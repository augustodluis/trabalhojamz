/**
 * @jest-environment jsdom
 */
const Api = require('../../assets/js/api.js');

describe('TJMZApi.parseCSV', () => {
  test('parseia CSV simples', () => {
    const csv = 'a,b,c\n1,2,3\n4,5,6';
    expect(Api.parseCSV(csv)).toEqual([
      { a: '1', b: '2', c: '3' },
      { a: '4', b: '5', c: '6' }
    ]);
  });

  test('respeita aspas e vírgulas dentro de aspas', () => {
    const csv = 'nome,descricao\n"Ana","Fala português, inglês"';
    const rows = Api.parseCSV(csv);
    expect(rows[0].descricao).toBe('Fala português, inglês');
  });

  test('suporta aspas duplas escapadas', () => {
    const csv = 'nome\n"O ""grande"" chef"';
    expect(Api.parseCSV(csv)[0].nome).toBe('O "grande" chef');
  });

  test('ignora linhas vazias', () => {
    const csv = 'a\n1\n\n2\n';
    expect(Api.parseCSV(csv)).toHaveLength(2);
  });
});

describe('TJMZApi.normalizeWorker', () => {
  test('normaliza campos opcionais', () => {
    const w = Api.normalizeWorker({
      id: 'x', Nome: 'Ana', sexo: 'f',
      telefone: '844111111', contato: 'WhatsApp',
      Provincia: 'Sofala', distrito: 'Beira',
      Categoria: 'construcao', profissao: 'Pedreira',
      voto_positivo: '5', voto_negativo: '2'
    });
    expect(w.nome).toBe('Ana');
    expect(w.sexo).toBe('F');
    expect(w.contato).toBe('whatsapp');
    expect(w.provincia).toBe('Sofala');
    expect(w.voto_positivo).toBe(5);
    expect(w.voto_negativo).toBe(2);
  });

  test('coage números numéricos de strings', () => {
    const w = Api.normalizeWorker({ experiencia: '7', voto_positivo: 'xx' });
    expect(w.experiencia).toBe(7);
    expect(w.voto_positivo).toBe(0);
  });
});

describe('TJMZApi.computeStats', () => {
  const sample = [
    { sexo:'F', provincia:'Sofala', categoria:'casa', voto_positivo:3, voto_negativo:1 },
    { sexo:'M', provincia:'Sofala', categoria:'construcao', voto_positivo:2, voto_negativo:0 },
    { sexo:'F', provincia:'Nampula', categoria:'casa', voto_positivo:5, voto_negativo:2 },
    { sexo:'Outro', provincia:'Nampula', categoria:'transporte', voto_positivo:0, voto_negativo:0 }
  ];

  test('total == length', () => {
    const s = Api.computeStats(sample);
    expect(s.total).toBe(4);
  });

  test('conta géneros corretamente', () => {
    const s = Api.computeStats(sample);
    expect(s.totalF).toBe(2);
    expect(s.totalM).toBe(1);
    expect(s.totalOutro).toBe(1);
  });

  test('agrupa por província com F/M', () => {
    const s = Api.computeStats(sample);
    expect(s.provincias['Sofala'].total).toBe(2);
    expect(s.provincias['Sofala'].F).toBe(1);
    expect(s.provincias['Sofala'].M).toBe(1);
    expect(s.provincias['Nampula'].F).toBe(1);
  });

  test('soma votos positivos e negativos', () => {
    const s = Api.computeStats(sample);
    expect(s.totalPos).toBe(10);
    expect(s.totalNeg).toBe(3);
  });

  test('conta categorias', () => {
    const s = Api.computeStats(sample);
    expect(s.categorias.casa).toBe(2);
    expect(s.categorias.construcao).toBe(1);
  });
});

describe('TJMZApi.vote (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
    Api.CONFIG.APPS_SCRIPT_URL = ''; // modo dev
  });

  test('regista voto positivo local', async () => {
    await Api.vote('w1', 'up');
    expect(Api.getLocalVote('w1')).toBe('up');
  });

  test('permite trocar voto de up para down', async () => {
    await Api.vote('w1', 'up');
    await Api.vote('w1', 'down');
    expect(Api.getLocalVote('w1')).toBe('down');
  });

  test('rejeita voto duplicado idêntico', async () => {
    await Api.vote('w1', 'up');
    await expect(Api.vote('w1', 'up')).rejects.toThrow(/já votou/i);
  });

  test('rejeita valor inválido', async () => {
    await expect(Api.vote('w1', 'maybe')).rejects.toThrow(/inválido/i);
  });
});
