const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('../controllers/rule');

router.post('/', controller.createRule);
router.get('/', controller.getRules);
router.put('/:id', controller.updateRule);
router.delete('/:id', controller.deleteRule);

module.exports = router;
