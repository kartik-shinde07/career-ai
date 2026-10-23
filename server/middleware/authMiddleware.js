// imports for jsonwebtoken library below this code block
const jwt = require('jsonwebtoken');

// jwt verification authentication middleware below this code block
const authMiddleware = (req, res, next) => {
  // extract authorization header from incoming request below this code block
  const authHeader = req.headers.authorization;

  // check if authorization header exists and starts with Bearer below this code block
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required or session expired.'
    });
  }

  // extract token string after Bearer prefix below this code block
  const token = authHeader.split(' ')[1];

  // verify jsonwebtoken using secret key below this code block
  try {
    const jwtSecret = process.env.JWT_SECRET || 'career_ai_default_dev_secret_key_change_me';
    const decoded = jwt.verify(token, jwtSecret);

    // attach authenticated user id to request object for downstream controllers below this code block
    req.user = { id: decoded.userId || decoded.id };
    next();
  } catch (error) {
    // catch expired or malformed token errors and return 401 below this code block
    return res.status(401).json({
      success: false,
      message: 'Authentication required or session expired.'
    });
  }
};

// export authentication middleware below this code block
module.exports = authMiddleware;
