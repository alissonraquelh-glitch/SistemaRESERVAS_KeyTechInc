function createEntityController(Model, { inputFields, requiredFields = [] }) {
  return {
    async list(req, res, next) {
      try {
        const limit = req.query.limit === undefined ? 100 : Number(req.query.limit);
        const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
        if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
          return res.status(400).json({ message: 'limit debe estar entre 1 y 100 y offset debe ser un entero no negativo.' });
        }

        const data = await Model.findAll({ limit, offset });
        return res.json({ data, pagination: { limit, offset } });
      } catch (error) {
        return next(error);
      }
    },

    async getById(req, res, next) {
      try {
        const data = await Model.findById(req.params.id);
        if (!data) {
          return res.status(404).json({ message: 'No se encontró el registro solicitado.' });
        }
        return res.json({ data });
      } catch (error) {
        return next(error);
      }
    },

    async create(req, res, next) {
      try {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
          return res.status(400).json({ message: 'El cuerpo de la solicitud debe ser un objeto JSON.' });
        }

        const unknownFields = Object.keys(req.body).filter((field) => !inputFields.includes(field));
        if (unknownFields.length) {
          return res.status(400).json({
            message: 'La solicitud contiene campos no permitidos.',
            fields: unknownFields,
          });
        }

        const missingFields = requiredFields.filter((field) => {
          const value = req.body[field];
          return value === undefined || value === null || value === '';
        });
        if (missingFields.length) {
          return res.status(400).json({
            message: 'Faltan campos obligatorios.',
            fields: missingFields,
          });
        }

        const data = await Model.create(req.body);
        return res.status(201).json({ data });
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = createEntityController;