const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { sendNotificationEmail } = require('../emailService');
const Vegetable = require('../models/Vegetable');

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

// dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', {
    user: req.user
  });
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

// Test email route
router.get('/test-email', async (req, res) => {
  try {
    await sendNotificationEmail({
      naam: 'Test Gebruiker',
      email: 'test@example.com',
      tuingrootte: 'Medium'
    });
    res.send('Test e-mail verzonden! Controleer je inbox.');
  } catch (error) {
    console.error('Fout bij het verzenden van test e-mail:', error);
    res.status(500).send('Er is een fout opgetreden bij het verzenden van de test e-mail.');
  }
});

// verwijder naar dat alles werkt

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
      const user = await User.findOne({ email: req.params.email });
      if (!user) {
        return res.send('User not found');
      }
      const isMatch = await bcrypt.compare('vriesvakje', user.password);
      res.send(`Password match for ${user.email}: ${isMatch}`);
    } catch (error) {
      res.status(500).send('Error checking password');
    }
  });
}

// In routes/mainRoutes.js
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



module.exports = router;