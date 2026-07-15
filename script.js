document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  const scrollProgress = document.getElementById("scroll-progress");

  let loadingFinished = false;

  const finishLoading = () => {
    if (loadingFinished) return;

    loadingFinished = true;
    body.classList.add("loaded");
    body.classList.remove("is-loading");
  };

  window.addEventListener(
    "load",
    () => {
      window.setTimeout(finishLoading, 500);
    },
    { once: true }
  );

  window.setTimeout(finishLoading, 1800);

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");

      navToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      navToggle.setAttribute(
        "aria-label",
        isOpen ? "Menüyü kapat" : "Menüyü aç"
      );
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");

        navToggle.setAttribute(
          "aria-expanded",
          "false"
        );

        navToggle.setAttribute(
          "aria-label",
          "Menüyü aç"
        );
      });
    });
  }

  const rotatingText =
    document.getElementById("rotating-text");

  const roleProgressBar =
    document.getElementById("role-progress-bar");

  if (rotatingText) {
    const words = [
      "Grafik Tasarım",
      "İçerik Üretimi",
      "Video Düzenleme",
      "Web Tasarım",
      "Uygulama Tasarımı"
    ];

    let index = 0;
    const interval = 2800;
    const transitionDuration = 420;

    const restartProgress = () => {
      if (!roleProgressBar) return;

      roleProgressBar.classList.remove("running");
      void roleProgressBar.offsetWidth;
      roleProgressBar.classList.add("running");
    };

    const changeWord = () => {
      restartProgress();

      window.setTimeout(() => {
        rotatingText.classList.add("is-changing");

        window.setTimeout(() => {
          index = (index + 1) % words.length;
          rotatingText.textContent = words[index];
          rotatingText.classList.remove("is-changing");
        }, transitionDuration);
      }, interval - transitionDuration);
    };

    restartProgress();
    window.setInterval(changeWord, interval);
  }

  const updateScrollState = () => {
    const scrollTop = window.scrollY;

    if (nav) {
      nav.classList.toggle("compact", scrollTop > 60);
    }

    if (scrollProgress) {
      const maxScroll =
        document.documentElement.scrollHeight -
        window.innerHeight;

      const percentage =
        maxScroll > 0
          ? (scrollTop / maxScroll) * 100
          : 0;

      scrollProgress.style.width = `${percentage}%`;
    }
  };

  window.addEventListener(
    "scroll",
    updateScrollState,
    { passive: true }
  );

  updateScrollState();

  const sectionLinks =
    document.querySelectorAll(
      ".nav-links a[data-section]"
    );

  const sections = [...sectionLinks]
    .map((link) => {
      return document.getElementById(
        link.dataset.section
      );
    })
    .filter(Boolean);

  if (
    sections.length &&
    "IntersectionObserver" in window
  ) {
    const sectionObserver =
      new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => {
              return entry.isIntersecting;
            })
            .sort((a, b) => {
              return (
                b.intersectionRatio -
                a.intersectionRatio
              );
            })[0];

          if (!visible) return;

          sectionLinks.forEach((link) => {
            const isActive =
              link.dataset.section ===
              visible.target.id;

            link.classList.toggle(
              "active",
              isActive
            );
          });
        },
        {
          rootMargin: "-35% 0px -50% 0px",
          threshold: [0.01, 0.25, 0.5]
        }
      );

    sections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  document
    .querySelectorAll('a[href^="#"]')
    .forEach((anchor) => {
      anchor.addEventListener(
        "click",
        (event) => {
          const targetId =
            anchor.getAttribute("href");

          if (!targetId || targetId === "#") {
            return;
          }

          const target =
            document.querySelector(targetId);

          if (!target) return;

          event.preventDefault();

          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      );
    });
});
