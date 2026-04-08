const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify';

let isAuthenticated = false;
let accessToken = null;

document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  await checkAuth();
  if (isAuthenticated) {
    loadStats();
  }
  setupEventListeners();
});

function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

function setupEventListeners() {
  document.getElementById('scanBtn').addEventListener('click', scanNewsletters);
  document.getElementById('deleteOldBtn').addEventListener('click', deleteOldEmails);
  document.getElementById('generateDigestBtn').addEventListener('click', generateDigest);
  document.getElementById('openDashboardBtn').addEventListener('click', openDashboard);
  document.getElementById('manageRulesBtn').addEventListener('click', manageRules);
}

async function checkAuth() {
  const authResponse = await chrome.identity.getAuthToken({ interactive: false });
  if (authResponse.token) {
    accessToken = authResponse.token;
    isAuthenticated = true;
    updateStatus(true);
  } else {
    updateStatus(false);
  }
}

function updateStatus(connected) {
  const statusEl = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  
  if (connected) {
    statusEl.className = 'status connected';
    statusText.textContent = '✓ Conectado a Gmail';
  } else {
    statusEl.className = 'status disconnected';
    statusText.textContent = '✗ No conectado';
    const loginBtn = document.createElement('button');
    loginBtn.className = 'btn btn-primary';
    loginBtn.textContent = 'Conectar con Gmail';
    loginBtn.style.marginTop = '8px';
    loginBtn.addEventListener('click', authorize);
    statusEl.appendChild(loginBtn);
  }
}

async function authorize() {
  try {
    const authResponse = await chrome.identity.getAuthToken({ interactive: true });
    if (authResponse.token) {
      accessToken = authResponse.token;
      isAuthenticated = true;
      updateStatus(true);
      loadStats();
    }
  } catch (err) {
    showError('Error al autenticar: ' + err.message);
  }
}

async function loadStats() {
  try {
    const response = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/profile');
    document.getElementById('totalEmails').textContent = parseInt(response.messagesTotal).toLocaleString();
    
    const unreadResponse = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages?query=is:unread&maxResults=1');
    document.getElementById('unreadEmails').textContent = unreadResponse.resultSizeEstimate || 0;
    
    const newsletterResponse = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages?query=List-ID:*&maxResults=1');
    document.getElementById('newsletterCount').textContent = newsletterResponse.resultSizeEstimate || 0;
  } catch (err) {
    showError('Error al cargar estadísticas');
  }
}

async function gapiRequest(url, method = 'GET', body = null) {
  const options = { method, headers: { Authorization: `Bearer ${accessToken}` } };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function scanNewsletters() {
  if (!accessToken) {
    await authorize();
    if (!accessToken) return;
  }
  
  showLoading('Escaneando newsletters...');
  
  try {
    const response = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages?query=List-ID:*&maxResults=100');
    const messages = response.messages || [];
    
    let html = '<div class="stat-card"><h3>Newsletters encontrados</h3><div class="value">' + messages.length + '</div></div>';
    
    const uniqueSenders = new Set();
    for (const msg of messages.slice(0, 10)) {
      const detail = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`);
      const headers = detail.payload?.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || '';
      uniqueSenders.add(from);
    }
    
    html += '<div class="stat-card"><h3>Remitentes únicos</h3><div class="value">' + uniqueSenders.size + '</div></div>';
    document.getElementById('dashboard').innerHTML = html;
  } catch (err) {
    showError('Error al escanear: ' + err.message);
  }
  
  hideLoading();
}

async function deleteOldEmails() {
  if (!accessToken) {
    await authorize();
    if (!accessToken) return;
  }
  
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const dateStr = oneYearAgo.toISOString().split('T')[0];
  
  showLoading('Buscando correos antiguos...');
  
  try {
    const response = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages?query=before:${dateStr}&maxResults=500`);
    const messages = response.messages || [];
    
    if (messages.length === 0) {
      showError('No hay correos mayores a 1 año');
      hideLoading();
      return;
    }
    
    let deleted = 0;
    for (const msg of messages) {
      try {
        await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, 'DELETE');
        deleted++;
      } catch (e) {}
    }
    
    alert(`Eliminados ${deleted} correos`);
    loadStats();
  } catch (err) {
    showError('Error al eliminar: ' + err.message);
  }
  
  hideLoading();
}

async function generateDigest() {
  showLoading('Generando resumen con IA...');
  
  try {
    const response = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages?query=List-ID:*&maxResults=20');
    const messages = response.messages || [];
    
    let snippets = [];
    for (const msg of messages.slice(0, 10)) {
      const detail = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`);
      if (detail.snippet) snippets.push(detail.snippet);
    }
    
    const summary = snippets.slice(0, 3).join(' | ');
    
    const resultHtml = `
      <div class="stat-card">
        <h3>Resumen IA</h3>
        <p style="font-size: 13px; color: #495057;">${summary.substring(0, 300)}...</p>
      </div>
    `;
    document.getElementById('dashboard').innerHTML = resultHtml;
  } catch (err) {
    showError('Error al generar resumen: ' + err.message);
  }
  
  hideLoading();
}

function openDashboard() {
  chrome.tabs.create({ url: 'dashboard/index.html' });
}

function manageRules() {
  chrome.tabs.create({ url: 'dashboard/index.html?tab=rules' });
}

function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 5000);
}

function showLoading(msg) {
  document.body.style.cursor = 'wait';
  showError(msg);
}

function hideLoading() {
  document.body.style.cursor = 'default';
  document.getElementById('error').style.display = 'none';
}