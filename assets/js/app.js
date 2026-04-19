/**
 * Trabalho Ja MZ - Ponto de entrada da aplicacao
 *
 * Este ficheiro e o coordenador. Junta o router, os ficheiros de dados,
 * a camada de API e o mapa, e escuta o DOM para ligar formularios,
 * listagens e o painel. E tambem o sitio onde ficam as regras de
 * validacao (nome minimo, telefone com 9 digitos, provincia valida,
 * etc.) antes de enviar qualquer coisa para o backend.
 */
(function () {
  'use strict';

  const {
    PROVINCIAS, CATEGORIAS,
    fillProvinciaSelect, fillDistritoSelect, fillCategoriaSelect,
    isValidLocation
  } = window.TJMZData;

  const Api    = window.TJMZApi;
  const Router = window.TJMZRouter;
  const MzMap  = window.TJMZMap;
  const Gps    = window.TJMZGps;


  // -------------------------------------------------------------------
  // Regras de validacao partilhadas pelos formularios
  // -------------------------------------------------------------------

  const Validation = {
    // Telefones mocambicanos tem exactamente 9 digitos.
    phone: (v) => /^[0-9]{9}$/.test(v),
    required: (v) => typeof v === 'string' && v.trim().length > 0,
    minLen: (v, n) => typeof v === 'string' && v.trim().length >= n,

    // Valida o cadastro de um profissional. Devolve a lista de erros
    // encontrados para que o front-end possa mostra-los todos de uma vez.
    validateWorker(data) {
      const errors = [];
      if (!this.minLen(data.nome, 3)) errors.push('Nome deve ter pelo menos 3 caracteres.');
      if (!['F', 'M', 'Outro'].includes(data.sexo)) errors.push('Selecione o sexo.');
      if (!this.phone(data.telefone)) errors.push('Telefone deve ter 9 digitos (ex: 844000000).');
      if (!['whatsapp', 'chamadas'].includes(data.contato)) errors.push('Indique o tipo de contacto.');
      if (!isValidLocation(data.provincia, data.distrito)) errors.push('Provincia ou distrito invalido.');
      if (!this.required(data.categoria)) errors.push('Selecione uma categoria.');
      if (!this.minLen(data.profissao, 2)) errors.push('Profissao obrigatoria.');
      return { ok: errors.length === 0, errors };
    },

    // Valida um pedido de contratacao.
    validateJob(data) {
      const errors = [];
      if (!this.minLen(data.nome, 2)) errors.push('Seu nome e obrigatorio.');
      if (!this.phone(data.telefone)) errors.push('Telefone deve ter 9 digitos.');
      if (!isValidLocation(data.provincia, data.distrito)) errors.push('Provincia ou distrito invalido.');
      if (!this.required(data.categoria)) errors.push('Selecione categoria.');
      if (!this.minLen(data.descricao, 10)) errors.push('Descreva o trabalho (minimo 10 caracteres).');
      return { ok: errors.length === 0, errors };
    }
  };


  // -------------------------------------------------------------------
  // Ligacao entre o router e as vistas do HTML
  // -------------------------------------------------------------------

  // Mostra a seccao correspondente a rota actual e esconde as outras.
  // Tambem actualiza o estado activo na navegacao e corre os hooks
  // especificos de cada rota (por exemplo, carregar a lista de
  // profissionais quando entramos em /buscar).
  function showView(route) {
    const views = document.querySelectorAll('[data-view]');
    let found = false;

    views.forEach(v => {
      const match = v.getAttribute('data-view') === route;
      v.hidden = !match;
      if (match) found = true;
    });

    // Fallback: se nenhuma vista coincide, mostra a home.
    if (!found) {
      const home = document.querySelector('[data-view="/"]');
      if (home) home.hidden = false;
    }

    // Marca a ligacao correspondente no menu principal.
    document.querySelectorAll('.nav a[data-route]').forEach(a => {
      a.classList.toggle('active', a.getAttribute('data-route') === route);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (route === '/buscar') loadAndRenderList();
    if (route === '/painel') loadAndRenderPanel();
  }

  Router.onChange(showView);


  // -------------------------------------------------------------------
  // Pagina inicial: cartoes de categorias
  // -------------------------------------------------------------------

  // Desenha os cartoes com as categorias principais e memoriza a
  // categoria escolhida para que a pagina de busca ja apareca filtrada.
  function renderCategoryCards() {
    const host = document.getElementById('categoryCards');
    if (!host) return;

    host.innerHTML = CATEGORIAS.map(c => `
      <a class="cat-card" href="#/buscar" data-cat="${c.id}">
        <div class="cat-card__icon" aria-hidden="true">${c.icon}</div>
        <div class="cat-card__name">${escapeHtml(c.nome)}</div>
      </a>
    `).join('');

    host.querySelectorAll('[data-cat]').forEach(el => {
      el.addEventListener('click', () => {
        const cat = el.getAttribute('data-cat');
        sessionStorage.setItem('tjmz_filter_cat', cat);
      });
    });
  }


  // -------------------------------------------------------------------
  // Formulario de cadastro de profissional
  // -------------------------------------------------------------------

  function initWorkerForm() {
    const form = document.getElementById('workerForm');
    if (!form) return;

    const prov = document.getElementById('wProv');
    const dist = document.getElementById('wDist');
    const cat  = document.getElementById('wCat');

    fillProvinciaSelect(prov);
    fillCategoriaSelect(cat);
    fillDistritoSelect(dist, '');
    prov.addEventListener('change', () => fillDistritoSelect(dist, prov.value));

    // Botao que pede a localizacao GPS. Guarda as coordenadas em
    // campos hidden e mostra um mini-mapa para o utilizador confirmar.
    const gpsBtn = document.getElementById('gpsBtn');
    const gpsMap = document.getElementById('gpsMap');
    const gpsLat = document.getElementById('gpsLat');
    const gpsLng = document.getElementById('gpsLng');

    if (gpsBtn) {
      gpsBtn.addEventListener('click', async () => {
        gpsBtn.disabled = true;
        gpsBtn.textContent = 'A obter localizacao...';
        try {
          const { lat, lng } = await Gps.requestLocation();
          gpsLat.value = lat;
          gpsLng.value = lng;
          gpsMap.classList.add('is-active');
          Gps.renderMini('gpsMap', lat, lng);
          gpsBtn.textContent = `Localizacao capturada (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
        } catch (err) {
          gpsBtn.textContent = 'Nao foi possivel obter localizacao';
          console.warn(err);
        } finally {
          gpsBtn.disabled = false;
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const status = document.getElementById('workerStatus');
      const data = Object.fromEntries(new FormData(form));
      const { ok, errors } = Validation.validateWorker(data);

      if (!ok) {
        status.textContent = errors.join(' ');
        status.className = 'form-status is-error';
        return;
      }

      status.textContent = 'Enviando...';
      status.className = 'form-status';

      try {
        await Api.createWorker({
          ...data,
          voto_positivo: 0,
          voto_negativo: 0,
          createdAt: new Date().toISOString()
        });
        status.textContent = 'Cadastro recebido. Obrigado por se juntar a comunidade.';
        status.className = 'form-status is-success';
        form.reset();
        fillDistritoSelect(dist, '');
      } catch (err) {
        status.textContent = 'Falha ao enviar: ' + err.message;
        status.className = 'form-status is-error';
      }
    });
  }


  // -------------------------------------------------------------------
  // Formulario de pedido de contratacao
  // -------------------------------------------------------------------

  function initJobForm() {
    const form = document.getElementById('jobForm');
    if (!form) return;

    const prov = document.getElementById('jProv');
    const dist = document.getElementById('jDist');
    const cat  = document.getElementById('jCat');

    fillProvinciaSelect(prov);
    fillCategoriaSelect(cat);
    fillDistritoSelect(dist, '');
    prov.addEventListener('change', () => fillDistritoSelect(dist, prov.value));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const status = document.getElementById('jobStatus');
      const data = Object.fromEntries(new FormData(form));
      const { ok, errors } = Validation.validateJob(data);

      if (!ok) {
        status.textContent = errors.join(' ');
        status.className = 'form-status is-error';
        return;
      }

      status.textContent = 'Publicando...';
      status.className = 'form-status';

      try {
        await Api.createJob({
          ...data,
          createdAt: new Date().toISOString()
        });
        status.textContent = 'Pedido publicado. Profissionais da zona serao notificados.';
        status.className = 'form-status is-success';
        form.reset();
        fillDistritoSelect(dist, '');
      } catch (err) {
        status.textContent = 'Falha: ' + err.message;
        status.className = 'form-status is-error';
      }
    });
  }


  // -------------------------------------------------------------------
  // Pagina de busca de profissionais
  // -------------------------------------------------------------------

  // Guarda a lista de profissionais em memoria para evitar pedidos
  // repetidos ao backend durante a mesma sessao. Qualquer voto novo e
  // reflectido aqui directamente.
  let _cachedWorkers = null;

  async function loadAndRenderList() {
    const list = document.getElementById('list');
    const filterProv = document.getElementById('filterProv');

    // Preenche o filtro de provincias apenas uma vez.
    if (filterProv && filterProv.options.length <= 1) {
      TJMZData.listProvincias().forEach(p =>
        filterProv.appendChild(new Option(p, p))
      );
    }

    if (!list) return;
    list.innerHTML = '<p class="muted">A carregar profissionais...</p>';

    try {
      _cachedWorkers = await Api.listWorkers();
      renderList();
    } catch (e) {
      list.innerHTML = `<p class="muted">Erro ao carregar: ${escapeHtml(e.message)}</p>`;
    }
  }

  // Aplica os filtros e a ordenacao actuais e redesenha a lista.
  function renderList() {
    const list = document.getElementById('list');
    const empty = document.getElementById('listEmpty');
    const q = (document.getElementById('search')?.value || '').toLowerCase();
    const fprov = document.getElementById('filterProv')?.value || '';
    const sort = document.getElementById('filterSort')?.value || 'recent';

    let items = (_cachedWorkers || []).slice();

    // Pesquisa por texto livre em varios campos ao mesmo tempo.
    if (q) {
      items = items.filter(w =>
        [w.nome, w.profissao, w.distrito, w.bairro, w.provincia, w.categoria]
          .join(' ').toLowerCase().includes(q)
      );
    }

    if (fprov) items = items.filter(w => w.provincia === fprov);

    items.sort((a, b) => {
      if (sort === 'positive') {
        return (b.voto_positivo - b.voto_negativo) - (a.voto_positivo - a.voto_negativo);
      }
      if (sort === 'negative') {
        return (a.voto_positivo - a.voto_negativo) - (b.voto_positivo - b.voto_negativo);
      }
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    if (empty) empty.hidden = items.length > 0;
    list.innerHTML = items.map(renderItem).join('');

    list.querySelectorAll('[data-vote]').forEach(btn => {
      btn.addEventListener('click', () => handleVote(btn));
    });
  }

  // Constroi o HTML de um cartao de profissional com os botoes de
  // contacto, votos e identificacao.
  function renderItem(w) {
    const score = (w.voto_positivo || 0) - (w.voto_negativo || 0);

    const whatsLink = w.contato === 'whatsapp'
      ? `<a class="btn btn--sm btn--primary" href="https://wa.me/258${w.telefone}" target="_blank" rel="noopener">WhatsApp</a>`
      : '';

    const telLink = `<a class="btn btn--sm" href="tel:+258${w.telefone}">Ligar</a>`;

    const contatoBadge = w.contato === 'whatsapp'
      ? '<span class="badge badge--whats">WhatsApp</span>'
      : '<span class="badge badge--call">So chamadas</span>';

    const sexoBadge = w.sexo === 'F'
      ? '<span class="badge badge--f">Mulher</span>'
      : w.sexo === 'M'
        ? '<span class="badge badge--m">Homem</span>' : '';

    const localVote = Api.getLocalVote(w.id);

    return `
      <article class="item" data-id="${escapeHtml(w.id)}">
        <div class="item__name">${escapeHtml(w.nome)} <span class="muted">- ${escapeHtml(w.profissao)}</span></div>
        <div class="item__badges">
          ${sexoBadge}${contatoBadge}
          <span class="badge">${escapeHtml(w.categoria || '-')}</span>
          ${w.experiencia ? `<span class="badge">${w.experiencia} anos</span>` : ''}
        </div>
        <div class="item__meta">${escapeHtml(w.distrito || '')}${w.bairro ? ', ' + escapeHtml(w.bairro) : ''} - ${escapeHtml(w.provincia || '')}</div>
        ${w.descricao ? `<div class="item__meta">${escapeHtml(w.descricao)}</div>` : ''}
        <div class="item__actions">
          ${whatsLink}
          ${telLink}
          <div class="vote-row" role="group" aria-label="Avaliar perfil">
            <button class="vote-btn vote-btn--up ${localVote === 'up' ? 'is-active' : ''}" data-vote="up" aria-label="Voto positivo">+ ${w.voto_positivo || 0}</button>
            <span class="vote-score" title="Saldo">${score >= 0 ? '+' : ''}${score}</span>
            <button class="vote-btn vote-btn--down ${localVote === 'down' ? 'is-active' : ''}" data-vote="down" aria-label="Voto negativo">- ${w.voto_negativo || 0}</button>
          </div>
        </div>
      </article>
    `;
  }

  // Envia um voto para o backend e actualiza o cache local.
  async function handleVote(btn) {
    const article = btn.closest('.item');
    const id = article?.getAttribute('data-id');
    const value = btn.getAttribute('data-vote');
    if (!id) return;

    btn.disabled = true;
    try {
      await Api.vote(id, value);

      // Actualiza o contador local para o utilizador ver o efeito
      // imediato sem precisar de nova chamada ao servidor.
      const target = (_cachedWorkers || []).find(w => w.id === id);
      if (target) {
        if (value === 'up') target.voto_positivo = (target.voto_positivo || 0) + 1;
        else target.voto_negativo = (target.voto_negativo || 0) + 1;
      }
      renderList();
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
    }
  }

  // Liga os filtros da lista para que qualquer alteracao dispare um
  // novo render sem ir buscar dados de novo.
  function initListFilters() {
    const s = document.getElementById('search');
    const p = document.getElementById('filterProv');
    const o = document.getElementById('filterSort');
    [s, p, o].forEach(el => el && el.addEventListener('input', renderList));
  }


  // -------------------------------------------------------------------
  // Painel estatistico
  // -------------------------------------------------------------------

  async function loadAndRenderPanel() {
    try {
      const workers = _cachedWorkers || await Api.listWorkers();
      _cachedWorkers = workers;
      const stats = Api.computeStats(workers);
      renderKpis(stats);
      if (MzMap) MzMap.render('mzMap', stats);
      renderCategoryChart(stats);
      renderProvinceChart(stats);
    } catch (e) {
      console.error('Painel falhou:', e);
    }
  }

  // Desenha os indicadores grandes no topo do painel.
  function renderKpis(stats) {
    const host = document.getElementById('statsKpis');
    if (!host) return;

    const pctF = stats.total ? ((stats.totalF / stats.total) * 100).toFixed(1) : 0;
    const pctM = stats.total ? ((stats.totalM / stats.total) * 100).toFixed(1) : 0;

    host.innerHTML = `
      <div class="kpi"><div class="kpi__label">Cadastros totais</div><div class="kpi__value">${stats.total}</div></div>
      <div class="kpi kpi--f"><div class="kpi__label">Mulheres</div><div class="kpi__value">${stats.totalF}</div><div class="muted">${pctF}%</div></div>
      <div class="kpi kpi--m"><div class="kpi__label">Homens</div><div class="kpi__value">${stats.totalM}</div><div class="muted">${pctM}%</div></div>
      <div class="kpi kpi--y"><div class="kpi__label">Votos positivos</div><div class="kpi__value">${stats.totalPos}</div></div>
      <div class="kpi"><div class="kpi__label">Votos negativos</div><div class="kpi__value">${stats.totalNeg}</div></div>
    `;
  }

  // Desenha a barra horizontal com as 8 categorias mais populares.
  function renderCategoryChart(stats) {
    const host = document.getElementById('chartCategories');
    if (!host) return;

    const entries = Object.entries(stats.categorias).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = Math.max(1, ...entries.map(e => e[1]));

    host.innerHTML = `<div class="bar-chart">${entries.map(([k, v]) => {
      const cat = CATEGORIAS.find(c => c.id === k);
      const label = cat ? `${cat.icon} ${cat.nome}` : k;
      return `<div class="bar-row">
        <div>${escapeHtml(label)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(v / max) * 100}%"></div></div>
        <div>${v}</div>
      </div>`;
    }).join('') || '<p class="muted">Sem dados</p>'}</div>`;
  }

  // Desenha o grafico por provincia. A barra de cada provincia tem
  // duas partes: uma para a proporcao de mulheres (vermelho) e outra
  // para os restantes (preto), tornando visualmente evidente a
  // representatividade de genero por regiao.
  function renderProvinceChart(stats) {
    const host = document.getElementById('chartProvinces');
    if (!host) return;

    const entries = Object.entries(stats.provincias).sort((a, b) => b[1].total - a[1].total);
    const max = Math.max(1, ...entries.map(e => e[1].total));

    host.innerHTML = `<div class="bar-chart">${entries.map(([k, v]) => {
      const fpct = v.total ? (v.F / v.total) * 100 : 0;
      return `<div class="bar-row">
        <div>${escapeHtml(k)}</div>
        <div class="bar-track">
          <div class="bar-fill--f" style="width:${fpct}%; height:100%; display:inline-block; background:var(--mz-red)"></div><div class="bar-fill--m" style="width:${100 - fpct}%; height:100%; display:inline-block; background:var(--mz-black)"></div>
        </div>
        <div>${v.total}</div>
      </div>`;
    }).join('') || '<p class="muted">Sem dados</p>'}</div>`;
  }


  // -------------------------------------------------------------------
  // Instalacao como PWA
  //
  // O browser dispara "beforeinstallprompt" quando a app cumpre os
  // criterios para ser instalada. Interceptamos o evento para mostrar
  // um botao proprio "Instalar" na interface em vez de depender do
  // prompt automatico.
  // -------------------------------------------------------------------

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('installBtn');
    if (btn) btn.hidden = false;
  });

  document.getElementById('installBtn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById('installBtn').hidden = true;
  });


  // -------------------------------------------------------------------
  // Utilitarios
  // -------------------------------------------------------------------

  // Escapa HTML simples para impedir que valores vindos da Sheet
  // sejam interpretados como tags ao serem inseridos no DOM.
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, ch => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  }


  // -------------------------------------------------------------------
  // Inicializacao
  // -------------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', () => {
    renderCategoryCards();
    initWorkerForm();
    initJobForm();
    initListFilters();

    // Primeiro render de acordo com a rota actual do URL.
    showView(Router.current());
  });

  // Exportacao minima apenas para testes poderem aceder a funcoes.
  if (typeof window !== 'undefined') {
    window.TJMZApp = { Validation, renderItem, escapeHtml };
  }
})();
