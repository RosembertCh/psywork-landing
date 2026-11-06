/* Cada hora repasa todos los leads y envía el siguiente email de la secuencia a quien le toque. */
import { todos, guardar } from '../lib/leads.mjs';
import { atender } from '../lib/agente.mjs';

export default async () => {
  const leads = await todos();
  let enviados = 0, errores = 0;
  for (const lead of leads) {
    try { if ((await atender(lead, guardar)) !== null) enviados++; }
    catch (e) { errores++; console.error(lead.email, e.message); }
  }
  console.log(`Seguimiento: ${leads.length} leads, ${enviados} emails enviados, ${errores} errores`);
};

export const config = { schedule: '@hourly' };
