(function () {
  var overlays = document.querySelectorAll('[data-modal-overlay]');
  if (!overlays.length) return;

  function openModal(id) {
    var overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(overlay) {
    overlay.classList.remove('is-open');
    if (!document.querySelector('.modal-overlay.is-open')) {
      document.body.style.overflow = '';
    }
  }

  document.querySelectorAll('[data-modal-open]').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      var target = trigger.getAttribute('data-modal-open');
      if (!target) return;
      e.preventDefault();
      openModal(target);
    });
  });

  overlays.forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay);
    });
    var closeBtn = overlay.querySelector('[data-modal-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeModal(overlay);
      });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    overlays.forEach(function (overlay) {
      if (overlay.classList.contains('is-open')) closeModal(overlay);
    });
  });
})();
