// imports for mongoose schema and model below this code block
const mongoose = require('mongoose');

// regular expression for validating email format below this code block
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// user schema definition with validation rules below this code block
const userSchema = new mongoose.Schema(
  {
    // user display name field definition below this code block
    name: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      minlength: [2, 'Display name must be at least 2 characters long'],
      maxlength: [60, 'Display name cannot exceed 60 characters']
    },

    // unique lowercase email address field definition below this code block
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Please provide a valid email address']
    },

    // hashed password field with default exclusion from queries below this code block
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // never returned in queries by default (AUTH-001)
    },

    // saved user interface theme preference below this code block
    themePreference: {
      type: String,
      enum: {
        values: ['light', 'dark'],
        message: 'Theme preference must be either light or dark'
      },
      default: 'dark'
    }
  },
  {
    // automatic createdAt and updatedAt timestamps below this code block
    timestamps: true
  }
);

// export compiled mongoose user model below this code block
const User = mongoose.model('User', userSchema);
module.exports = User;
