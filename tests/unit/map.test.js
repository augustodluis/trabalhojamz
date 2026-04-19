/**
 * @jest-environment jsdom
 */
const Map = require('../../assets/js/map.js');

describe('TJMZMap — mapa SVG Moçambique', () => {
  test('tem exactamente 11 províncias no SVG', () => {
    expect(Map.PROVINCES_GEO).toHaveLength(11);
  });

  test('cada província tem path e coordenadas de label', () => {
    Map.PROVINCES_GEO.forEach(p => {
      expect(p.name).toBeTruthy();
      expect(p.path).toMatch(/^M/);
      expect(typeof p.cx).toBe('number');
      expect(typeof p.cy).toBe('number');
    });
  });

  test('colorFor retorna cor cinzenta se sem dados', () => {
    expect(Map.colorFor({ F: 0, M: 0, total: 0 })).toBe(Map.LEGEND.NONE);
  });

  test('colorFor detecta maioria de mulheres (>55%)', () => {
    expect(Map.colorFor({ F: 8, M: 2, total: 10 })).toBe(Map.LEGEND.F);
  });

  test('colorFor detecta maioria de homens (<45%)', () => {
    expect(Map.colorFor({ F: 2, M: 8, total: 10 })).toBe(Map.LEGEND.M);
  });

  test('colorFor retorna equilíbrio na faixa 45-55%', () => {
    expect(Map.colorFor({ F: 5, M: 5, total: 10 })).toBe(Map.LEGEND.EQUAL);
  });

  test('render produz SVG com 11 paths', () => {
    const host = document.createElement('div');
    host.id = 'mapHost';
    document.body.appendChild(host);
    Map.render('mapHost', { provincias: {} });
    expect(host.querySelectorAll('.province').length).toBe(11);
  });
});
