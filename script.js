import './style.css';

// Nav scroll state
const nav = document.getElementById('nav');
const onScroll = () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');

const closeMenu = () => {
  toggle.classList.remove('is-open');
  links.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
};

toggle.addEventListener('click', () => {
  const open = toggle.classList.toggle('is-open');
  links.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
});

links.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

// Reveal on scroll
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
);
reveals.forEach((el) => io.observe(el));

// Smooth scroll for anchor links (respects reduced motion)
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}
