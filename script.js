document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Menüyü kapat" : "Menüyü aç");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Menüyü aç");
      });
    });
  }

  const rotatingText = document.getElementById("rotating-text");

  if (rotatingText) {
    const words = [
      "Grafik Tasarım",
      "İçerik Üretimi",
      "Web Tasarım",
      "Uygulama Tasarımı"
    ];

    let index = 0;

    setInterval(() => {
      rotatingText.classList.add("is-changing");

      setTimeout(() => {
        index = (index + 1) % words.length;
        rotatingText.textContent = words[index];
        rotatingText.classList.remove("is-changing");
      }, 350);
    }, 2400);
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");
      const target = document.querySelector(targetId);

      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });
});