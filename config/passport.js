const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email });
        if (!user) {
          return done(null, false, { message: 'Die email is niet geregistreerd' });
        }

        console.log('Vergelijken van wachtwoorden:');
        console.log('Ingevoerd wachtwoord:', password);
        console.log('Opgeslagen gehasht wachtwoord:', user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Wachtwoord komt overeen:', isMatch);

        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Wachtwoord is incorrect' });
        }
      } catch (err) {
        console.error('Fout tijdens authenticatie:', err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id)
      .then(user => {
        done(null, user);
      })
      .catch(err => {
        done(err, null);
      });
  });
};