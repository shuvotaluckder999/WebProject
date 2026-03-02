const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "secretkey", // fallback si .env manquant
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  // Generate token
  const token = generateToken(user._id);

  // Select only safe fields to send
  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: safeUser,
  });
};

module.exports = { generateToken, sendTokenResponse };