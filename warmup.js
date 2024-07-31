// warmup.js
const mongoose = require('mongoose');
const mollieClient = require('./config/mollieConfig');
const User = require('./models/User');
const Vegetable = require('./models/Vegetable');

async function warmUpDatabase() {
    try {
        // Voer een lichte query uit om de database-verbinding te initialiseren
        await User.findOne({});
        await Vegetable.findOne({});
        console.log('Database warmed up');
    } catch (error) {
        console.error('Error warming up database:', error);
    }
}

// In je warmup.js bestand
async function warmUpMollieClient() {
    try {
      console.log('Initialiseren Mollie client...');
      const mollieClient = require('./config/mollieConfig');
      await mollieClient.methods.all();
      console.log('Mollie client succesvol geïnitialiseerd en getest.');
    } catch (error) {
      console.error('Fout bij het initialiseren van de Mollie client:', error);
      throw error; // Gooi de fout opnieuw om de server-opstart te stoppen
    }
  }

  async function warmUpRoutes(app) {
    const testRoutes = ['/', '/initiate-payment', '/payment-success'];
    for (const route of testRoutes) {
        try {
            const req = new http.IncomingMessage();
            req.method = 'GET';
            req.url = route;
            
            const res = new http.ServerResponse(req);
            
            await new Promise((resolve, reject) => {
                app.handle(req, res, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log(`Route ${route} warmed up`);
        } catch (error) {
            console.error(`Error warming up route ${route}:`, error);
        }
    }
}

module.exports = async function warmUp(app) {
    console.log('Starting warm-up process...');
    try {
        await warmUpDatabase();
        await warmUpMollieClient();
        await warmUpRoutes(app);
        console.log('Warm-up process completed');
    } catch (error) {
        console.error('Error during warm-up process:', error);
        throw error; // Gooi de fout opnieuw om de server-opstart te stoppen
    }
};