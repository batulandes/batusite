document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  const scrollProgress =
    document.getElementById("scroll-progress");

  /*
   * SUPABASE AYARLARI
   */
  const SUPABASE_URL =
    "https://phreqbjgynchbynmtefz.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_BWfR-8PgH0RIfLDngFDjUA_2vbIo-Ae";

  /*
   * Güvenli HTML metni
   */
  const escapeHTML = (value = "") => {
    return String(value).replace(
      /[&<>"']/g,
      (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]
    );
  };

  /*
   * Mobil menü
   */
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen =
        navLinks.classList.toggle("open");

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
    });

    navLinks
      .querySelectorAll("a")
      .forEach((link) => {
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

  /*
   * Değişen ana başlık
   */
  const rotatingText =
    document.getElementById("rotating-text");

  const roleProgressBar =
    document.getElementById(
      "role-progress-bar"
    );

  if (rotatingText) {
    const words = [
      "Grafik Tasarım",
      "İçerik Üretimi",
      "Video Düzenleme",
      "Web Tasarım",
      "Uygulama Tasarımı"
    ];

    let currentIndex = 0;

    const intervalDuration = 2700;
    const fadeDuration = 380;

    const restartProgress = () => {
      if (!roleProgressBar) {
        return;
      }

      roleProgressBar.classList.remove(
        "running"
      );

      void roleProgressBar.offsetWidth;

      roleProgressBar.classList.add(
        "running"
      );
    };

    const changeWord = () => {
      rotatingText.classList.add(
        "is-changing"
      );

      window.setTimeout(() => {
        currentIndex =
          (currentIndex + 1) %
          words.length;

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

  /*
   * Üst menü küçülmesi ve
   * kaydırma ilerleme çizgisi
   */
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
        document.documentElement
          .scrollHeight -
        window.innerHeight;

      const progress =
        maximumScroll > 0
          ? (
              scrollTop /
              maximumScroll
            ) * 100
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

  /*
   * Menüde aktif bölümü göster
   */
  const sectionLinks =
    document.querySelectorAll(
      ".nav-links a[data-section]"
    );

  const sections = [
    ...sectionLinks
  ]
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
    const sectionObserver =
      new IntersectionObserver(
        (entries) => {
          const visibleEntry =
            entries
              .filter((entry) => {
                return (
                  entry.isIntersecting
                );
              })
              .sort(
                (
                  first,
                  second
                ) => {
                  return (
                    second
                      .intersectionRatio -
                    first
                      .intersectionRatio
                  );
                }
              )[0];

          if (!visibleEntry) {
            return;
          }

          sectionLinks.forEach(
            (link) => {
              const isActive =
                link.dataset.section ===
                visibleEntry.target.id;

              link.classList.toggle(
                "active",
                isActive
              );
            }
          );
        },
        {
          rootMargin:
            "-35% 0px -50% 0px",

          threshold: [
            0.01,
            0.25,
            0.5
          ]
        }
      );

    sections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  /*
   * Sayfa içi yumuşak kaydırma
   */
  document
    .querySelectorAll(
      'a[href^="#"]'
    )
    .forEach((anchor) => {
      anchor.addEventListener(
        "click",
        (event) => {
          const targetId =
            anchor.getAttribute(
              "href"
            );

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
            behavior: "smooth",
            block: "start"
          });
        }
      );
    });

  /*
   * SUPABASE'TEN PROJELERİ GETİR
   */
  const loadProjects = async () => {
    const workSection =
      document.getElementById("work");

    if (!workSection) {
      return;
    }

    const workContainer =
      workSection.querySelector(
        ".container"
      );

    const sectionHead =
      workSection.querySelector(
        ".section-head"
      );

    if (
      !workContainer ||
      !sectionHead
    ) {
      return;
    }

    try {
      const endpoint =
        `${SUPABASE_URL}` +
        `/rest/v1/projects` +
        `?select=*` +
        `&published=eq.true` +
        `&order=sort_order.asc,created_at.desc`;

      const response = await fetch(
        endpoint,
        {
          method: "GET",

          headers: {
            apikey:
              SUPABASE_KEY,

            Authorization:
              `Bearer ${SUPABASE_KEY}`,

            Accept:
              "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          `Projeler alınamadı: ${response.status}`
        );
      }

      const projects =
        await response.json();

      if (
        !Array.isArray(projects) ||
        projects.length === 0
      ) {
        console.warn(
          "Supabase'te yayınlanmış proje bulunamadı."
        );

        return;
      }

      /*
       * Eski sabit proje kartlarını kaldır
       */
      workContainer
        .querySelectorAll(
          ".project-card"
        )
        .forEach((card) => {
          card.remove();
        });

      /*
       * Yeni projeleri ekle
       */
      projects.forEach(
        (project) => {
          const projectCard =
            document.createElement(
              "a"
            );

          const projectTitle =
            project.title ||
            "İsimsiz Proje";

          const projectCategory =
            project.category ||
            "Proje";

          const projectYear =
            project.year || "";

          const projectDescription =
            project.short_description ||
            project.description ||
            "";

          const projectImage =
            project.cover_image ||
            "";

          const projectLink =
            project.project_url ||
            `project.html?slug=${encodeURIComponent(
              project.slug || ""
            )}`;

          const isExternal =
            projectLink.startsWith(
              "http://"
            ) ||
            projectLink.startsWith(
              "https://"
            );

          projectCard.className =
            "project-card";

          projectCard.href =
            projectLink;

          projectCard.setAttribute(
            "aria-label",
            `${projectTitle} projesini görüntüle`
          );

          if (isExternal) {
            projectCard.target =
              "_blank";

            projectCard.rel =
              "noopener noreferrer";
          }

          projectCard.innerHTML = `
            <div class="project-image-wrap">

              <img
                src="${escapeHTML(
                  projectImage
                )}"
                alt="${escapeHTML(
                  projectTitle
                )}"
                class="project-image"
                loading="lazy"
              >

              <div
                class="project-hover"
                aria-hidden="true"
              >
                <span>
                  Projeyi Gör
                </span>

                <strong>
                  ↗
                </strong>
              </div>

            </div>

            <div class="project-content">

              <div>

                <div class="project-meta">

                  <span>
                    ${escapeHTML(
                      projectCategory
                    )}
                  </span>

                  ${
                    projectYear
                      ? `
                        <span>
                          ${escapeHTML(
                            projectYear
                          )}
                        </span>
                      `
                      : ""
                  }

                </div>

                <h3>
                  ${escapeHTML(
                    projectTitle
                  )}
                </h3>

                ${
                  projectDescription
                    ? `
                      <p>
                        ${escapeHTML(
                          projectDescription
                        )}
                      </p>
                    `
                    : ""
                }

              </div>

              <span
                class="project-detail-link"
              >
                Proje detayına git
                <b>↗</b>
              </span>

            </div>
          `;

          workContainer.appendChild(
            projectCard
          );
        }
      );
    } catch (error) {
      /*
       * Bir hata olursa mevcut sabit
       * Lemonhota kartını silmiyoruz.
       */
      console.error(
        "Supabase proje hatası:",
        error
      );
    }
  };

  loadProjects();
});
