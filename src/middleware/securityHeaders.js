const helmet = require("helmet");

function securityHeaders(production = process.env.NODE_ENV === "production") {
  const apiPolicy = helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
    },
  });
  const frontendPolicy = helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      ...(production ? { upgradeInsecureRequests: [] } : {}),
    },
  });
  const hsts = helmet.strictTransportSecurity({
    maxAge: 86400,
    includeSubDomains: false,
    preload: false,
  });
  return [
    helmet({
      contentSecurityPolicy: false,
      strictTransportSecurity: false,
      xFrameOptions: { action: "deny" },
      referrerPolicy: { policy: "no-referrer" },
      crossOriginEmbedderPolicy: false,
    }),
    (req, res, next) => {
      if (production && req.secure) return hsts(req, res, next);
      next();
    },
    (req, res, next) => {
      if (req.path === "/health" || req.path === "/api" || req.path.startsWith("/api/"))
        return apiPolicy(req, res, next);
      if (production) return frontendPolicy(req, res, next);
      next();
    },
  ];
}

module.exports = securityHeaders;
