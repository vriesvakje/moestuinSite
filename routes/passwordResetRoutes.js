const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../emailService');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: true });

// Hulpfuncties
const renderPage = (res, page, options) => {
  res.render(page, { ...options, user: options.user, csrfToken: options.csrfToken });
};

const handleError = (req, res, error, redirectPath) => {
  console.error(`Error: ${error.message}`, error);
  req.flash('error', 'Er is een fout opgetreden. Probeer het later opnieuw.');
  res.redirect(redirectPath);
};

// Wachtwoord vergeten pagina
router.get('/forgot-password', csrfProtection, (req, res) => {
  renderPage(res, 'forgot-password', { 
    title: 'Wachtwoord Vergeten', 
    csrfToken: req.csrfToken() 
  });
});

// Wachtwoord reset aanvraag verwerking
router.post('/forgot-password', csrfProtection, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      req.flash('error', 'Geen account gevonden met dit e-mailadres.');
      return res.redirect('/forgot-password');
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 uur geldig
    await user.save();

    const resetUrl = `http://${req.headers.host}/reset-password/${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    req.flash('success', 'Een e-mail met resetinstructies is verzonden naar je e-mailadres.');
    res.redirect('/juser/login');
  } catch (error) {
    handleError(req, res, error, '/forgot-password');
  }
});

// Wachtwoord reset pagina
router.get('/reset-password/:token', csrfProtection, async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Wachtwoord reset token is ongeldig of verlopen.');
      return res.redirect('/forgot-password');
    }

    renderPage(res, 'reset-password', { 
      title: 'Wachtwoord Resetten',
      token: req.params.token,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    handleError(req, res, error, '/forgot-password');
  }
});

// Wachtwoord reset verwerking
router.post('/reset-password/:token', csrfProtection, async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Wachtwoord reset token is ongeldig of verlopen.');
      return res.redirect('/forgot-password');
    }

    const { password, password2 } = req.body;

    if (!password || !password2 || password !== password2 || password.length < 6) {
      req.flash('error', 'Ongeldige wachtwoordinvoer.');
      return res.redirect(`/reset-password/${req.params.token}`);
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash('success', 'Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je nieuwe wachtwoord.');
    res.redirect('/juser/login');
  } catch (error) {
    handleError(req, res, error, '/forgot-password');
  }
});

module.exports = router;