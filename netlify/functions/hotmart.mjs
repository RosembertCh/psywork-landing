/* Webhook de Hotmart: cuando un lead compra el kit deja de recibir los emails de venta. */
import { cfg } from '../lib/config.mjs';
import { actualizar, normalizar } from '../lib/leads.mjs';

const COMPRA = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'];

export default async req => {
  if (!cfg.hottok() || req.headers.get('x-hotmart-hottok') !== cfg.hottok()) return new Response('no autorizado', { status: 401 });
  const { event, data } = await req.json();
  if (COMPRA.includes(event)) await actualizar(normalizar(data?.buyer?.email), { comprador: true, fechaCompra: new Date().toISOString() });
  return new Response('ok');
};

export const config = { path: '/api/hotmart' };
