// Configuration and state management
const CONFIG = {
  defaultLanguage: 'si',
  defaultPage: 'home.html',
  supportedLanguages: ['si', 'en', 'ta'],
  languageLabels: {
    'si': 'සිංහල',
    'en': 'English',
    'ta': 'தமிழ்'
  }
};

// State management
let currentLanguage = null;
let currentPage = null;
let navData = {};

// Cache for loaded content
const cache = {
  nav: {},
  pages: {}
};

// Initialize application
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadStaticComponents(); // Load header/footer
    initializeFromURL(); // Set language/page
    await initializeApp(); // Load nav + content
    setupEventListeners(); // Event listeners
  } catch (error) {
    console.error('Application initialization failed:', error);
    showError('Failed to initialize application');
  }
});

// Load static HTML components
async function loadStaticComponents() {
  const components = [
    { file: 'sections/header.html', target: 'header' },
    { file: 'sections/footer.html', target: 'footer' }
  ];

  await Promise.all(components.map(async ({ file, target }) => {
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      const html = await response.text();
      document.getElementById(target).innerHTML = html;
    } catch (error) {
      console.warn(`Could not load ${file}:`, error);
    }
  }));
}

// Initialize language and page from URL parameters
function initializeFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  const pageParam = urlParams.get('page');

  currentLanguage = validateLanguage(langParam) ||
                   validateLanguage(localStorage.getItem('language')) ||
                   CONFIG.defaultLanguage;

  currentPage = pageParam || CONFIG.defaultPage;
  localStorage.setItem('language', currentLanguage);
}

function validateLanguage(lang) {
  return CONFIG.supportedLanguages.includes(lang) ? lang : null;
}

// Initialize app
async function initializeApp() {
  try {
    await loadNavigation(currentLanguage);
    await loadContent(currentPage, currentLanguage);
    updateLanguageUI();
  } catch (error) {
    console.error('App initialization failed:', error);
    showError('Failed to load content');
  }
}

// Load navigation data with caching
async function loadNavigation(lang = currentLanguage) {
  try {
    if (cache.nav[lang]) {
      navData = cache.nav[lang];
      renderNavigation(navData);
      return;
    }

    const response = await fetch(`static/lang/${lang}.json`);
    if (!response.ok) throw new Error(`Navigation file not found for language: ${lang}`);

    navData = await response.json();
    cache.nav[lang] = navData;
    renderNavigation(navData);

  } catch (error) {
    console.error(`Failed to load navigation for ${lang}:`, error);
    if (lang !== CONFIG.defaultLanguage) {
      console.warn(`Falling back to ${CONFIG.defaultLanguage}`);
      await loadNavigation(CONFIG.defaultLanguage);
    }
  }
}

// Render navigation
function renderNavigation(data) {
  updateTextContent('councilName', data.name);
  updateTextContent('PaymentName', data.payment);

  const navContainers = ['navItem1', 'navItem2','footerNav'];
  navContainers.forEach(id => {
    const container = document.getElementById(id);
    if (container) container.innerHTML = '';
  });

  if (data.nav && Array.isArray(data.nav)) {
    navContainers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        data.nav.forEach(item => {
          const navItem = createNavItem(item);
          container.appendChild(navItem);
        });
      }
    });
  }
}

function updateTextContent(elementId, text) {
  const element = document.getElementById(elementId);
  if (element && text) {
    element.textContent = text;
  }
}

function createNavItem(item) {
  const navItem = document.createElement('li');
  navItem.classList.add('nav-item');

  if (item.sub_menu && Array.isArray(item.sub_menu)) {
    navItem.classList.add('dropdown');
    navItem.appendChild(createDropdownToggle(item.text));
    navItem.appendChild(createDropdownMenu(item.sub_menu));
  } else {
    navItem.appendChild(createNavLink(item.text, item.link));
  }
  return navItem;
}

function createDropdownToggle(text) {
  const toggle = document.createElement('a');
  toggle.classList.add('nav-link', 'dropdown-toggle');
  toggle.href = '#';
  toggle.setAttribute('role', 'button');
  toggle.setAttribute('data-bs-toggle', 'dropdown');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = text;
  return toggle;
}

function createDropdownMenu(items) {
  const menu = document.createElement('ul');
  menu.classList.add('dropdown-menu');

  items.forEach(item => {
    const menuItem = document.createElement('li');

    if (item.sub_menu && Array.isArray(item.sub_menu)) {
      menuItem.classList.add('dropdown-submenu');
      const subToggle = document.createElement('a');
      subToggle.classList.add('dropdown-item', 'has-submenu');
      subToggle.href = '#';
      subToggle.textContent = item.text;
      menuItem.appendChild(subToggle);
      menuItem.appendChild(createDropdownMenu(item.sub_menu));
    } else {
      menuItem.appendChild(createDropdownLink(item.text, item.link));
    }
    menu.appendChild(menuItem);
  });

  return menu;
}

function createDropdownLink(text, link) {
  const dropdownLink = document.createElement('a');
  dropdownLink.classList.add('dropdown-item');
  dropdownLink.textContent = text;

  if (isExternalURL(link)) {
    dropdownLink.href = link;
    dropdownLink.target = '_blank';
    dropdownLink.rel = 'noopener noreferrer';
    dropdownLink.addEventListener('click', closeMobileNav);
  } else {
    dropdownLink.href = '#';
    dropdownLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileNav();
      if (link) loadContent(link, currentLanguage);
    });
  }
  return dropdownLink;
}

function createNavLink(text, link) {
  const navLink = document.createElement('a');
  navLink.classList.add('nav-link');
  navLink.textContent = text;

  if (isExternalURL(link)) {
    navLink.href = link;
    navLink.target = '_blank';
    navLink.rel = 'noopener noreferrer';
    navLink.addEventListener('click', closeMobileNav);
  } else {
    navLink.href = '#';
    navLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileNav();
      if (link) loadContent(link, currentLanguage);
    });
  }
  return navLink;
}

function isExternalURL(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}

// Load page content with caching
async function loadContent(pageName, lang) {
  lang = lang || currentLanguage;
  if (!pageName) pageName = CONFIG.defaultPage;

  if (isExternalURL(pageName)) {
    window.open(pageName, '_blank', 'noopener,noreferrer');
    return;
  }

  const cacheKey = `${lang}-${pageName}`;

  try {
    if (cache.pages[cacheKey]) {
      renderContent(cache.pages[cacheKey]);
      updateURL(pageName, lang);
      currentPage = pageName;
      return;
    }

    let fileName = pageName;
    if (['contact', 'about'].includes(pageName.replace('.html', ''))) {
      fileName = pageName.replace('.html', '') + '.md';
    }

    const filePath = `pages/${lang}/${fileName}`;
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Page not found: ${filePath}`);

    const content = await response.text();
    const extension = fileName.split('.').pop();

    let processedContent;
    if (extension === 'md' && typeof marked !== 'undefined') {
      processedContent = marked.parse(content);
    } else {
      processedContent = content;
    }

    cache.pages[cacheKey] = processedContent;
    renderContent(processedContent);
    updateURL(pageName, lang);
    currentPage = pageName;

  } catch (error) {
    console.error(`Failed to load content: ${pageName}`, error);
    showError(`Failed to load page: ${pageName}`);
  }
}

function renderContent(content) {
  const contentDiv = document.getElementById('content');
  if (contentDiv) {
    contentDiv.innerHTML = content;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updateURL(page, lang) {
  const urlPath = `?page=${page}&lang=${lang}`;
  const state = { page, lang };
  window.history.pushState(state, '', urlPath);
}

async function setLanguage(newLang) {
  if (!validateLanguage(newLang) || newLang === currentLanguage) return;

  try {
    showLoading();
    currentLanguage = newLang;
    localStorage.setItem('language', newLang);

    await Promise.all([
      loadNavigation(newLang),
      loadContent(currentPage, newLang)
    ]);

    updateLanguageUI();
    updateURL(currentPage, newLang);

  } catch (error) {
    console.error('Language switch failed:', error);
    showError('Failed to switch language');
  } finally {
    hideLoading();
  }
}

function updateLanguageUI() {
  document.querySelectorAll('#currentLang').forEach(el => {
    el.textContent = CONFIG.languageLabels[currentLanguage];
  });

  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.classList.remove('active');
    const onclick = item.getAttribute('onclick');
    if (onclick && onclick.includes(`'${currentLanguage}'`)) {
      item.classList.add('active');
    }
  });
}

// Mobile nav
function toggleMobileNav() {
  const menu = document.getElementById('menuItems');
  if (menu) menu.classList.toggle('show');
}

function closeMobileNav() {
  const menu = document.getElementById('menuItems');
  if (menu) menu.classList.remove('show');
}

// Event listeners
function setupEventListeners() {
  window.addEventListener('popstate', (event) => {
    if (event.state) {
      currentLanguage = event.state.lang || CONFIG.defaultLanguage;
      currentPage = event.state.page || CONFIG.defaultPage;
      initializeApp();
    }
  });

  document.addEventListener('click', (event) => {
    const menu = document.getElementById('menuItems');
    const toggleButton = document.querySelector('.mobile-menu');
    if (menu && toggleButton && !menu.contains(event.target) && !toggleButton.contains(event.target)) {
      closeMobileNav();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMobileNav();
  });
}

// Utility feedback
function showLoading() { console.log('Loading...'); }
function hideLoading() { console.log('Loading complete'); }

function showError(message) {
  console.error(message);
  const contentDiv = document.getElementById('content');
  if (contentDiv) {
    contentDiv.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Error</h4>
        <p>${message}</p>
        <hr>
        <p class="mb-0">Please try refreshing the page or contact support if the problem persists.</p>
      </div>
    `;
  }
}

// Year switch
function switchYear(section, year, btn) {
  document.querySelectorAll(`#${section}-2023, #${section}-2024, #${section}-2025`)
    .forEach(content => content.classList.remove('active'));

  const targetContent = document.getElementById(`${section}-${year}`);
  if (targetContent) targetContent.classList.add('active');

  const parentDiv = btn.parentNode;
  if (parentDiv) {
    const buttons = parentDiv.querySelectorAll('button');
    buttons.forEach(button => {
      button.classList.remove('btn-primary');
      button.classList.add('btn-outline-primary');
    });
    btn.classList.remove('btn-outline-primary');
    btn.classList.add('btn-primary');
  }
}


// Export to global scope safely
window.loadContent = loadContent;
window.setLanguage = setLanguage;
window.toggleMobileNav = toggleMobileNav;
window.closeMobileNav = closeMobileNav;
window.switchYear = switchYear;
