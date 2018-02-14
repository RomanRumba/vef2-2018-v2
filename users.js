/* ------------------------------------------------------------------------- */
/* ---------------------------Requires START ------------------------------- */
/* ------------------------------------------------------------------------- */

const bcrypt = require('bcrypt');

/* ------------------------------------------------------------------------- */
/* ---------------------------Requires END --------------------------------- */
/* ------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------- */
/* --------------------- BREYTUR / gögn START ------------------------------ */
/* ------------------------------------------------------------------------- */

/* records er object sem inniheldur notenda sem geta skrá sig inn á siðuna
   id= bendill á aðilan , username er notenda nafn , password er dulkóðað i bcrypt
   name = er nafnið sem er notað þegar notandi skráir sig inn */
const records = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii',
    name: 'Stjórnandi',
  },
];

/* ------------------------------------------------------------------------- */
/* --------------------- BREYTUR / gögn END  ------------------------------- */
/* ------------------------------------------------------------------------- */


/* Notkun : comparePasswords(hash, user)
   Fyrir  : hash er lykillorðið
            user er object með id,username,password,name
   Eftir  : skilar notenda ef lýkillorðið hanns passar
            við það sem er i user obj annars ósatt */
exports.comparePasswords = (hash, user) =>
  bcrypt.compare(hash, user.password)
    .then((res) => {
      if (res) {
        return user;// ef notanda er samþykkt þá skilum honum
      }
      return false;// ef notenda ekki samþykkt þá skilum ósatt
    });

/* Notkun : findByUsername(username)
   Fyrir  : username er strengur
   Eftir  : skilar loforði um að lesa i records og athuga hvort
            strengurin username passard við username i records
            ef það er þá er honum skilað annars skilað null */
exports.findByUsername = username => new Promise((resolve) => {
  const found = records.find(u => u.username === username);
  if (found) {
    return resolve(found);// ef notandi er til þá er resolvað þvi og skilað honum
  }
  return resolve(null);// ef hann er ekki til þá skilum null
});

/* Notkun : findById(id)
   Fyrir  : id er strengur
   Eftir  : skilar loforði um að lesa i records og athuga hvort
            strengurin id passard við id i records
            ef það er þá er honum skilað annars skilað null */
exports.findById = id => new Promise((resolve) => {
  const found = records.find(u => u.id === id);
  if (found) {
    return resolve(found); // ef notandi er til þá er resolvað þvi og skilað honum
  }
  return resolve(null); // ef hann er ekki til þá skilum null
});
