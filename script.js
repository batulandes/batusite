"use strict";

const nav = document.getElementById("nav");
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
const scrollProgress =
  document.getElementById("scroll-progress");
const heroGlow =
  document.getElementById("hero-glow");

const reduceMotion =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

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
      if (window.innerWidth > 720) {
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
