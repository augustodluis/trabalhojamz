/**
 * @jest-environment jsdom
 */
const Data = require('../../assets/js/data.js');

describe('TJMZData — dados padronizados STAE 2024', () => {
  test('tem exactamente 11 províncias', () => {
    expect(Data.listProvincias()).toHaveLength(11);
  });

  test('contém todas as províncias oficiais de Moçambique', () => {
    const expected = [
      'Maputo Cidade', 'Maputo Província', 'Gaza', 'Inhambane', 'Sofala',
      'Manica', 'Tete', 'Zambézia', 'Nampula', 'Cabo Delgado', 'Niassa'
    ];
    expected.forEach(p => expect(Data.listProvincias()).toContain(p));
  });

  test('Maputo Cidade tem 7 distritos municipais', () => {
    expect(Data.listDistritos('Maputo Cidade')).toHaveLength(7);
    expect(Data.listDistritos('Maputo Cidade')).toContain('KaMpfumu');
  });

  test('Nampula (maior província) tem 23+ distritos', () => {
    expect(Data.listDistritos('Nampula').length).toBeGreaterThanOrEqual(23);
    expect(Data.listDistritos('Nampula')).toContain('Ilha de Moçambique');
  });

  test('Cabo Delgado inclui Palma e Mocímboa da Praia', () => {
    const d = Data.listDistritos('Cabo Delgado');
    expect(d).toContain('Palma');
    expect(d).toContain('Mocímboa da Praia');
  });

  test('Niassa contém Lichinga (capital)', () => {
    expect(Data.listDistritos('Niassa')).toContain('Lichinga');
  });

  test('isValidLocation aceita combinações válidas', () => {
    expect(Data.isValidLocation('Sofala', 'Beira')).toBe(true);
    expect(Data.isValidLocation('Gaza', 'Xai-Xai')).toBe(true);
    expect(Data.isValidLocation('Zambézia', 'Quelimane')).toBe(true);
  });

  test('isValidLocation rejeita combinações inválidas', () => {
    expect(Data.isValidLocation('Sofala', 'Lichinga')).toBe(false);
    expect(Data.isValidLocation('Inexistente', 'Beira')).toBe(false);
    expect(Data.isValidLocation('', '')).toBe(false);
  });

  test('listDistritos retorna cópia (não muta o original)', () => {
    const list1 = Data.listDistritos('Gaza');
    list1.push('FAKE');
    const list2 = Data.listDistritos('Gaza');
    expect(list2).not.toContain('FAKE');
  });

  test('CATEGORIAS contém as essenciais para Moçambique', () => {
    const ids = Data.CATEGORIAS.map(c => c.id);
    expect(ids).toEqual(expect.arrayContaining([
      'transporte','agricultura','construcao','casa'
    ]));
  });

  test('fillProvinciaSelect popula o <select>', () => {
    const sel = document.createElement('select');
    Data.fillProvinciaSelect(sel);
    // 11 províncias + 1 placeholder
    expect(sel.options.length).toBe(12);
  });

  test('fillDistritoSelect atualiza conforme província', () => {
    const sel = document.createElement('select');
    Data.fillDistritoSelect(sel, 'Sofala');
    // 13 distritos + 1 placeholder
    expect(sel.options.length).toBe(14);
    // Mudar para Maputo Cidade
    Data.fillDistritoSelect(sel, 'Maputo Cidade');
    expect(sel.options.length).toBe(8);
  });
});
