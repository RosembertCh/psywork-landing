/* Descarga de los leads en CSV para revisar el seguimiento: /api/leads?key=TU_ADMIN_KEY */
import { cfg } from '../lib/config.mjs';
import { todos } from '../lib/leads.mjs';
import { secuencia } from '../lib/secuencia.mjs';

const celda = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default async req => {
  const key = new URL(req.url).searchParams.get('key');
  if (!cfg.adminKey() || key !== cfg.adminKey()) return new Response('no autorizado', { status: 401 });
  const leads = (await todos()).sort((a, b) => a.alta.localeCompare(b.alta));
  const cab = ['email', 'nombre', 'origen', 'alta', 'emails_enviados', 'ultimo_email', 'comprador', 'baja'];
  const filas = leads.map(l => {
    const fechas = Object.values(l.enviados).sort();
    return [l.email, l.nombre, l.origen, l.alta, `${fechas.length}/${secuencia.length}`, fechas.at(-1), l.comprador ? 'sí' : 'no', l.baja ? 'sí' : 'no'];
  });
  const csv = '﻿' + [cab, ...filas].map(f => f.map(celda).join(';')).join('\r\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="leads.csv"' } });
};

export const config = { path: '/api/leads' };
