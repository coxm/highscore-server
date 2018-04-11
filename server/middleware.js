const logRequest = (req, res, next) => {
  console.log('[%s][%s] %s %s',
    new Date().toISOString(), req.ip,
    req.method,
    (req.url === req.originalUrl
      ? req.url
      : `(${req.originalUrl} mutated to ${req.url})`));
  next();
};
module.exports.logRequest = logRequest;
