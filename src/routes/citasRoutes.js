const express = require('express');
const Cita = require('../models/Cita');
const createEntityController = require('../controllers/demoController');

const router = express.Router();
const controller = createEntityController(Cita, {
	inputFields: ['placa', 'inicio', 'fin', 'notas'],
	requiredFields: ['placa', 'inicio', 'fin'],
});

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);

module.exports = router;
