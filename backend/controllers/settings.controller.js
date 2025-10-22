const Settings = require('../models/Settings');

// Ensure a single settings document exists
async function getOrCreateSettings() {
  let doc = await Settings.findOne();
  if (!doc) {
    doc = await Settings.create({ promotions: [], policies: [] });
  }
  return doc;
}

exports.getPublic = async (req, res) => {
  try {
    const doc = await getOrCreateSettings();
    res.json({ promotions: doc.promotions, policies: doc.policies });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load public settings' });
  }
};

exports.getAdmin = async (req, res) => {
  try {
    const doc = await getOrCreateSettings();
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load settings' });
  }
};

exports.update = async (req, res) => {
  try {
    const { promotions, policies } = req.body || {};
    const doc = await getOrCreateSettings();
    if (Array.isArray(promotions)) doc.promotions = promotions;
    if (Array.isArray(policies)) doc.policies = policies;
    await doc.save();
    res.json({ message: 'Settings updated', settings: doc });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update settings' });
  }
};
