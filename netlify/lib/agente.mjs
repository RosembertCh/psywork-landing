/* Núcleo del agente: decide qué email toca a cada lead y lo envía con Resend. */
import { createHmac } from 'node:crypto';
import { cfg } from './config.mjs';
import { secuencia, plantilla } from './secuencia.mjs';

const HORA = 3600e3;
const SEPARACION_MIN = 20 * HORA; // nunca dos emails de la secuencia con menos de 20 h entre sí

export function nuevoLead({ email, nombre, origen }, ahora = new Date()) {
  return { email, nombre: (nombre || '').trim(), origen: origen || '', alta: ahora.toISOString(), enviados: {}, baja: false, comprador: false };
}

/* Índice del siguiente email que toca enviar ahora, o null si no toca nada. */
export function siguientePaso(lead, ahora = new Date()) {
  if (lead.baja) return null;
  const alta = Date.parse(lead.alta);
  const ultimo = Math.max(0, ...Object.values(lead.enviados).map(Date.parse));
  for (const [i, paso] of secuencia.entries()) {
    if (lead.enviados[i]) continue;
    if (paso.venta && lead.comprador) continue;
    if (ahora - alta < paso.dia * 24 * HORA) return null;
    if (ultimo && ahora - ultimo < SEPARACION_MIN) return null;
    return i;
  }
  return null;
}

export const token = email => createHmac('sha256', cfg.secreto()).update(email).digest('base64url').slice(0, 32);
export const urlBaja = email => `${cfg.site()}/api/baja?e=${encodeURIComponent(email)}&t=${token(email)}`;

async function enviar(lead, i) {
  const { asunto, html, texto } = plantilla(secuencia[i], lead, { site: cfg.site(), checkout: cfg.checkout(), firma: cfg.firma(), baja: urlBaja(lead.email) });
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.resendKey()}`, 'Content-Type': 'application/json', 'Idempotency-Key': `${lead.email}-${i}` },
    body: JSON.stringify({
      from: cfg.from(), to: [lead.email], reply_to: cfg.replyTo(), subject: asunto, html, text: texto,
      headers: { 'List-Unsubscribe': `<${urlBaja(lead.email)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      tags: [{ name: 'paso', value: String(i) }],
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

/* Envía el email que toque (si toca) y lo registra. Devuelve el índice enviado o null. */
export async function atender(lead, guardar, ahora = new Date()) {
  const i = siguientePaso(lead, ahora);
  if (i === null) return null;
  await enviar(lead, i);
  lead.enviados[i] = ahora.toISOString();
  await guardar(lead);
  return i;
}
