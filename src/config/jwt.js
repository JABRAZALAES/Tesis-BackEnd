module.exports = {
    secret: process.env.JWT_SECRET || 'default',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  };