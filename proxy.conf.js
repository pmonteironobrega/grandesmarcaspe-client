const API_TARGET = 'http://localhost:3000';

function shouldServeSpa(req) {
  const accept = req.headers.accept ?? '';
  return accept.includes('text/html');
}

/** @type {import('http-proxy-middleware').Options} */
const apiDefaults = {
  target: API_TARGET,
  secure: false,
  changeOrigin: true,
};

module.exports = {
  '/geography': apiDefaults,
  '/catalog': apiDefaults,
  '/categorias': apiDefaults,
  '/clientes': apiDefaults,
  '/busca': apiDefaults,
  '/c/': {
    ...apiDefaults,
    bypass(req) {
      if (shouldServeSpa(req)) {
        return '/index.html';
      }
    },
  },
  '/r/': {
    ...apiDefaults,
    bypass(req) {
      if (shouldServeSpa(req)) {
        return '/index.html';
      }
    },
  },
};
