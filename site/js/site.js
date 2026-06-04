(function () {
  var banner = document.getElementById('cookieBanner');
  if (!banner) return;

  var STORAGE_KEY = 'andreevsky_cookie_accepted';

  if (localStorage.getItem(STORAGE_KEY) === '1') {
    banner.classList.add('hidden');
    banner.setAttribute('aria-hidden', 'true');
    return;
  }

  banner.setAttribute('aria-hidden', 'false');

  var btn = banner.querySelector('.cookie-banner__btn');
  if (!btn) return;

  function acceptCookies() {
    localStorage.setItem(STORAGE_KEY, '1');
    banner.classList.add('hidden');
    banner.setAttribute('aria-hidden', 'true');
  }

  btn.addEventListener('click', acceptCookies);
  btn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      acceptCookies();
    }
  });
})();
