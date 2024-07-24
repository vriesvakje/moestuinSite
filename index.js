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

const app = express();
const port = process.env.PORT || 3000;

console.log('Express app is geïnitialiseerd');

// Algemene middleware voor logging
app.use((req, res, next) => {
  console.log(`Request ontvangen: ${req.method} ${req.url}`);
  next();
});

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

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
const paymentRoutes = require('./routes/paymentRoutes');

console.log('Routes worden geladen');

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
app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
  console.log('Server is klaar om requests te ontvangen');
});

module.exports = app;