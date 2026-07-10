(function () {
  function resolvePrefix() {
    if (typeof window.SITE_PREFIX === 'string') return window.SITE_PREFIX;
    var path = window.location.pathname;
    var marker = '/admin/';
    var i = path.indexOf(marker);
    if (i > 0) return path.slice(0, i);
    return '';
  }

  var PREFIX = resolvePrefix();
  var AUTH_KEY = 'andreevsky_admin_auth';
  var TOKEN_KEY = 'andreevsky_github_token';

  var config = null;
  var newsData = { items: [] };
  var settingsData = {};
  var bodyEditor = null;
  var editingId = null;
  var appBooted = false;

  function $(id) {
    return document.getElementById(id);
  }

  function toast(msg, isError) {
    var el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.background = isError ? '#c8394b' : '#333';
    el.hidden = false;
    setTimeout(function () {
      el.hidden = true;
    }, 4000);
  }

  function showLoginError(msg) {
    var err = $('login-error');
    if (!err) return;
    err.textContent = msg || '';
    err.hidden = !msg;
  }

  function uniqueUrls(urls) {
    var seen = {};
    return urls.filter(function (u) {
      if (!u || seen[u]) return false;
      seen[u] = true;
      return true;
    });
  }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' HTTP ' + r.status);
      return r.json();
    });
  }

  function fetchFirst(urls) {
    var chain = Promise.reject();
    urls.forEach(function (url) {
      chain = chain.catch(function () {
        return fetchJson(url);
      });
    });
    return chain;
  }

  function dataUrl(name) {
    return uniqueUrls([
      PREFIX + '/data/' + name,
      '/data/' + name,
      '../data/' + name,
      '/data/' + name
    ]);
  }

  function loadConfig() {
    return fetchFirst(dataUrl('admin-config.json')).then(function (c) {
      config = c;
      return c;
    });
  }

  function loadNews() {
    return fetchFirst(dataUrl('news.json')).then(function (d) {
      newsData = d;
      return d;
    });
  }

  function loadSettings() {
    return fetchFirst(dataUrl('site-settings.json')).then(function (d) {
      settingsData = d;
      return d;
    });
  }

  function slugify(text) {
    var map = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
      и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
      с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
      щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
    };
    return String(text).toLowerCase().split('').map(function (c) {
      return map[c] || c;
    }).join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'news-' + Date.now();
  }

  function getFileSha(path, token) {
    return fetch('https://api.github.com/repos/' + config.github.owner + '/' + config.github.repo + '/contents/' + path + '?ref=' + config.github.branch, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' }
    }).then(function (r) {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('GitHub: не удалось получить файл');
      return r.json();
    }).then(function (data) {
      return data ? data.sha : null;
    });
  }

  function putFile(path, contentObj, message, token) {
    return getFileSha(path, token).then(function (sha) {
      var body = {
        message: message,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(contentObj, null, 2)))),
        branch: config.github.branch
      };
      if (sha) body.sha = sha;
      return fetch('https://api.github.com/repos/' + config.github.owner + '/' + config.github.repo + '/contents/' + path, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) {
        throw new Error(e.message || 'Ошибка сохранения на GitHub');
      });
      return r.json();
    });
  }

  function publishAll() {
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      toast('Сначала укажите GitHub Token во вкладке «Справка»', true);
      document.querySelector('[data-tab="help"]').click();
      return Promise.reject();
    }
    var btn = $('save-github-btn');
    btn.disabled = true;
    btn.textContent = 'Публикация…';
    return putFile(config.github.newsPath, newsData, 'Обновление новостей (админ-панель)', token)
      .then(function () {
        return putFile(config.github.settingsPath, settingsData, 'Обновление главной страницы (админ-панель)', token);
      })
      .then(function () {
        toast('Опубликовано! Сайт обновится через 1–2 минуты.');
      })
      .catch(function (e) {
        toast(e.message || 'Ошибка публикации', true);
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = 'Опубликовать на сайте';
      });
  }

  function renderNewsList() {
    var list = $('news-list-admin');
    var items = (newsData.items || []).slice().sort(function (a, b) {
      return (b.date || '').localeCompare(a.date || '');
    });
    if (!items.length) {
      list.innerHTML = '<li class="admin-news-list__empty">Нет новостей. Нажмите «Добавить новость».</li>';
      return;
    }
    list.innerHTML = items.map(function (item) {
      return (
        '<li>' +
          '<div><div class="admin-news-list__title">' + escapeHtml(item.title) + '</div>' +
          '<div class="admin-news-list__meta">' + (item.date || '') + '</div></div>' +
          '<button type="button" class="admin-btn admin-btn--ghost" data-edit="' + escapeHtml(item.id) + '">Изменить</button>' +
        '</li>'
      );
    }).join('');
    list.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openEditor(btn.getAttribute('data-edit'));
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function ensureEasyMde() {
    if (typeof EasyMDE !== 'undefined') return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.css';
      document.head.appendChild(link);
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.js';
      script.onload = resolve;
      script.onerror = function () {
        reject(new Error('Не удалось загрузить редактор'));
      };
      document.head.appendChild(script);
    });
  }

  function initEditor() {
    if (bodyEditor) return Promise.resolve();
    return ensureEasyMde().then(function () {
      bodyEditor = new EasyMDE({
        element: $('news-body'),
        spellChecker: false,
        status: false,
        minHeight: '280px',
        toolbar: ['bold', 'italic', 'heading', 'heading-smaller', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', 'preview', 'guide']
      });
    });
  }

  function openEditor(id) {
    editingId = id || null;
    $('news-editor').hidden = false;
    $('delete-news-btn').hidden = !id;
    initEditor().then(function () {
      if (id) {
        var item = newsData.items.find(function (n) { return n.id === id; });
        if (!item) return;
        $('editor-heading').textContent = 'Редактирование';
        $('news-title').value = item.title;
        $('news-date').value = item.date;
        $('news-excerpt').value = item.excerpt || '';
        bodyEditor.value(item.body || '');
      } else {
        $('editor-heading').textContent = 'Новая новость';
        $('news-title').value = '';
        $('news-date').value = new Date().toISOString().slice(0, 10);
        $('news-excerpt').value = '';
        bodyEditor.value('');
      }
      $('news-editor').scrollIntoView({ behavior: 'smooth' });
    }).catch(function () {
      toast('Редактор недоступен. Проверьте интернет или VPN.', true);
    });
  }

  function closeEditor() {
    $('news-editor').hidden = true;
    editingId = null;
  }

  function saveNewsLocal() {
    if (!bodyEditor) {
      toast('Редактор ещё не загружен', true);
      return;
    }
    var title = $('news-title').value.trim();
    if (!title) {
      toast('Укажите заголовок', true);
      return;
    }
    var item = {
      id: editingId || slugify(title),
      slug: editingId ? (newsData.items.find(function (n) { return n.id === editingId; }) || {}).slug : slugify(title),
      title: title,
      date: $('news-date').value || new Date().toISOString().slice(0, 10),
      excerpt: $('news-excerpt').value.trim(),
      body: bodyEditor.value()
    };
    if (!editingId) {
      item.slug = slugify(title);
      newsData.items.unshift(item);
    } else {
      var idx = newsData.items.findIndex(function (n) { return n.id === editingId; });
      if (idx >= 0) {
        item.slug = newsData.items[idx].slug || item.slug;
        newsData.items[idx] = item;
      }
    }
    renderNewsList();
    closeEditor();
    toast('Новость сохранена локально. Нажмите «Опубликовать на сайте».');
  }

  function deleteNews() {
    if (!editingId || !confirm('Удалить эту новость?')) return;
    newsData.items = newsData.items.filter(function (n) { return n.id !== editingId; });
    renderNewsList();
    closeEditor();
    toast('Новость удалена. Не забудьте опубликовать изменения.');
  }

  function saveSettingsLocal() {
    settingsData = {
      hero: {
        title: $('hero-title').value.trim(),
        lead: $('hero-lead').value.trim(),
        subtitle: $('hero-subtitle').value.trim()
      },
      quote: $('site-quote').value.trim()
    };
    toast('Настройки сохранены локально. Нажмите «Опубликовать на сайте».');
  }

  function fillSettingsForm() {
    $('hero-title').value = (settingsData.hero && settingsData.hero.title) || '';
    $('hero-lead').value = (settingsData.hero && settingsData.hero.lead) || '';
    $('hero-subtitle').value = (settingsData.hero && settingsData.hero.subtitle) || '';
    $('site-quote').value = settingsData.quote || '';
  }

  function showApp() {
    $('login-screen').hidden = true;
    $('app').hidden = false;
  }

  function bindTabs() {
    document.querySelectorAll('.admin-tabs__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.admin-tabs__btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.admin-tab').forEach(function (t) { t.hidden = true; });
        btn.classList.add('active');
        $('tab-' + btn.getAttribute('data-tab')).hidden = false;
      });
    });
  }

  function bindAppHandlers() {
    $('logout-btn').addEventListener('click', function () {
      sessionStorage.removeItem(AUTH_KEY);
      location.reload();
    });
    $('add-news-btn').addEventListener('click', function () { openEditor(null); });
    $('save-news-btn').addEventListener('click', saveNewsLocal);
    $('cancel-news-btn').addEventListener('click', closeEditor);
    $('delete-news-btn').addEventListener('click', deleteNews);
    $('save-settings-btn').addEventListener('click', saveSettingsLocal);
    $('save-github-btn').addEventListener('click', publishAll);
    $('save-token-btn').addEventListener('click', function () {
      var t = $('github-token').value.trim();
      if (t) {
        localStorage.setItem(TOKEN_KEY, t);
        toast('Токен сохранён в браузере');
      }
    });
  }

  function bootApp() {
    if (appBooted) return;
    appBooted = true;
    renderNewsList();
    fillSettingsForm();
    bindTabs();
    bindAppHandlers();
    var savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) $('github-token').value = savedToken;
  }

  function loadAppData() {
    return Promise.all([loadNews(), loadSettings()]).then(bootApp);
  }

  function tryLogin() {
    if (!config) {
      showLoginError('Конфигурация ещё не загружена. Подождите или обновите страницу.');
      return;
    }
    var pwd = $('login-password').value;
    if (pwd === config.password) {
      sessionStorage.setItem(AUTH_KEY, '1');
      showLoginError('');
      showApp();
      loadAppData().catch(function () {
        toast('Не удалось загрузить данные новостей', true);
      });
    } else {
      showLoginError('Неверный пароль');
    }
  }

  function bindLoginHandlers() {
    $('login-btn').addEventListener('click', tryLogin);
    $('login-password').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') tryLogin();
    });
  }

  function init() {
    bindLoginHandlers();
    loadConfig().then(function () {
      if (sessionStorage.getItem(AUTH_KEY) === '1') {
        showApp();
        return loadAppData();
      }
      return null;
    }).catch(function () {
      showLoginError('Не удалось загрузить конфигурацию. Обновите страницу (Ctrl+F5).');
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
