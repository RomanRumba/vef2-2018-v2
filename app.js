/* ------------------------------------------------------------------------- */
/* ---------------------------Requires START ------------------------------- */
/* ------------------------------------------------------------------------- */

const express = require('express');
const path = require('path');
/* Notað til að lesa úr cookies */
const cookieParser = require('cookie-parser');
/* Verðum að nota til að búa til sessions til að halda utan um login passport þarf að hafa þetta */
const session = require('express-session');
const passport = require('passport');
/* notað til að segja hvaða leið á að nota til að auðkenna erum á local */
const { Strategy } = require('passport-local');

/* ------------------------------------------------------------------------- */
/* ---------------------------Requires END --------------------------------- */
/* ------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------- */
/* --------------------------------STILLINGAR START ------------------------ */
/* ------------------------------------------------------------------------- */

// náum i form/admin og users
const form = require('./form');
const admin = require('./admin');
const users = require('./users');

const app = express();

// dulkóðun fyrir session upplýsingar
const sessionSecret = 'dontniggmadata';

// náum i dót úr views viljum pug
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// náum i css skjalið
app.use(express.static(path.join(__dirname, 'public')));

// sér um að taka cookies úr requesti
app.use(cookieParser());
// middleware til að vinna með application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
/* secret = lykill til að dulkóða session upplýsingar
   resave – á alltaf að vista session aftur í geymslu
   saveUninitialized – á að vista */
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
}));

/* Notkun : strat(username, password, done)
   Fyrir  : username er strengur
            password er strengur
            done er fall sem er kallað eftir við erum buin
   Eftir  : kallar á done með input (null,false) ef notandi nær ekki skrá sig inn
            ef hann nær að skrá sig inn þá er kallað á done með (null,res)
            "skilar i raun hvort notandi loggast inn eða ekki" */
function strat(username, password, done) {
  users
    .findByUsername(username)
    .then((user) => {
      if (!user) {
        return done(null, false);// ef notandi fanst ekki
      }
      // skilum loforð að bera saman lykillorð
      return users.comparePasswords(password, user);
    })
    .then(res => done(null, res))// tekur við comparePasswords resolvi
    .catch((err) => {
      done(err);// villu meðhöndlun
    });
}

// notar strategy sem við gerðum frá strat fallinu
passport.use(new Strategy(strat));

/* serializerum user id sem er auðkenni á notendanum
   vistum id á notenda i sessioni */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/* Notkun : deserializeUser(id, done)
   Fyrir  : id er serialized auðkenni á notanda
            done er fall sem er kallað þegar það er buið
   Eftir  : deserializa id og fletta upp hvort hann er til i users
            ef hann er til þá er skilað done með (null,user)
            annars done með (err) */
passport.deserializeUser((id, done) => {
  users
    .findById(id)
    .then(user => done(null, user))
    .catch(err => done(err));
});

// þarf að kalla þetta til að passport upphafsstillir sig
app.use(passport.initialize());
// skilgreinum að við notum sessions
app.use(passport.session());

app.use((req, res, next) => {
  /* isAuthenticated er fall sem er fengið úr passport skilar true eða false
     if true =  þá er til authenticated notandi og hann er settur sem res.locals.user
     þetta leyfir okkur nuna að nota user i view.
     if false = kallað i næsta fallið i keðjuni */
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }
  next();
});

app.use(form);
app.use(admin);

/* -------------------------------------------------------------------------- */
/* --------------------------------STILLINGAR END --------------------------- */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* ------------------------VILLU MEÐHÖNDLUN START --------------------------- */
/* -------------------------------------------------------------------------- */

/* NOTKUN : notFoundHandler(req, res, next)
   Fyrir  : req er lesanlegur straumur sem gefur
            okkur aðgang að upplýsingum um HTTP request frá client.
            res er skrifanlegur straumur sem sendur verður til clients.
            next er næsti middleware i keðjuni.
   Eftir  : visar þig i error.pug ef siðan sem var leitað var ófundin */
function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { title: '404', errorMsg: 'Siðan fannst ekki' });
}

/* NOTKUN : errorHandler(err, req, res, next)
   FYRIR  : err er truthy og inniheldur upplýsingar um villu,
            req er lesanlegur straumur sem gefur
            okkur aðgang að upplýsingum um HTTP request frá client.
            res er skrifanlegur straumur sem sendur verður til clients.
            next er næsti middleware i keðjuni.
   Eftir  : loggar ut villuna og visar i error.pug með villu prentaða i hausnum */
function errorHandler(err, req, res, next) { // eslint-disable-line
  console.error(err);
  res.status(500).render('error', { err, errorMsg: 'Villa!' });
}

/* -------------------------------------------------------------------------- */
/* ------------------------VILLU MEÐHÖNDLUN END ----------------------------- */
/* -------------------------------------------------------------------------- */

app.use(notFoundHandler);
app.use(errorHandler);

// Vefjón configin ip/port
const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.info(`Server running at http://${hostname}:${port}/`);
});
