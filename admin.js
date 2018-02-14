/* ------------------------------------------------------------------------- */
/* -------------------------- Requires START ------------------------------- */
/* ------------------------------------------------------------------------- */

const express = require('express');
const passport = require('passport');
const { Client } = require('pg');

/* ------------------------------------------------------------------------- */
/* -------------------------- Requires END  -------------------------------- */
/* ------------------------------------------------------------------------- */

const router = express.Router();
const connectionString = process.env.DATABASE_URL; // tenging við gagnagrun a heroku
let orders = []; // fylki sem geymir allar upplysingar úr pantanir

/* Notkun : fetchTable()
   Fyrir  : ekkert
   efitr  : skilar obj sem inniheldur allar niðurstöður úr töfluni orders */
async function fetchTable() {
  const client = new Client({ connectionString });
  /* const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'VefforritunVerkefni2',
    password: 'dontniggmadata',
  }); */
  await client.connect();
  const result = await client.query('SELECT * FROM orders');
  await client.end();
  return result.rows;
}

/* Notkun : createCsv(data)
   Fyrir  : data er obj þar sem hvert stak er á formi
            {
              id:
              date:
              name:
              ssn:
              email:
              amount:
            }
    Eftir : data er obj þar sem hvert stak er á formi
            {
              date:
              name:
              email:
              amount:
              ssn:
            } */
function createCsv(data) {
  const csvData = [];
  let csvItem = {
    date: 'date',
    name: 'name',
    email: 'email',
    amount: 'amount',
    ssn: 'ssn',
  };
  csvData.push(csvItem);
  for (let i = 0; i < data.length; i += 1) {
    csvItem = {
      date: data[i].date,
      name: data[i].name,
      email: data[i].email,
      amount: data[i].amount,
      ssn: data[i].ssn,
    };
    csvData.push(csvItem);
  }
  return csvData;
}

/* Notkun : ensureLoggedIn(req, res, next)
   FYRIR  : err er truthy og inniheldur upplýsingar um villu,
            req er lesanlegur straumur sem gefur
            okkur aðgang að upplýsingum um HTTP request frá client.
            res er skrifanlegur straumur sem sendur verður til clients.
            next er næsti middleware i keðjuni.
   Eftir  : athuar hvort notandi er skráður inn eða ekki ef skráður þá er kallað á næsta
            hlut i keðjuni annars það er visað i login */
function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect('/login');
}

/* Fyrir download sendir download.csv skjal */
router.get('/admin/download', (req, res) => {
  const filename = 'download.csv';
  res.set('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(res.csv(createCsv(orders)));
  res.redirect('/admin');
});

/* Þegar það er farið á admin það er fyrst tryggt að aðili er skráðurinn
   svo ef hann er til þá er sótt orders úr gagnagruni og þá er byrt admin siðu
   með gögnum semvoru fengin út gagnagruni */
router.get('/admin', ensureLoggedIn, async (req, res) => {
  const table = await fetchTable();
  orders = [];
  for (let i = 0; i < table.length; i += 1) {
    const order = {
      id: table[i].id,
      date: table[i].date,
      name: table[i].name,
      ssn: table[i].ssn,
      email: table[i].email,
      amount: table[i].amount,
    };
    orders.push(order);
  }
  const data = '<p><a href="/"> Forsiða </a></p>';
  res.render('admin', { data, orders });
});

/* sækja login formið */
router.get('/login', (req, res) => {
  const data = '<p><a href="/"> Forsiða </a></p>';
  res.render('login', { data });
});

/* Logout fallið er gefið að passport að sér um að logga út aðilan
   svo er visað hann yfir á indexið */
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

/* þegar það reint að logga inn þá er
   authenticata notandan ef það tekst þá er visað hann i /admin
   annars i /form */
router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/form',
  }),
  (req, res) => {
    res.redirect('/admin');
  },
);

module.exports = router;
