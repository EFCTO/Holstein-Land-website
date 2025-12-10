const { getTokenFromReq } = require('../utils/cookies');
const { verifyJwt } = require('../utils/jwt');

function authRequired(requiredRole = null) {
  return (req, res, next) => {
    const token = getTokenFromReq(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const payload = verifyJwt(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.user = payload;
    if (requiredRole && payload.role !== requiredRole) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = authRequired;
