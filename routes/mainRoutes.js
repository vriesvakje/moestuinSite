const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { sendNotificationEmail, sendPasswordResetEmail } = require('../emailService');
const Vegetable = require('../models/Vegetable');
const User = require('../models/User');
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

// Openbare routes
router.get('/', csrfProtection, (req, res) => renderPage(res, 'home', { title: 'Welkom bij Moestuin Verhuur', user: req.user, csrfToken: req.csrfToken() }));
router.get('/beschikbaar', csrfProtection, (req, res) => renderPage(res, 'beschikbaar', { title: 'Beschikbare Moestuinen', user: req.user, csrfToken: req.csrfToken() }));
router.get('/huren', csrfProtection, (req, res) => renderPage(res, 'huren', { title: 'Huur een Moestuin', user: req.user, csrfToken: req.csrfToken() }));
router.get('/informatie', csrfProtection, (req, res) => renderPage(res, 'informatie', { title: 'Informatie over Moestuinieren', user: req.user, csrfToken: req.csrfToken() }));
router.get('/contact', csrfProtection, (req, res) => renderPage(res, 'contact', { title: 'Neem Contact Op', user: req.user, csrfToken: req.csrfToken() }));

// Huur aanvraag
router.post('/huren', csrfProtection, async (req, res) => {
  try {
    await sendNotificationEmail(req.body);
    renderPage(res, 'huren-bevestiging', { title: 'Aanvraag Ontvangen', user: req.user, csrfToken: req.csrfToken() });
  } catch (error) {
    handleError(req, res, error, '/huren');
  }
});

router.get('/dashboard', ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    const vegetables = await Vegetable.find();
    renderPage(res, 'dashboard', { 
      title: 'Dashboard',
      user: req.user, 
      vegetables: vegetables,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Error fetching vegetables:', error);
    handleError(req, res, error, '/');
  }
});

// Contact formulier
router.post('/contact', csrfProtection, async (req, res) => {
  try {
    await sendNotificationEmail(req.body);
    renderPage(res, 'contact-bevestiging', { title: 'Bericht Ontvangen', user: req.user, csrfToken: req.csrfToken() });
  } catch (error) {
    handleError(req, res, error, '/contact');
  }
});

// Betalingsroutes
router.get('/payment-success', csrfProtection, (req, res) => renderPage(res, 'payment-success', { title: 'Betaling Succesvol', user: req.user, csrfToken: req.csrfToken() }));
router.get('/payment-open', csrfProtection, (req, res) => renderPage(res, 'payment-open', { title: 'Betaling in Behandeling', user: req.user, csrfToken: req.csrfToken() }));
router.get('/payment-failed', csrfProtection, (req, res) => renderPage(res, 'payment-failed', { title: 'Betaling Mislukt', user: req.user, csrfToken: req.csrfToken() }));
router.get('/payment-canceled', csrfProtection, (req, res) => renderPage(res, 'payment-canceled', { title: 'Betaling Geannuleerd', user: req.user, csrfToken: req.csrfToken() }));
router.get('/payment-expired', csrfProtection, (req, res) => renderPage(res, 'payment-expired', { title: 'Betaling Verlopen', user: req.user, csrfToken: req.csrfToken() }));

// Geauthenticeerde routes
router.get('/mijnMoestuinUpdates', ensureAuthenticated, csrfProtection, (req, res) => {
  renderPage(res, 'mijnMoestuinUpdates', { title: 'Mijn Moestuin Updates', user: req.user, csrfToken: req.csrfToken() });
});

// Wachtwoord reset functionaliteit
router.get('/forgot-password', csrfProtection, (req, res) => renderPage(res, 'forgot-password', { title: 'Wachtwoord Vergeten', csrfToken: req.csrfToken() }));

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
      error_msg: req.flash('error'),
      success_msg: req.flash('success'),
      user: req.user,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    handleError(req, res, error, '/forgot-password');
  }
});

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

// Groenteselectie opslaan
router.post('/save-selection', ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    console.log(req.body);
    const selectedVegetables = req.body.vegetables;
    await Vegetable.updateMany({}, { selected: false });
    await Vegetable.updateMany({ name: { $in: selectedVegetables } }, { selected: true });
    res.json({ message: 'Selectie opgeslagen' });
  } catch (error) {
    console.error('Error saving selection:', error);
    res.status(500).json({ message: 'Fout bij opslaan van selectie' });
  }
});

// verwijderen van groente
router.post('/remove-selection', ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    const vegetableToRemove = req.body.vegetable;
    console.log('Verwijderen van groente:', vegetableToRemove);
    const result = await Vegetable.updateOne({ name: vegetableToRemove }, { selected: false });
    console.log('Update resultaat:', result);
    res.json({ message: 'Selectie verwijderd' });
  } catch (error) {
    console.error('Error removing selection:', error);
    res.status(500).json({ message: 'Fout bij verwijderen van selectie' });
  }
});

router.get('/groenteselectie', ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    const vegetables = await Vegetable.find();
    renderPage(res, 'groenteselectie', { 
      title: 'Groenteselectie',
      vegetables: vegetables,
      user: req.user,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    handleError(req, res, error, '/');
  }
});

// Mijn selectie pagina
router.get('/mijn-selectie', ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    const selectedVegetables = await Vegetable.find({ selected: true });
    renderPage(res, 'mijn-selectie', { 
      title: 'Mijn Groenteselectie',
      vegetables: selectedVegetables.map(v => v.name),
      user: req.user,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    handleError(req, res, error, '/dashboard');
  }
});

// Ontwikkelingsroutes (alleen in niet-productieomgeving)
if (process.env.NODE_ENV !== 'production') {
  router.get('/check-session', (req, res) => {
    res.json({ 
      authenticated: req.isAuthenticated(), 
      user: req.user ? { id: req.user.id, email: req.user.email } : null
    });
  });

  router.get('/check-password/:email', async (req, res) => {
    try {
      const user = await User.findOne({ email: req.params.email });
      if (!user) return res.status(404).send('User not found');
      
      const isMatch = await bcrypt.compare('vriesvakje', user.password);
      res.send(`Password match for ${user.email}: ${isMatch}`);
    } catch (error) {
      res.status(500).send('Error checking password: ' + error.message);
    }
  });
}

module.exports = router;