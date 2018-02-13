/* ------------------------------------------------------------------------- */
/* ---------------------------Requires START ------------------------------- */
/* ------------------------------------------------------------------------- */

const { Client } = require('pg');
const xss = require('xss');
const express = require('express');

/* ------------------------------------------------------------------------- */
/* ---------------------------Requires END  -------------------------------- */
/* ------------------------------------------------------------------------- */

const router = express.Router();

const connectionString = process.env.DATABASE_URL;


/* Fyrir rót ef notandi er skráður inn þá er byrt i footer
   notendanafn, hvort hann vill skrá sig ut og hvort hann vill fara á admin siðu
   annars það er boðið honum að fara á login siðu */
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    const data = `<p>Innskráður notandi  ${req.user.name}</p>
                  <p><a href="/logout">Útskráning</a></p>
                  <p><a href="/admin">Skoða leyndarmál</a></p>`;
    return res.render('form', { data });
  }
  const data = '<p><a href="/login">Innskráning</a></p>';
  return res.render('form', { data });
});

router.get('/thanks', (req, res) => {
  if (req.isAuthenticated()) {
    const data = `<p>Innskráning notandi  ${req.user.name}</p>
                  <p><a href="/logout">Útskráning</a></p>
                  <p><a href="/admin">Stjórnsiða</a></p>`;
    return res.render('thanks', { data });
  }
  const data = '<p><a href="/login">Innskráning</a></p>';
  return res.render('thanks', { data });
});

async function order(name, email, socials, amount) {
  const client = new Client({ connectionString });
  /*const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'VefforritunVerkefni2',
    password: 'dontniggmadata',
  });*/
  await client.connect();
  await client.query('INSERT INTO orders (name,email,ssn,amount) VALUES ($1,$2,$3,$4)', [name, email, socials, amount]);
  await client.end();
}

router.post('/', async (req, res) => {
  // næ i öll gögn úr formi
  const {
    name,
    email,
    socials,
    amount,
  } = req.body;
  // treysta eingum
  const cname = xss(name);
  const cemail = xss(email);
  const csocials = xss(socials);
  const camount = xss(amount);
  const error = [];
  error.name = cname;
  error.email = cemail;
  error.socials = csocials;
  error.amount = camount;
  if (cname.length === 0) {
    error.push('Nafn má ekki vera tómt');
  }
  if (cemail.length === 0) {
    error.push('Netfang má ekki ver tómt');
  }
  if (!/\S+@\S+\.\S+/.test(cemail)) {
    error.push('Netfang verður að vera netfang');
  }
  if (csocials.length === 0) {
    error.push(' Kennitala má ekki vera tóm');
  }
  const firsthalf = csocials.substr(0, 6);
  const secondhalf = csocials.substr(7, 11);
  if (typeof (parseInt(firsthalf, 10)) !== 'number' || typeof (parseInt(secondhalf, 10)) !== 'number' || csocials[6] !== '-') {
    error.push('Kennitala verður að vera á formi 000000-0000');
  }
  if (parseInt(camount, 10) <= 0 || camount.length === 0 || isNaN(camount)) {
    error.push('Fjöldi verður að vera tala stærri en 0 ');
  }

  if (error.length > 0) {
    if (req.isAuthenticated()) {
      const data = `<p>Innskráning notandi  ${req.user.name}</p>
                    <p><a href="/logout">Útskráning</a></p>
                    <p><a href="/admin">Skoða leyndarmál</a></p>`;
      return res.render('form', { data, error});
    }
    const data = '<p><a href="/login">Innskráning</a></p>';
    return res.render('form', { data, error});
  }
  await order(cname, cemail, csocials, parseInt(camount, 10));
  res.redirect('/thanks');
});


module.exports = router;

