/* ============================
   GitHub API + Cloudinary
   ============================ */

/* ---------- CONFIG ---------- */
const GITHUB = {
  owner: '',
  repo: '',
  branch: 'main'
};

const CLOUDINARY = {
  cloudName: 'drvztudsf',
  uploadPreset: 'cy_app_hub_preset'
};

/* ---------- INIT ---------- */
function initGitHub(owner, repo) {
  GITHUB.owner = owner;
  GITHUB.repo = repo;
}

function getGitHubToken() {
  return localStorage.getItem('gh_token') || '';
}

function setGitHubToken(token) {
  localStorage.setItem('gh_token', token);
}

function clearGitHubToken() {
  localStorage.removeItem('gh_token');
}

/* ---------- CATEGORY META ---------- */
const CATEGORY_META = {
  'Tools': { icon: 'fas fa-wrench', color: '#6c5ce7' },
  'Games': { icon: 'fas fa-gamepad', color: '#e17055' },
  'Education': { icon: 'fas fa-graduation-cap', color: '#00b894' },
  'Entertainment': { icon: 'fas fa-film', color: '#fdcb6e' },
  'Social': { icon: 'fas fa-users', color: '#74b9ff' },
  'Productivity': { icon: 'fas fa-chart-line', color: '#a29bfe' },
  'Finance': { icon: 'fas fa-coins', color: '#55efc4' },
  'Health': { icon: 'fas fa-heartbeat', color: '#ff7675' },
  'Music': { icon: 'fas fa-music', color: '#fd79a8' },
  'Photography': { icon: 'fas fa-camera', color: '#81ecec' },
  'Weather': { icon: 'fas fa-cloud-sun', color: '#74b9ff' },
  'Other': { icon: 'fas fa-folder', color: '#b2bec3' }
};

/* ============================
   GITHUB API READ
   ============================ */
async function githubRead(path) {
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/${GITHUB.branch}/${path}`;
  const res = await fetch(rawUrl);
  if (!res.ok) throw new Error(`Failed to read ${path}: ${res.status}`);
  return res.json();
}

/* ============================
   GITHUB API WRITE (commit)
   ============================ */
async function githubWrite(path, data, message) {
  const token = getGitHubToken();
  if (!token) throw new Error('GitHub token not set');

  // Get current file SHA (needed for update)
  let sha = null;
  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${path}`;
    const res = await fetch(apiUrl, {
      headers: { 'Authorization': `token ${token}` }
    });
    if (res.ok) {
      const fileData = await res.json();
      sha = fileData.sha;
    }
  } catch (e) {
    // File might not exist yet
  }

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
  const body = {
    message,
    content,
    branch: GITHUB.branch
  };
  if (sha) body.sha = sha;

  const apiUrl = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${path}`;
  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to write ${path}`);
  }

  return res.json();
}

/* ============================
   APPS CRUD
   ============================ */
async function getApps() {
  try {
    const data = await githubRead('apps.json');
    return data.apps || [];
  } catch (e) {
    console.warn('Failed to read apps.json:', e);
    return [];
  }
}

async function getAppById(id) {
  const apps = await getApps();
  return apps.find(a => a.id === id) || null;
}

async function saveApps(apps, message) {
  const data = {
    apps,
    lastUpdated: new Date().toISOString()
  };
  await githubWrite('apps.json', data, message);
}

async function addApp(appData) {
  const apps = await getApps();
  const id = appData.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now().toString(36);
  const newApp = { id, ...appData };
  apps.unshift(newApp);
  await saveApps(apps, `Add app: ${appData.name}`);
  return id;
}

async function updateApp(id, appData) {
  const apps = await getApps();
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) throw new Error('App not found');
  apps[index] = { ...apps[index], ...appData };
  await saveApps(apps, `Update app: ${appData.name || id}`);
}

async function deleteApp(id) {
  const apps = await getApps();
  const app = apps.find(a => a.id === id);
  const filtered = apps.filter(a => a.id !== id);
  await saveApps(filtered, `Delete app: ${app?.name || id}`);
}

/* ============================
   SETTINGS CRUD
   ============================ */
async function getSettings() {
  try {
    return await githubRead('settings.json');
  } catch (e) {
    console.warn('Failed to read settings.json:', e);
    return {};
  }
}

async function updateSettings(data, message) {
  await githubWrite('settings.json', data, message || 'Update settings');
}

/* ============================
   CLOUDINARY UPLOAD
   ============================ */
async function uploadToCloudinary(file, folder = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY.uploadPreset);
  if (folder) formData.append('folder', `cy-app-hub/${folder}`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  return data.secure_url;
}

async function uploadScreenshots(files, folder = '') {
  const promises = Array.from(files).map(f => uploadToCloudinary(f, folder));
  return Promise.all(promises);
}

/* ============================
   HELPERS
   ============================ */
function generateId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '') + '_' + Date.now().toString(36);
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function getCategories(apps) {
  const counts = {};
  apps.forEach(a => {
    if (a.category) counts[a.category] = (counts[a.category] || 0) + 1;
  });
  return counts;
}

function generateSitemap(apps, baseUrl) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url><loc>${baseUrl}/</loc><priority>1.0</priority></url>\n`;
  apps.forEach(app => {
    const date = app.publishDate || new Date().toISOString();
    xml += `  <url><loc>${baseUrl}/app-details.html?id=${app.id}</loc><lastmod>${date.split('T')[0]}</lastmod><priority>0.9</priority></url>\n`;
  });
  xml += '</urlset>';
  return xml;
}
