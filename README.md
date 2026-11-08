# Sistema de Reservas

## Backend

Instala las dependencias con `npm install` y configura las variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y, opcionalmente, `PORT`. Inicia el servidor con `npm start`; el endpoint `GET /health` comprueba la conexión a MySQL.

Los modelos de `src/models` ofrecen operaciones SQL parametrizadas para las entidades definidas en `db/DataBase(1).sql`. `Cliente` y `Empleado` coordinan sus escrituras en `usuario` mediante transacciones; `LogAuditoria` es de solo inserción.

### Endpoints de demo

Todos los recursos ofrecen `GET /api/{recurso}?limit=100&offset=0`, `GET /api/{recurso}/:id` y `POST /api/{recurso}`. Los recursos disponibles son `clientes`, `vehiculos` y `citas`. El `POST` responde con `201`; los errores de validación, duplicados y referencias inexistentes responden con `400` o `409`.

Ejemplo de alta de cliente:

```json
{
	"nombre_completo": "Ana Pérez",
	"telefono": "5551234567",
	"correo": "ana@example.com",
	"documento_identidad": "ID-12345"
}
```

La demo aún no incorpora autenticación ni validación de disponibilidad horaria para citas; no debe exponerse públicamente sin esas protecciones.

### Datos semilla

Aplica primero `db/DataBase(1).sql` y luego `db/seed.demo.sql` en una base local o de pruebas. El seed se puede volver a ejecutar: actualiza sus registros de demostración sin borrar otros datos. No lo ejecutes en producción.
