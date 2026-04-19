/**
 * Trabalho Ja MZ - Dados padronizados de localizacao e categorias
 *
 * Contem a lista oficial de provincias e distritos de Mocambique e as
 * categorias de trabalho usadas em toda a aplicacao. As localizacoes
 * sao a base STAE 2024 da Comissao Nacional de Eleicoes, cobrindo 11
 * provincias e 161 distritos.
 *
 * Este ficheiro nao depende de rede: e carregado de uma vez no arranque
 * e serve de fonte unica de verdade para os formularios, validacao e
 * painel estatistico.
 */
(function (global) {
  'use strict';

  // Mapa de provincia para lista de distritos. A ordem segue o ficheiro
  // original STAE, de sul para norte, o que tambem e a ordem usada no
  // mapa SVG do painel.
  const PROVINCIAS = {
    'Maputo Cidade': [
      'KaMpfumu', 'Nlhamankulu', 'KaMaxakeni', 'KaMavota',
      'KaMubukwana', 'KaTembe', 'KaNyaca'
    ],
    'Maputo Província': [
      'Matutuine', 'Namaacha', 'Boane', 'Matola',
      'Marracuene', 'Moamba', 'Manhiça', 'Magude'
    ],
    'Gaza': [
      'Chongoene', 'Xai-Xai', 'Limpopo', 'Bilene', 'Mandlakazi',
      'Chibuto', 'Chókwè', 'Guijá', 'Chigubo', 'Mabalane',
      'Massingir', 'Mapai', 'Chicualacuala', 'Massangena'
    ],
    'Inhambane': [
      'Zavala', 'Inharrime', 'Jangamo', 'Inhambane', 'Maxixe',
      'Homoíne', 'Panda', 'Morrumbene', 'Massinga', 'Funhalouro',
      'Vilankulo', 'Mabote', 'Inhassoro', 'Govuro'
    ],
    'Sofala': [
      'Machanga', 'Búzi', 'Chibabava', 'Beira', 'Dondo',
      'Nhamatanda', 'Muanza', 'Gorongosa', 'Marromeu', 'Cheringoma',
      'Caia', 'Maringué', 'Chemba'
    ],
    'Manica': [
      'Machaze', 'Mossurize', 'Sussundenga', 'Macate', 'Gondola',
      'Chimoio', 'Vanduzi', 'Manica', 'Macossa', 'Bárue',
      'Tambara', 'Guro'
    ],
    'Tete': [
      'Mutarara', 'Dôa', 'Changara', 'Moatize', 'Tete',
      'Marara', 'Cahora-Bassa', 'Mágoè', 'Tsangano', 'Chiúta',
      'Marávia', 'Zumbo', 'Angónia', 'Macanga', 'Chifunde'
    ],
    'Zambézia': [
      'Chinde', 'Luabo', 'Inhassunge', 'Quelimane', 'Mopeia',
      'Namacurra', 'Nicoadala', 'Maganja da Costa', 'Mocuba', 'Derre',
      'Morrumbala', 'Pebane', 'Mulevala', 'Lugela', 'Milange',
      'Gilé', 'Alto Molócuè', 'Ile', 'Namarroi', 'Molumbo', 'Gurúè'
    ],
    'Nampula': [
      'Moma', 'Larde', 'Angoche', 'Mogovolas', 'Murrupula',
      'Liúpo', 'Mongicual', 'Meconta', 'Nampula', 'Rapale',
      'Ribáuè', 'Malema', 'Ilha de Moçambique', 'Mossuril', 'Monapo',
      'Muecate', 'Mecubúri', 'Lalaua', 'Nacala-Porto', 'Nacala-a-Velha',
      'Nacarôa', 'Memba', 'Eráti'
    ],
    'Cabo Delgado': [
      'Mecufi', 'Chiúre', 'Namuno', 'Balama', 'Pemba',
      'Metuge', 'Ancuabe', 'Quissanga', 'Ibo', 'Meluco',
      'Montepuez', 'Macomia', 'Muidumbe', 'Mocímboa da Praia', 'Mueda',
      'Palma', 'Nangade'
    ],
    'Niassa': [
      'Cuamba', 'Mecanhelas', 'Metarica', 'Mandimba', 'Nipepe',
      'Maua', 'Marrupa', 'Majune', 'Ngaúma', 'Chimbonila',
      'Lichinga', 'Mecula', 'Mavago', 'Muembe', 'Sanga', 'Lago'
    ]
  };

  // Categorias sugeridas de trabalho. Cada categoria tem um id interno
  // (usado na Sheet e nos filtros), um nome para o utilizador e um
  // icone visual que aparece nos selects e cartoes do site.
  const CATEGORIAS = [
    { id: 'transporte',   nome: 'Transporte',        icon: '🛵' },
    { id: 'agricultura',  nome: 'Agricultura',       icon: '🌾' },
    { id: 'construcao',   nome: 'Construção',        icon: '🧱' },
    { id: 'casa',         nome: 'Casa & Família',    icon: '🏠' },
    { id: 'beleza',       nome: 'Beleza & Estética', icon: '💇' },
    { id: 'comercio',     nome: 'Comércio',          icon: '🛒' },
    { id: 'servicos',     nome: 'Serviços Gerais',   icon: '🔧' },
    { id: 'tecnologia',   nome: 'Tecnologia',        icon: '💻' },
    { id: 'educacao',     nome: 'Educação',          icon: '📚' },
    { id: 'saude',        nome: 'Saúde',             icon: '⚕️' }
  ];

  // Devolve a lista de nomes de provincias na ordem em que estao
  // registadas no objecto PROVINCIAS.
  function listProvincias() {
    return Object.keys(PROVINCIAS);
  }

  // Devolve os distritos de uma provincia. Se a provincia nao existir,
  // devolve uma lista vazia em vez de undefined.
  function listDistritos(provincia) {
    return PROVINCIAS[provincia] ? PROVINCIAS[provincia].slice() : [];
  }

  // Verifica se o par (provincia, distrito) existe nos dados oficiais.
  // Usado na validacao de formularios antes de gravar.
  function isValidLocation(provincia, distrito) {
    return !!(PROVINCIAS[provincia] && PROVINCIAS[provincia].includes(distrito));
  }

  // Preenche um elemento <select> com as provincias. O segundo parametro
  // permite desactivar a opcao vazia inicial, util quando queremos uma
  // selecao forcada.
  function fillProvinciaSelect(selectEl, includeEmpty = true) {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    if (includeEmpty) {
      selectEl.appendChild(new Option('— Selecione —', ''));
    }
    listProvincias().forEach(p => selectEl.appendChild(new Option(p, p)));
  }

  // Preenche um <select> com os distritos da provincia indicada. E
  // tipicamente chamada em resposta a uma mudanca no select de provincia.
  function fillDistritoSelect(distSelect, provincia) {
    if (!distSelect) return;
    distSelect.innerHTML = '';
    distSelect.appendChild(new Option('— Selecione —', ''));
    listDistritos(provincia).forEach(d => distSelect.appendChild(new Option(d, d)));
  }

  // Preenche um <select> com as categorias de trabalho. Mostra o icone
  // concatenado com o nome para melhor leitura.
  function fillCategoriaSelect(selectEl, includeEmpty = true) {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    if (includeEmpty) selectEl.appendChild(new Option('— Selecione —', ''));
    CATEGORIAS.forEach(c => selectEl.appendChild(new Option(`${c.icon} ${c.nome}`, c.id)));
  }

  const API = {
    PROVINCIAS,
    CATEGORIAS,
    listProvincias,
    listDistritos,
    isValidLocation,
    fillProvinciaSelect,
    fillDistritoSelect,
    fillCategoriaSelect
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  } else {
    global.TJMZData = API;
  }
})(typeof window !== 'undefined' ? window : globalThis);
