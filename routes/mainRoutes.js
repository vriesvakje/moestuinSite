const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: true });

// Hulpfunctie
const renderPage = (res, page, options) => {
  res.render(page, { ...options, user: options.user, csrfToken: options.csrfToken });
};

// Openbare routes
router.get('/', csrfProtection, (req, res) => renderPage(res, 'home', { title: 'Welkom bij Moestuin Verhuur', user: req.user, csrfToken: req.csrfToken() }));
router.get('/beschikbaar', csrfProtection, (req, res) => renderPage(res, 'beschikbaar', { title: 'Beschikbare Moestuinen', user: req.user, csrfToken: req.csrfToken() }));
router.get('/huren', csrfProtection, (req, res) => renderPage(res, 'huren', { title: 'Huur een Moestuin', user: req.user, csrfToken: req.csrfToken() }));
router.get('/informatie', csrfProtection, (req, res) => renderPage(res, 'informatie', { title: 'Informatie over Moestuinieren', user: req.user, csrfToken: req.csrfToken() }));
router.get('/contact', csrfProtection, (req, res) => renderPage(res, 'contact', { title: 'Neem Contact Op', user: req.user, csrfToken: req.csrfToken() }));

// Geauthenticeerde routes
router.get('/dashboard', ensureAuthenticated, csrfProtection, (req, res) => renderPage(res, 'dashboard', { title: 'Dashboard', user: req.user, csrfToken: req.csrfToken() }));
router.get('/mijnMoestuinUpdates', ensureAuthenticated, csrfProtection, (req, res) => renderPage(res, 'mijnMoestuinUpdates', { title: 'Mijn Moestuin Updates', user: req.user, csrfToken: req.csrfToken() }));
router.get('/groenteselectie', ensureAuthenticated, csrfProtection, (req, res) => renderPage(res, 'groenteselectie', { title: 'Groenteselectie', user: req.user, csrfToken: req.csrfToken() }));
router.get('/mijn-selectie', ensureAuthenticated, csrfProtection, (req, res) => renderPage(res, 'mijn-selectie', { title: 'Mijn Groenteselectie', user: req.user, csrfToken: req.csrfToken() }));

// Wachtwoord reset routes
router.get('/forgot-password', csrfProtection, (req, res) => renderPage(res, 'forgot-password', { title: 'Wachtwoord Vergeten', csrfToken: req.csrfToken() }));
router.get('/reset-password/:token', csrfProtection, (req, res) => renderPage(res, 'reset-password', { title: 'Wachtwoord Resetten', token: req.params.token, csrfToken: req.csrfToken() }));

// Betalingsroutes
router.get('/payment-success', csrfProtection, (req, res) => renderPage(res, 'payment-success', { title: 'Betaling Succesvol', user: req.user, csrfToken: req.csrfToken() }));
router.get('/payment-open', csrfProtection, (req, res) => renderPage(res, 'payment-open', { title: 'Betaling in Behandeling', user: req.user, csrfToken: req.csrfToken() }));
router.get('/payment-failed', csrfProtection, (req, res) => renderPage(res, 'payment-failed', { title: 'Betaling Mislukt', user: req.user, csrfToken: req.csrfToken() }));
router.get('/payment-canceled', csrfProtection, (req, res) => renderPage(res, 'payment-canceled', { title: 'Betaling Geannuleerd', user: req.user, csrfToken: req.csrfToken() }));
router.get('/payment-expired', csrfProtection, (req, res) => renderPage(res, 'payment-expired', { title: 'Betaling Verlopen', user: req.user, csrfToken: req.csrfToken() }));

module.exports = router;