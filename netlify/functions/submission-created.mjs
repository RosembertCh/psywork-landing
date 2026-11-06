/* Se ejecuta sola cada vez que Netlify Forms recibe un envío válido (no spam).
   Da de alta al lead y le manda el primer email al momento. */
import { cfg } from '../lib/config.mjs';
import { leer, guardar, normalizar } from '../lib/leads.mjs';
import { nuevoLead, atender } from '../lib/agente.mjs';

export default async req => {
  const { payload } = await req.json();
  const data = payload?.data || {};
  if (payload?.form_name !== cfg.formulario || data.web) return new Response('ignorado');

  const email = normalizar(data.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return new Response('email no válido');

  // Si ya estaba registrado no reiniciamos su secuencia (ni la reactivamos si se dio de baja).
  const lead = (await leer(email)) || nuevoLead({ email, nombre: data.name, origen: data.origen });
  await guardar(lead);
  await atender(lead, guardar);
  return new Response('ok');
};
