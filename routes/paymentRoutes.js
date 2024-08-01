const express = require('express');
const router = express.Router();
const { createMollieClient } = require('@mollie/api-client');
const csrf = require('csurf');

const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

router.post('/create-payment', csrfProtection, async (req, res) => {
  console.log('Sessie voor het maken van de betaling:', req.session);
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
    
    // Update de redirectUrl met de payment ID
    const updatedRedirectUrl = `${payment.redirectUrl}?paymentId=${payment.id}`;
    
    // Sla de paymentId op in de sessie en wacht tot de sessie is opgeslagen
    await new Promise((resolve, reject) => {
      req.session.paymentId = payment.id;
      req.session.save(err => {
        if (err) {
          console.error('Fout bij het opslaan van de sessie:', err);
          reject(err);
        } else {
          console.log('PaymentId opgeslagen in sessie:', req.session.paymentId);
          resolve();
        }
      });
    });

    console.log('Sessie na opslaan paymentId:', req.session);
    res.json({ 
      checkoutUrl: payment.getCheckoutUrl(),
      redirectUrl: updatedRedirectUrl
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
        redirectUrl = `${process.env.NGROK_URL}/payment-success`;
        break;
      case 'failed':
        redirectUrl = `${process.env.NGROK_URL}/payment-failed`;
        break;
      case 'canceled':
        redirectUrl = `${process.env.NGROK_URL}/payment-canceled`;
        break;
      case 'expired':
        redirectUrl = `${process.env.NGROK_URL}/payment-expired`;
        break;
      case 'open':
      default:
        redirectUrl = `${process.env.NGROK_URL}/payment-open`;
    }

    console.log('Redirect URL:', redirectUrl);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Fout in webhook:', error);
    res.status(500).send('Er is een fout opgetreden in de webhook');
  }
});

router.get('/check-payment-status', async (req, res) => {
  console.log('Sessie bij status check:', req.session);
  try {
    const paymentId = req.query.paymentId || req.session.paymentId;
    
    if (!paymentId) {
      console.log('Geen paymentId gevonden in query of sessie, wacht even...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wacht 3 seconden
      if (!req.session.paymentId) {
        return res.redirect('/payment-failed');
      }
    }

    console.log('Controleren van betaling met ID:', paymentId);
    const payment = await mollieClient.payments.get(paymentId);
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