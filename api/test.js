module.exports = (req, res) => {
  res.json({ test: 'working', timestamp: new Date().toISOString() });
};
