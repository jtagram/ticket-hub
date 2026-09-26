# ticket-hub

## Variables de entorno

La app requiere las siguientes variables de entorno para funcionar
(validadas con `requireEnv` en tiempo de ejecución; si falta alguna, la ruta
que la necesita falla al arrancar):

- `IAM_API_URL`
- `TICKET_HUB_APPLICATION_NAME`
- `TICKET_HUB_API_URL`

## Cómo obtener cada una

### `IAM_API_URL`

URL desde la que este frontend puede alcanzar a `iam-api` (Service dentro
del cluster, o su URL pública si corre fuera). Se usa para el login.

### `TICKET_HUB_APPLICATION_NAME`

Debe ser exactamente el mismo valor configurado como
`TICKET_HUB_APPLICATION_NAME` en `ticket-hub-api`. Se usa al hacer login
para pedir un token emitido para la aplicación "ticket-hub".

### `TICKET_HUB_API_URL`

URL desde la que este frontend puede alcanzar a `ticket-hub-api` (Service
dentro del cluster, o su URL pública si corre fuera).
