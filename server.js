const path = require('path');
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

app.get('/save', (req, res) => {
    res.render('save');
});
// handlebars.registerHelper('isGoogleDocsUrl', function (url) {
//     return url.includes("docs.google.com");
// });


// Proxy request từ frontend (2908) sang backend (3001)
app.use('/', createProxyMiddleware({ 
    target: 'http://localhost:3001', 
    changeOrigin: true 
}));

app.use('/static', express.static(path.join(__dirname, 'static')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

