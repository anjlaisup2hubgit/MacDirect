const path = require('path');
const fs = require('fs');
const express = require('express');

const societies = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'societies.json'), 'utf8'));

const router = express.Router();
router.get('/', (req, res) => res.json(societies));

module.exports = router;
