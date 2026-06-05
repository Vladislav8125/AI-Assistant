(function () {
  var PREFIX = typeof window.SITE_PREFIX === 'string' ? window.SITE_PREFIX : '/AI-Assistant';

  document.addEventListener('DOMContentLoaded', function () {
    fetch(PREFIX + '/data/site-settings.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.hero) {
          var t = document.getElementById('hero-title');
          var l = document.getElementById('hero-lead');
          var s = document.getElementById('hero-subtitle');
          if (t && data.hero.title) t.textContent = data.hero.title;
          if (l && data.hero.lead) l.textContent = data.hero.lead;
          if (s && data.hero.subtitle) s.textContent = data.hero.subtitle;
        }
        var q = document.getElementById('site-quote');
        if (q && data.quote) q.textContent = data.quote;
      })
      .catch(function () { /* keep static fallback */ });
  });
})();
