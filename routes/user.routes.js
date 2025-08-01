const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Test route
router.get('/test', (req, res) => {
  res.send('user test route');
});

// Register page (GET)
router.get('/register', (req, res) => {
  res.render('register', { title: 'User Registration' });
});

// Register user (POST)
router.post(
  '/register',
  body('email').trim().isEmail().withMessage('Please enter a valid email address'),
  body('password').trim().isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: 'Validation failed' });
    }

    try {
      const { username, email, password } = req.body;
      const hashPassword = await bcrypt.hash(password, 10);
      const newUser = await userModel.create({
        username,
        email,
        password: hashPassword,
      });

      res.json({ message: 'User registered successfully', user: newUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// Login page (GET)
router.get('/login', (req, res) => {
  res.render('login');
});

// Login user (POST)
router.post(
  '/login',
  body('username').trim().isLength({ min: 4 }).withMessage('Username must be at least 4 characters'),
  body('password').trim().isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: 'Validation failed' });
    }

    try {
      const { username, password } = req.body;
      const user = await userModel.findOne({ username });

      if (!user) {
        return res.status(400).json({ message: 'Username or password is incorrect' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Username or password is incorrect' });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          username: user.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000,
      });

      res.redirect('/home');
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

module.exports = router;
