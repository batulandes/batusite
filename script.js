// ============================================
// LOADER
// ============================================
document.body.classList.add('loading');

window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.classList.add('fade-out');
    document.body.classList.remove('loading');
    loader.addEventListener('transitionend', () => {
      loader.style.display = 'none';
      loader.setAttribute('aria-hidden', 'true');
    }, { once: true });
  }, 1300);
});

// ============================================
// NAV — scroll state + mobile menu
// ============================================
const nav = document.getElementById('nav');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

const onScroll = () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ============================================
// SCROLL REVEAL
// ============================================
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in-view'));
}

// ============================================
// PROJECT MODAL
// ============================================
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalTag = document.getElementById('modal-tag');
const modalDesc = document.getElementById('modal-desc');
const modalClose = document.getElementById('modal-close');
let lastFocused = null;

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', () => {
    modalTitle.textContent = card.dataset.title;
    modalTag.textContent = card.dataset.category;
    modalDesc.textContent = card.dataset.desc;
    lastFocused = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('show'));
    modalClose.focus();
    document.body.style.overflow = 'hidden';
  });
});

function closeModal() {
  modal.classList.remove('show');
  document.body.style.overflow = '';
  modal.addEventListener('transitionend', () => {
    modal.hidden = true;
  }, { once: true });
  if (lastFocused) lastFocused.focus();
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});

// ============================================
// FOOTER YEAR
// ============================================
document.getElementById('year').textContent = new Date().getFullYear();
