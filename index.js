const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const flash = require('express-flash');
const connectDB = require('./db');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

console.log('Express app is geïnitialiseerd');

// Algemene middleware voor logging
app.use((req, res, next) => {
  console.log(`Request ontvangen: ${req.method} ${req.url}`);
  next();
});

// Rate limiter
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Connect to MongoDB
connectDB();

// EJS setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Bodyparser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Express Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 uur
  }
}));

// Passport config
require('./config/passport')(passport);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash
app.use(flash());

// CSRF Protection
const csrfProtection = csrf({ cookie: true });
app.use((req, res, next) => {
  if (req.path === '/payments/webhook') {
    return next();
  }
  csrfProtection(req, res, next);
});

// Make csrfToken available to all views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null;
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const indexRoutes = require('./routes/mainRoutes');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/paymentRoutes');

console.log('Routes worden geladen');

app.get('/initiate-payment', (req, res) => {
  console.log('Initiate payment route aangeroepen');
  res.render('initiate-payment');
});

app.use('/', indexRoutes);
app.use('/juser', userRoutes);
app.use('/payments', paymentRoutes);

console.log('Alle routes zijn toegevoegd aan de app');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error', { 
    title: 'Fout', 
    message: 'Er is een onverwachte fout opgetreden.',
    user: req.user
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
  console.log('Server is klaar om requests te ontvangen');
});

module.exports = app;