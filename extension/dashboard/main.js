const CLIENT_ID = '396680226341-t7qlgf5bu5mr6lcgegedghflces1gb58.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify';

let accessToken = null;
let rules = [];
let modelLoaded = false;
let summarizer = null;

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  initTabs();
  setupEventListeners();
  loadRules();
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tab')) {
    document.querySelector(`[data-tab="${urlParams.get('tab')}"]`).click();
  }
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
  document.getElementById('refreshBtn').addEventListener('click', loadAllStats);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('scanNewsletters').addEventListener('click', scanNewsletters);
  document.getElementById('deleteOld').addEventListener('click', () => deleteByAge(365));
  document.getElementById('deleteLarge').addEventListener('click', () => deleteBySize(10));
  document.getElementById('archiveRead').addEventListener('click', archiveRead);
  document.getElementById('generateDigest').addEventListener('click', generateDigest);
  document.getElementById('addRuleBtn').addEventListener('click', addRule);
  document.getElementById('loadModelBtn').addEventListener('click', loadAIModel);
  document.getElementById('runAIBtn').addEventListener('click', runAI);
  document.getElementById('emailSearch').addEventListener('input', searchEmails);
}

async function checkAuth() {
  try {
    const authResponse = await chrome.identity.getAuthToken({ interactive: false });
    if (authResponse.token) {
      accessToken = authResponse.token;
      loadAllStats();
      loadSenders();
    }
  } catch (err) {
    await authorize();
  }
}

async function authorize() {
  try {
    const authResponse = await chrome.identity.getAuthToken({ interactive: true });
    if (authResponse.token) {
      accessToken = authResponse.token;
      loadAllStats();
      loadSenders();
    }
  } catch (err) {
    showToast('Error al autenticar');
  }
}

function logout() {
  chrome.identity.removeCachedAuthToken({ token: accessToken }, () => {
    accessToken = null;
    location.reload();
  });
}

async function gapiRequest(url, method = 'GET', body = null) {
  const options = { method, headers: { Authorization: `Bearer ${accessToken}` } };
  if (body) {
    options.body = JSON.stringify(body);
    options.headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function loadAllStats() {
  try {
    const profile = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/profile');
    document.getElementById('totalEmails').textContent = parseInt(profile.messagesTotal).toLocaleString();
    document.getElementById('storageUsed').textContent = (parseInt(profile.messagesTotal) * 50 / 1024 / 1024).toFixed(2) + ' MB';
    document.getElementById('storageBar').style.width = Math.min((parseInt(profile.messagesTotal) * 50 / 1024 / 1024 / 15360) * 100, 100) + '%';

    const unread = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages?query=is:unread&maxResults=1');
    document.getElementById('unreadEmails').textContent = unread.resultSizeEstimate;

    const newsletter = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages?query=List-ID:*&maxResults=1');
    document.getElementById('newsletterCount').textContent = newsletter.resultSizeEstimate;
  } catch (err) {
    showToast('Error al cargar estadísticas');
  }
}

async function loadSenders() {
  try {
    const response = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=500');
    const messages = response.messages || [];
    
    const senderMap = new Map();
    for (const msg of messages.slice(0, 200)) {
      const detail = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`);
      const headers = detail.payload?.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const match = from.match(/<(.+)>/) || [null, from];
      const email = match[1] || from;
      
      if (senderMap.has(email)) {
        senderMap.get(email).count++;
      } else {
        senderMap.set(email, { email, count: 1, last: headers.find(h => h.name === 'Date')?.value || '' });
      }
    }
    
    const sorted = Array.from(senderMap.values()).sort((a, b) => b.count - a.count).slice(0, 20);
    const tbody = document.getElementById('senderTable');
    tbody.innerHTML = sorted.map(s => `
      <tr>
        <td>${s.email}</td>
        <td>${s.count}</td>
        <td>${s.last ? new Date(s.last).toLocaleDateString() : '-'}</td>
        <td>
          <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" onclick="deleteSender('${s.email}')">Eliminar</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Error al cargar remitentes');
  }
}

async function scanNewsletters() {
  try {
    const response = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages?query=List-ID:*&maxResults=100');
    showToast(`Encontrados ${response.resultSizeEstimate} newsletters`);
    loadEmails('List-ID:*');
  } catch (err) {
    showToast('Error al escanear');
  }
}

async function loadEmails(query = '') {
  try {
    const url = query 
      ? `https://gmail.googleapis.com/gmail/v1/users/me/messages?query=${encodeURIComponent(query)}&maxResults=50`
      : 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50';
    const response = await gapiRequest(url);
    const messages = response.messages || [];
    
    let html = '<table><thead><tr><th>De</th><th>Asunto</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>';
    
    for (const msg of messages) {
      const detail = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`);
      const headers = detail.payload?.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || '';
      const subject = headers.find(h => h.name === 'Subject')?.value || '(Sin asunto)';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      html += `<tr>
        <td>${from.substring(0, 30)}...</td>
        <td>${subject.substring(0, 40)}...</td>
        <td>${new Date(date).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-danger" style="padding: 4px 8px;" onclick="deleteEmail('${msg.id}')">🗑️</button>
          <button class="btn btn-primary" style="padding: 4px 8px;" onclick="archiveEmail('${msg.id}')">📂</button>
        </td>
      </tr>`;
    }
    
    html += '</tbody></table>';
    document.getElementById('emailList').innerHTML = html;
  } catch (err) {
    showToast('Error al cargar correos');
  }
}

async function searchEmails(e) {
  const query = e.target.value;
  if (query.length > 2) {
    loadEmails(query);
  } else if (query.length === 0) {
    loadEmails();
  }
}

async function deleteByAge(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const dateStr = date.toISOString().split('T')[0];
  
  try {
    const response = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages?query=before:${dateStr}&maxResults=500`);
    const messages = response.messages || [];
    
    let deleted = 0;
    for (const msg of messages) {
      try {
        await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, 'DELETE');
        deleted++;
      } catch (e) {}
    }
    
    showToast(`Eliminados ${deleted} correos`);
    loadAllStats();
  } catch (err) {
    showToast('Error al eliminar');
  }
}

async function deleteBySize(mb) {
  try {
    const response = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages?query=size:${mb * 1024}&maxResults=500`);
    const messages = response.messages || [];
    
    let deleted = 0;
    for (const msg of messages) {
      try {
        await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, 'DELETE');
        deleted++;
      } catch (e) {}
    }
    
    showToast(`Eliminados ${deleted} correos grandes`);
    loadAllStats();
  } catch (err) {
    showToast('Error al eliminar');
  }
}

async function archiveRead() {
  try {
    const response = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages?query=is:read&maxResults=100');
    const messages = response.messages || [];
    
    let archived = 0;
    for (const msg of messages) {
      try {
        await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, 'POST', { removeLabelIds: ['INBOX'] });
        archived++;
      } catch (e) {}
    }
    
    showToast(`Archivados ${archived} correos`);
  } catch (err) {
    showToast('Error al archivar');
  }
}

async function deleteEmail(id) {
  if (confirm('¿Eliminar este correo?')) {
    try {
      await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`, 'DELETE');
      showToast('Correo eliminado');
      loadEmails();
    } catch (err) {
      showToast('Error al eliminar');
    }
  }
}

async function archiveEmail(id) {
  try {
    await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, 'POST', { removeLabelIds: ['INBOX'] });
    showToast('Correo archivado');
    loadEmails();
  } catch (err) {
    showToast('Error al archivar');
  }
}

window.deleteEmail = deleteEmail;
window.archiveEmail = archiveEmail;
window.deleteSender = async function(email) {
  if (confirm(`¿Eliminar todos los correos de ${email}?`)) {
    try {
      const response = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages?query=from:${encodeURIComponent(email)}&maxResults=500`);
      const messages = response.messages || [];
      
      let deleted = 0;
      for (const msg of messages) {
        try {
          await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, 'DELETE');
          deleted++;
        } catch (e) {}
      }
      
      showToast(`Eliminados ${deleted} correos`);
      loadSenders();
    } catch (err) {
      showToast('Error al eliminar');
    }
  }
};

function loadRules() {
  chrome.storage.local.get(['cleaningRules'], (result) => {
    rules = result.cleaningRules || [];
    renderRules();
  });
}

function renderRules() {
  const tbody = document.getElementById('rulesTable');
  if (rules.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">No hay reglas</td></tr>';
    return;
  }
  
  tbody.innerHTML = rules.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${r.type}: ${r.value}</td>
      <td><span class="badge badge-primary">${r.action}</span></td>
      <td><span class="badge badge-success">Activa</span></td>
      <td>
        <button class="btn btn-danger" style="padding: 4px 8px;" onclick="deleteRule('${r.id}')">🗑️</button>
        <button class="btn btn-primary" style="padding: 4px 8px;" onclick="runRule('${r.id}')">▶️</button>
      </td>
    </tr>
  `).join('');
}

function addRule() {
  const rule = {
    id: Date.now().toString(),
    name: document.getElementById('ruleName').value,
    type: document.getElementById('ruleType').value,
    value: document.getElementById('ruleValue').value,
    action: document.getElementById('ruleAction').value
  };
  
  if (!rule.name || !rule.value) {
    showToast('Completa todos los campos');
    return;
  }
  
  rules.push(rule);
  chrome.storage.local.set({ cleaningRules: rules });
  renderRules();
  showToast('Regla creada');
}

window.deleteRule = function(id) {
  rules = rules.filter(r => r.id !== id);
  chrome.storage.local.set({ cleaningRules: rules });
  renderRules();
  showToast('Regla eliminada');
};

window.runRule = async function(id) {
  const rule = rules.find(r => r.id === id);
  if (!rule) return;
  
  let query = '';
  if (rule.type === 'age') {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(rule.value));
    query = `before:${date.toISOString().split('T')[0]}`;
  } else if (rule.type === 'size') {
    query = `size:${parseInt(rule.value) * 1024}`;
  } else if (rule.type === 'sender') {
    query = `from:${rule.value}`;
  }
  
  try {
    const response = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages?query=${encodeURIComponent(query)}&maxResults=500`);
    const messages = response.messages || [];
    
    let processed = 0;
    for (const msg of messages) {
      try {
        if (rule.action === 'delete') {
          await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, 'DELETE');
        } else if (rule.action === 'archive') {
          await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, 'POST', { removeLabelIds: ['INBOX'] });
        } else if (rule.action === 'mark_read') {
          await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, 'POST', { removeLabelIds: ['UNREAD'] });
        }
        processed++;
      } catch (e) {}
    }
    
    showToast(`Procesados ${processed} correos`);
    loadAllStats();
  } catch (err) {
    showToast('Error al ejecutar regla');
  }
};

async function loadAIModel() {
  document.getElementById('aiStatus').textContent = 'Descargando modelo ( ~100MB )...';
  
  try {
    const { pipeline, env } = await import('../../lib/transformers.js');
    env.allowLocalModels = false;
    
    summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
    modelLoaded = true;
    document.getElementById('aiStatus').textContent = '✅ Modelo cargado y listo';
    document.getElementById('runAIBtn').disabled = false;
    showToast('Modelo de IA cargado');
  } catch (err) {
    document.getElementById('aiStatus').textContent = '❌ Error al cargar: ' + err.message;
    showToast('Error al cargar modelo');
  }
}

async function runAI() {
  if (!modelLoaded) {
    showToast('Carga el modelo primero');
    return;
  }
  
  showToast('Generando resumen...');
  
  try {
    const response = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages?query=List-ID:*&maxResults=20');
    const messages = response.messages || [];
    
    let snippets = [];
    for (const msg of messages.slice(0, 10)) {
      const detail = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`);
      if (detail.snippet) snippets.push(detail.snippet);
    }
    
    const text = snippets.join(' ');
    const output = await summarizer(text, { max_length: 150, min_length: 40 });
    
    const summary = output[0].summary_text;
    
    const history = document.getElementById('digestHistory');
    history.innerHTML = `
      <div class="card">
        <p style="font-size: 14px; margin-bottom: 8px;">${summary}</p>
        <small style="color: var(--text-muted);">${new Date().toLocaleString()} - ${messages.length} newsletters</small>
      </div>
    ` + history.innerHTML;
    
    showToast('Resumen generado');
  } catch (err) {
    showToast('Error al generar resumen');
  }
}

async function generateDigest() {
  await loadAIModel();
  await runAI();
  document.querySelector('[data-tab="ai"]').click();
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}