// imports for express router user model and authentication middleware below this code block
const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// express router initialization below this code block
const router = express.Router();

// update user profile and preferences endpoint below this code block (PROF-001 to PROF-003)
router.patch('/profile', authMiddleware, async (req, res, next) => {
  try {
    const { name, themePreference } = req.body;

    // object to hold validated update operations below this code block
    const updates = {};

    // validate and sanitize display name if provided in request body below this code block
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Display name must be a text string.'
        });
      }

      const trimmedName = name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 60) {
        return res.status(400).json({
          success: false,
          message: 'Display name must be between 2 and 60 characters long.'
        });
      }

      updates.name = trimmedName;
    }

    // validate theme preference if provided in request body below this code block
    if (themePreference !== undefined) {
      if (themePreference !== 'light' && themePreference !== 'dark') {
        return res.status(400).json({
          success: false,
          message: "Theme preference must be either 'light' or 'dark'."
        });
      }

      updates.themePreference = themePreference;
    }

    // ensure at least one valid field was provided to update below this code block
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid profile fields provided for update.'
      });
    }

    // find and update user document in mongodb atlas below this code block
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // verify user was found in database below this code block
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    // return updated sanitized user object below this code block
    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        themePreference: updatedUser.themePreference,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    // pass unhandled errors to global error middleware below this code block
    next(error);
  }
});

// export user profile router below this code block
module.exports = router;
