export const roleMiddleware = (rolesPermitidas) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidas.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
    }
    return next();
  };
};