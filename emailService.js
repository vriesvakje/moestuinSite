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

module.exports = { sendNotificationEmail };