(function () {
  var banner = document.getElementById('cookieBanner');
  if (!banner) return;

  if (sessionStorage.getItem('cookieAccepted') === '1') {
    banner.classList.add('hidden');
    return;
  }

  var btn = banner.querySelector('.cookie-banner__btn');
  if (!btn) return;

  btn.addEventListener('click', function () {
    sessionStorage.setItem('cookieAccepted', '1');
    banner.classList.add('hidden');
  });
})();
