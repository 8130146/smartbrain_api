const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const morgan = require('morgan');

const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');
const auth = require('./controllers/authorization');

const db = knex({
  client: 'pg',
  connection: process.env.POSTGRES_URI 
});

const app = express();

app.use(morgan('combined'));
app.use(cors());
app.use(express.json());

const whitelist = ['http://localhost:5173']
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.get('/', (req, res) => {
    res.send('success');
});

app.post('/signin', signin.signinAuthentication(db, bcrypt));

app.post('/register' , (req, res) => {register.handleRegister(req, res, db, bcrypt)});



app.get('/profile/:id',auth.requireAuth, (req, res) => {profile.handleProfileGet(req, res, db)});
app.post('/profile/:id',auth.requireAuth, (req, res) => {profile.handleProfileUpdate(req, res, db)});

app.put('/image',auth.requireAuth, (req, res) => {image.handleImage(req, res, db)});
app.post('/imageurl',auth.requireAuth, (req, res) => {image.handleApiCall(req, res)});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});