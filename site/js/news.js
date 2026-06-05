(function () {
  var PREFIX = typeof window.SITE_PREFIX === 'string' ? window.SITE_PREFIX : '/AI-Assistant';
  var DATA_URL = PREFIX + '/data/news.json';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T12:00:00');
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  }

  function sortItems(items) {
    return items.slice().sort(function (a, b) {
      return (b.date || '').localeCompare(a.date || '');
    });
  }

  function renderMarkdown(md) {
    if (window.marked && typeof window.marked.parse === 'function') {
      return window.marked.parse(md || '');
    }
    return '<p>' + escapeHtml(md || '').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
  }

  function loadNews() {
    return fetch(DATA_URL).then(function (r) {
      if (!r.ok) throw new Error('Не удалось загрузить новости');
      return r.json();
    });
  }

  function renderList(container) {
    loadNews()
      .then(function (data) {
        var items = sortItems(data.items || []);
        if (!items.length) {
          container.innerHTML = '<p class="news-empty">Пока нет опубликованных новостей.</p>';
          return;
        }
        container.innerHTML = items.map(function (item) {
          var href = PREFIX + '/news/article.html?slug=' + encodeURIComponent(item.slug || item.id);
          return (
            '<article class="news-preview">' +
              '<h2 class="news-preview__title"><a href="' + href + '">' + escapeHtml(item.title) + '</a></h2>' +
              '<time class="news-preview__date" datetime="' + escapeHtml(item.date) + '">' + formatDate(item.date) + '</time>' +
              '<p class="news-preview__excerpt">' + escapeHtml(item.excerpt || '') + '</p>' +
              '<a class="news-preview__more" href="' + href + '">Читать полностью</a>' +
            '</article>'
          );
        }).join('');
      })
      .catch(function () {
        container.innerHTML = '<p class="news-empty">Не удалось загрузить новости. Попробуйте обновить страницу.</p>';
      });
  }

  function renderArticle(container) {
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');
    if (!slug) {
      container.innerHTML = '<p class="news-empty">Новость не найдена. <a href="' + PREFIX + '/news/">Вернуться к списку</a></p>';
      return;
    }

    loadNews()
      .then(function (data) {
        var item = (data.items || []).find(function (n) {
          return n.slug === slug || n.id === slug;
        });
        if (!item) {
          container.innerHTML = '<p class="news-empty">Новость не найдена. <a href="' + PREFIX + '/news/">Вернуться к списку</a></p>';
          return;
        }
        document.title = item.title + ' — Андреевский';
        container.innerHTML =
          '<article class="news-post">' +
            '<header class="news-post__header">' +
              '<h1 class="news-post__title">' + escapeHtml(item.title) + '</h1>' +
              '<time class="news-post__date" datetime="' + escapeHtml(item.date) + '">' + formatDate(item.date) + '</time>' +
            '</header>' +
            '<div class="news-post__body prose">' + renderMarkdown(item.body) + '</div>' +
            '<footer class="news-post__footer">' +
              '<a class="btn btn--outline" href="' + PREFIX + '/news/">← Все новости</a>' +
            '</footer>' +
          '</article>';
      })
      .catch(function () {
        container.innerHTML = '<p class="news-empty">Не удалось загрузить новость.</p>';
      });
  }

  window.NewsApp = {
    renderList: renderList,
    renderArticle: renderArticle,
    loadNews: loadNews,
    formatDate: formatDate
  };

  document.addEventListener('DOMContentLoaded', function () {
    var listEl = document.getElementById('news-list');
    var articleEl = document.getElementById('news-article');
    if (listEl) renderList(listEl);
    if (articleEl) renderArticle(articleEl);
  });
})();
