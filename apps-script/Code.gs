/**
 * Trabalho Ja MZ - Backend em Google Apps Script
 *
 * Este ficheiro e publicado como Web App. Funciona como um pequeno
 * servidor sem infraestrutura, que le e escreve dados numa Google
 * Sheet. O site em GitHub Pages envia pedidos HTTP para este script.
 *
 * Fluxo resumido:
 *
 *   1. O utilizador preenche um formulario no site.
 *   2. O browser envia um POST para a URL deste Web App, com os campos
 *      "action" e "payload" codificados como formulario URL-encoded.
 *   3. A funcao doPost le esses campos, identifica a accao pedida e
 *      delega em createWorker, createJob ou vote.
 *   4. Cada funcao grava ou actualiza linhas na Sheet e devolve JSON.
 *
 * Para publicar: abrir https://script.google.com, criar novo projecto,
 * colar este ficheiro inteiro, guardar, fazer Deploy como Web App com
 * "Execute as: Me" e "Who has access: Anyone". Copiar a URL /exec para
 * dentro de assets/js/api.js em CONFIG.APPS_SCRIPT_URL.
 */

// Identificador da Sheet ja pre-configurado. Para usar outra folha,
// basta alterar esta constante ou definir a propriedade SHEET_ID em
// Project Settings do Apps Script.
const DEFAULT_SHEET_ID = '1LpR5tWncyr4_n0LL8N2fS69T6SpDPeQi6Ejjdz3wn4o';

// Colunas da folha dos profissionais. A ordem aqui define a ordem das
// colunas na Sheet e e reutilizada em varios sitios, por isso fica
// centralizada numa unica lista.
const WORKER_HEADERS = [
  'id', 'createdAt', 'nome', 'sexo', 'nascimento', 'telefone', 'contato',
  'provincia', 'distrito', 'bairro', 'categoria', 'profissao',
  'experiencia', 'descricao', 'gps_lat', 'gps_lng',
  'voto_positivo', 'voto_negativo'
];

// Colunas da folha dos pedidos de contratacao.
const JOB_HEADERS = [
  'id', 'createdAt', 'nome', 'telefone', 'provincia', 'distrito', 'bairro',
  'categoria', 'urgencia', 'descricao', 'valor'
];


// -------------------------------------------------------------------
// Handlers HTTP
// -------------------------------------------------------------------

/**
 * Responde a pedidos GET. E usado para listar profissionais, pedidos
 * de trabalho e estatisticas. A accao e passada na query string.
 */
function doGet(e) {
  try {
    const action = (e.parameter.action || '').toLowerCase();

    if (action === 'list')  return _json({ workers: listWorkers() });
    if (action === 'stats') return _json(computeStats(listWorkers()));
    if (action === 'jobs')  return _json({ jobs: listJobs() });

    // Resposta por defeito: confirma que o servico esta vivo.
    return _json({ ok: true, name: 'Trabalho Ja MZ API', version: '1.0.0' });
  } catch (err) {
    return _json({ error: err.message }, 500);
  }
}

/**
 * Responde a pedidos POST. O cliente envia os dados como formulario
 * URL-encoded em vez de JSON, para sobreviver ao redirect 302 que o
 * Apps Script faz para script.googleusercontent.com. Por isso lemos
 * de e.parameter em vez de e.postData.contents.
 */
function doPost(e) {
  try {
    const action  = (e.parameter.action || '').toLowerCase();
    const payload = JSON.parse(e.parameter.payload || '{}');

    if (action === 'createworker') return _json(createWorker(payload));
    if (action === 'createjob')    return _json(createJob(payload));
    if (action === 'vote')         return _json(vote(payload));

    return _json({ error: 'Accao desconhecida' }, 400);
  } catch (err) {
    return _json({ error: err.message }, 500);
  }
}


// -------------------------------------------------------------------
// Profissionais (workers)
// -------------------------------------------------------------------

/**
 * Cria um novo profissional. Gera um id unico, preenche a data de
 * criacao, inicia os contadores de voto a zero e adiciona a linha.
 */
function createWorker(payload) {
  const p = _sanitizeWorker(payload);
  _validateWorker(p);

  const sh = _getSheet('workers', WORKER_HEADERS);
  const id = 'w_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

  const row = WORKER_HEADERS.map(h => {
    if (h === 'id') return id;
    if (h === 'createdAt') return new Date().toISOString();
    if (h === 'voto_positivo' || h === 'voto_negativo') return 0;
    return p[h] != null ? p[h] : '';
  });

  sh.appendRow(row);
  return { ok: true, id };
}

/**
 * Devolve todos os profissionais registados como uma lista de objectos
 * onde as chaves sao os nomes das colunas.
 */
function listWorkers() {
  const sh = _getSheet('workers', WORKER_HEADERS);
  const values = sh.getDataRange().getValues();

  // Se so existir o cabecalho, nao ha dados.
  if (values.length < 2) return [];

  const headers = values[0];
  return values.slice(1).map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
}


// -------------------------------------------------------------------
// Pedidos de contratacao (jobs)
// -------------------------------------------------------------------

/**
 * Cria um novo pedido de trabalho com id unico e data de criacao.
 */
function createJob(payload) {
  const p = _sanitizeJob(payload);
  _validateJob(p);

  const sh = _getSheet('jobs', JOB_HEADERS);
  const id = 'j_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

  const row = JOB_HEADERS.map(h => {
    if (h === 'id') return id;
    if (h === 'createdAt') return new Date().toISOString();
    return p[h] != null ? p[h] : '';
  });

  sh.appendRow(row);
  return { ok: true, id };
}

/**
 * Devolve a lista de todos os pedidos de contratacao registados.
 */
function listJobs() {
  const sh = _getSheet('jobs', JOB_HEADERS);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  return values.slice(1).map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
}


// -------------------------------------------------------------------
// Sistema de votos
//
// O voto e guardado em duas colunas do profissional (voto_positivo e
// voto_negativo). Usamos LockService para evitar que dois votos
// simultaneos se sobreponham, o que aconteceria porque cada voto le e
// escreve na mesma celula.
// -------------------------------------------------------------------

function vote(payload) {
  const workerId = String(payload && payload.workerId || '');
  const value    = String(payload && payload.value || '');
  const previous = payload && payload.previous ? String(payload.previous) : null;

  if (!workerId) throw new Error('workerId obrigatorio');
  if (!['up', 'down'].includes(value)) throw new Error('Valor de voto invalido');

  // Adquirimos o lock por ate 10 segundos. Se outro pedido de voto
  // estiver em curso, este espera em vez de corromper os contadores.
  const lock = LockService.getScriptLock();
  lock.waitLock(10 * 1000);

  try {
    const sh = _getSheet('workers', WORKER_HEADERS);
    const range = sh.getDataRange();
    const values = range.getValues();

    const idxId  = WORKER_HEADERS.indexOf('id') + 1;
    const idxPos = WORKER_HEADERS.indexOf('voto_positivo') + 1;
    const idxNeg = WORKER_HEADERS.indexOf('voto_negativo') + 1;

    // Percorremos as linhas a procura do profissional. A linha 1 tem o
    // cabecalho, por isso comecamos em 2.
    for (let r = 2; r <= values.length; r++) {
      if (String(values[r - 1][idxId - 1]) === workerId) {

        // Se o utilizador ja tinha votado no sentido contrario,
        // decrementamos o contador antigo para nao somar duas vezes.
        if (previous === 'up') {
          const cur = (values[r - 1][idxPos - 1] || 0);
          sh.getRange(r, idxPos).setValue(Math.max(0, cur - 1));
        }
        if (previous === 'down') {
          const cur = (values[r - 1][idxNeg - 1] || 0);
          sh.getRange(r, idxNeg).setValue(Math.max(0, cur - 1));
        }

        // Incrementamos o contador correspondente ao novo voto.
        const col = value === 'up' ? idxPos : idxNeg;
        const cur = (value === 'up'
          ? values[r - 1][idxPos - 1]
          : values[r - 1][idxNeg - 1]) || 0;

        sh.getRange(r, col).setValue(cur + 1);
        return { ok: true };
      }
    }

    throw new Error('Profissional nao encontrado');
  } finally {
    lock.releaseLock();
  }
}


// -------------------------------------------------------------------
// Estatisticas agregadas
//
// Conta profissionais por categoria e por provincia e soma o total de
// votos positivos e negativos. Usada pelo painel do site.
// -------------------------------------------------------------------

function computeStats(workers) {
  const categorias = {};
  const provincias = {};

  let totalPos = 0;
  let totalNeg = 0;

  workers.forEach(w => {
    if (w.categoria) {
      categorias[w.categoria] = (categorias[w.categoria] || 0) + 1;
    }

    const prov = w.provincia || 'Desconhecida';
    provincias[prov] = (provincias[prov] || 0) + 1;

    totalPos += Number(w.voto_positivo) || 0;
    totalNeg += Number(w.voto_negativo) || 0;
  });

  return {
    total: workers.length,
    categorias,
    provincias,
    totalPos,
    totalNeg
  };
}


// -------------------------------------------------------------------
// Sanitizacao e validacao
//
// Antes de gravar, garantimos que os campos tem o tipo certo e que
// caracteres estranhos sao removidos. A validacao rejeita registos
// obviamente invalidos e devolve uma mensagem util ao utilizador.
// -------------------------------------------------------------------

function _sanitizeWorker(p) {
  p = p || {};
  return {
    nome:        _str(p.nome),
    sexo:        String(p.sexo || '').toUpperCase(),
    nascimento:  _str(p.nascimento),
    telefone:    String(p.telefone || '').replace(/\D/g, ''),
    contato:     String(p.contato || '').toLowerCase(),
    provincia:   _str(p.provincia),
    distrito:    _str(p.distrito),
    bairro:      _str(p.bairro),
    categoria:   _str(p.categoria),
    profissao:   _str(p.profissao),
    experiencia: Number(p.experiencia) || 0,
    descricao:   _str(p.descricao),
    gps_lat:     p.gps_lat ? Number(p.gps_lat) : '',
    gps_lng:     p.gps_lng ? Number(p.gps_lng) : ''
  };
}

function _sanitizeJob(p) {
  p = p || {};
  return {
    nome:      _str(p.nome),
    telefone:  String(p.telefone || '').replace(/\D/g, ''),
    provincia: _str(p.provincia),
    distrito:  _str(p.distrito),
    bairro:    _str(p.bairro),
    categoria: _str(p.categoria),
    urgencia:  _str(p.urgencia),
    descricao: _str(p.descricao),
    valor:     p.valor ? Number(p.valor) : ''
  };
}

function _validateWorker(p) {
  if (!p.nome || p.nome.length < 3) throw new Error('Nome invalido');
  if (!['F', 'M', 'OUTRO'].includes(p.sexo)) throw new Error('Sexo invalido');
  if (!/^[0-9]{9}$/.test(p.telefone)) throw new Error('Telefone deve ter 9 digitos');
  if (!['whatsapp', 'chamadas'].includes(p.contato)) throw new Error('Tipo de contacto invalido');
  if (!p.provincia || !p.distrito) throw new Error('Provincia e distrito obrigatorios');
  if (!p.categoria || !p.profissao) throw new Error('Categoria e profissao obrigatorias');
}

function _validateJob(p) {
  if (!p.nome || p.nome.length < 2) throw new Error('Nome obrigatorio');
  if (!/^[0-9]{9}$/.test(p.telefone)) throw new Error('Telefone invalido');
  if (!p.provincia || !p.distrito) throw new Error('Localizacao obrigatoria');
  if (!p.categoria) throw new Error('Categoria obrigatoria');
  if (!p.descricao || p.descricao.length < 10) throw new Error('Descricao muito curta');
}

// Converte qualquer valor num texto seguro, removendo espacos nas pontas.
function _str(v) {
  return (v == null ? '' : String(v)).trim();
}


// -------------------------------------------------------------------
// Infraestrutura
// -------------------------------------------------------------------

/**
 * Abre a Sheet configurada e devolve a folha pedida. Cria a folha com
 * os cabecalhos caso ainda nao exista, e insere os cabecalhos caso a
 * folha exista mas esteja vazia.
 */
function _getSheet(name, headers) {
  const id = PropertiesService
    .getScriptProperties()
    .getProperty('SHEET_ID') || DEFAULT_SHEET_ID;

  if (!id) {
    throw new Error('SHEET_ID nao definido (nem em DEFAULT_SHEET_ID nem em Script Properties)');
  }

  const ss = SpreadsheetApp.openById(id);
  let sh = ss.getSheetByName(name);

  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  } else if (sh.getLastRow() === 0) {
    // A folha foi criada mas ainda nao tem linhas: colocamos o cabecalho.
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }

  return sh;
}

/**
 * Serializa um objecto como JSON e devolve-o com o MIME correcto. O
 * parametro "status" e mantido por compatibilidade, mas o Apps Script
 * nao permite alterar o codigo HTTP do ContentService.
 */
function _json(obj, status) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
