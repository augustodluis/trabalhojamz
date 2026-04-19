/**
 * Trabalho Ja MZ - Mapa SVG de Mocambique
 *
 * Desenha um mapa simplificado das 11 provincias, com poligonos SVG
 * posicionados em ordem geografica (Niassa e Cabo Delgado a norte,
 * Maputo a sul, Tete a oeste). Cada provincia e colorida consoante o
 * racio de mulheres e homens cadastrados, tornando visualmente obvia
 * a desigualdade de genero em cada regiao:
 *
 *   - tons de rosa quando ha mais mulheres que homens,
 *   - tons de azul quando ha mais homens que mulheres,
 *   - roxo quando a proporcao e equilibrada,
 *   - cinzento quando ainda nao ha registos.
 *
 * Se chegar ao mapa apenas o total por provincia (sem separacao por
 * sexo), a cor usada e a neutra. O painel continua util mesmo nesse
 * caso, apenas sem a leitura de genero.
 */
(function (global) {
  'use strict';

  // Definicao geometrica das provincias. Cada entrada tem o nome, o
  // caminho SVG (path) do poligono e o centro aproximado (cx, cy) onde
  // colocamos a etiqueta com o nome curto. O viewBox do SVG e 500x720.
  const PROVINCES_GEO = [
    { name: 'Niassa',           path: 'M 40,40 L 260,40 L 260,190 L 180,220 L 40,220 Z',     cx: 140, cy: 135 },
    { name: 'Cabo Delgado',     path: 'M 260,40 L 460,40 L 460,210 L 320,230 L 260,190 Z',   cx: 360, cy: 130 },
    { name: 'Tete',             path: 'M 40,220 L 180,220 L 220,330 L 40,330 Z',              cx: 120, cy: 275 },
    { name: 'Nampula',          path: 'M 320,230 L 460,210 L 460,360 L 300,360 Z',            cx: 380, cy: 290 },
    { name: 'Zambézia',         path: 'M 180,220 L 260,190 L 320,230 L 300,360 L 200,380 L 220,330 Z', cx: 250, cy: 290 },
    { name: 'Manica',           path: 'M 40,330 L 220,330 L 210,440 L 40,440 Z',              cx: 130, cy: 385 },
    { name: 'Sofala',           path: 'M 220,330 L 300,360 L 310,470 L 210,440 Z',            cx: 260, cy: 400 },
    { name: 'Inhambane',        path: 'M 210,440 L 310,470 L 320,600 L 200,580 Z',            cx: 260, cy: 520 },
    { name: 'Gaza',             path: 'M 40,440 L 210,440 L 200,580 L 80,600 Z',              cx: 130, cy: 520 },
    { name: 'Maputo Província', path: 'M 80,600 L 200,580 L 210,700 L 100,710 Z',             cx: 155, cy: 650 },
    { name: 'Maputo Cidade',    path: 'M 210,700 L 260,680 L 255,720 L 205,720 Z',            cx: 230, cy: 705 }
  ];

  // Cores associadas a cada cenario do racio de genero.
  const LEGEND = {
    F:      '#e83e8c',
    EQUAL:  '#8a54b0',
    M:      '#1d4fbf',
    NONE:   '#d6d6d6'
  };

  // Converte o registo de uma provincia na cor a aplicar. Aceita tanto
  // a forma detalhada {F, M, total} como um simples numero total. Se
  // nao houver informacao suficiente sobre sexo, devolve a cor neutra.
  function colorFor(prov) {
    if (!prov) return LEGEND.NONE;

    // Caso em que recebemos apenas o total (numero inteiro).
    if (typeof prov === 'number') {
      return prov === 0 ? LEGEND.NONE : LEGEND.EQUAL;
    }

    if (prov.total === 0) return LEGEND.NONE;
    const ratio = prov.F / (prov.F + prov.M || 1);
    if (ratio > 0.55) return LEGEND.F;
    if (ratio < 0.45) return LEGEND.M;
    return LEGEND.EQUAL;
  }

  // Constroi o SVG do mapa dentro do elemento com o id indicado e
  // anexa interactividade (tooltip e clique para filtrar a busca).
  function render(hostId, stats) {
    const host = document.getElementById(hostId);
    if (!host) return;

    const tooltip = _ensureTooltip();

    const parts = PROVINCES_GEO.map(g => {
      // Normalizamos o registo da provincia. Pode vir como objecto
      // detalhado, como numero, ou nao vir de todo.
      const raw = stats && stats.provincias && stats.provincias[g.name];
      const data = _normalizeProvData(raw);
      const color = colorFor(data);
      const title =
        `${g.name}\nMulheres: ${data.F} - Homens: ${data.M}\nTotal: ${data.total}`;

      return `
        <path class="province"
              d="${g.path}"
              fill="${color}"
              data-name="${_esc(g.name)}"
              data-f="${data.F}" data-m="${data.M}" data-total="${data.total}">
          <title>${_esc(title)}</title>
        </path>
        <text class="prov-label" x="${g.cx}" y="${g.cy}" text-anchor="middle">${_esc(_shortName(g.name))}</text>
      `;
    });

    host.innerHTML = `
      <svg viewBox="0 0 500 720" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa estatístico de Moçambique">
        <defs>
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity=".25"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">${parts.join('')}</g>
      </svg>
    `;

    // Ao passar o rato sobre uma provincia mostramos um tooltip com os
    // numeros. Ao clicar saltamos para a pagina de busca ja com o
    // filtro da provincia activo.
    host.querySelectorAll('.province').forEach(p => {
      p.addEventListener('mousemove', (e) => {
        tooltip.style.display = 'block';
        const name = p.getAttribute('data-name');
        const f = p.getAttribute('data-f');
        const m = p.getAttribute('data-m');
        const t = p.getAttribute('data-total');
        tooltip.innerHTML =
          `<strong>${_esc(name)}</strong><br>` +
          `Mulheres: ${f} &nbsp; Homens: ${m} &nbsp; (${t})`;
        tooltip.style.left = (e.pageX + 12) + 'px';
        tooltip.style.top  = (e.pageY + 12) + 'px';
      });

      p.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });

      p.addEventListener('click', () => {
        const name = p.getAttribute('data-name');
        const filter = document.getElementById('filterProv');
        if (filter) {
          filter.value = name;
          filter.dispatchEvent(new Event('input'));
        }
        global.location.hash = '/buscar';
      });
    });
  }

  // Transforma um registo de provincia num objecto com a forma
  // esperada pelo mapa. Aceita varios formatos de entrada para
  // manter compatibilidade com versoes mais antigas e mais novas
  // do backend.
  function _normalizeProvData(raw) {
    if (raw == null) return { F: 0, M: 0, total: 0 };
    if (typeof raw === 'number') return { F: 0, M: 0, total: raw };
    return {
      F: Number(raw.F) || 0,
      M: Number(raw.M) || 0,
      total: Number(raw.total) || 0
    };
  }

  // Cria ou reaproveita o elemento unico de tooltip. Fica no body para
  // nao herdar overflow de nenhum container.
  function _ensureTooltip() {
    let t = document.getElementById('tjmz-tooltip');
    if (!t) {
      t = document.createElement('div');
      t.id = 'tjmz-tooltip';
      t.className = 'tooltip';
      t.style.display = 'none';
      document.body.appendChild(t);
    }
    return t;
  }

  // Nomes abreviados para caber dentro dos poligonos mais pequenos.
  function _shortName(n) {
    return n
      .replace('Maputo Província', 'Maputo Prov.')
      .replace('Maputo Cidade', 'Mpt. Cid.')
      .replace('Cabo Delgado', 'C. Delgado');
  }

  // Escapa texto antes de o inserir no HTML para evitar injeccoes.
  function _esc(s) {
    return String(s).replace(/[&<>"]/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[ch]));
  }

  const API = { render, colorFor, PROVINCES_GEO, LEGEND };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else global.TJMZMap = API;
})(typeof window !== 'undefined' ? window : globalThis);
