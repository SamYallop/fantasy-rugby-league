// Simple test endpoint
module.exports = (req, res) => {
  res.status(200).json({
    status: "API directory works!",
    timestamp: new Date().toISOString()
  });
};
