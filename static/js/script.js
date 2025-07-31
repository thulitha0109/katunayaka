// Load header, footer, and slider on page load
window.addEventListener('DOMContentLoaded', () => {
  loadStaticPart('sections/header.html', 'header', () => {
    loadNav(); // Load nav after header
    updateActiveLanguage();
  });

  loadStaticPart('sections/footer.html', 'footer');

  // Get language and page from URL if available
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  const langParam = urlParams.get('lang');
  
  const lang = langParam || localStorage.getItem('language') || 'si';
  const page = pageParam || 'home.html';
  
  loadContent(page, lang);
});

// Load static HTML parts
function loadStaticPart(filePath, targetId, callback = null) {
  fetch(filePath)
    .then(response => response.text())
    .then(html => {
      document.getElementById(targetId).innerHTML = html;
      if (callback) callback();
    });
}

// Load .md or .html content or navigate to URLs
function loadContent(pageName, lang = null) {
  if (!lang) lang = localStorage.getItem('language') || 'si';

  // Default to 'home' if no page name is provided
  if (!pageName) pageName = 'home.html';

  // Check if the pageName is a URL (starts with http:// or https://)
  if (pageName.startsWith('http://') || pageName.startsWith('https://')) {
    // External URL - redirect the browser
    window.open(pageName, '_blank');
    return;
  }

  // Internal page handling
  // Determine extension based on convention (e.g., all .md pages)
  let fileName = `${pageName}`; // default as is
  if (pageName === 'contact' || pageName === 'about') {
    fileName = `${pageName}.md`; // example of markdown file exceptions
  }

  const filePath = `pages/${lang}/${fileName}`;
  fetch(filePath)
    .then(response => {
      if (!response.ok) throw new Error('Page not found');
      const ext = fileName.split('.').pop();
      return response.text().then(data => ({ ext, data }));
    })
    .then(({ ext, data }) => {
      const contentDiv = document.getElementById('content');
      contentDiv.innerHTML = ext === 'md' ? marked.parse(data) : data;
      
      // Update browser URL without page reload using History API
      const urlPath = `?page=${pageName}&lang=${lang}`;
      window.history.pushState({ page: pageName, lang }, '', urlPath);
    })
    .catch(error => {
      document.getElementById('content').innerHTML = `<p>Error: ${error.message}</p>`;
    });
}

// Load nav dynamically
// Function to close the mobile navigation slider
function closeMobileNav() {
  document.getElementById('menuItems').classList.remove('show');
}

// Attach closeMobileNav function to each nav-item dynamically
function attachCloseNav() {
  // Get all the nav items
  const navItems = document.getElementsByClassName('nav-item');
  
  // Loop through each nav item and add the onclick event
  for (let i = 0; i < navItems.length; i++) {
    navItems[i].onclick = closeMobileNav; // Set the onclick event to close the nav
  }
}

// Close the nav when clicking outside the mobile menu
document.addEventListener('click', function(event) {
  let menu = document.getElementById('menuItems');
  let toggleButton = document.querySelector('.mobile-menu');
  let mobileNav = document.querySelector('.mobile-nav-container');

  // If the click is outside the mobile menu or the menu toggle button, close the menu
  if (!mobileNav.contains(event.target) && !toggleButton.contains(event.target)) {
    closeMobileNav();
  }
});

function loadNav(lang = null) {
  if (!lang) lang = localStorage.getItem('language') || 'si';

  fetch(`static/lang/${lang}.json`)
    .then(response => response.json())
    .then(data => {
      // Update council name
      const councilName = document.getElementById('councilName');
      if (councilName) councilName.textContent = data.name;
      const icon = document.getElementById('icon');
      if (icon) icon.textContent = data.name;

        // Update council name
        const PaymentName = document.getElementById('PaymentName');
        if (PaymentName) PaymentName.textContent = data.payment;

      // Update nav links
      const navContainer1 = document.getElementById('navItem1');
      const navContainer2 = document.getElementById('navItem2');
      
      if (navContainer1) navContainer1.innerHTML = '';
      if (navContainer2) navContainer2.innerHTML = '';

      // Build main nav
      if (navContainer1 && navContainer2) {
        data.nav.forEach(item => {
          const navItem1 = createNavItem(item);
          const navItem2 = createNavItem(item);
          
          navContainer1.appendChild(navItem1);
          navContainer2.appendChild(navItem2);
        });
      }
    })
    .catch(err => {
      console.error('Failed to load nav:', err);
    });
}

// Recursive function to create nav items
function createNavItem(item) {
  let navItem = document.createElement('li');
  navItem.classList.add('nav-item');

  // Check for submenus
  if (item.sub_menu) {
    navItem.classList.add('dropdown');

    let dropdownToggle = document.createElement('a');
    dropdownToggle.classList.add('nav-link', 'dropdown-toggle');
    dropdownToggle.href = '#';
    dropdownToggle.setAttribute('role', 'button');
    dropdownToggle.setAttribute('data-bs-toggle', 'dropdown');
    dropdownToggle.textContent = item.text;
    navItem.appendChild(dropdownToggle);

    let dropdownMenu = document.createElement('ul');
    dropdownMenu.classList.add('dropdown-menu');

    // Recursively create sub-items
    item.sub_menu.forEach(sub => {
      let subNavItem = document.createElement('li');

      // Check for deeper submenus
      if (sub.sub_menu) {
        subNavItem.classList.add('dropdown-submenu'); // You can style this
        
        let subDropdownToggle = document.createElement('a');
        subDropdownToggle.classList.add('dropdown-item', 'dropdown-toggle');
        subDropdownToggle.href = '#';
        subDropdownToggle.textContent = sub.text;
        subNavItem.appendChild(subDropdownToggle);

        let subDropdownMenu = document.createElement('ul');
        subDropdownMenu.classList.add('dropdown-menu');

        sub.sub_menu.forEach(subSub => {
          let subSubItem = document.createElement('li');
          let subSubLink = document.createElement('a');
          subSubLink.classList.add('dropdown-item');
          
          // Check if it's an external URL
          if (subSub.link && (subSub.link.startsWith('http://') || subSub.link.startsWith('https://'))) {
            subSubLink.href = subSub.link;
            subSubLink.setAttribute('target', '_blank');
            subSubLink.setAttribute('onclick', 'closeMobileNav()');
          } else {
            subSubLink.href = '#';
            subSubLink.setAttribute('onclick', `closeMobileNav(); loadContent('${subSub.link}')`);
          }
          
          subSubLink.textContent = subSub.text;
          subSubItem.appendChild(subSubLink);
          subDropdownMenu.appendChild(subSubItem);
        });

        subNavItem.appendChild(subDropdownMenu);
      } else {
        // Simple dropdown item
        let subLink = document.createElement('a');
        subLink.classList.add('dropdown-item');
        
        // Check if it's an external URL
        if (sub.link && (sub.link.startsWith('http://') || sub.link.startsWith('https://'))) {
          subLink.href = sub.link;
          subLink.setAttribute('target', '_blank');
          subLink.setAttribute('onclick', 'closeMobileNav()');
        } else {
          subLink.href = '#';
          subLink.setAttribute('onclick', `closeMobileNav(); loadContent('${sub.link}')`);
        }
        
        subLink.textContent = sub.text;
        subNavItem.appendChild(subLink);
      }

      dropdownMenu.appendChild(subNavItem);
    });

    navItem.appendChild(dropdownMenu);
  } 
  // Normal link
  else {
    let normalLink = document.createElement('a');
    normalLink.classList.add('nav-link');
    
    // Check if it's an external URL
    if (item.link && (item.link.startsWith('http://') || item.link.startsWith('https://'))) {
      normalLink.href = item.link;
      normalLink.setAttribute('target', '_blank');
      normalLink.setAttribute('onclick', 'closeMobileNav()');
    } else {
      normalLink.href = '#';
      normalLink.setAttribute('onclick', `closeMobileNav(); loadContent('${item.link}')`);
    }
    
    normalLink.textContent = item.text;
    navItem.appendChild(normalLink);
  }

  return navItem;
}

// Change language
function setLanguage(lang) {
  const links = document.querySelectorAll('.active-lang');
  links.forEach(link => link.classList.remove('active'));

  if (lang === 'en') {
    links[0].classList.add('active');
  } else if (lang === 'si') {
    links[1].classList.add('active');
  } else if (lang === 'ta') {
    links[2].classList.add('active');
  }
  
  localStorage.setItem('language', lang);
  loadNav(lang);
  loadContent('home.html', lang);
}

// Update active language indication
function updateActiveLanguage() {
  const lang = localStorage.getItem('language') || 'si';
  const links = document.querySelectorAll('.active-lang');
  
  links.forEach(link => link.classList.remove('active'));
  
  if (lang === 'en') {
    links[0]?.classList.add('active');
  } else if (lang === 'si') {
    links[1]?.classList.add('active');
  } else if (lang === 'ta') {
    links[2]?.classList.add('active');
  }
}
function switchYear(section, year, btn) {
  // Hide all year content for this section
  document.querySelectorAll(`#${section}-2023, #${section}-2024, #${section}-2025`).forEach(content => {
      content.classList.remove('active');
  });
  
  // Show selected year content
  document.getElementById(`${section}-${year}`).classList.add('active');
  
  // Update button styles
  const parentDiv = btn.parentNode;
  const buttons = parentDiv.querySelectorAll('button');
  
  buttons.forEach(button => {
      button.classList.remove('btn-primary');
      button.classList.add('btn-outline-primary');
  });
  
  btn.classList.remove('btn-outline-primary');
  btn.classList.add('btn-primary');
}

// Initialize Bootstrap tooltips
document.addEventListener('DOMContentLoaded', function() {
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
      var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      tooltipTriggerList.map(function(tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl);
      });
  }
});