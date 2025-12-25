function requireRole(role) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        message: 'Unauthorized'
      });
    }

    if (req.admin.role !== role) {
      return res.status(403).json({
        message: 'Forbidden'
      });
    }

    next();
  };
}

module.exports = requireRole;
