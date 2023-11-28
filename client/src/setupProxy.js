const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        createProxyMiddleware('/amphitrite', {
            target: 'http://localhost:5001',
            changeOrigin: true,
            pathRewrite: function (path, req) { return path.replace('/amphitrite', '/') }
        })
    );
};