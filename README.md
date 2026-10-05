# ticket-hub

## Variables de entorno

La app requiere las siguientes variables de entorno para funcionar
(validadas con `requireEnv` en tiempo de ejecución; si falta alguna, la ruta
que la necesita falla al arrancar):

- `IAM_API_URL`
- `TICKET_HUB_APPLICATION_NAME`
- `TICKET_HUB_TARGET_APPLICATION_NAME`
- `TICKET_HUB_API_URL`

## Cómo obtener cada una

### `IAM_API_URL`

URL desde la que este frontend puede alcanzar a `iam-api` (Service dentro
del cluster, o su URL pública si corre fuera). Se usa para el login.

### `TICKET_HUB_APPLICATION_NAME`

Nombre de esta aplicación (origen) tal como está registrada en `iam-api`:
"ticket-hub". Se envía como `x-application-name` al hacer login.

### `TICKET_HUB_TARGET_APPLICATION_NAME`

Debe ser exactamente el mismo valor configurado como
`TICKET_HUB_API_APPLICATION_NAME` en `ticket-hub-api`. Se envía como
`x-target-application` al hacer login, para pedir un token emitido para esa
aplicación (destino).

### `TICKET_HUB_API_URL`

URL desde la que este frontend puede alcanzar a `ticket-hub-api` (Service
dentro del cluster, o su URL pública si corre fuera).
