document.addEventListener('DOMContentLoaded', () => {

  const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------- i18n: translations dictionary ---------- */
  const translations = {
    'nav.work': { tr: 'Çalışmalar', en: 'Work' },
    'nav.about': { tr: 'Hakkımda', en: 'About' },
    'nav.contact': { tr: 'İletişim', en: 'Contact' },
    'hero.bgtext': { tr: 'TASARIM · İÇERİK · MARKA · TASARIM · İÇERİK · MARKA · ', en: 'DESIGN · CONTENT · BRAND · DESIGN · CONTENT · BRAND · ' },
    'hero.role1': { tr: 'Grafik Tasarımcı', en: 'Graphic Designer' },
    'hero.role2': { tr: 'YouTube İçerik Üreticisi', en: 'YouTube Content Creator' },
    'hero.intro': { tr: 'Cesur görseller, akılda kalıcı markalar ve etkileyici dijital içerikler üretiyorum.', en: 'Creating bold visuals, memorable brands and engaging digital content.' },
    'cat.branding': { tr: 'Marka Kimliği', en: 'Branding' },
    'cat.thumbnails': { tr: 'Thumbnail', en: 'Thumbnails' },
    'cat.graphic': { tr: 'Grafik Tasarım', en: 'Graphic Design' },
    'cat.youtube': { tr: 'YouTube', en: 'YouTube' },
    'marquee.editing': { tr: 'Video Kurgu', en: 'Video Editing' },
    'marquee.identity': { tr: 'Görsel Kimlik', en: 'Visual Identity' },
    'work.eyebrow': { tr: 'Seçilmiş Çalışmalar', en: 'Selected Work' },
    'work.title': { tr: 'Portföy', en: 'Portfolio' },
    'filter.all': { tr: 'Tümü', en: 'All' },
    'proj1.title': { tr: 'Nova Kimlik', en: 'Nova Identity' },
    'proj2.title': { tr: 'Yüksek Etkili Thumbnail Seti', en: 'High-Impact Thumbnail Set' },
    'proj3.title': { tr: 'Monokrom Poster Serisi', en: 'Monochrome Poster Series' },
    'proj4.title': { tr: 'Kanal Yenileme', en: 'Channel Rebrand' },
    'proj5.title': { tr: 'Stüdyo Amblemi', en: 'Studio Mark' },
    'proj6.title': { tr: 'Editoryal Yerleşimler', en: 'Editorial Layouts' },
    'about.eyebrow': { tr: 'Hakkımda', en: 'About' },
    'about.title': { tr: 'Biraz kendimden bahsedeyim', en: 'A little about me' },
    'about.bio': {
      tr: "Ben Batu — süslemeden çok, üzerine düşünülmüş görseller üretmeye odaklanan bir grafik tasarımcı ve içerik üreticisiyim. Çalışmalarım marka kimliğinden thumbnail tasarımına ve YouTube içeriğine kadar uzanıyor, ama hedef hep aynı: önce netlik, sonra süsleme. Çoğu kişinin gözden kaçırdığı detaylar benim işim.",
      en: "I'm Batu — a graphic designer and content creator focused on building visuals that feel considered rather than decorated. My work spans brand identity, thumbnail design and YouTube content, always with the same goal: clarity first, decoration second. I care about the details most people scroll past."
    },
    'stat1.label': { tr: 'Tamamlanan Proje', en: 'Completed Projects' },
    'stat2.label': { tr: 'Uzmanlık Alanı', en: 'Areas of Expertise' },
    'stat3.label': { tr: 'Özenli İşçilik', en: 'Careful Craft' },
    'skills.label': { tr: 'Kullandığım Araçlar', en: 'Tools I Use' },
    'contact.eyebrow': { tr: 'İletişime Geç', en: 'Get in Touch' },
    'contact.title': { tr: 'Birlikte çalışalım', en: "Let's work together" },
    'contact.copy': { tr: 'Aklında bir proje mi var? Duymak isterim.', en: 'Have a project in mind? I\'d love to hear about it.' },
  };

  const titleTranslations = {
    tr: 'Batu — Grafik Tasarımcı & YouTube İçerik Üreticisi',
    en: 'Batu — Graphic Designer & YouTube Content Creator'
  };
  const descTranslations = {
    tr: 'Batu; marka kimliği, thumbnail tasarımı ve dijital içerik üreten bir grafik tasarımcı ve YouTube içerik üreticisidir.',
    en: 'Batu is a graphic designer and YouTube content creator specializing in branding, thumbnails and digital content.'
  };

  const applyLanguage = (lang) => {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (translations[key]) {
        el.textContent = translations[key][lang];
      }
    });
    document.title = titleTranslations[lang];
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', descTranslations[lang]);

    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) langToggle.textContent = lang === 'tr' ? 'EN' : 'TR';

    localStorage.setItem('batu-lang', lang);
    currentLang = lang;
  };

  let currentLang = localStorage.getItem('batu-lang') || 'tr';
  applyLanguage(currentLang);

  const langToggleBtn = document.getElementById('lang-toggle');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      applyLanguage(currentLang === 'tr' ? 'en' : 'tr');
    });
  }

  /* ---------- Sticky nav background on scroll ---------- */
  const nav = document.getElementById('nav');
  const scrollProgress = document.getElementById('scroll-progress');

  const onScroll = () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    scrollProgress.style.width = progress + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Cursor-follow spotlight glow (desktop only) ---------- */
  const spotlight = document.getElementById('spotlight');
  if (!isTouchDevice && spotlight) {
    window.addEventListener('mousemove', (e) => {
      spotlight.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      spotlight.classList.add('active');
    });
    window.addEventListener('mouseleave', () => spotlight.classList.remove('active'));
  }

  /* ---------- Hero role flip animation ---------- */
  const roles = document.querySelectorAll('.role-flip .role');
  if (roles.length > 1) {
    let current = 0;
    setInterval(() => {
      const next = (current + 1) % roles.length;
      roles[current].classList.remove('active');
      roles[current].classList.add('exiting');
      roles[next].classList.add('active');
      setTimeout(() => roles[current].classList.remove('exiting'), 500);
      current = next;
    }, 2600);
  }

  /* ---------- Back to top button ---------- */
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Magnetic button effect (desktop only) ---------- */
  if (!isTouchDevice) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const inner = el.querySelector('span') || el;
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
        el.style.transform = `translate(${x * 0.4}px, ${y * 0.4}px)`;
        inner.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        inner.style.transform = '';
      });
    });
  }

  /* ---------- Animated stat counters ---------- */
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers.length) {
    const animateCount = (el) => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const duration = 1400;
      const start = performance.now();

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => statsObserver.observe(el));
  }

  /* ---------- Mobile hamburger menu ---------- */
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    });
  });

  /* ---------- Scroll reveal for portfolio cards ---------- */
  const cards = document.querySelectorAll('.card');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  cards.forEach(card => revealObserver.observe(card));

  /* ---------- 3D tilt effect on cards (desktop only) ---------- */
  if (!isTouchDevice) {
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--ry', `${x * 10}deg`);
        card.style.setProperty('--rx', `${-y * 10}deg`);
        card.classList.add('tilting');
      });
      card.addEventListener('mouseleave', () => {
        card.classList.remove('tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Portfolio filtering ---------- */
  const filters = document.querySelectorAll('.filter');

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(f => {
        f.classList.remove('active');
        f.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const category = btn.dataset.filter;

      cards.forEach(card => {
        const match = category === 'all' || card.dataset.category === category;
        card.classList.toggle('hidden-filter', !match);
        if (match) {
          // re-trigger reveal animation for newly shown cards
          requestAnimationFrame(() => card.classList.add('visible'));
        }
      });
    });
  });

  /* ---------- Modal ---------- */
  const overlay = document.getElementById('modal-overlay');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalCategory = document.getElementById('modal-category');
  const modalDesc = document.getElementById('modal-desc');
  const modalClose = document.getElementById('modal-close');
  let lastFocusedElement = null;

  const openModal = (card) => {
    lastFocusedElement = document.activeElement;

    modalImg.src = card.dataset.img;
    const title = currentLang === 'en' ? (card.dataset.titleEn || card.dataset.title) : card.dataset.title;
    const desc = currentLang === 'en' ? (card.dataset.descEn || card.dataset.desc) : card.dataset.desc;
    const category = currentLang === 'en' ? (card.dataset.categoryLabelEn || card.dataset.categoryLabel) : card.dataset.categoryLabel;

    modalImg.alt = title;
    modalTitle.textContent = title;
    modalCategory.textContent = category;
    modalDesc.textContent = desc;

    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('open'));
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  };

  const closeModal = () => {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.hidden = true; }, 250);
    if (lastFocusedElement) lastFocusedElement.focus();
  };

  cards.forEach(card => {
    card.addEventListener('click', () => openModal(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card);
      }
    });
  });

  modalClose.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  /* ---------- Smooth scroll for in-page nav links (fallback) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
