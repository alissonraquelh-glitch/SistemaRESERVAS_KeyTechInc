const express = require('express');
const Vehiculo = require('../models/Vehiculo');
const createEntityController = require('../controllers/demoController');

const router = express.Router();
const controller = createEntityController(Vehiculo, {
  inputFields: Vehiculo.createFields,
  requiredFields: ['placa', 'id_cliente'],
});

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);

module.exports = router;