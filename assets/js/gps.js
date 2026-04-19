/**
 * Trabalho Ja MZ - GPS com Leaflet e OpenStreetMap
 *
 * Este modulo trata de duas coisas: pedir a localizacao actual do
 * utilizador ao browser (depois de ele autorizar) e desenhar um
 * pequeno mapa Leaflet para que a pessoa confirme visualmente o
 * sitio onde esta. Nao precisa de chaves de API e nao guarda nada;
 * as coordenadas sao apenas devolvidas para serem usadas nos
 * formularios caso o utilizador queira partilhar a localizacao.
 */
(function (global) {
  'use strict';

  // Pede ao browser a localizacao actual. Devolve uma Promise com as
  // coordenadas ou rejeita se o utilizador negar permissao ou se o
  // dispositivo nao suportar geolocalizacao. As opcoes por defeito
  // favorecem precisao alta mas com tempo limite razoavel para nao
  // deixar o utilizador a espera.
  function requestLocation(options = {}) {
    return new Promise((resolve, reject) => {
      if (!global.navigator || !global.navigator.geolocation) {
        return reject(new Error('Geolocalizacao nao suportada pelo navegador.'));
      }

      global.navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        }),
        (err) => reject(new Error(err.message || 'Permissao negada')),
        Object.assign({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }, options)
      );
    });
  }

  // Desenha um mini-mapa Leaflet dentro de um elemento do DOM, centrado
  // nas coordenadas indicadas, e coloca um marcador com um popup. Se
  // o mesmo elemento ja tiver um mapa antigo, limpa-o antes para evitar
  // fugas de memoria e sobreposicao.
  function renderMini(hostId, lat, lng) {
    const host = document.getElementById(hostId);
    if (!host || !global.L) return null;

    // Remove qualquer mapa previamente criado neste elemento.
    if (host._leaflet_map) {
      host._leaflet_map.remove();
      host._leaflet_map = null;
    }

    const map = global.L.map(host).setView([lat, lng], 14);

    global.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    global.L.marker([lat, lng])
      .addTo(map)
      .bindPopup('Voce esta aqui')
      .openPopup();

    host._leaflet_map = map;

    // Leaflet precisa de invalidar o tamanho quando o container se
    // torna visivel depois da criacao, senao os tiles nao enchem.
    setTimeout(() => map.invalidateSize(), 100);
    return map;
  }

  const API = { requestLocation, renderMini };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else global.TJMZGps = API;
})(typeof window !== 'undefined' ? window : globalThis);
