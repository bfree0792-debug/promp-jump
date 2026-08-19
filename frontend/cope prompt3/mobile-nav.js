function openMobileNav() {
  const sidebar = document.getElementById('mobileSidebar');
  const overlay = document.getElementById('mobileOverlay');
  if (!sidebar || !overlay) return;

  sidebar.style.width = '260px';
  sidebar.setAttribute('aria-hidden', 'false');
  overlay.classList.add('active');
  document.body.classList.add('mobile-nav-open');
}

function closeMobileNav() {
  const sidebar = document.getElementById('mobileSidebar');
  const overlay = document.getElementById('mobileOverlay');
  if (!sidebar || !overlay) return;

  sidebar.style.width = '0';
  sidebar.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('active');
  document.body.classList.remove('mobile-nav-open');
}

window.openMobileNav = openMobileNav;
window.closeMobileNav = closeMobileNav;

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMobileNav();
  }
});

function initMobileNav() {
  document.querySelectorAll('.mobile-menu-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMobileNav();
    });
  });

  document.querySelectorAll('.mobile-sidebar-close').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      closeMobileNav();
    });
  });

  const overlay = document.getElementById('mobileOverlay');
  if (overlay) {
    overlay.addEventListener('click', closeMobileNav);
  }

  document.querySelectorAll('.mobile-sidebar a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  initMobileNav();
}
