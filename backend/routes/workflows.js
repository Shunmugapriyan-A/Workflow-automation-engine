const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('../controllers/workflow');
const executionController = require('../controllers/execution');

router.post('/', controller.createWorkflow);
router.get('/', controller.getWorkflows);
router.get('/:id', controller.getWorkflow);
router.put('/:id', controller.updateWorkflow);
router.delete('/:id', controller.deleteWorkflow);

router.post('/:id/execute', executionController.startExecution);

module.exports = router;
