const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('../controllers/step');

router.post('/', controller.createStep);
router.get('/', controller.getSteps);
router.put('/:id', controller.updateStep);
router.delete('/:id', controller.deleteStep);

module.exports = router;
