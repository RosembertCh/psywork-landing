# Agente de seguimiento de leads

Cada vez que alguien descarga la guía gratuita (formulario `guia-gratis`), el agente:

1. **Lo da de alta** y le envía el email 1 al momento (función `submission-created`).
2. **Cada hora** revisa todos los leads y envía el siguiente email al que le toque (función `seguimiento`).
3. **Deja de enviar emails de venta** si compra el kit en Hotmart (webhook `/api/hotmart`).
4. **No vuelve a escribir** a quien se dé de baja (`/api/baja`, también el botón "Cancelar suscripción" de Gmail).

| Día | Email | Tipo |
|----|-------|------|
| 0 | Aquí tienes tus 5 worksheets | entrega |
| 1 | Cómo introducir el registro de pensamientos | valor |
| 3 | Una ficha real del kit completo, gratis (Círculo de Control) | valor + muestra |
| 5 | Lo que hay dentro del Kit Terapéutico PsyWork | venta |
| 7 | Una última nota sobre el kit | venta |

Los textos están en `netlify/lib/secuencia.mjs`: puedes cambiar los textos, los días o añadir emails.

## Puesta en marcha (una sola vez)

### 1. Resend
1. Crea una cuenta en https://resend.com y verifica tu dominio en **Domains** (añade los registros DNS que te indica).
2. En **API Keys**, crea una clave con permiso *Sending access*.

> Sin un dominio verificado, Resend solo deja enviar emails a tu propia dirección.

### 2. Variables de entorno en Netlify
En *Site configuration → Environment variables*:

| Variable | Valor |
|----------|-------|
| `RESEND_API_KEY` | la clave de Resend (`re_...`) |
| `EMAIL_FROM` | `Rosembert · PsyWork <hola@tudominio.com>` (de tu dominio verificado) |
| `EMAIL_FIRMA` | el nombre que aparece al final de cada email |
| `EMAIL_REPLY_TO` | a dónde llegan las respuestas (por defecto rosembertcoach@gmail.com) |
| `UNSUB_SECRET` | un texto largo y aleatorio (no lo cambies después: invalidaría los enlaces de baja ya enviados) |
| `ADMIN_KEY` | otra contraseña larga, para descargar la lista de leads |
| `HOTMART_HOTTOK` | el *hottok* de Hotmart (paso 4) |

### 3. Publicar con funciones
Las funciones **no se publican** si arrastras la carpeta a Netlify. Publica con la CLI desde esta carpeta:

```bash
npx netlify-cli deploy --prod
```

(La primera vez te pedirá iniciar sesión y vincular el sitio existente.)

### 4. Webhook de Hotmart (opcional, recomendado)
Hotmart → *Herramientas → Webhook (API y notificaciones)* → nueva configuración:
- URL: `https://TU-SITIO/api/hotmart`
- Eventos: *Compra aprobada* y *Compra completa*
- Copia el **hottok** que te muestra en la variable `HOTMART_HOTTOK`.

## Ver cómo va
- Lista de leads en CSV (se abre en Excel): `https://TU-SITIO/api/leads?key=TU_ADMIN_KEY`
- Registros de envío: Netlify → *Logs → Functions → seguimiento*.
- Aperturas y clics: panel de Resend.

## Probar sin enviar nada
```bash
npm test
```
