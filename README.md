# Coin Challenge

## Funcionalidades principales

- **Conexión por socket:** Los usuarios pueden conectarse y obtener información sobre las monedas disponibles en una habitación específica.
- **Agarre de monedas:** Los usuarios pueden solicitar agarrar una moneda en particular, eliminándola de las monedas disponibles en esa habitación.
- **Notificaciones en tiempo real:** Cuando una moneda es agarrada, se notifica a todos los clientes conectados sobre la moneda tomada.

## Tecnologías utilizadas

- Node.js
- Express
- Socket.io
- Redis
- Docker

## Configuración del entorno de desarrollo

### Requisitos previos

Tener instalado Docker

### Ejecución local

Si prefieres ejecutarlo localmente sin Docker:

1. Asegúrate de tener Redis instalado y funcionando en tu máquina.
2. Ejecuta `npm start` para iniciar el servidor.

## API Endpoints

### Obtener cantidad de monedas en una habitación

- **GET `/coins/:room`**: Obtiene la cantidad de monedas disponibles en una habitación específica.

### Listar habitaciones disponibles

- **GET `/rooms`**: Obtiene la lista de habitaciones disponibles.
