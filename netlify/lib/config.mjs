/* Configuración del agente de seguimiento.
   Todo se define como variables de entorno en Netlify (Site configuration → Environment variables). */
const env = (k, d = '') => (globalThis.Netlify?.env?.get(k) ?? process.env[k] ?? d);

export const cfg = {
  resendKey: () => env('RESEND_API_KEY'),
  // Remitente: debe ser de un dominio verificado en Resend. Ej.: "Rosembert · PsyWork <hola@tudominio.com>"
  from: () => env('EMAIL_FROM', 'PsyWork <onboarding@resend.dev>'),
  replyTo: () => env('EMAIL_REPLY_TO', 'rosembertcoach@gmail.com'),
  firma: () => env('EMAIL_FIRMA', 'El equipo de PsyWork'),
  // Netlify define URL automáticamente con el dominio principal del sitio.
  site: () => env('SITE_URL') || env('URL', 'http://localhost:8888'),
  checkout: () => env('CHECKOUT_URL', 'https://pay.hotmart.com/Y106895319B?checkoutMode=10'),
  secreto: () => env('UNSUB_SECRET'),       // cualquier texto largo y aleatorio
  hottok: () => env('HOTMART_HOTTOK'),      // Hotmart → Herramientas → Webhook
  adminKey: () => env('ADMIN_KEY'),         // para descargar /api/leads
  formulario: 'guia-gratis',
};
