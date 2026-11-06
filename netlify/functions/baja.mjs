/* Enlace de baja de los emails (GET desde el enlace, POST desde el botón "Cancelar suscripción" de Gmail). */
import { timingSafeEqual } from 'node:crypto';
import { actualizar, normalizar } from '../lib/leads.mjs';
import { token } from '../lib/agente.mjs';

const pagina = msg => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PsyWork</title>
<body style="font:16px/1.6 Inter,system-ui,sans-serif;background:#eef1f4;color:#1d2125;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px">
<p style="background:#fff;border-radius:20px;padding:32px;max-width:420px;text-align:center">${msg}</p>`,
  { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

export default async req => {
  const url = new URL(req.url);
  const email = normalizar(url.searchParams.get('e'));
  const t = url.searchParams.get('t') || '';
  const valido = email && t.length === 32 && timingSafeEqual(Buffer.from(t), Buffer.from(token(email)));
  if (!valido) return pagina('Este enlace de baja no es válido.');
  await actualizar(email, { baja: true, fechaBaja: new Date().toISOString() });
  return pagina('Listo. No recibirás más emails de PsyWork.');
};

export const config = { path: '/api/baja' };
