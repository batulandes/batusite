(() => {
  const logoMark = "/logolar/BATU%20Logo%20Beyaz.png?v=3";
  const logoWordmark = "/logolar/BATU%20Logo%20Yatay%20Beyaz.png";
  const header = document.querySelector("body > header") || document.createElement("header");
  const logout = header.querySelector("#logout") || document.getElementById("logout");

  header.className = "batu-site-nav";
  header.removeAttribute("hidden");
  header.innerHTML = `<div class="batu-shell-container batu-site-nav__inner"><a class="batu-site-home" href="/">Ana Sayfa</a><a class="batu-site-logo" href="/" aria-label="BATU ana sayfa"><span class="batu-site-logo__mark"><img src="${logoMark}" alt="BATU"></span><img class="batu-site-logo__wordmark" src="${logoWordmark}" alt="" aria-hidden="true"></a><div class="batu-site-nav__actions"></div></div>`;
  if (!header.isConnected) document.body.prepend(header);
  if (logout) header.querySelector(".batu-site-nav__actions").append(logout);

  const footer = document.querySelector("body > footer") || document.createElement("footer");
  footer.className = "batu-site-footer";
  footer.removeAttribute("hidden");
  footer.innerHTML = `<p class="batu-site-footer__copy">© 2026 BATU · Tüm hakları saklıdır.</p><a class="batu-site-footer__link" href="/isbirlikleri">İşbirlikleri</a><a href="/logo" aria-label="BATU resmî logo arşivini aç"><img class="batu-site-footer__logo" src="${logoWordmark}" alt="BATU"></a>`;
  if (!footer.isConnected) document.body.append(footer);

  const transition = document.createElement("div");
  transition.className = "batu-page-transition";
  transition.setAttribute("aria-hidden", "true");
  transition.innerHTML = `<img src="${logoWordmark}" alt="">`;
  document.body.append(transition);

  const compactHeader = () => header.classList.toggle("is-compact", window.scrollY > 48);
  compactHeader();
  window.addEventListener("scroll", compactHeader, { passive: true });

  document.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank" || link.hasAttribute("download")) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search && url.hash)) return;
    event.preventDefault();
    transition.classList.add("is-active");
    window.setTimeout(() => { location.href = url.href; }, 300);
  });

  window.addEventListener("pageshow", () => transition.classList.remove("is-active"));
})();
