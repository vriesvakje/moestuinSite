const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Vegetable = require('../models/Vegetable');
const csrf = require('csurf');
const User = require('../models/User');

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

// Groenteselectie pagina
router.get('/groenteselectie', ensureAuthenticated, csrfProtection, async (req, res) => {
    try {
      const vegetables = await Vegetable.find().lean();
      res.render('groenteselectie', { 
        title: 'Groenteselectie',
        vegetables: vegetables,
        user: req.user,
        csrfToken: req.csrfToken()
      });
    } catch (error) {
      console.error('Error fetching vegetables:', error);
      req.flash('error', 'Er is een fout opgetreden bij het laden van de groenten.');
      res.redirect('/dashboard');
    }
  });

// Groenteselectie opslaan
router.post('/save-selection', ensureAuthenticated, async (req, res) => {
    try {
      const { vegetables } = req.body;
      console.log({ vegetables }); // Voor debugging
  
      // Update de gebruiker met de geselecteerde groenten
      await User.findByIdAndUpdate(req.user._id, { selectedVegetables: vegetables });
  
      res.redirect('/mijn-selectie');
    } catch (error) {
      console.error('Fout bij opslaan groenteselectie:', error);
      res.status(500).send('Er is een fout opgetreden bij het opslaan van je selectie');
    }
  });

// Groente verwijderen uit selectie
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

// Mijn selectie pagina
router.get('/mijn-selectie', ensureAuthenticated, async (req, res) => {
    try {
      // Haal de geselecteerde groenten op voor de ingelogde gebruiker
      const user = await User.findById(req.user._id);
      const vegetables = user.selectedVegetables || [];
  
      res.render('mijn-selectie', { 
        title: 'Mijn Groenteselectie', 
        vegetables: vegetables,
        user: req.user 
      });
    } catch (error) {
      console.error('Fout bij ophalen groenteselectie:', error);
      res.status(500).send('Er is een fout opgetreden bij het ophalen van je groenteselectie');
    }
  });

module.exports = router;