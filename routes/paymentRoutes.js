const express = require('express');
const router = express.Router();
const { createMollieClient } = require('@mollie/api-client');

const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

router.post('/create-payment', async (req, res) => {
  try {
    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: '10.00' // Vervang dit met het juiste bedrag
      },
      description: 'Moestuin huur',
      redirectUrl: `${process.env.NGROK_URL}/payment-success`,
      webhookUrl: `${process.env.NGROK_URL}/payments/webhook`,
      method: 'ideal'
    });

    console.log('Mollie betaling gecreëerd:', payment);
    res.redirect(payment.getCheckoutUrl());
  } catch (error) {
    console.error('Fout bij het maken van de betaling:', error);
    res.status(500).send('Er is een fout opgetreden bij het verwerken van je betaling');
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const payment = await mollieClient.payments.get(req.body.id);
    console.log('Webhook ontvangen voor betaling:', payment.id);
    console.log('Betaling status:', payment.status);

    if (payment.isPaid()) {
      // Implementeer hier de logica voor een succesvolle betaling
      console.log('Betaling is succesvol');
      // Bijvoorbeeld: update de status van de bestelling in je database
    } else if (payment.isCanceled()) {
      console.log('Betaling is geannuleerd');
      // Implementeer hier de logica voor een geannuleerde betaling
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Fout in webhook:', error);
    res.status(500).send('Er is een fout opgetreden in de webhook');
  }
});

router.get('/payment-success', (req, res) => {
  res.render('payment-success', { title: 'Betaling Succesvol' });
});

module.exports = router;