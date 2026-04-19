/**
 * Trabalho Ja MZ - Mapa SVG de Mocambique
 *
 * Desenha as 11 provincias de Mocambique num SVG e colore cada uma em
 * funcao da distribuicao de sexo dos profissionais ali registados. E
 * este ficheiro que alimenta a secao "Painel" do site.
 *
 * O modulo nao depende de bibliotecas externas: cria o SVG de raiz,
 * aplica as cores e liga os tooltips. Isto mantem o bundle leve e
 * evita pedidos de rede adicionais no carregamento do painel.
 */

(function (global) {
  'use strict';

  // Tabela de provincias com a sua posicao no SVG. Cada entrada tem o
  // nome oficial, um identificador interno e um rectangulo (x, y, w, h)
  // que define onde e com que tamanho a provincia aparece no mapa. As
  // coordenadas foram ajustadas para aproximar a forma real do pais.
  const PROVINCES = [
    { id: 'niassa',       name: 'Niassa',           x: 155, y:  85, w:  95, h: 105 },
    { id: 'cabodelgado',  name: 'Cabo Delgado',     x: 250, y:  70, w:  95, h: 135 },
    { id: 'nampula',      name: 'Nampula',          x: 235, y: 205, w: 110, h: 105 },
    { id: 'tete',         name: 'Tete',             x:  80, y: 210, w: 110, h:  95 },
    { id: 'zambezia',     name: 'Zambézia',         x: 180, y: 215, w:  70, h: 120 },
    { id: 'manica',       name: 'Manica',           x: 145, y: 340, w:  70, h:  90 },
    { id: 'sofala',       name: 'Sofala',           x: 215, y: 330, w:  78, h: 120 },
    { id: 'inhambane',    name: 'Inhambane',        x: 205, y: 455, w:  92, h: 145 },
    { id: 'gaza',         name: 'Gaza',             x: 120, y: 455, w:  88, h: 130 },
    { id: 'maputoprov',   name: 'Maputo Província', x: 145, y: 595, w:  78, h:  95 },
    { id: 'maputocidade', name: 'Maputo Cidade',    x: 200, y: 690, w:  18, h:  18 }
  ];

  // Paleta inspirada nas cores da bandeira de Mocambique. Cada entrada
  // corresponde a um "estado" de distribuicao na provincia:
  //  - F: maioria de mulheres registadas
  //  - M: maioria de homens
  //  - EQUAL: distribuicao equilibrada
  //  - NONE: sem dados ainda
  const LEGEND = {
    F:     '#DA121A',
    M:     '#007A3D',
    EQUAL: '#FCE100',
    NONE:  '#D9D9D9'
  };

  // Versao "geografica" da tabela de provincias. Cada entrada inclui um
  // path SVG sintetico (rectangulo) construido a partir das coordenadas
  // da tabela PROVINCES. Isto permite que consumidores externos - por
  // exemplo, testes unitarios ou exportacoes - referenciem um "path"
  // sem precisarem de conhecer a implementacao interna.
  const PROVINCES_GEO = PROVINCES.map(p => {
    const x2 = p.x + p.w;
    const y2 = p.y + p.h;
    return {
      id: p.id,
      name: p.name,
      // Path SVG que descreve o mesmo rectangulo usado no render.
      path: `M${p.x} ${p.y} L${x2} ${p.y} L${x2} ${y2} L${p.x} ${y2} Z`,
      // Centro do rectangulo - util para colocar o rotulo da provincia.
      cx: p.x + p.w / 2,
      cy: p.y + p.h / 2
    };
  });

  // Decide a cor de uma provincia a partir das suas contagens. Aceita
  // um objecto no formato { F, M, Outro, total } e devolve sempre uma
  // cor da paleta LEGEND, mesmo quando a provincia nao tem registos.
  function colorFor(stat) {
    if (!stat || !stat.total) return LEGEND.NONE;

    const f = Number(stat.F) || 0;
    const m = Number(stat.M) || 0;

    if (f > m) return LEGEND.F;
    if (m > f) return LEGEND.M;

    return LEGEND.EQUAL;
  }

  // Desenha o mapa dentro do elemento DOM indicado por hostId. Aceita
  // um objecto de estatisticas com a forma { provincias: { [nome]: { F, M, total } } }
  // e aplica as cores correspondentes em cada provincia.
  function render(hostId, stats) {
    stats = stats || {};

    const host = document.getElementById(hostId);
    if (!host) return;

    const provMap = stats.provincias || {};

    host.innerHTML = `
      <svg viewBox="0 0 420 760" class="mz-map" xmlns="http://www.w3.org/2000/svg">
        <style>
          .mz-map{width:100%;height:auto;max-height:760px;font-family:Arial,sans-serif;}
          .outline{fill:#f8f8f8;stroke:#999;stroke-width:2;}
          .province{stroke:#fff;stroke-width:2;cursor:pointer;transition:.2s;}
          .province:hover{opacity:.85;filter:brightness(1.05);}
          .label{font-size:11px;font-weight:bold;fill:#fff;paint-order:stroke;stroke:#000;stroke-width:.7;pointer-events:none;}
        </style>

        <!-- Silhueta simplificada do territorio de Mocambique. -->
        <path class="outline" d="
          M145 40 L265 38 L300 55 L340 45 L365 78
          L360 250 L335 300 L318 355 L320 465 L305 610
          L250 710 L205 740 L175 730 L150 690 L130 620
          L120 520 L95 420 L100 300 L115 215 L130 110 Z
        "/>

        ${PROVINCES.map(p => {
          const st = provMap[p.name] || { F: 0, M: 0, total: 0 };
          const fill = colorFor(st);

          return `
            <rect class="province"
              x="${p.x}" y="${p.y}"
              width="${p.w}" height="${p.h}"
              rx="4"
              fill="${fill}"
              data-name="${p.name}"
              data-f="${st.F || 0}"
              data-m="${st.M || 0}"
              data-total="${st.total || 0}">
              <title>${p.name}</title>
            </rect>

            <text
              x="${p.x + p.w / 2}"
              y="${p.y + p.h / 2}"
              text-anchor="middle"
              dominant-baseline="middle"
              class="label">
              ${_shortName(p.name)}
            </text>
          `;
        }).join('')}
      </svg>
    `;

    _bindTooltip(host);
  }

  // Liga um tooltip flutuante as provincias ja desenhadas. Cria o
  // elemento apenas uma vez e reutiliza-o em cada hover para nao
  // poluir o DOM com elementos orfaos.
  function _bindTooltip(host) {
    let tip = document.getElementById('mapTooltip');

    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'mapTooltip';
      tip.style.cssText = [
        'position:fixed',
        'display:none',
        'background:#fff',
        'padding:10px',
        'border-radius:10px',
        'box-shadow:0 10px 25px rgba(0,0,0,.15)',
        'font-size:13px',
        'z-index:9999'
      ].join(';');
      document.body.appendChild(tip);
    }

    host.querySelectorAll('.province').forEach(el => {
      el.onmousemove = e => {
        tip.style.display = 'block';
        tip.style.left = (e.clientX + 15) + 'px';
        tip.style.top = (e.clientY + 15) + 'px';
        tip.innerHTML = `
          <b>${el.dataset.name}</b><br>
          Mulheres: ${el.dataset.f}<br>
          Homens: ${el.dataset.m}<br>
          Total: ${el.dataset.total}
        `;
      };

      el.onmouseleave = () => {
        tip.style.display = 'none';
      };
    });
  }

  // Encurta os nomes mais longos para caberem dentro do rectangulo da
  // provincia quando renderizados no SVG.
  function _shortName(n) {
    return n
      .replace('Maputo Província', 'Maputo Prov.')
      .replace('Maputo Cidade', 'Mpt. Cid.')
      .replace('Cabo Delgado', 'C. Delgado');
  }

  const API = {
    PROVINCES,
    PROVINCES_GEO,
    LEGEND,
    colorFor,
    render
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  } else {
    global.TJMZMap = API;
  }

})(typeof window !== 'undefined' ? window : globalThis);
