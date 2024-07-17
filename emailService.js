const nodemailer = require('nodemailer');

const createTransporter = async () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

const sendNotificationEmail = async (formData) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: 'Nieuwe aanvraag voor moestuinhuur',
      text: `
        Er is een nieuwe aanvraag voor moestuinhuur binnengekomen:
        
        Naam: ${formData.naam}
        E-mail: ${formData.email}
        Gewenste tuingrootte: ${formData.tuingrootte}
        
        Neem zo snel mogelijk contact op met deze persoon.
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Notificatie e-mail verzonden');
  } catch (error) {
    console.error('Fout bij het verzenden van de notificatie e-mail:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  const transporter = await createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Wachtwoord Reset voor Moestuin Verhuur',
    text: `U heeft een wachtwoordreset aangevraagd. Klik op de volgende link om uw wachtwoord te resetten: ${resetUrl}`,
    html: `
      <p>U heeft een wachtwoordreset aangevraagd.</p>
      <p>Klik op de volgende link om uw wachtwoord te resetten:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Deze link is 1 uur geldig.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendNotificationEmail, sendPasswordResetEmail };