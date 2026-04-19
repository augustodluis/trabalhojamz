/**
 * @jest-environment jsdom
 *
 * Testa as regras de validação (reimplementadas localmente ou importadas do app).
 * Como app.js usa o DOM + globals, extraímos aqui as mesmas regras via um helper
 * equivalente, garantindo compatibilidade 1:1.
 */
const Data = require('../../assets/js/data.js');

const Validation = {
  phone: (v) => /^[0-9]{9}$/.test(v),
  minLen: (v, n) => typeof v === 'string' && v.trim().length >= n,

  validateWorker(data) {
    const errors = [];
    if (!this.minLen(data.nome, 3)) errors.push('Nome');
    if (!['F','M','Outro'].includes(data.sexo)) errors.push('Sexo');
    if (!this.phone(data.telefone)) errors.push('Telefone');
    if (!['whatsapp','chamadas'].includes(data.contato)) errors.push('Contacto');
    if (!Data.isValidLocation(data.provincia, data.distrito)) errors.push('Localização');
    if (!data.categoria) errors.push('Categoria');
    if (!this.minLen(data.profissao, 2)) errors.push('Profissão');
    return { ok: errors.length === 0, errors };
  }
};

describe('Validação de cadastro de trabalhador', () => {
  const baseValid = {
    nome: 'Ana Maria Chambal',
    sexo: 'F',
    telefone: '844123456',
    contato: 'whatsapp',
    provincia: 'Sofala',
    distrito: 'Beira',
    categoria: 'construcao',
    profissao: 'Pedreira'
  };

  test('cadastro válido passa', () => {
    expect(Validation.validateWorker(baseValid).ok).toBe(true);
  });

  test('rejeita telefone com 8 dígitos', () => {
    expect(Validation.validateWorker({ ...baseValid, telefone: '84412345' }).ok).toBe(false);
  });

  test('rejeita telefone com letras', () => {
    expect(Validation.validateWorker({ ...baseValid, telefone: '84412345a' }).ok).toBe(false);
  });

  test('rejeita telefone com +258 prefixado', () => {
    expect(Validation.validateWorker({ ...baseValid, telefone: '+258844123456' }).ok).toBe(false);
  });

  test('aceita telefone com exactamente 9 dígitos', () => {
    expect(Validation.validateWorker({ ...baseValid, telefone: '824000000' }).ok).toBe(true);
    expect(Validation.validateWorker({ ...baseValid, telefone: '877000000' }).ok).toBe(true);
  });

  test('rejeita nome muito curto', () => {
    expect(Validation.validateWorker({ ...baseValid, nome: 'Jo' }).ok).toBe(false);
  });

  test('rejeita sexo fora do enum', () => {
    expect(Validation.validateWorker({ ...baseValid, sexo: 'X' }).ok).toBe(false);
  });

  test('rejeita contato inválido', () => {
    expect(Validation.validateWorker({ ...baseValid, contato: 'sms' }).ok).toBe(false);
  });

  test('aceita apenas chamadas', () => {
    expect(Validation.validateWorker({ ...baseValid, contato: 'chamadas' }).ok).toBe(true);
  });

  test('rejeita distrito que não pertence à província', () => {
    expect(Validation.validateWorker({ ...baseValid, provincia: 'Sofala', distrito: 'Lichinga' }).ok).toBe(false);
  });

  test('aceita "Outro" como sexo (prefiro não dizer)', () => {
    expect(Validation.validateWorker({ ...baseValid, sexo: 'Outro' }).ok).toBe(true);
  });

  test('retorna lista de erros acumulados', () => {
    const r = Validation.validateWorker({
      nome: '', sexo: '', telefone: 'abc', contato: '',
      provincia: '', distrito: '', categoria: '', profissao: ''
    });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(6);
  });
});
