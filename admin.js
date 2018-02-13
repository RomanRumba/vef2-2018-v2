/* ------------------------------------------------------------------------- */
/* ---------------------------Requires START ------------------------------- */
/* ------------------------------------------------------------------------- */

const express = require('express');
const passport = require('passport');
const { Client } = require('pg');
const csv = require('express-csv');

/* ------------------------------------------------------------------------- */
/* ---------------------------Requires END  -------------------------------- */
/* ------------------------------------------------------------------------- */
const router = express.Router();
const connectionString = process.env.DATABASE_URL;
let orders = [];
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
router.get('/admin/download', (req, res) => {
  const filename = 'download.csv';
  res.set('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(res.csv(createCsv(orders)));
  res.redirect('/admin');
});

async function fetchTable() {
  const client = new Client({ connectionString });
  /*const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'VefforritunVerkefni2',
    password: 'dontniggmadata',
  });*/
  await client.connect();
  const result = await client.query('SELECT * FROM orders');
  await client.end();
  return result.rows;
}

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

  res.render('admin', { data , orders});
});

/* sækja login formið */
router.get('/login', (req, res) => {
  const data = '<p><a href="/"> Forsiða </a></p>';
  res.render('login', { data });
});

router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/form',
  }),
  (req, res) => {
    res.redirect('/admin');
  },
);

/* Logout fallið er gefið að passport að sér um að logga út aðilan
   svo er visað hann yfir á indexið */
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
