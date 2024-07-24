// routes/paymentRoutes.js

console.log('paymentRoutes.js wordt geladen');

const express = require('express');
const router = express.Router();
const mollieClient = require('../config/mollieConfig');

router.get('/test', (req, res) => {
    console.log('Test route in paymentRoutes.js is aangeroepen');
    res.send('Test route werkt');
  });

router.post('/create-payment', async (req, res) => {
    console.log('create-payment route is aangeroepen');
    console.log('Betaling initiatie gestart');
    try {
      const payment = await mollieClient.payments.create({
        amount: {
          currency: 'EUR',
          value: '10.00' // Vervang dit met het juiste bedrag
        },
        description: 'Moestuin huur',
        redirectUrl: `${req.protocol}://${req.get('host')}/payment-success`,
        webhookUrl: `${req.protocol}://${req.get('host')}/webhook`,
        method: 'ideal'
      });
  
      console.log('Mollie betaling gecreëerd:', payment);
      console.log('Redirect URL:', payment.getCheckoutUrl());
  
      res.redirect(payment.getCheckoutUrl());
    } catch (error) {
      console.error('Fout bij het maken van de betaling:', error);
      res.status(500).send('Er is een fout opgetreden bij het verwerken van je betaling');
    }
  });

router.post('/webhook', async (req, res) => {
  try {
    const payment = await mollieClient.payments.get(req.body.id);

    if (payment.isPaid()) {
      // Verwerk de succesvolle betaling
      console.log('Betaling succesvol:', payment);
    } else if (payment.isCanceled()) {
      // Handel geannuleerde betaling af
      console.log('Betaling geannuleerd:', payment);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Fout in webhook:', error);
    res.status(500).send('Er is een fout opgetreden in de webhook');
  }
});

module.exports = router;