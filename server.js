const express = require('express');
const handlebars = require('express-handlebars');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Cấu hình Handlebars
 app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');

app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.render('home');
});
// handlebars.registerHelper('isGoogleDocsUrl', function (url) {
//     return url.includes("docs.google.com");
// });


// Proxy request từ frontend (2908) sang backend (3001)
app.use('/', createProxyMiddleware({ 
    target: 'http://localhost:3001', 
    changeOrigin: true 
}));

const PORT = process.env.PORT || 2908;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

