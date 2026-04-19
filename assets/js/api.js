/**
 * Trabalho Ja MZ - Camada de API
 *
 * Este ficheiro concentra toda a comunicacao entre o site e o backend.
 * O backend e um Google Apps Script publicado como Web App, que usa uma
 * folha do Google Sheets como base de dados.
 *
 * A funcao principal aqui e esconder do resto da aplicacao os detalhes
 * da rede. O front-end chama apenas listWorkers(), createWorker(),
 * createJob() ou vote() e este ficheiro trata do fetch, parsing de CSV,
 * normalizacao de campos e persistencia do voto local.
 */

(function (global) {
  'use strict';

  // Identificador da Google Sheet usada como base de dados.
  // Esta Sheet e partilhada como "Anyone with the link - Viewer" para
  // que a leitura via gviz funcione sem Apps Script.
  const SHEET_ID = '1LpR5tWncyr4_n0LL8N2fS69T6SpDPeQi6Ejjdz3wn4o';

  const CONFIG = {
    // URL do Web App publicado no Apps Script. E aqui que o site envia
    // pedidos POST para criar cadastros, pedidos de trabalho e votos.
    APPS_SCRIPT_URL:
      'https://script.google.com/macros/s/AKfycbz-TqH47GHoR_mA5-ZNIARpDLKc4avHnbeDC1eKKF9fU5IcBgdLpPso-7FbQZLvb7hf/exec',

    // Endpoint publico de leitura da Google Sheet em formato CSV.
    // Serve como alternativa caso o Apps Script esteja offline ou
    // demore a responder. Le directamente a folha "workers".
    SHEET_CSV_URL:
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=workers`,

    // Intervalo em milissegundos para actualizar a listagem de
    // profissionais automaticamente no painel.
    REFRESH_MS: 60000,

    // Chave usada no localStorage para guardar os votos que o utilizador
    // ja fez. Serve para impedir que o mesmo browser vote duas vezes no
    // mesmo profissional.
    VOTES_KEY: 'tjmz_votes_v2'
  };

  // -------------------------------------------------------------------
  // Gestao de votos guardados no browser
  // -------------------------------------------------------------------

  // Le o objecto com todos os votos guardados pelo utilizador. Se o
  // conteudo estiver corrompido ou em falta, devolve objecto vazio.
  function _votesStore() {
    try {
      return JSON.parse(
        localStorage.getItem(CONFIG.VOTES_KEY) || '{}'
      );
    } catch {
      return {};
    }
  }

  // Regista localmente que este utilizador votou num determinado
  // profissional com um determinado valor (up ou down).
  function _saveVote(workerId, value) {
    const store = _votesStore();
    store[workerId] = value;
    localStorage.setItem(
      CONFIG.VOTES_KEY,
      JSON.stringify(store)
    );
  }

  // Devolve o voto anterior deste utilizador para um profissional, ou
  // null caso ainda nao tenha votado.
  function getLocalVote(workerId) {
    return _votesStore()[workerId] || null;
  }

  // -------------------------------------------------------------------
  // Parser de CSV
  //
  // O gviz devolve CSV simples, mas pode conter virgulas dentro de
  // campos entre aspas e aspas duplicadas como caracter de escape. Este
  // parser trata desses casos sem recorrer a bibliotecas externas para
  // manter o bundle pequeno.
  // -------------------------------------------------------------------

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          // Aspa escapada dentro de um campo entre aspas.
          field += '"';
          i++;
        } else if (ch === '"') {
          // Fim do campo entre aspas.
          inQuotes = false;
        } else {
          field += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          row.push(field);
          field = '';
        } else if (ch === '\n') {
          row.push(field);
          rows.push(row);
          row = [];
          field = '';
        } else if (ch !== '\r') {
          field += ch;
        }
      }
    }

    // Fecha o ultimo campo/linha caso o ficheiro nao termine em nova linha.
    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }

    if (!rows.length) return [];

    // A primeira linha tem os nomes das colunas; o resto sao registos.
    const headers = rows.shift();

    return rows
      // Ignora linhas totalmente vazias que podem aparecer quando o
      // ficheiro tem separadores em branco ou termina com nova linha.
      .filter(r => r.some(c => String(c || '').trim() !== ''))
      .map(r => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h.trim()] = (r[i] || '').trim();
        });
        return obj;
      });
  }

  // -------------------------------------------------------------------
  // Normalizacao de um registo de profissional
  //
  // A linha vinda da Sheet pode ter campos em falta, valores numericos
  // como string ou variacoes de caixa. Esta funcao devolve sempre um
  // objecto com a mesma forma para o resto da aplicacao poder confiar.
  // -------------------------------------------------------------------

  function normalizeWorker(raw) {
    raw = raw || {};

    // Converte uma string em inteiro seguro. Se nao for um numero
    // valido devolve zero em vez de NaN.
    const toInt = v => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : 0;
    };

    // Lookup tolerante a variacoes de caixa. Por exemplo, aceita tanto
    // "nome" como "Nome" ou "NOME". Isto facilita integracoes com
    // origens de dados diferentes (Forms, Sheet manual, etc.).
    const lower = {};
    Object.keys(raw).forEach(k => {
      lower[String(k).toLowerCase()] = raw[k];
    });
    const pick = (key, fallback = '') => {
      const v = lower[key];
      return (v == null ? fallback : v);
    };

    return {
      id: pick('id'),
      nome: pick('nome'),
      sexo: String(pick('sexo') || '').toUpperCase(),
      telefone: String(pick('telefone') || ''),
      contato: String(pick('contato') || 'whatsapp').toLowerCase(),
      provincia: pick('provincia'),
      distrito: pick('distrito'),
      bairro: pick('bairro'),
      categoria: pick('categoria'),
      profissao: pick('profissao'),
      experiencia: toInt(pick('experiencia')),
      descricao: pick('descricao'),
      gps_lat: parseFloat(pick('gps_lat')) || null,
      gps_lng: parseFloat(pick('gps_lng')) || null,
      voto_positivo: toInt(pick('voto_positivo')),
      voto_negativo: toInt(pick('voto_negativo')),
      createdAt: pick('createdat') || pick('createdAt') || ''
    };
  }

  // -------------------------------------------------------------------
  // Envio de pedidos para o Apps Script
  //
  // O Apps Script responde com um redirect 302 para
  // script.googleusercontent.com. Navegadores tendem a perder o corpo
  // do pedido quando o Content-Type e "application/json". Enviamos por
  // isso os dados como formulario URL-encoded, que e um "simple request"
  // e sobrevive ao redirect sem precisar de preflight CORS.
  // -------------------------------------------------------------------

  async function _postAppsScript(action, payload) {
    // Em modo de desenvolvimento ou nos testes unitarios a URL do
    // Apps Script fica em branco. Nesse caso evitamos qualquer
    // chamada de rede e devolvemos uma resposta sintetica de sucesso,
    // preservando o fluxo de UI sem dependencias externas.
    if (!CONFIG.APPS_SCRIPT_URL) {
      return { ok: true, dev: true };
    }

    const body = new URLSearchParams();
    body.append('action', action);
    body.append('payload', JSON.stringify(payload));

    const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      body: body
    });

    if (!res.ok) {
      throw new Error('Erro HTTP ' + res.status);
    }

    const data = await res.json();

    // O backend usa o campo "error" para indicar falhas de validacao.
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  }

  // -------------------------------------------------------------------
  // Operacoes de escrita
  // -------------------------------------------------------------------

  // Cria um novo profissional na folha "workers".
  async function createWorker(payload) {
    return _postAppsScript('createWorker', payload);
  }

  // Cria um novo pedido de contratacao na folha "jobs".
  async function createJob(payload) {
    return _postAppsScript('createJob', payload);
  }

  // Regista um voto positivo ou negativo num profissional. Se o
  // utilizador ja tinha votado antes noutro sentido, o backend faz a
  // troca (decrementa o voto antigo e incrementa o novo).
  async function vote(workerId, value) {
    if (!['up', 'down'].includes(value)) {
      throw new Error('Voto inválido');
    }

    const previous = getLocalVote(workerId);

    // Impede votar duas vezes no mesmo sentido.
    if (previous === value) {
      throw new Error('Já votou assim.');
    }

    // Guarda o voto localmente antes de enviar, para que o botao fique
    // imediatamente marcado e o utilizador nao volte a clicar.
    _saveVote(workerId, value);

    return _postAppsScript('vote', {
      workerId,
      value,
      previous
    });
  }

  // -------------------------------------------------------------------
  // Operacoes de leitura
  // -------------------------------------------------------------------

  // Devolve a lista completa de profissionais. Tenta primeiro o Apps
  // Script (que sabe dar os votos ja somados) e faz fallback para o
  // endpoint CSV publico caso o script falhe.
  async function listWorkers() {
    if (CONFIG.APPS_SCRIPT_URL) {
      try {
        const res = await fetch(
          CONFIG.APPS_SCRIPT_URL + '?action=list'
        );

        if (res.ok) {
          const data = await res.json();
          return (data.workers || []).map(normalizeWorker);
        }
      } catch (e) {
        // O Apps Script pode estar em cold-start ou fora do ar.
        // Seguimos para o fallback CSV sem interromper o utilizador.
        console.warn(e);
      }
    }

    // Fallback: ler o CSV publico da Sheet.
    const res = await fetch(CONFIG.SHEET_CSV_URL);
    const txt = await res.text();
    return parseCSV(txt).map(normalizeWorker);
  }

  // Devolve as estatisticas agregadas. Tenta obter do Apps Script
  // (calculo server-side) e, se falhar, calcula localmente a partir da
  // lista de profissionais.
  async function getStats() {
    try {
      const res = await fetch(
        CONFIG.APPS_SCRIPT_URL + '?action=stats'
      );

      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Silencioso: seguimos para o calculo local.
    }

    const workers = await listWorkers();
    return computeStats(workers);
  }

  // -------------------------------------------------------------------
  // Calculo local de estatisticas
  //
  // Usado como alternativa quando o Apps Script nao responde e tambem
  // pelos testes unitarios. Alem dos totais gerais, separa as contagens
  // por provincia com o detalhe de sexo (mulheres, homens, outro). E
  // esta separacao que alimenta as cores do mapa SVG no painel.
  // -------------------------------------------------------------------

  function computeStats(workers) {
    const categorias = {};
    const provincias = {};

    let totalF = 0;
    let totalM = 0;
    let totalOutro = 0;
    let totalPos = 0;
    let totalNeg = 0;

    workers.forEach(w => {
      if (w.categoria) {
        categorias[w.categoria] = (categorias[w.categoria] || 0) + 1;
      }

      const prov = w.provincia || 'Desconhecida';
      if (!provincias[prov]) {
        provincias[prov] = { F: 0, M: 0, Outro: 0, total: 0 };
      }

      // Tudo o que nao for F nem M e contado como "Outro" para nao
      // perder o registo quando o campo vem em branco ou inesperado.
      const s = (w.sexo === 'F' || w.sexo === 'M') ? w.sexo : 'Outro';
      provincias[prov][s] += 1;
      provincias[prov].total += 1;

      if (s === 'F') totalF += 1;
      else if (s === 'M') totalM += 1;
      else totalOutro += 1;

      totalPos += w.voto_positivo || 0;
      totalNeg += w.voto_negativo || 0;
    });

    return {
      total: workers.length,
      totalF,
      totalM,
      totalOutro,
      totalPos,
      totalNeg,
      categorias,
      provincias
    };
  }

  // -------------------------------------------------------------------
  // Exportacao
  //
  // Em ambiente de browser expoe o objecto em window.TJMZApi. Em Node
  // (usado pelos testes) expoe via module.exports.
  // -------------------------------------------------------------------

  const API = {
    CONFIG,
    createWorker,
    createJob,
    vote,
    listWorkers,
    getStats,
    computeStats,
    parseCSV,
    normalizeWorker,
    getLocalVote
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  } else {
    global.TJMZApi = API;
  }

})(typeof window !== 'undefined' ? window : globalThis);
