const connectDB = require('./db');
const Vegetable = require('./models/Vegetable');

const vegetables = [
  'Tomaat', 'Sla', 'Wortel', 'Komkommer', 'Paprika', 'Courgette'
];

const seedDatabase = async () => {
  await connectDB();
  
  for (let veg of vegetables) {
    try {
      await Vegetable.create({ name: veg });
      console.log(`${veg} toegevoegd aan de database`);
    } catch (error) {
      if (error.code === 11000) {
        console.log(`${veg} bestaat al in de database`);
      } else {
        console.error(`Fout bij toevoegen van ${veg}:`, error);
      }
    }
  }
  
  console.log('Database seeding voltooid');
  process.exit();
};

seedDatabase();