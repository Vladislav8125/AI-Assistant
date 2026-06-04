(function () {
  var containers = document.querySelectorAll('[data-pilgrimage-map]');
  if (!containers.length) return;

  var scriptId = 'yandex-maps-api';
  if (!document.getElementById(scriptId)) {
    var s = document.createElement('script');
    s.id = scriptId;
    s.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
    s.async = true;
    document.head.appendChild(s);
  }

  function initMaps() {
    if (typeof ymaps === 'undefined') return;
    ymaps.ready(function () {
      containers.forEach(function (el) {
        if (el.dataset.mapReady === '1') return;
        var raw = el.getAttribute('data-places');
        if (!raw) return;
        var places;
        try {
          places = JSON.parse(raw);
        } catch (e) {
          return;
        }
        if (!places.length) return;

        var mapId = el.id || 'pilgrimage-map-' + Math.random().toString(36).slice(2);
        el.id = mapId;

        var map = new ymaps.Map(mapId, {
          center: [places[0].lat, places[0].lon],
          zoom: 8,
          controls: ['zoomControl', 'fullscreenControl']
        });

        var collection = new ymaps.GeoObjectCollection();
        var seen = {};

        places.forEach(function (p) {
          var key = p.lat + ',' + p.lon + '|' + p.name;
          if (seen[key]) return;
          seen[key] = true;
          collection.add(
            new ymaps.Placemark(
              [p.lat, p.lon],
              {
                balloonContentHeader: p.name,
                balloonContentBody: p.address,
                hintContent: p.name
              },
              { preset: 'islands#redIcon' }
            )
          );
        });

        map.geoObjects.add(collection);
        if (collection.getLength()) {
          map.setBounds(collection.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 50
          });
        }
        el.dataset.mapReady = '1';
      });
    });
  }

  function waitForApi() {
    if (typeof ymaps !== 'undefined') {
      initMaps();
      return;
    }
    var tries = 0;
    var t = setInterval(function () {
      tries += 1;
      if (typeof ymaps !== 'undefined') {
        clearInterval(t);
        initMaps();
      } else if (tries > 80) {
        clearInterval(t);
      }
    }, 100);
  }

  var apiScript = document.getElementById(scriptId);
  if (apiScript) {
    apiScript.addEventListener('load', waitForApi);
    waitForApi();
  }
})();
