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
      redirectUrl: `${process.env.NGROK_URL}/payment-open`,
      webhookUrl: `${process.env.NGROK_URL}/payments/webhook`,
      method: 'ideal'
    });

    console.log('Mollie betaling gecreëerd:', payment);
    
    // Sla de paymentId op in de sessie
    req.session.paymentId = payment.id;
    
    res.json({
      checkoutUrl: payment.getCheckoutUrl()
    });
  } catch (error) {
    console.error('Fout bij het maken van de betaling:', error);
    res.status(500).json({ error: 'Er is een fout opgetreden bij het verwerken van je betaling' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const payment = await mollieClient.payments.get(req.body.id);
    console.log('Webhook ontvangen voor betaling:', payment.id);
    console.log('Betaling status:', payment.status);

    let redirectUrl;
    switch(payment.status) {
      case 'paid':
        redirectUrl = `${process.env.NGROK_URL}/payments/payment-success`;
        break;
      case 'failed':
        redirectUrl = `${process.env.NGROK_URL}/payments/payment-failed`;
        break;
      case 'canceled':
        redirectUrl = `${process.env.NGROK_URL}/payments/payment-canceled`;
        break;
      case 'expired':
        redirectUrl = `${process.env.NGROK_URL}/payments/payment-expired`;
        break;
      case 'open':
      default:
        redirectUrl = `${process.env.NGROK_URL}/payments/payment-open`;
    }

    console.log('Redirect URL:', redirectUrl);
    res.status(200).send('OK');

    // Hier kun je eventueel een functie aanroepen om de gebruiker te redirecten
    // bijvoorbeeld door een socket-verbinding te gebruiken of door de frontend 
    // regelmatig de status te laten controleren.
  } catch (error) {
    console.error('Fout in webhook:', error);
    res.status(500).send('Er is een fout opgetreden in de webhook');
  }
});

router.get('/check-payment-status', async (req, res) => {
  try {
    if (!req.session.paymentId) {
      console.log('Geen paymentId gevonden in sessie');
      return res.redirect('/payment-failed');
    }

    console.log('Controleren van betaling met ID:', req.session.paymentId);
    const payment = await mollieClient.payments.get(req.session.paymentId);
    console.log('Betaling status:', payment.status);

    let redirectUrl;
    switch(payment.status) {
      case 'paid':
        redirectUrl = '/payment-success';
        break;
      case 'failed':
        redirectUrl = '/payment-failed';
        break;
      case 'canceled':
        redirectUrl = '/payment-canceled';
        break;
      case 'expired':
        redirectUrl = '/payment-expired';
        break;
      case 'open':
      default:
        redirectUrl = '/payment-open';
    }

    console.log('Redirecting to:', redirectUrl);
    
    if (redirectUrl !== '/payment-open') {
      // Als de betaling is afgerond, verwijder de paymentId uit de sessie
      delete req.session.paymentId;
    }

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Fout bij het controleren van de betalingsstatus:', error);
    res.redirect('/payment-failed');
  }
});

module.exports = router;