// CleanMailBox - Background Service Worker
// Handles OAuth, Gmail API calls, and messaging between components

const CLIENT_ID = '396680226341-t7qlgf5bu5mr6lcgegedghflces1gb58.apps.googleusercontent.com';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

let accessToken = null;

// Listen for messages from popup and dashboard
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'authenticate') {
    authenticate().then(token => sendResponse({ token }));
    return true;
  }
  
  if (message.action === 'getToken') {
    getToken().then(token => sendResponse({ token }));
    return true;
  }
  
  if (message.action === 'apiRequest') {
    apiRequest(message.url, message.method, message.body)
      .then(data => sendResponse({ data }))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }
});

async function authenticate() {
  try {
    const authResponse = await chrome.identity.getAuthToken({ interactive: true });
    if (authResponse.token) {
      accessToken = authResponse.token;
      return accessToken;
    }
  } catch (err) {
    console.error('Auth error:', err);
    throw err;
  }
}

async function getToken() {
  if (accessToken) return accessToken;
  
  try {
    const authResponse = await chrome.identity.getAuthToken({ interactive: false });
    if (authResponse.token) {
      accessToken = authResponse.token;
      return accessToken;
    }
  } catch (err) {
    console.error('Get token error:', err);
    throw err;
  }
}

async function apiRequest(url, method = 'GET', body = null) {
  const token = await getToken();
  
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, try to get a new one
      chrome.identity.removeCachedAuthToken({ token }, async () => {
        accessToken = null;
        const newToken = await authenticate();
        return apiRequest(url, method, body);
      });
    }
    throw new Error(await response.text());
  }
  
  return response.json();
}

// Handle OAuth callback
chrome.identity.onTokenRevoked.addListener(() => {
  accessToken = null;
});

// Store for cleaning rules
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.cleaningRules) {
    // Broadcast rules update to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'rulesUpdated',
          rules: changes.cleaningRules.newValue
        }).catch(() => {});
      });
    });
  }
});

console.log('CleanMailBox background service worker loaded');