const path = require('path');
const fs = require('fs');
const express = require('express');

const food = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'food.json'), 'utf8'));

const router = express.Router();
router.get('/', (req, res) => res.json(food));

module.exports = router;
