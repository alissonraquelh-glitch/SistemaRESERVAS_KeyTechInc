const express = require('express');
const Cliente = require('../models/Cliente');
const createEntityController = require('../controllers/demoController');

const router = express.Router();
const controller = createEntityController(Cliente, {
	inputFields: Cliente.createFields,
	requiredFields: ['nombre_completo', 'telefono', 'documento_identidad'],
});

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);

module.exports = router;
