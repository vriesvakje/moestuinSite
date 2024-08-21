const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const connectDB = require('./db');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 200, // Limiet elke IP tot 100 requests per `window` (hier, per 15 minuten)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const app = express();
const port = process.env.PORT || 3000;

// Passport config
require('./config/passport')(passport);

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

// Express Session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(limiter);

// Connect Flash
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const indexRoutes = require('./routes/mainRoutes');
const userRoutes = require('./routes/users');

app.use('/', indexRoutes);
app.use('/juser', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Fout', 
    message: 'Er is een onverwachte fout opgetreden.',
    user: req.user
  });
});

const User = require('./models/User');
const bcrypt = require('bcryptjs');



// Start the server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
  
  if (process.env.NODE_ENV !== 'production') {
    const browserSync = require('browser-sync').create();
    browserSync.init({
      files: ['public/**/*.{js,css}', 'views/**/*.ejs'],
      open: false,
      port: 3001,
      proxy: `localhost:${PORT}`,
      ui: false,
      notify: false,
      reloadDelay: 1000,
      reloadDebounce: 1000
    }, function(err, bs) {
      console.log('BrowserSync is running on port 3001');
    });
  }
});

module.exports = app;
