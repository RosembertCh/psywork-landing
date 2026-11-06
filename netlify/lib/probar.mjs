/* Comprobaciones de la lógica del agente sin enviar nada: npm test [carpeta-para-vistas-previas] */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

process.env.UNSUB_SECRET ||= 'secreto-de-prueba';
const { nuevoLead, siguientePaso, urlBaja } = await import('./agente.mjs');
const { secuencia, plantilla } = await import('./secuencia.mjs');

const H = 3600e3, D = 24 * H;
const t0 = new Date('2026-10-14T10:00:00Z');
const en = ms => new Date(t0.getTime() + ms);
const lead = nuevoLead({ email: 'ana@ejemplo.com', nombre: 'ana maría', origen: 'utm_source=meta' }, t0);
const marcar = (l, i, cuando) => { l.enviados[i] = cuando.toISOString(); };

// Email 0 al momento; luego nada hasta el día 1.
assert.equal(siguientePaso(lead, t0), 0);
marcar(lead, 0, t0);
assert.equal(siguientePaso(lead, en(23 * H)), null);
assert.equal(siguientePaso(lead, en(D)), 1);
marcar(lead, 1, en(D));
assert.equal(siguientePaso(lead, en(2 * D)), null);
assert.equal(siguientePaso(lead, en(3 * D)), 2);

// Si la función estuvo caída y se acumulan pasos, salen de uno en uno con 20 h de separación.
const atrasado = structuredClone(lead);
marcar(atrasado, 2, en(10 * D));
assert.equal(siguientePaso(atrasado, en(10 * D + H)), null);
assert.equal(siguientePaso(atrasado, en(10 * D + 20 * H)), 3);

// Quien compra no recibe emails de venta: la secuencia termina tras el día 3.
const comprador = structuredClone(lead);
marcar(comprador, 2, en(3 * D));
comprador.comprador = true;
assert.equal(siguientePaso(comprador, en(30 * D)), null);

// Quien se da de baja no recibe nada más.
const baja = structuredClone(lead);
baja.baja = true;
assert.equal(siguientePaso(baja, en(3 * D)), null);

// Secuencia completa: nada más que enviar.
const fin = structuredClone(lead);
secuencia.forEach((_, i) => marcar(fin, i, en(i * D)));
assert.equal(siguientePaso(fin, en(60 * D)), null);

// Plantillas: nombre capitalizado, HTML escapado, enlaces correctos.
const ctx = { site: 'https://psywork.example', checkout: 'https://pay.hotmart.com/X', firma: 'Rosembert', baja: urlBaja(lead.email) };
const e0 = plantilla(secuencia[0], lead, ctx);
assert.equal(e0.asunto, 'Ana, aquí tienes tus 5 worksheets');
assert.match(e0.html, /https:\/\/psywork\.example\/descargas\/5-worksheets\.pdf/);
assert.match(e0.texto, /Darme de baja: http/);
const sinNombre = plantilla(secuencia[4], { ...lead, nombre: '' }, ctx);
assert.equal(sinNombre.asunto, 'Una última nota sobre el kit');
const raro = plantilla(secuencia[0], { ...lead, nombre: '<script>' }, ctx);
assert.doesNotMatch(raro.html, /<script>/);
assert.match(plantilla(secuencia[3], lead, ctx).html, /pay\.hotmart\.com\/X/);

console.log('✔ Todas las comprobaciones pasan');

const dir = process.argv[2];
if (dir) {
  mkdirSync(dir, { recursive: true });
  secuencia.forEach((paso, i) => {
    const { asunto, html } = plantilla(paso, lead, ctx);
    writeFileSync(join(dir, `email-${i}-dia-${paso.dia}.html`), html.replace('<body', `<title>${asunto}</title><body`));
  });
  console.log(`Vistas previas en ${dir}`);
}
