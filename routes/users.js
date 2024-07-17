const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

// Login Page
router.get('/login', (req, res) => res.render('login'));

// Register Page
router.get('/register', (req, res) => res.render('register'));

// Register Handle
router.post('/register', async (req, res) => {
  console.log('Registratieroute aangeroepen');
  console.log('Ontvangen data:', req.body);
  const { name, email, password, password2 } = req.body;
  let errors = [];

  // Check required fields
  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Vul alstublieft alle velden in' });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: 'Wachtwoorden komen niet overeen' });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: 'Wachtwoord moet minstens 6 karakters lang zijn' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    try {
      let user = await User.findOne({ email: email });
      if (user) {
        errors.push({ msg: 'Email is al geregistreerd' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name,
          email,
          password  // Het ongehashte wachtwoord wordt hier opgeslagen
        });

        // Het hashing proces wordt afgehandeld door het User model
        await newUser.save();
        console.log('Gebruiker succesvol geregistreerd:', newUser);
        req.flash('success_msg', 'Je bent nu geregistreerd en kan inloggen');
        res.redirect('/juser/login');
      }
    } catch (err) {
      console.error('Fout bij registratie:', err);
      res.status(500).render('error', { message: 'Er is een fout opgetreden bij de registratie. Probeer het later opnieuw.' });
    }
  }
});

// Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/juser/login',
    failureFlash: true
  })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.flash('success_msg', 'Je bent uitgelogd');
    res.redirect('/juser/login');
  });
});

module.exports = router;