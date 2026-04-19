/**
 * Trabalho Ja MZ - Router baseado em hash
 *
 * O site e hospedado no GitHub Pages, que nao tem servidor proprio
 * para reescrever URLs. Por isso usamos o fragmento da URL (tudo
 * depois do #) como rota: #/cadastro, #/buscar, #/painel, etc.
 * Isto garante que os links funcionam e que a navegacao por teclas
 * "voltar" e "avancar" do browser continua a funcionar.
 *
 * A api e minimalista: current() diz em que rota estamos, navigate()
 * muda para outra rota, e onChange() regista um callback que e
 * chamado sempre que a rota muda.
 */
(function (global) {
  'use strict';

  // Lista de funcoes a notificar quando a rota muda.
  const listeners = [];

  // Devolve a rota actual normalizada, sempre a comecar com barra.
  function current() {
    const hash = global.location.hash.replace(/^#/, '') || '/';
    return hash.startsWith('/') ? hash : `/${hash}`;
  }

  // Muda a rota actual. Como alteramos apenas o hash, o browser nao
  // recarrega a pagina e o evento hashchange dispara a notificacao.
  function navigate(route) {
    global.location.hash = route;
  }

  // Regista uma funcao a ser chamada quando a rota muda. Erros dentro
  // de um listener nao afectam os outros.
  function onChange(fn) {
    listeners.push(fn);
  }

  // Chama todos os listeners registados com a rota actual.
  function _emit() {
    const r = current();
    listeners.forEach(fn => {
      try {
        fn(r);
      } catch (e) {
        console.error(e);
      }
    });
  }

  global.addEventListener('hashchange', _emit);
  global.addEventListener('DOMContentLoaded', _emit);

  const Router = { current, navigate, onChange };

  if (typeof module !== 'undefined' && module.exports) module.exports = Router;
  else global.TJMZRouter = Router;
})(typeof window !== 'undefined' ? window : globalThis);
