/* ============================
   Admin — GitHub API Dashboard
   ============================ */

let appsCache = [];
let settingsCache = null;
let editingAppId = null;

// File state
let appIconFile = null;
let appBannerFile = null;
let appScreenshotsFiles = [];
let heroImageFile = null;
let logoFile = null;
let faviconFile = null;
let seoOgFile = null;

document.addEventListener('DOMContentLoaded', () => {
  detectRepo();
  initTheme();
  initLogin();
  initSidebar();
  initAppForm();
  initDeleteModal();
  initHeroTab();
  initSectionsTab();
  initThemeTab();
  initStoresTab();
  initContactTab();
  initSeoTab();
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
}

/* ---------- LOGIN (GitHub Token) ---------- */
function initLogin() {
  const savedToken = getGitHubToken();
  if (savedToken) { showDashboard(); return; }

  document.getElementById('loginForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const token = document.getElementById('loginToken').value.trim();
    if (!token) return;
    setGitHubToken(token);
    showDashboard();
  });
}

async function showDashboard() {
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'block';
  await loadAllData();
}

/* ---------- SIDEBAR ---------- */
function initSidebar() {
  document.querySelectorAll('.sidebar-link').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    clearGitHubToken();
    location.reload();
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.sidebar-link[data-tab="${tabId}"]`)?.classList.add('active');
  document.getElementById(`tab-${tabId}`)?.classList.add('active');
}

/* ---------- LOAD ALL ---------- */
async function loadAllData() {
  try {
    [appsCache, settingsCache] = await Promise.all([getApps(), getSettings()]);
    renderDashStats();
    renderAppsTable(appsCache);
    renderStoresAdmin();
    loadHeroForm();
    loadSectionsForm();
    loadThemeForm();
    loadContactForm();
    loadSeoForm();
  } catch (e) {
    showToast('Failed to load data: ' + e.message, 'error');
  }
}

/* ============================
   DASHBOARD TAB
   ============================ */
function renderDashStats() {
  const featured = appsCache.filter(a => a.featured).length;
  const cats = Object.keys(getCategories(appsCache)).length;
  const totalDL = appsCache.reduce((s, a) => s + (a.downloadCount || 0), 0);
  document.getElementById('dashStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon"><i class="fas fa-rocket"></i></div><div class="stat-info"><span class="stat-number">${appsCache.length}</span><span class="stat-label">Total Apps</span></div></div>
    <div class="stat-card"><div class="stat-icon"><i class="fas fa-star"></i></div><div class="stat-info"><span class="stat-number">${featured}</span><span class="stat-label">Featured</span></div></div>
    <div class="stat-card"><div class="stat-icon"><i class="fas fa-tags"></i></div><div class="stat-info"><span class="stat-number">${cats}</span><span class="stat-label">Categories</span></div></div>
    <div class="stat-card"><div class="stat-icon"><i class="fas fa-download"></i></div><div class="stat-info"><span class="stat-number">${totalDL}</span><span class="stat-label">Downloads</span></div></div>
  `;
  const recent = document.getElementById('dashRecentApps');
  if (appsCache.length) {
    recent.innerHTML = appsCache.slice(0, 5).map(a => `
      <div class="dash-recent-item">
        ${a.icon ? `<img class="dash-recent-icon" src="${a.icon}">` : `<div class="dash-recent-icon" style="background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">${(a.name||'?')[0]}</div>`}
        <div><div class="dash-recent-name">${a.name}</div><div class="dash-recent-date">${formatDate(a.publishDate)}</div></div>
      </div>`).join('');
  } else {
    recent.innerHTML = '<p class="text-muted">No apps yet</p>';
  }
}

/* ============================
   APPS TAB
   ============================ */
function renderAppsTable(apps) {
  const tbody = document.getElementById('appsTableBody');
  if (!apps.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div style="padding:40px;text-align:center"><i class="fas fa-box-open" style="font-size:2rem;color:var(--text-muted)"></i><p style="margin:12px 0">No apps yet</p><button class="btn btn-primary btn-sm" onclick="document.getElementById(\'addAppBtn\').click()"><i class="fas fa-plus"></i> Add App</button></div></td></tr>';
    return;
  }
  tbody.innerHTML = apps.map(a => `<tr>
    <td><div class="app-info-cell">
      ${a.icon ? `<img class="app-table-icon" src="${a.icon}">` : `<div class="app-table-icon" style="background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">${(a.name||'?')[0]}</div>`}
      <div class="app-table-name">${a.name || 'Untitled'}</div>
    </div></td>
    <td><span class="badge badge-success">${a.category || '-'}</span></td>
    <td>v${a.version || '0.0.0'}</td>
    <td>${a.downloadCount || 0}</td>
    <td>${a.featured ? '<span class="badge badge-featured"><i class="fas fa-star"></i></span>' : '-'}</td>
    <td><div class="table-actions">
      <button class="btn btn-sm btn-ghost" onclick="openEditApp('${a.id}')"><i class="fas fa-edit"></i></button>
      <button class="btn btn-sm btn-ghost" onclick="openDeleteModal('${a.id}')"><i class="fas fa-trash"></i></button>
    </div></td>
  </tr>`).join('');

  document.getElementById('adminSearchInput').addEventListener('input', debounce(function() {
    const q = this.value.trim().toLowerCase();
    if (!q) return renderAppsTable(appsCache);
    renderAppsTable(appsCache.filter(a => (a.name||'').toLowerCase().includes(q) || (a.category||'').toLowerCase().includes(q)));
  }, 300));
}

/* ---------- APP FORM ---------- */
function initAppForm() {
  const modal = document.getElementById('appFormModal');
  document.getElementById('addAppBtn')?.addEventListener('click', () => { resetAppForm(); openModal(modal); });
  document.getElementById('appFormClose')?.addEventListener('click', () => closeModal(modal));
  document.getElementById('appFormCancel')?.addEventListener('click', () => closeModal(modal));
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
  document.getElementById('appForm')?.addEventListener('submit', handleAppFormSubmit);

  setupFileUpload('appIconUpload', 'appIconInput', 'appIconPreview', 'appIconRemove', f => appIconFile = f, () => appIconFile = null);
  setupFileUpload('appBannerUpload', 'appBannerInput', 'appBannerPreview', 'appBannerRemove', f => appBannerFile = f, () => appBannerFile = null);
  document.getElementById('appScreenshotsUpload')?.addEventListener('click', () => document.getElementById('appScreenshotsInput')?.click());
  document.getElementById('appScreenshotsInput')?.addEventListener('change', e => {
    appScreenshotsFiles = [...appScreenshotsFiles, ...Array.from(e.target.files)];
    renderScreenshotsPreview();
  });
  document.getElementById('addAppStoreRow')?.addEventListener('click', () => addAppStoreRow());
}

function resetAppForm() {
  document.getElementById('appForm')?.reset();
  editingAppId = null;
  appIconFile = null; appBannerFile = null; appScreenshotsFiles = [];
  ['appIconPreview', 'appBannerPreview'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
  document.getElementById('appScreenshotsPreview').innerHTML = '';
  document.getElementById('appStoreLinks').innerHTML = '';
  populateStoreDropdown();
}

function openEditApp(id) {
  const app = appsCache.find(a => a.id === id);
  if (!app) return showToast('App not found', 'error');
  editingAppId = id;
  document.getElementById('appFormTitle').textContent = 'Edit App';
  document.getElementById('appName').value = app.name || '';
  document.getElementById('appCategory').value = app.category || '';
  document.getElementById('appDesc').value = app.description || '';
  document.getElementById('appVersion').value = app.version || '';
  document.getElementById('appFeatured').value = app.featured ? 'true' : 'false';
  document.getElementById('appChangelog').value = app.changelog || '';
  document.getElementById('appFeatures').value = (app.features || []).join('\n');
  document.getElementById('appStoreLinks').innerHTML = '';
  populateStoreDropdown();

  if (app.stores) {
    Object.entries(app.stores).forEach(([storeId, url]) => {
      if (url) addAppStoreRow(storeId, url);
    });
  }

  if (app.icon) showFilePreview('appIconPreview', app.icon);
  if (app.banner) showFilePreview('appBannerPreview', app.banner);

  switchTab('apps');
  openModal(document.getElementById('appFormModal'));
}

async function handleAppFormSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('appFormSubmit');
  btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>';

  try {
    const name = document.getElementById('appName').value.trim();
    const category = document.getElementById('appCategory').value;
    const description = document.getElementById('appDesc').value.trim();
    const version = document.getElementById('appVersion').value.trim();
    const featured = document.getElementById('appFeatured').value === 'true';
    const changelog = document.getElementById('appChangelog').value.trim();
    const features = document.getElementById('appFeatures').value.trim().split('\n').map(f => f.trim()).filter(Boolean);

    // Store links as object
    const stores = {};
    document.querySelectorAll('#appStoreLinks .store-link-row').forEach(row => {
      const storeId = row.querySelector('.store-select')?.value;
      const url = row.querySelector('.store-url')?.value.trim();
      if (storeId && url) stores[storeId] = url;
    });

    let icon = appIconFile ? await uploadToCloudinary(appIconFile, `apps/${sanitizeFileName(name)}`) : null;
    let banner = appBannerFile ? await uploadToCloudinary(appBannerFile, `apps/${sanitizeFileName(name)}`) : null;
    let screenshots = appScreenshotsFiles.length ? await uploadScreenshots(appScreenshotsFiles, `apps/${sanitizeFileName(name)}/screenshots`) : null;

    const data = { name, category, description, version, featured, changelog, features, stores };
    if (icon) data.icon = icon;
    if (banner) data.banner = banner;
    if (screenshots) data.screenshots = screenshots;

    if (editingAppId) {
      const existing = appsCache.find(a => a.id === editingAppId);
      if (!icon) data.icon = existing?.icon || '';
      if (!banner) data.banner = existing?.banner || '';
      if (!screenshots) data.screenshots = existing?.screenshots || [];
      await updateApp(editingAppId, data);
      showToast('App updated!', 'success');
    } else {
      data.publishDate = new Date().toISOString();
      data.downloadCount = 0;
      data.viewCount = 0;
      await addApp(data);
      showToast('App added!', 'success');
    }

    closeModal(document.getElementById('appFormModal'));
    await loadAllData();
  } catch (e) { showToast('Save failed: ' + e.message, 'error'); }
  btn.disabled = false; btn.innerHTML = '<span>Save App</span><i class="fas fa-check"></i>';
}

function populateStoreDropdown() {
  const stores = settingsCache?.stores || [];
  const container = document.getElementById('appStoreLinks');
  const existingRows = container.querySelectorAll('.store-link-row');
  if (existingRows.length) return;
  addAppStoreRow();
}

function addAppStoreRow(storeId = '', url = '') {
  const stores = settingsCache?.stores || [];
  const div = document.createElement('div');
  div.className = 'store-link-row';
  div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
  div.innerHTML = `
    <select class="form-input store-select" style="flex:1">
      <option value="">Select store</option>
      ${stores.filter(s => s.enabled !== false).map(s => `<option value="${s.id}" ${storeId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
    </select>
    <input type="url" class="form-input store-url" style="flex:2" placeholder="https://..." value="${url}">
    <button type="button" class="btn btn-icon btn-danger store-remove" style="flex-shrink:0"><i class="fas fa-trash"></i></button>
  `;
  div.querySelector('.store-remove').addEventListener('click', () => div.remove());
  document.getElementById('appStoreLinks').appendChild(div);
}

/* ---------- DELETE ---------- */
let deleteTargetId = null;
function initDeleteModal() {
  const modal = document.getElementById('deleteModal');
  function close() { closeModal(modal); deleteTargetId = null; }
  document.getElementById('deleteModalClose')?.addEventListener('click', close);
  document.getElementById('deleteCancel')?.addEventListener('click', close);
  modal?.addEventListener('click', e => { if (e.target === modal) close(); });
  document.getElementById('deleteConfirm')?.addEventListener('click', async () => {
    if (!deleteTargetId) return;
    try {
      await deleteApp(deleteTargetId);
      showToast('Deleted!', 'success');
      close(); await loadAllData();
    } catch (e) { showToast('Delete failed: ' + e.message, 'error'); }
  });
}

function openDeleteModal(id) {
  deleteTargetId = id;
  const app = appsCache.find(a => a.id === id);
  document.getElementById('deleteAppName').textContent = app?.name || 'this app';
  openModal(document.getElementById('deleteModal'));
}

/* ============================
   STORES TAB
   ============================ */
function initStoresTab() {
  document.getElementById('addGlobalStoreBtn')?.addEventListener('click', () => {
    if (!settingsCache) return;
    settingsCache.stores = settingsCache.stores || [];
    settingsCache.stores.push({ id: 'new_' + Date.now(), name: 'New Store', icon: 'fas fa-store', color: '#6c5ce7', enabled: true });
    renderStoresAdmin();
  });
}

function renderStoresAdmin() {
  const grid = document.getElementById('storesAdminList');
  const stores = settingsCache?.stores || [];
  grid.innerHTML = stores.map((s, i) => `
    <div class="store-admin-card">
      <div class="store-admin-header">
        <div class="store-admin-icon" style="background:${s.color}"><i class="${s.icon}"></i></div>
        <div class="store-admin-info">
          <input class="form-input store-admin-name-input" value="${s.name}" data-i="${i}" style="margin-bottom:4px;">
          <div class="store-admin-id">ID: ${s.id}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <label class="toggle"><input type="checkbox" ${s.enabled !== false ? 'checked' : ''} class="store-enabled-toggle" data-i="${i}"><span class="toggle-slider"></span></label>
        <span style="font-size:0.85rem;color:var(--text-muted)">${s.enabled !== false ? 'On' : 'Off'}</span>
      </div>
      <div class="form-row" style="grid-template-columns:1fr 1fr;gap:8px;">
        <div class="form-group" style="margin:0"><label style="font-size:0.75rem;">Icon</label><input class="form-input store-icon-input" value="${s.icon}" data-i="${i}" style="font-size:0.85rem;padding:8px 12px;"></div>
        <div class="form-group" style="margin:0"><label style="font-size:0.75rem;">Color</label><input class="form-input store-color-input" value="${s.color}" data-i="${i}" style="font-size:0.85rem;padding:8px 12px;"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-sm btn-primary store-save-btn" data-i="${i}"><i class="fas fa-save"></i> Save</button>
        <button class="btn btn-sm btn-ghost store-del-btn" data-i="${i}"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.store-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = parseInt(btn.dataset.i);
      const card = btn.closest('.store-admin-card');
      settingsCache.stores[i].name = card.querySelector('.store-admin-name-input').value;
      settingsCache.stores[i].icon = card.querySelector('.store-icon-input').value;
      settingsCache.stores[i].color = card.querySelector('.store-color-input').value;
      settingsCache.stores[i].enabled = card.querySelector('.store-enabled-toggle').checked;
      try {
        await updateSettings(settingsCache, 'Update stores');
        showToast('Store saved!', 'success');
        renderStoresAdmin();
      } catch (e) { showToast('Failed: ' + e.message, 'error'); }
    });
  });

  grid.querySelectorAll('.store-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = parseInt(btn.dataset.i);
      settingsCache.stores.splice(i, 1);
      try {
        await updateSettings(settingsCache, 'Remove store');
        showToast('Removed', 'success');
        renderStoresAdmin();
      } catch (e) { showToast('Failed: ' + e.message, 'error'); }
    });
  });
}

/* ============================
   HERO TAB
   ============================ */
function initHeroTab() {
  setupFileUpload('heroImageUpload', 'heroImageInput', 'heroImagePreview', 'heroImageRemove', f => heroImageFile = f, () => heroImageFile = null);
  document.getElementById('heroSaveBtn')?.addEventListener('click', saveHero);
}

function loadHeroForm() {
  const h = settingsCache?.hero || {};
  document.getElementById('heroTitle').value = h.title || '';
  document.getElementById('heroSubtitle').value = h.subtitle || '';
  document.getElementById('heroCtaText').value = h.ctaText || '';
  document.getElementById('heroCtaLink').value = h.ctaLink || '';
  if (h.image) showFilePreview('heroImagePreview', h.image);
}

async function saveHero() {
  try {
    const hero = {
      title: document.getElementById('heroTitle').value.trim(),
      subtitle: document.getElementById('heroSubtitle').value.trim(),
      ctaText: document.getElementById('heroCtaText').value.trim(),
      ctaLink: document.getElementById('heroCtaLink').value.trim()
    };
    if (heroImageFile) hero.image = await uploadToCloudinary(heroImageFile, 'config/hero');
    else hero.image = settingsCache?.hero?.image || '';
    settingsCache.hero = hero;
    await updateSettings(settingsCache, 'Update hero');
    showToast('Hero saved!', 'success');
  } catch (e) { showToast('Failed: ' + e.message, 'error'); }
}

/* ============================
   SECTIONS TAB
   ============================ */
function loadSectionsForm() {
  const sections = settingsCache?.sections || {};
  const items = [
    { key: 'featured', label: 'Featured Apps', desc: 'Handpicked premium apps' },
    { key: 'latest', label: 'Latest Apps', desc: 'Newly added apps' },
    { key: 'popular', label: 'Popular Apps', desc: 'Most downloaded apps' },
    { key: 'recommended', label: 'Recommended Apps', desc: 'Curated picks' },
    { key: 'trending', label: 'Trending Apps', desc: 'What\'s hot right now' }
  ];
  document.getElementById('sectionsList').innerHTML = items.map(item => `
    <div class="section-toggle-item">
      <div><div class="section-toggle-label">${item.label}</div><div class="section-toggle-desc">${item.desc}</div></div>
      <label class="toggle"><input type="checkbox" class="section-toggle-input" data-key="${item.key}" ${sections[item.key] !== false ? 'checked' : ''}><span class="toggle-slider"></span></label>
    </div>
  `).join('');
}

document.getElementById('sectionsSaveBtn')?.addEventListener('click', async () => {
  try {
    const sections = {};
    document.querySelectorAll('.section-toggle-input').forEach(cb => { sections[cb.dataset.key] = cb.checked; });
    settingsCache.sections = sections;
    await updateSettings(settingsCache, 'Update sections');
    showToast('Sections saved!', 'success');
  } catch (e) { showToast('Failed: ' + e.message, 'error'); }
});

/* ============================
   THEME TAB
   ============================ */
function loadThemeForm() {
  const t = settingsCache?.theme || {};
  const f = settingsCache?.footer || {};
  document.getElementById('themePrimaryColor').value = t.primaryColor || '#6c5ce7';
  document.getElementById('themePrimaryColorText').value = t.primaryColor || '#6c5ce7';
  document.getElementById('themeAccentColor').value = t.accentColor || '#00cec9';
  document.getElementById('themeAccentColorText').value = t.accentColor || '#00cec9';
  document.getElementById('footerDesc').value = f.description || '';
  syncColorInputs();
  renderSocialLinks();
  if (t.logo) showFilePreview('logoPreview', t.logo);
  if (t.favicon) showFilePreview('faviconPreview', t.favicon);
}

function syncColorInputs() {
  ['PrimaryColor', 'AccentColor'].forEach(name => {
    const picker = document.getElementById(`theme${name}`);
    const text = document.getElementById(`theme${name}Text`);
    picker?.addEventListener('input', () => text.value = picker.value);
    text?.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(text.value)) picker.value = text.value; });
  });
}

function renderSocialLinks() {
  const list = document.getElementById('socialLinksList');
  const links = settingsCache?.footer?.socialLinks || [];
  list.innerHTML = links.map((l, i) => `
    <div class="social-link-row">
      <input class="form-input" value="${l.platform}" data-soc="platform" data-i="${i}" style="flex:1" placeholder="Platform">
      <input class="form-input" value="${l.url}" data-soc="url" data-i="${i}" style="flex:2" placeholder="URL">
      <input class="form-input" value="${l.icon}" data-soc="icon" data-i="${i}" style="flex:1" placeholder="Icon">
      <button class="btn btn-icon btn-danger soc-remove" data-i="${i}"><i class="fas fa-trash"></i></button>
    </div>
  `).join('');
  list.querySelectorAll('.soc-remove').forEach(btn => btn.addEventListener('click', () => { settingsCache.footer.socialLinks.splice(parseInt(btn.dataset.i), 1); renderSocialLinks(); }));
}

document.getElementById('addSocialLinkBtn')?.addEventListener('click', () => {
  if (!settingsCache.footer) settingsCache.footer = {};
  if (!settingsCache.footer.socialLinks) settingsCache.footer.socialLinks = [];
  settingsCache.footer.socialLinks.push({ platform: '', url: '', icon: 'fab fa-link' });
  renderSocialLinks();
});

document.getElementById('themeSaveBtn')?.addEventListener('click', async () => {
  try {
    const socialLinks = [];
    document.querySelectorAll('#socialLinksList .social-link-row').forEach(row => {
      const inputs = row.querySelectorAll('input');
      socialLinks.push({ platform: inputs[0]?.value || '', url: inputs[1]?.value || '', icon: inputs[2]?.value || 'fab fa-link' });
    });

    const theme = {
      primaryColor: document.getElementById('themePrimaryColorText').value,
      accentColor: document.getElementById('themeAccentColorText').value
    };
    if (logoFile) theme.logo = await uploadToCloudinary(logoFile, 'config/theme');
    else theme.logo = settingsCache?.theme?.logo || '';
    if (faviconFile) theme.favicon = await uploadToCloudinary(faviconFile, 'config/theme');
    else theme.favicon = settingsCache?.theme?.favicon || '';

    settingsCache.theme = theme;
    settingsCache.footer = { description: document.getElementById('footerDesc').value, socialLinks };
    await updateSettings(settingsCache, 'Update theme');
    showToast('Theme saved!', 'success');
  } catch (e) { showToast('Failed: ' + e.message, 'error'); }
});

/* ============================
   CONTACT TAB
   ============================ */
function loadContactForm() {
  const c = settingsCache?.contact || {};
  document.getElementById('contactEmail').value = c.email || '';
  document.getElementById('contactPhone').value = c.phone || '';
  document.getElementById('contactAddress').value = c.address || '';
}

document.getElementById('contactSaveBtn')?.addEventListener('click', async () => {
  try {
    settingsCache.contact = {
      email: document.getElementById('contactEmail').value.trim(),
      phone: document.getElementById('contactPhone').value.trim(),
      address: document.getElementById('contactAddress').value.trim()
    };
    await updateSettings(settingsCache, 'Update contact');
    showToast('Contact saved!', 'success');
  } catch (e) { showToast('Failed: ' + e.message, 'error'); }
});

/* ============================
   SEO TAB
   ============================ */
function loadSeoForm() {
  const s = settingsCache?.seo || {};
  document.getElementById('seoSiteTitle').value = s.siteTitle || '';
  document.getElementById('seoSiteDesc').value = s.siteDescription || '';
  document.getElementById('seoTwitterHandle').value = s.twitterHandle || '';
  if (s.ogImage) showFilePreview('seoOgPreview', s.ogImage);
}

setupFileUpload('seoOgUpload', 'seoOgInput', 'seoOgPreview', 'seoOgRemove', f => seoOgFile = f, () => seoOgFile = null);

document.getElementById('seoSaveBtn')?.addEventListener('click', async () => {
  try {
    const seo = {
      siteTitle: document.getElementById('seoSiteTitle').value.trim(),
      siteDescription: document.getElementById('seoSiteDesc').value.trim(),
      twitterHandle: document.getElementById('seoTwitterHandle').value.trim()
    };
    if (seoOgFile) seo.ogImage = await uploadToCloudinary(seoOgFile, 'config/seo');
    else seo.ogImage = settingsCache?.seo?.ogImage || '';
    settingsCache.seo = seo;
    await updateSettings(settingsCache, 'Update SEO');
    showToast('SEO saved!', 'success');
  } catch (e) { showToast('Failed: ' + e.message, 'error'); }
});

document.getElementById('seoGenerateSitemap')?.addEventListener('click', () => {
  const baseUrl = window.location.origin + '/' + (window.location.pathname.split('/')[1] || '');
  const xml = generateSitemap(appsCache, baseUrl);
  const blob = new Blob([xml], { type: 'application/xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'sitemap.xml'; a.click();
  showToast('Sitemap downloaded!', 'success');
});

/* ============================
   UTILITIES
   ============================ */
function openModal(el) { if (el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; } }
function closeModal(el) { if (el) { el.classList.remove('active'); document.body.style.overflow = ''; } }

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

function setupFileUpload(uploadId, inputId, previewId, removeId, onFile, onRemove) {
  const upload = document.getElementById(uploadId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const remove = document.getElementById(removeId);
  if (!upload || !input) return;
  upload.addEventListener('click', () => input.click());
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    onFile(file);
    const reader = new FileReader();
    reader.onload = ev => { preview.querySelector('img').src = ev.target.result; preview.style.display = 'block'; };
    reader.readAsDataURL(file);
  });
  remove?.addEventListener('click', e => { e.stopPropagation(); onRemove(); input.value = ''; preview.style.display = 'none'; });
}

function showFilePreview(id, src) {
  const el = document.getElementById(id);
  if (el) { el.querySelector('img').src = src; el.style.display = 'block'; }
}

function renderScreenshotsPreview() {
  const preview = document.getElementById('appScreenshotsPreview');
  preview.innerHTML = '';
  appScreenshotsFiles.forEach((f, i) => {
    const div = document.createElement('div');
    div.className = 'file-preview';
    const reader = new FileReader();
    reader.onload = e => {
      div.innerHTML = `<img src="${e.target.result}"><button type="button" class="file-remove"><i class="fas fa-times"></i></button>`;
      div.querySelector('.file-remove').addEventListener('click', () => { appScreenshotsFiles.splice(i, 1); renderScreenshotsPreview(); });
    };
    reader.readAsDataURL(f);
    preview.appendChild(div);
  });
}

window.switchTab = switchTab;
