const dotenvResult = require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');

// Routes
const authRoutes = require('./routes/auth');
const binRoutes = require('./routes/bins');
const adminRoutes = require('./routes/admin'); 

const app = express();

// -----------------------
// MongoDB Connection
// -----------------------
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/user-tracker';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// -----------------------
// Middlewares
// -----------------------
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend/public")));

// -----------------------
// Express Session
// -----------------------
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: mongoURI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Flash messages
app.use(flash());

// Passport middleware (optional, for authentication)
app.use(passport.initialize());
app.use(passport.session());

// -----------------------
// Global Variables for Flash Messages
// -----------------------
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// -----------------------
// Routes
// -----------------------
app.use('/', authRoutes); // Signup/Login
app.use('/', binRoutes); // Bin-related routes
app.use('/', adminRoutes); // Admin Routes

// Home page
app.get('/', (req, res) => res.render('index'));

// 404 Error Handling
app.use((req, res, next) => {
  next(createError(404, 'Page Not Found'));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', { message: err.message, error: err });
});

// -----------------------
// Server Start
// -----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
