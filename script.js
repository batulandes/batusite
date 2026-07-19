"use strict";

const nav = document.getElementById("nav");
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
const scrollProgress =
  document.getElementById("scroll-progress");
const heroGlow =
  document.getElementById("hero-glow");
const heroDesigns =
  document.getElementById("hero-designs");
const heroDesignsTilt =
  document.getElementById("hero-designs-tilt");
const heroTitle =
  document.getElementById("hero-title");

const reduceMotion =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

const loadHeroDesigns = async () => {
  if (!heroDesigns || !heroDesignsTilt) {
    return;
  }

  const endpoint =
    "https://phreqbjgynchbynmtefz.supabase.co/rest/v1/tasarimlar" +
    "?select=id,gorsel_url,baslik" +
    "&yayinlandi=eq.true" +
    "&order=sira.asc,created_at.desc" +
    "&limit=12";

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey:
          "sb_publishable_BWfR-8PgH0RIfLDngFDjUA_2vbIo-Ae"
      }
    });

    if (!response.ok) {
      throw new Error(
        `Tasarım arşivi alınamadı: ${response.status}`
      );
    }

    const designs = await response.json();

    if (!Array.isArray(designs) || !designs.length) {
      return;
    }

    const isMobile = window.innerWidth <= 720;
    const cardCount = isMobile ? 6 : 12;
    const visibleDesigns = designs.slice(
      0,
      isMobile ? 7 : 12
    );

    const lanes = [-39, -13, 13, 39];

    for (let index = 0;
      index < cardCount;
      index += 1) {
      const design =
        visibleDesigns[index % visibleDesigns.length];
      const lane = lanes[index % lanes.length];
      const duration = 24;
      const card = document.createElement("div");
      const visual = document.createElement("div");
      const image = document.createElement("img");

      card.className = "hero-design-card";
      visual.className = "hero-design-card-visual";
      card.style.setProperty(
        "--lane-x",
        `${lane}vw`
      );
      card.style.setProperty(
        "--duration",
        `${duration}s`
      );
      card.style.setProperty(
        "--card-width",
        "14vw"
      );
      card.style.setProperty(
        "--delay",
        `${-(index / cardCount) * duration}s`
      );

      image.src = design.gorsel_url;
      image.alt = "";
      image.loading = index < 6 ? "eager" : "lazy";
      image.decoding = "async";
      image.addEventListener("load", () => {
        if (image.naturalWidth && image.naturalHeight) {
          card.style.setProperty(
            "--design-ratio",
            `${image.naturalWidth} / ${image.naturalHeight}`
          );
        }
      });

      visual.appendChild(image);
      card.appendChild(visual);
      heroDesignsTilt.appendChild(card);
    }

    requestAnimationFrame(() => {
      heroDesigns.classList.add("ready");
    });
  } catch (error) {
    console.error(error);
  }
};

loadHeroDesigns();

const loadPortfolioProjects = async () => {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  const indexUrl =
    "https://phreqbjgynchbynmtefz.supabase.co/storage/v1/object/public/timelapse/projects.json";

  try {
    const response = await fetch(`${indexUrl}?v=${Date.now()}`, {
      cache: "no-store"
    });
    if (!response.ok) return;

    const projects = await response.json();
    if (!Array.isArray(projects)) return;

    projects
      .sort((a, b) => (a.sira || 0) - (b.sira || 0))
      .forEach(project => {
        const existingCard = [...grid.querySelectorAll("[data-project-slug]")]
          .find(card => card.dataset.projectSlug === project.slug);

        if (!project.yayinlandi || !project.banner_url) {
          if (existingCard) existingCard.hidden = true;
          return;
        }

        const url = `/proje/${encodeURIComponent(project.slug)}`;

        if (existingCard) {
          existingCard.hidden = false;
          const image = existingCard.querySelector(".project-image");
          const title = existingCard.querySelector("h3");
          const summary = existingCard.querySelector(".project-content > p");
          const meta = existingCard.querySelector(".project-meta");
          existingCard.querySelectorAll("a.project-image-link, a.project-link")
            .forEach(link => { link.href = url; });
          if (image) {
            image.src = project.banner_url;
            image.alt = `${project.baslik} proje kapağı`;
          }
          if (title) title.textContent = project.baslik;
          if (summary) summary.textContent = project.ozet || project.aciklama || "";
          if (meta) {
            meta.innerHTML = "";
            [project.kategori || "Proje", project.yil].filter(Boolean).forEach(value => {
              const span = document.createElement("span");
              span.textContent = value;
              meta.appendChild(span);
            });
          }
          return;
        }

        const article = document.createElement("article");
        const imageLink = document.createElement("a");
        const imageWrap = document.createElement("div");
        const image = document.createElement("img");
        const hover = document.createElement("div");
        const content = document.createElement("div");
        const meta = document.createElement("div");
        const title = document.createElement("h3");
        const summary = document.createElement("p");
        const detailLink = document.createElement("a");

        article.className = "project-card project-card-featured reveal visible";
        article.dataset.projectSlug = project.slug;
        imageLink.className = "project-image-link";
        imageLink.href = url;
        imageLink.setAttribute("aria-label", `${project.baslik} proje sayfasını görüntüle`);
        imageWrap.className = "project-image-wrap";
        image.className = "project-image";
        image.src = project.banner_url;
        image.alt = `${project.baslik} proje kapağı`;
        image.loading = "lazy";
        hover.className = "project-hover";
        hover.setAttribute("aria-hidden", "true");
        hover.innerHTML = "<span>Projeyi Gör</span><strong>↗</strong>";
        content.className = "project-content";
        meta.className = "project-meta";
        [project.kategori || "Proje", project.yil].filter(Boolean).forEach(value => {
          const span = document.createElement("span");
          span.textContent = value;
          meta.appendChild(span);
        });
        title.textContent = project.baslik;
        summary.textContent = project.ozet || project.aciklama || "";
        detailLink.className = "project-link";
        detailLink.href = url;
        detailLink.innerHTML = "Projeyi İncele <span>↗</span>";

        imageWrap.append(image, hover);
        imageLink.appendChild(imageWrap);
        content.append(meta, title, summary, detailLink);
        article.append(imageLink, content);
        grid.appendChild(article);
      });
  } catch (error) {
    console.error("Proje arşivi yüklenemedi", error);
  }
};

loadPortfolioProjects();

const pageTransition = document.getElementById("page-transition");

document.querySelectorAll('a[href="/tasarimlar"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      reduceMotion
    ) {
      return;
    }

    event.preventDefault();
    document.body.classList.add("is-leaving");
    pageTransition?.classList.add("active");

    window.setTimeout(() => {
      window.location.assign(link.href);
    }, 450);
  });
});

const updateScrollState = () => {
  const scrollTop =
    window.scrollY ||
    document.documentElement.scrollTop;

  if (nav) {
    nav.classList.toggle(
      "compact",
      scrollTop > 35
    );
  }

  if (scrollProgress) {
    const documentHeight =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const progress =
      documentHeight > 0
        ? (scrollTop / documentHeight) * 100
        : 0;

    scrollProgress.style.width =
      `${Math.min(progress, 100)}%`;
  }
};

updateScrollState();

window.addEventListener(
  "scroll",
  updateScrollState,
  { passive: true }
);

if (navToggle && navLinks) {
  const closeMenu = () => {
    navLinks.classList.remove("open");
    navToggle.classList.remove("active");

    navToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    navToggle.setAttribute(
      "aria-label",
      "Menüyü aç"
    );

    document.body.classList.remove(
      "menu-open"
    );
  };

  navToggle.addEventListener(
    "click",
    () => {
      const isOpen =
        navLinks.classList.toggle("open");

      navToggle.classList.toggle(
        "active",
        isOpen
      );

      navToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      navToggle.setAttribute(
        "aria-label",
        isOpen
          ? "Menüyü kapat"
          : "Menüyü aç"
      );

      document.body.classList.toggle(
        "menu-open",
        isOpen
      );
    }
  );

  navLinks
    .querySelectorAll("a")
    .forEach((link) => {
      link.addEventListener(
        "click",
        closeMenu
      );
    });

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 900) {
        closeMenu();
      }
    }
  );

  document.addEventListener(
    "click",
    (event) => {
      const clickedInsideMenu =
        navLinks.contains(event.target);

      const clickedToggle =
        navToggle.contains(event.target);

      if (
        navLinks.classList.contains("open") &&
        !clickedInsideMenu &&
        !clickedToggle
      ) {
        closeMenu();
      }
    }
  );
}

const revealItems =
  document.querySelectorAll(".reveal");

if (reduceMotion) {
  revealItems.forEach((item) => {
    item.classList.add("visible");
  });
} else {
  const revealObserver =
    new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add(
            "visible"
          );

          observer.unobserve(
            entry.target
          );
        });
      },
      {
        threshold: 0.12,
        rootMargin:
          "0px 0px -35px 0px"
      }
    );

  revealItems.forEach((item) => {
    revealObserver.observe(item);
  });
}

const sections =
  document.querySelectorAll(
    "main section[id]"
  );

const menuLinks =
  document.querySelectorAll(
    ".nav-links a[data-section]"
  );

if (sections.length && menuLinks.length) {
  const sectionObserver =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const sectionId =
            entry.target.id;

          menuLinks.forEach((link) => {
            link.classList.toggle(
              "active",
              link.dataset.section ===
                sectionId
            );
          });
        });
      },
      {
        rootMargin:
          "-35% 0px -55% 0px",
        threshold: 0
      }
    );

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });
}

if (
  heroGlow &&
  !reduceMotion &&
  window.matchMedia(
    "(pointer: fine)"
  ).matches
) {
  window.addEventListener(
    "pointermove",
    (event) => {
      const x =
        (event.clientX /
          window.innerWidth) *
        100;

      const y =
        (event.clientY /
          window.innerHeight) *
        100;

      heroGlow.style.left =
        `${Math.max(
          20,
          Math.min(80, x)
        )}%`;

      heroGlow.style.top =
        `${Math.max(
          5,
          Math.min(55, y)
        )}%`;
    },
    { passive: true }
  );
}

document
  .querySelectorAll(
    'a[href^="#"]'
  )
  .forEach((anchor) => {
    anchor.addEventListener(
      "click",
      (event) => {
        const targetId =
          anchor.getAttribute("href");

        if (
          !targetId ||
          targetId === "#"
        ) {
          return;
        }

        const target =
          document.querySelector(
            targetId
          );

        if (!target) {
          return;
        }

        event.preventDefault();

        target.scrollIntoView({
          behavior: reduceMotion
            ? "auto"
            : "smooth",
          block: "start"
        });
      }
    );
  });

window.addEventListener(
  "load",
  () => {
    document.body.classList.add(
      "page-ready"
    );
  }
);
