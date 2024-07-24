const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { sendNotificationEmail, sendPasswordResetEmail } = require('../emailService');
const Vegetable = require('../models/Vegetable');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Home page
router.get('/', (req, res) => {
  res.render('home', { title: 'Welkom bij Moestuin Verhuur', user: req.user });
});

// Beschikbare moestuinen
router.get('/beschikbaar', (req, res) => {
  res.render('beschikbaar', { title: 'Beschikbare Moestuinen', user: req.user });
});

// Huur een moestuin
router.get('/huren', (req, res) => {
  res.render('huren', { title: 'Huur een Moestuin', user: req.user });
});

router.post('/huren', async (req, res) => {
  try {
    await sendNotificationEmail(req.body);
    res.render('huren-bevestiging', { title: 'Aanvraag Ontvangen', user: req.user });
  } catch (error) {
    console.error('Fout bij het verwerken van de huuraanvraag:', error);
    res.status(500).render('error', { 
      title: 'Fout', 
      message: 'Er is een fout opgetreden bij het verwerken van uw aanvraag. Probeer het later opnieuw.',
      user: req.user
    });
  }
});

// route voor verstuuren contact
router.post('/contact', async (req, res) => {
  try {
    console.log('Contact form gegevens:', req.body); // Voor debugging
    await sendNotificationEmail(req.body);
    res.render('contact-bevestiging', { 
      title: 'Bericht Ontvangen', 
      user: req.user 
    });
  } catch (error) {
    console.error('Fout bij het verwerken van het contactformulier:', error);
    res.status(500).render('error', { 
      title: 'Fout', 
      message: 'Er is een fout opgetreden bij het verwerken van uw bericht. Probeer het later opnieuw.',
      user: req.user
    });
  }
});

// payment-success route
router.get('/payment-success', (req, res) => {
  console.log('Payment success route aangeroepen');
  res.render('payment-success', { title: 'Betaling Succesvol', user: req.user });
});

// Informatie pagina
router.get('/informatie', (req, res) => {
  res.render('informatie', { title: 'Informatie over Moestuinieren', user: req.user });
});

// Contact pagina
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Neem Contact Op', user: req.user });
});

// Groenteselectie
router.get('/groenteselectie', async (req, res) => {
  const vegetables = await Vegetable.find();
  res.render('groenteselectie', { title: 'Groenteselectie', vegetables, user: req.user });
});

// Mijn Moestuin Updates (beschermd door authenticatie)
router.get('/mijnMoestuinUpdates', ensureAuthenticated, (req, res) => {
  res.render('mijnMoestuinUpdates', { title: 'Mijn Moestuin Updates', user: req.user });
});

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', {
    user: req.user
  });
});

// Forgot Password Page (GET route)
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { title: 'Wachtwoord Vergeten' });
});

// Forgot Password Handle (POST route)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error_msg', 'Geen account gevonden met dit e-mailadres.');
      return res.redirect('/forgot-password');
    }
    
    // Genereer een unieke token
    const token = crypto.randomBytes(20).toString('hex');
    console.log('Token generated:', token);

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 uur geldig
    
    console.log('User before save:', user);
    await user.save();
    console.log('User after save:', user);

    // Stuur een e-mail met de reset link
    const resetUrl = `http://${req.headers.host}/reset-password/${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    req.flash('success_msg', 'Een e-mail met resetinstructies is verzonden naar je e-mailadres.');
    res.redirect('/juser/login');
  } catch (error) {
    console.error('Wachtwoord reset error:', error);
    req.flash('error_msg', 'Er is een fout opgetreden bij het verwerken van je aanvraag.');
    res.redirect('/forgot-password');
  }
});

// Reset Password Page (GET route)
router.get('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error_msg', 'Wachtwoord reset token is ongeldig of verlopen.');
      return res.redirect('/forgot-password');
    }

    res.render('reset-password', { 
      title: 'Wachtwoord Resetten',
      token: req.params.token,
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg'),
      user: req.user
    });
  } catch (error) {
    console.error('Error in reset password page:', error);
    req.flash('error_msg', 'Er is een fout opgetreden. Probeer het opnieuw.');
    res.redirect('/forgot-password');
  }
});

// Reset Password Handle (POST route)
router.get('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Invalid or expired token attempted:', req.params.token);
      req.flash('error_msg', 'Wachtwoord reset token is ongeldig of verlopen.');
      return res.redirect('/forgot-password');
    }

    res.render('reset-password', { 
      title: 'Wachtwoord Resetten',
      token: req.params.token,
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg'),
      user: req.user
    });
  } catch (error) {
    console.error('Error in reset password page:', error);
    req.flash('error_msg', 'Er is een fout opgetreden. Probeer het opnieuw.');
    res.redirect('/forgot-password');
  }
});

// Reset Password Handle (POST route)
router.post('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Invalid or expired token submitted:', req.params.token);
      req.flash('error_msg', 'Wachtwoord reset token is ongeldig of verlopen.');
      return res.redirect('/forgot-password');
    }

    const { password, password2 } = req.body;

    // Validatie
    if (!password || !password2) {
      req.flash('error_msg', 'Vul alstublieft alle velden in');
      return res.redirect(`/reset-password/${req.params.token}`);
    }

    if (password !== password2) {
      req.flash('error_msg', 'Wachtwoorden komen niet overeen');
      return res.redirect(`/reset-password/${req.params.token}`);
    }

    if (password.length < 6) {
      req.flash('error_msg', 'Wachtwoord moet minstens 6 karakters lang zijn');
      return res.redirect(`/reset-password/${req.params.token}`);
    }

    // Set new password
    user.password = password; // Assuming you're using a pre-save hook for hashing
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('Password reset successful for user:', user.email);
    req.flash('success_msg', 'Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je nieuwe wachtwoord.');
    res.redirect('/juser/login');
  } catch (error) {
    console.error('Error in reset password handle:', error);
    req.flash('error_msg', 'Er is een fout opgetreden bij het resetten van je wachtwoord. Probeer het opnieuw.');
    res.redirect('/forgot-password');
  }
});

// Opslaan van groenteselectie (beschermd door authenticatie)
router.post('/save-selection', ensureAuthenticated, async (req, res) => {
  const { vegetables } = req.body;
  try {
    await Vegetable.updateMany({}, { selected: false });
    await Vegetable.updateMany({ name: { $in: vegetables } }, { selected: true });
    res.json({ message: 'Selectie opgeslagen' });
  } catch (error) {
    res.status(500).json({ message: 'Fout bij opslaan van selectie' });
  }
});

// Mijn selectie pagina (beschermd door authenticatie)
router.get('/mijn-selectie', ensureAuthenticated, async (req, res) => {
  const selectedVegetables = await Vegetable.find({ selected: true });
  res.render('mijn-selectie', { 
    title: 'Mijn Groenteselectie',
    vegetables: selectedVegetables.map(v => v.name),
    user: req.user
  });
});

router.get('/reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error_msg', 'Wachtwoord reset token is ongeldig of verlopen.');
      return res.redirect('/forgot-password');
    }

    res.render('reset-password', { token: req.params.token });
  } catch (error) {
    console.error('Error in reset password route:', error);
    req.flash('error_msg', 'Er is een fout opgetreden. Probeer het opnieuw.');
    res.redirect('/forgot-password');
  }
});

router.post('/reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error_msg', 'Wachtwoord reset token is ongeldig of verlopen.');
      return res.redirect('/forgot-password');
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash('success_msg', 'Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je nieuwe wachtwoord.');
    res.redirect('/login');
  } catch (error) {
    console.error('Error in reset password post route:', error);
    req.flash('error_msg', 'Er is een fout opgetreden bij het resetten van je wachtwoord. Probeer het opnieuw.');
    res.redirect('/forgot-password');
  }
});

// Tijdelijke check routes (alleen voor ontwikkeling)
if (process.env.NODE_ENV !== 'production') {
  // Sessie check route
  router.get('/check-session', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ 
        authenticated: true, 
        user: { 
          id: req.user.id, 
          email: req.user.email 
        } 
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Wachtwoord check route
  router.get('/check-password/:email', async (req, res) => {
    try {
      console.log('Checking password for email:', req.params.email);
      const user = await User.findOne({ email: req.params.email });
      if (!user) {
        console.log('User not found');
        return res.status(404).send('User not found');
      }
      console.log('User found:', user.email);
      console.log('Stored password hash:', user.password);
      const isMatch = await bcrypt.compare('vriesvakje', user.password);
      console.log('Password match:', isMatch);
      res.send(`Password match for ${user.email}: ${isMatch}`);
    } catch (error) {
      console.error('Error checking password:', error);
      res.status(500).send('Error checking password: ' + error.message);
    }
  });
}

module.exports = router;