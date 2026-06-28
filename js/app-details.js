/* ============================
   App Details — GitHub API
   ============================ */

let currentApp = null;
let settings = null;

document.addEventListener('DOMContentLoaded', async () => {
  detectRepo();
  await loadSettings();
  initTheme();
  applyThemeColors();
  initMobileMenu();
  initDownloadModal();
  updateFooterYear();
  loadAppDetails();
});

function detectRepo() {
  const host = window.location.hostname;
  if (host.includes('github.io')) {
    const owner = host.split('.')[0];
    const path = window.location.pathname.split('/');
    const repo = path[1] || '';
    initGitHub(owner, repo);
  } else {
    initGitHub('YOUR_GITHUB_USERNAME', 'cy-app-hub');
  }
}

async function loadSettings() {
  try { settings = await getSettings(); } catch (e) { settings = {}; }
}

function applyThemeColors() {
  const p = settings?.theme?.primaryColor || '#6c5ce7';
  const a = settings?.theme?.accentColor || '#00cec9';
  document.documentElement.style.setProperty('--primary', p);
  document.documentElement.style.setProperty('--primary-light', p + 'cc');
  document.documentElement.style.setProperty('--primary-dark', p + '99');
  document.documentElement.style.setProperty('--accent', a);
}

function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('cy-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  toggle?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cy-theme', next);
  });
  window.addEventListener('scroll', () => {
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
  });
}

function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  const close = document.getElementById('mobileMenuClose');
  if (!toggle) return;
  toggle.addEventListener('click', () => { menu?.classList.add('active'); document.body.style.overflow = 'hidden'; });
  close?.addEventListener('click', () => { menu?.classList.remove('active'); document.body.style.overflow = ''; });
  menu?.addEventListener('click', e => { if (e.target === menu) { menu.classList.remove('active'); document.body.style.overflow = ''; } });
}

async function loadAppDetails() {
  const params = new URLSearchParams(window.location.search);
  const appId = params.get('id');
  if (!appId) return showError('No app ID provided');

  try {
    currentApp = await getAppById(appId);
    if (!currentApp) return showError('App not found');
    renderAppDetails(currentApp);
  } catch (e) { showError('Failed to load app details'); }
}

function showError(msg) {
  document.getElementById('appDetailName').textContent = 'Error';
  document.getElementById('appDetailDesc').textContent = msg;
}

function renderAppDetails(app) {
  const banner = document.getElementById('appBanner');
  if (app.banner) banner.style.backgroundImage = `url(${app.banner})`;

  const icon = document.querySelector('#appBannerIcon img');
  if (app.icon) icon.src = app.icon;

  document.getElementById('appDetailName').textContent = app.name || 'Untitled';
  document.getElementById('appDetailCategory').textContent = app.category || 'Uncategorized';
  document.getElementById('appDetailVersion').textContent = `v${app.version || '0.0.0'}`;
  document.getElementById('appDetailDate').textContent = formatDate(app.publishDate);
  document.getElementById('appDetailDesc').textContent = app.description || 'No description available.';
  document.getElementById('appDetailDownload').addEventListener('click', () => openDownloadModal(app));

  renderScreenshots(app);
  renderFeatures(app);
  renderChangelog(app);
  renderStores(app);

  document.title = `${app.name} - ${settings?.seo?.siteTitle || 'CY App Hub'}`;

  // SEO meta
  const desc = app.description || '';
  ['pageTitle'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = `${app.name} - CY App Hub`; });
  ['metaDescription', 'ogDescription', 'twDescription'].forEach(id => { const el = document.getElementById(id); if (el) el.content = desc; });
  if (app.icon) { ['ogImage', 'twImage'].forEach(id => { const el = document.getElementById(id); if (el) el.content = app.icon; }); }
}

function renderScreenshots(app) {
  const grid = document.getElementById('screenshotsGrid');
  const section = document.getElementById('screenshotsSection');
  if (!app.screenshots?.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  grid.innerHTML = '';
  app.screenshots.forEach((url, i) => {
    const item = document.createElement('div');
    item.className = 'screenshot-item';
    item.innerHTML = `<img src="${url}" alt="Screenshot ${i+1}" loading="lazy">`;
    item.addEventListener('click', () => openLightbox(url));
    grid.appendChild(item);
  });
}

function openLightbox(url) {
  const existing = document.querySelector('.lightbox');
  if (existing) existing.remove();
  const box = document.createElement('div');
  box.className = 'lightbox active';
  box.innerHTML = `<button class="lightbox-close"><i class="fas fa-times"></i></button><img src="${url}" alt="">`;
  box.addEventListener('click', e => { if (e.target === box || e.target.closest('.lightbox-close')) { box.classList.remove('active'); setTimeout(() => box.remove(), 300); } });
  document.body.appendChild(box);
}

function renderFeatures(app) {
  const list = document.getElementById('featuresList');
  const section = document.getElementById('featuresSection');
  if (!app.features?.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = app.features.map(f => `<li><i class="fas fa-check-circle"></i> ${f}</li>`).join('');
}

function renderChangelog(app) {
  const content = document.getElementById('changelogContent');
  const section = document.getElementById('changelogSection');
  if (!app.changelog) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  content.textContent = app.changelog;
}

function renderStores(app) {
  const grid = document.getElementById('storesGrid');
  const enabledStores = settings?.stores?.filter(s => s.enabled !== false) || [];
  if (!app.stores || !Object.keys(app.stores).length) { grid.innerHTML = '<p class="text-muted">No stores available</p>'; return; }

  grid.innerHTML = Object.entries(app.stores).filter(([, url]) => url).map(([storeId, url]) => {
    const meta = enabledStores.find(s => s.id === storeId) || { name: storeId, icon: 'fas fa-store', color: '#6c5ce7' };
    return `<a class="store-card" href="${url}" target="_blank" rel="noopener noreferrer">
      <div class="store-card-icon" style="background:${meta.color}"><i class="${meta.icon}"></i></div>
      <span class="store-card-name">${meta.name}</span>
      <i class="fas fa-chevron-right store-card-arrow"></i>
    </a>`;
  }).join('');
}

function initDownloadModal() {
  const modal = document.getElementById('downloadModal');
  document.getElementById('modalClose')?.addEventListener('click', closeDownloadModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeDownloadModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDownloadModal(); });
}

function openDownloadModal(app) {
  const modal = document.getElementById('downloadModal');
  const enabledStores = settings?.stores?.filter(s => s.enabled !== false) || [];
  document.getElementById('modalAppIcon').src = app.icon || '../assets/icons/default-app.svg';
  document.getElementById('modalAppName').textContent = app.name || 'App';
  document.getElementById('modalAppVersion').textContent = `v${app.version || '0.0.0'}`;

  const list = document.getElementById('storeList');
  if (!app.stores || !Object.keys(app.stores).length) {
    list.innerHTML = '<p class="text-muted">No download links available</p>';
  } else {
    list.innerHTML = Object.entries(app.stores).filter(([, url]) => url).map(([storeId, url]) => {
      const meta = enabledStores.find(s => s.id === storeId) || { name: storeId, icon: 'fas fa-store', color: '#6c5ce7' };
      return `<a class="store-item" href="${url}" target="_blank" rel="noopener noreferrer">
        <div class="store-item-icon" style="background:${meta.color}"><i class="${meta.icon}"></i></div>
        <div class="store-item-info"><div class="store-item-name">${meta.name}</div></div>
        <div class="store-item-action"><i class="fas fa-chevron-right"></i></div>
      </a>`;
    }).join('');
  }

  modal?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDownloadModal() {
  document.getElementById('downloadModal')?.classList.remove('active');
  document.body.style.overflow = '';
}

function updateFooterYear() {
  const el = document.getElementById('currentYear');
  if (el) el.textContent = new Date().getFullYear();
}
