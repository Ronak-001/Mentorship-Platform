function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length >= 16) return secret;

  // In production, never allow a fallback secret.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production (set it in environment variables).');
  }

  // Dev fallback (keeps local setup working if user forgot env)
  return 'dev-insecure-secret-change-me';
}

module.exports = { getJwtSecret };

