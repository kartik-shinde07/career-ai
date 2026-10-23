// imports for express router bcryptjs jsonwebtoken user model and rate limiters below this code block
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

// express router initialization below this code block
const router = express.Router();

// email validation regex pattern below this code block
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// helper function to generate signed jsonwebtoken below this code block
const signToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'career_ai_default_dev_secret_key_change_me';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, secret, { expiresIn });
};

// register new user endpoint handler with rate limiting below this code block (AUTH-001, AUTH-002, SEC-003)
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // validate presence and string types below this code block
    if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    // sanitize trimmed name and lowercase email below this code block
    const trimmedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();

    // validate name length constraints (2–60 chars) below this code block
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 60 characters long.'
      });
    }

    // validate email format with regex below this code block
    if (!EMAIL_REGEX.test(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // validate password minimum length (at least 8 chars) below this code block
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    // check for existing user with identical email case-insensitively below this code block
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // hash plaintext password with bcryptjs salt factor of 10 below this code block
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // create and persist new user document in mongodb atlas below this code block
    const newUser = await User.create({
      name: trimmedName,
      email: sanitizedEmail,
      passwordHash,
      themePreference: 'dark'
    });

    // sign jsonwebtoken with new user identifier below this code block
    const token = signToken(newUser._id);

    // return http 201 response with sanitized user data and jwt token below this code block
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        themePreference: newUser.themePreference,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    // pass unhandled errors to global error middleware below this code block
    next(error);
  }
});

// login user endpoint handler with rate limiting below this code block (AUTH-003, SEC-003)
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // validate presence of credentials below this code block
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // sanitize email address below this code block
    const sanitizedEmail = email.trim().toLowerCase();

    // query user by email and explicitly select hidden passwordHash below this code block
    const user = await User.findOne({ email: sanitizedEmail }).select('+passwordHash');

    // if user does not exist return generic 401 error below this code block
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // compare supplied password with stored bcrypt hash below this code block
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);

    // if password does not match return exact same generic 401 error below this code block
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // sign jsonwebtoken for authenticated user below this code block
    const token = signToken(user._id);

    // return http 200 response with token and sanitized user profile below this code block
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        themePreference: user.themePreference,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    // pass unhandled errors to global error middleware below this code block
    next(error);
  }
});

// fetch current authenticated user session endpoint below this code block (AUTH-004)
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    // find user by authenticated id from authMiddleware below this code block
    const user = await User.findById(req.user.id);

    // verify user exists in database below this code block
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required or session expired.'
      });
    }

    // return sanitized user profile below this code block
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        themePreference: user.themePreference,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    // pass unhandled errors to global error middleware below this code block
    next(error);
  }
});

// export authentication router below this code block
module.exports = router;
