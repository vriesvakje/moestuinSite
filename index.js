const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const flash = require('express-flash');
const connectDB = require('./db');
const rateLimit = require('express-rate-limit');
const warmUp = require('./warmup');
require('dotenv').config();

const app = express();
let isWarmedUp = false;

console.log('Express app is geïnitialiseerd');

// Algemene middleware voor logging
app.use((req, res, next) => {
  console.log(`Request ontvangen: ${req.method} ${req.url}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  if (isWarmedUp) {
    res.status(200).json({ status: 'OK', message: 'Server is warmed up and ready' });
  } else {
    res.status(503).json({ status: 'Not Ready', message: 'Server is still warming up' });
  }
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

// Passport config
require('./config/passport')(passport);

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
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash
app.use(flash());

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

async function startServer() {
  try {
    await connectDB();
    await warmUp(app);
    isWarmedUp = true;
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is volledig opgewarmd en draait op http://localhost:${port}`);
      console.log('Server is klaar om requests te ontvangen');
    });
  } catch (error) {
    console.error('Kritieke fout bij het opstarten van de server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;