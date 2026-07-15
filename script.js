document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  const scrollProgress = document.getElementById("scroll-progress");

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
      "Video Düzenleme",
      "İçerik Üretimi",
      "Web Site Tasarımı",
      "3D Modelleme"
    ];

    let currentIndex = 0;

    const intervalDuration = 2700;
    const fadeDuration = 380;

    const restartProgress = () => {
      if (!roleProgressBar) {
        return;
      }

      roleProgressBar.classList.remove("running");

      void roleProgressBar.offsetWidth;

      roleProgressBar.classList.add("running");
    };

    const changeWord = () => {
      rotatingText.classList.add("is-changing");

      window.setTimeout(() => {
        currentIndex =
          (currentIndex + 1) % words.length;

        rotatingText.textContent =
          words[currentIndex];

        rotatingText.classList.remove(
          "is-changing"
        );

        restartProgress();
      }, fadeDuration);
    };

    restartProgress();

    window.setInterval(
      changeWord,
      intervalDuration
    );
  }

  const updateScrollState = () => {
    const scrollTop = window.scrollY;

    if (nav) {
      nav.classList.toggle(
        "compact",
        scrollTop > 60
      );
    }

    if (scrollProgress) {
      const maximumScroll =
        document.documentElement.scrollHeight -
        window.innerHeight;

      const progress =
        maximumScroll > 0
          ? (scrollTop / maximumScroll) * 100
          : 0;

      scrollProgress.style.width =
        `${progress}%`;
    }
  };

  window.addEventListener(
    "scroll",
    updateScrollState,
    {
      passive: true
    }
  );

  updateScrollState();

  const sectionLinks =
    document.querySelectorAll(
      ".nav-links a[data-section]"
    );

  const sections =
    [...sectionLinks]
      .map((link) => {
        return document.getElementById(
          link.dataset.section
        );
      })
      .filter(Boolean);

  if (
    sections.length > 0 &&
    "IntersectionObserver" in window
  ) {
    const observer =
      new IntersectionObserver(
        (entries) => {
          const visibleEntry =
            entries
              .filter((entry) => {
                return entry.isIntersecting;
              })
              .sort((first, second) => {
                return (
                  second.intersectionRatio -
                  first.intersectionRatio
                );
              })[0];

          if (!visibleEntry) {
            return;
          }

          sectionLinks.forEach((link) => {
            const isActive =
              link.dataset.section ===
              visibleEntry.target.id;

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
      observer.observe(section);
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

          if (
            !targetId ||
            targetId === "#"
          ) {
            return;
          }

          const target =
            document.querySelector(targetId);

          if (!target) {
            return;
          }

          event.preventDefault();

          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      );
    });
});
