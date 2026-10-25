const path = require('path');
const fs = require('fs');
const express = require('express');

const events = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'events.json'), 'utf8'));

const router = express.Router();
router.get('/', (req, res) => res.json(events));

module.exports = router;
