/* ============================
   Main — Home Page (GitHub API)
   ============================ */

let settings = null;
let allApps = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Init GitHub (owner/repo auto-detected from URL or set manually)
  detectRepo();
  await loadSettings();
  initTheme();
  applyThemeColors();
  initMobileMenu();
  initHeroParticles();
  initSearch();
  initDownloadModal();
  await loadSections();
  updateFooter();
  loadPWA();
});

function detectRepo() {
  // Auto-detect from hostname: username.github.io
  const host = window.location.hostname;
  if (host.includes('github.io')) {
    const owner = host.split('.')[0];
    const path = window.location.pathname.split('/');
    const repo = path[1] || '';
    initGitHub(owner, repo);
  } else {
    // Localhost — set your GitHub owner/repo here
    initGitHub('YOUR_GITHUB_USERNAME', 'cy-app-hub');
  }
}

async function loadSettings() {
  try {
    settings = await getSettings();
  } catch (e) {
    settings = {};
  }
}

function applyThemeColors() {
  const p = settings?.theme?.primaryColor || '#6c5ce7';
  const a = settings?.theme?.accentColor || '#00cec9';
  document.documentElement.style.setProperty('--primary', p);
  document.documentElement.style.setProperty('--primary-light', p + 'cc');
  document.documentElement.style.setProperty('--primary-dark', p + '99');
  document.documentElement.style.setProperty('--accent', a);
}

/* ---------- THEME ---------- */
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

/* ---------- MOBILE MENU ---------- */
function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  const close = document.getElementById('mobileMenuClose');
  if (!toggle) return;
  toggle.addEventListener('click', () => { menu?.classList.add('active'); document.body.style.overflow = 'hidden'; });
  close?.addEventListener('click', () => { menu?.classList.remove('active'); document.body.style.overflow = ''; });
  menu?.addEventListener('click', e => { if (e.target === menu) { menu.classList.remove('active'); document.body.style.overflow = ''; } });
}

/* ---------- HERO ---------- */
function updateHero() {
  const h = settings?.hero || {};
  const title = document.querySelector('.hero-title');
  const subtitle = document.querySelector('.hero-subtitle');
  if (title) title.innerHTML = h.title || 'Discover <span class="gradient-text">Premium</span> Apps';
  if (subtitle) subtitle.textContent = h.subtitle || 'Curated collection of high-quality apps';
  if (h.image) {
    const bg = document.querySelector('.hero-gradient');
    if (bg) { bg.style.backgroundImage = `url(${h.image})`; bg.style.backgroundSize = 'cover'; bg.style.backgroundPosition = 'center'; }
  }
}

/* ---------- SECTIONS ---------- */
async function loadSections() {
  try {
    allApps = await getApps();
  } catch (e) {
    allApps = [];
  }

  document.getElementById('totalApps').textContent = allApps.length;
  const cats = Object.keys(getCategories(allApps)).length;
  document.getElementById('totalCategories').textContent = cats;
  document.getElementById('totalDownloads').textContent = allApps.reduce((s, a) => s + (a.downloadCount || 0), 0);

  updateHero();
  loadCategories();

  const sections = settings?.sections || {};

  if (sections.featured !== false) showSection('section-featured', 'featuredGrid', allApps.filter(a => a.featured).slice(0, 8));
  if (sections.latest !== false) showSection('section-latest', 'latestGrid', allApps.slice(0, 8));
  if (sections.popular !== false) showSection('section-popular', 'popularGrid', [...allApps].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0)).slice(0, 8));
  if (sections.recommended !== false) showSection('section-recommended', 'recommendedGrid', allApps.filter(a => a.featured).slice(0, 8));
  if (sections.trending !== false) showSection('section-trending', 'trendingGrid', [...allApps].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 8));
}

function showSection(sectionId, gridId, apps) {
  const section = document.getElementById(sectionId);
  const grid = document.getElementById(gridId);
  if (!section || !grid) return;
  section.style.display = 'block';
  renderApps(grid, apps);
}

/* ---------- CATEGORIES ---------- */
function loadCategories() {
  const grid = document.getElementById('categoriesGrid');
  const counts = getCategories(allApps);
  const entries = Object.entries(counts);
  grid.innerHTML = '';

  const allCard = document.createElement('div');
  allCard.className = 'category-card active';
  allCard.innerHTML = '<div class="category-icon"><i class="fas fa-th-large"></i></div><span class="category-name">All</span>';
  allCard.addEventListener('click', () => {
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
    allCard.classList.add('active');
    renderApps(document.getElementById('featuredGrid'), allApps.filter(a => a.featured));
    renderApps(document.getElementById('latestGrid'), allApps);
  });
  grid.appendChild(allCard);

  entries.forEach(([cat, count]) => {
    const meta = CATEGORY_META[cat] || { icon: 'fas fa-folder', color: '#b2bec3' };
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `<div class="category-icon"><i class="${meta.icon}"></i></div><span class="category-name">${cat}</span><span class="category-count">${count} app${count !== 1 ? 's' : ''}</span>`;
    card.addEventListener('click', () => {
      document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const filtered = allApps.filter(a => a.category === cat);
      renderApps(document.getElementById('featuredGrid'), filtered.filter(a => a.featured));
      renderApps(document.getElementById('latestGrid'), filtered);
    });
    grid.appendChild(card);
  });
}

/* ---------- SEARCH ---------- */
function initSearch() {
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('searchClear');
  if (!input) return;
  input.addEventListener('input', debounce(() => {
    const q = input.value.trim().toLowerCase();
    clear?.classList.toggle('visible', q.length > 0);
    if (!q) { loadCategories(); loadSections(); return; }
    const filtered = allApps.filter(a =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q)
    );
    renderApps(document.getElementById('featuredGrid'), filtered.filter(a => a.featured));
    renderApps(document.getElementById('latestGrid'), filtered);
  }, 400));
  clear?.addEventListener('click', () => { input.value = ''; clear.classList.remove('visible'); loadSections(); });
}

/* ---------- PARTICLES ---------- */
function initHeroParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const dot = document.createElement('div');
    const size = Math.random() * 4 + 2;
    dot.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:rgba(108,92,231,${Math.random()*0.4+0.1});top:${Math.random()*100}%;left:${Math.random()*100}%;animation:float ${Math.random()*6+4}s ease-in-out infinite;animation-delay:${Math.random()*3}s;`;
    container.appendChild(dot);
  }
}

/* ---------- RENDER APPS ---------- */
function renderApps(grid, apps) {
  if (!grid) return;
  if (!apps?.length) { grid.innerHTML = '<div class="empty-state"><div class="empty-state-content"><i class="fas fa-box-open"></i><p>No apps found</p></div></div>'; return; }
  grid.innerHTML = '';
  apps.forEach((app, i) => grid.appendChild(createAppCard(app, i)));
}

function createAppCard(app, index) {
  const card = document.createElement('div');
  card.className = 'app-card';
  card.style.animationDelay = `${index * 0.05}s`;
  const initial = app.name ? app.name[0].toUpperCase() : '?';

  card.innerHTML = `
    ${app.featured ? '<div class="app-card-featured-badge"><i class="fas fa-star"></i> Featured</div>' : ''}
    <div class="app-card-header">
      ${app.icon ? `<img class="app-card-icon" src="${app.icon}" alt="${app.name}" loading="lazy">` : `<div class="app-card-icon-placeholder">${initial}</div>`}
      <div class="app-card-info">
        <h3 class="app-card-name">${app.name || 'Untitled'}</h3>
        <span class="app-card-category">${app.category || 'Uncategorized'}</span>
      </div>
    </div>
    <p class="app-card-desc">${app.description || 'No description'}</p>
    <div class="app-card-footer">
      <span class="app-card-version">v${app.version || '0.0.0'}</span>
      <button class="btn btn-primary btn-sm download-btn"><i class="fas fa-download"></i> Get</button>
    </div>
  `;

  card.addEventListener('click', e => { if (!e.target.closest('.download-btn')) window.location.href = `app-details.html?id=${app.id}`; });
  card.querySelector('.download-btn').addEventListener('click', e => { e.stopPropagation(); openDownloadModal(app); });
  return card;
}

/* ---------- DOWNLOAD MODAL ---------- */
function initDownloadModal() {
  const modal = document.getElementById('downloadModal');
  if (!modal) return;
  document.getElementById('modalClose')?.addEventListener('click', closeDownloadModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeDownloadModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDownloadModal(); });
}

function openDownloadModal(app) {
  const modal = document.getElementById('downloadModal');
  document.getElementById('modalAppIcon').src = app.icon || 'assets/icons/default-app.svg';
  document.getElementById('modalAppName').textContent = app.name || 'App';
  document.getElementById('modalAppVersion').textContent = `v${app.version || '0.0.0'}`;

  const list = document.getElementById('storeList');
  const enabledStores = settings?.stores?.filter(s => s.enabled !== false) || [];
  list.innerHTML = '';

  if (app.stores) {
    Object.entries(app.stores).forEach(([storeId, url]) => {
      if (!url) return;
      const storeMeta = enabledStores.find(s => s.id === storeId) || { name: storeId, icon: 'fas fa-store', color: '#6c5ce7' };
      const item = document.createElement('a');
      item.className = 'store-item';
      item.href = url;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';
      item.innerHTML = `
        <div class="store-item-icon" style="background:${storeMeta.color}"><i class="${storeMeta.icon}"></i></div>
        <div class="store-item-info"><div class="store-item-name">${storeMeta.name}</div></div>
        <div class="store-item-action"><i class="fas fa-chevron-right"></i></div>
      `;
      list.appendChild(item);
    });
  }

  if (!list.children.length) list.innerHTML = '<p class="text-muted">No download links available</p>';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDownloadModal() {
  document.getElementById('downloadModal')?.classList.remove('active');
  document.body.style.overflow = '';
}

/* ---------- FOOTER ---------- */
function updateFooter() {
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  if (settings?.footer?.description) document.querySelector('.footer-desc').textContent = settings.footer.description;
  const social = document.querySelector('.footer-social');
  if (social && settings?.footer?.socialLinks?.length) {
    social.innerHTML = settings.footer.socialLinks.filter(l => l.url).map(l => `<a href="${l.url}" target="_blank"><i class="${l.icon || 'fab fa-link'}"></i></a>`).join('');
  }
  if (settings?.seo) {
    document.getElementById('pageTitle') && (document.title = settings.seo.siteTitle || 'CY App Hub');
    document.getElementById('metaDescription')?.setAttribute('content', settings.seo.siteDescription || '');
    document.getElementById('ogTitle')?.setAttribute('content', settings.seo.siteTitle || 'CY App Hub');
    document.getElementById('ogDescription')?.setAttribute('content', settings.seo.siteDescription || '');
  }
}

function loadPWA() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ---------- TOAST ---------- */
function showToast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  t.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 3000);
}
