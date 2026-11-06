/* Almacén de leads en Netlify Blobs: una entrada JSON por email. */
import { getStore } from '@netlify/blobs';

const store = () => getStore({ name: 'leads', consistency: 'strong' });
export const normalizar = email => String(email || '').trim().toLowerCase();
const clave = email => encodeURIComponent(normalizar(email));

export const leer = email => store().get(clave(email), { type: 'json' });
export const guardar = lead => store().setJSON(clave(lead.email), lead);

export async function todos() {
  const s = store(), { blobs } = await s.list();
  const leads = await Promise.all(blobs.map(b => s.get(b.key, { type: 'json' })));
  return leads.filter(Boolean);
}

export async function actualizar(email, cambios) {
  const lead = await leer(email);
  if (!lead) return null;
  Object.assign(lead, cambios);
  await guardar(lead);
  return lead;
}
