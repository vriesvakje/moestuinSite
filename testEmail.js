const { sendNotificationEmail } = require('./emailService');

const testFormData = {
  naam: 'Test User',
  email: 'testuser@example.com',
  tuingrootte: '100m²'
};

sendNotificationEmail(testFormData)
  .then(() => console.log('Test email sent successfully'))
  .catch(error => console.error('Error sending test email:', error));
