const path = require('path');
const fs = require('fs');
const express = require('express');

const tasks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'tasks.json'), 'utf8'));

const router = express.Router();
router.get('/', (req, res) => res.json(tasks));

module.exports = router;
