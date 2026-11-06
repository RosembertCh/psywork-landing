/* Secuencia de seguimiento de la guía gratuita.
   dia:   días desde el registro (el 0 sale al momento).
   venta: si es true, no se envía a quien ya compró el kit en Hotmart.
   Bloques del cuerpo: texto → párrafo · { lista: [...] } · { boton: [texto, destino] }
   Destinos: guia, muestra, checkout. En los textos, {n} es el nombre del lead. */
export const secuencia = [
  {
    dia: 0, venta: false,
    asunto: ['{n}, aquí tienes tus 5 worksheets', 'Aquí tienes tus 5 worksheets'],
    cuerpo: [
      'Gracias por descargar la guía. Te la dejo aquí también, por si la quieres abrir en otro dispositivo:',
      { boton: ['Descargar las 5 worksheets', 'guia'] },
      'Un consejo para empezar: no intentes usar las cinco a la vez. Elige una para tu próxima sesión (el registro de pensamientos suele ser la más fácil de introducir) y entrégala impresa o compártela en pantalla.',
      'Mañana te cuento cómo sacarle más partido en consulta.',
      'Si tienes cualquier duda, responde a este email.',
    ],
  },
  {
    dia: 1, venta: false,
    asunto: ['Cómo introducir el registro de pensamientos sin que suene a deberes'],
    cuerpo: [
      'El registro de pensamientos es de las fichas más útiles de la TCC y también de las que más se abandonan entre sesiones. Tres cosas que ayudan:',
      { lista: [
        '<strong>Rellena la primera fila en sesión</strong>, con una situación reciente del propio paciente. Así ve que no es un examen.',
        '<strong>Pide pocas entradas.</strong> Dos o tres situaciones en la semana bastan: mejor poco y real que mucho y forzado.',
        '<strong>Empieza la siguiente sesión revisándolo.</strong> Si no lo miras, el mensaje que recibe es que no importa.',
      ] },
      'Cuando ya identifique sus pensamientos con soltura, pasa a la hoja de distorsiones cognitivas, que también está en tu guía.',
      { boton: ['Abrir la guía', 'guia'] },
    ],
  },
  {
    dia: 3, venta: false,
    asunto: ['Una ficha real del kit completo, gratis para ti'],
    cuerpo: [
      'Las 5 worksheets que descargaste salen de un kit más grande que hemos preparado para consulta: 36 cuadernos clínicos y más de 900 páginas organizadas por temática.',
      'Antes de hablarte de él prefiero que veas la calidad por ti mismo. Aquí tienes completo el cuaderno «Círculo de Control» (12 páginas), de la carpeta de ansiedad:',
      { boton: ['Descargar «Círculo de Control»', 'muestra'] },
      'Pruébalo con un paciente esta semana. Funciona muy bien cuando alguien llega desbordado por cosas que no dependen de él.',
    ],
  },
  {
    dia: 5, venta: true,
    asunto: ['Lo que hay dentro del Kit Terapéutico PsyWork'],
    cuerpo: [
      'Si las worksheets te han resultado útiles, el kit completo es lo mismo a lo grande: 9 carpetas por temática para llegar a cada sesión con el material preparado.',
      { lista: [
        '<strong>Evaluación:</strong> escalas y registros para abrir el caso y seguir su evolución.',
        '<strong>TCC:</strong> registro de pensamientos y hojas de distorsiones cognitivas.',
        '<strong>Ansiedad:</strong> libro de actividades y tarjetas.',
        '<strong>Paquete de terapia:</strong> autoestima, crítico interno, límites, depresión, ACT y autocuidado.',
        '<strong>Trauma:</strong> tarjetas de TEPT, plan de seguridad, ventana de tolerancia.',
        '<strong>TDAH y regulación:</strong> planeador de más de 180 páginas y cuaderno de regulación del sistema nervioso.',
        '<strong>Bonos:</strong> TDAH en adultos y TDAH en niños.',
      ] },
      'Formato A4 y tablet, licencia de uso clínico con todos tus pacientes y actualizaciones gratuitas.',
      'Pago único de 9,90 $ con garantía de 7 días: si no te convence, recuperas el 100 %.',
      { boton: ['Ver el kit completo', 'checkout'] },
    ],
  },
  {
    dia: 7, venta: true,
    asunto: ['{n}, una última nota sobre el kit', 'Una última nota sobre el kit'],
    cuerpo: [
      'Este es el último email de la serie, así que voy al grano.',
      'Si preparas tú el material de tus sesiones, seguramente se te van varias horas a la semana entre buscar, adaptar e imprimir fichas. El kit está pensado para recuperar ese tiempo: abres la carpeta del tema y eliges la ficha.',
      '9,90 $, pago único, con 7 días de garantía.',
      { boton: ['Quiero el kit', 'checkout'] },
      'Y si no es para ti, no pasa nada: las worksheets son tuyas y puedes seguir usándolas. Gracias por leerme.',
    ],
  },
];

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sinEtiquetas = s => s.replace(/<[^>]+>/g, '');

export function plantilla(paso, lead, { site, checkout, firma, baja }) {
  const pila = (lead.nombre || '').split(/\s+/)[0];
  const n = pila ? pila[0].toUpperCase() + pila.slice(1) : '';
  const destinos = { guia: `${site}/descargas/5-worksheets.pdf`, muestra: `${site}/descargas/ficha-muestra.pdf`, checkout };
  const asunto = (n ? paso.asunto[0] : paso.asunto.at(-1)).replace('{n}', n);
  const saludo = n ? `Hola, ${esc(n)}:` : 'Hola:';

  const p = 'margin:0 0 16px;font-size:16px;line-height:1.6;color:#242426';
  const html = [`<p style="${p}">${saludo}</p>`];
  const texto = [n ? `Hola, ${n}:` : 'Hola:'];
  for (const b of paso.cuerpo) {
    if (typeof b === 'string') { html.push(`<p style="${p}">${b}</p>`); texto.push(sinEtiquetas(b)); }
    else if (b.lista) {
      html.push(`<ul style="margin:0 0 16px;padding-left:20px">${b.lista.map(li => `<li style="${p};margin-bottom:8px">${li}</li>`).join('')}</ul>`);
      texto.push(b.lista.map(li => `- ${sinEtiquetas(li)}`).join('\n'));
    } else if (b.boton) {
      const [label, destino] = b.boton, href = destinos[destino];
      html.push(`<p style="margin:8px 0 24px"><a href="${esc(href)}" style="display:inline-block;background:#35363b;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 22px;border-radius:999px">${label} <span style="color:#d9ff5c">→</span></a></p>`);
      texto.push(`${label}: ${href}`);
    }
  }
  html.push(`<p style="${p}">Un abrazo,<br>${esc(firma)}</p>`);
  texto.push(`Un abrazo,\n${firma}`);

  const pie = 'Recibes este email porque descargaste la guía gratuita de PsyWork. PsyWork · Madrid (España).';
  return {
    asunto,
    html: `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:#ebeff5">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:Inter,-apple-system,'Segoe UI',Roboto,Arial,sans-serif">
<div style="background:#ffffff;border-radius:20px;padding:32px 28px">${html.join('\n')}</div>
<p style="font-size:12px;line-height:1.5;color:#6b6e76;text-align:center;margin:16px 8px">${pie}<br><a href="${esc(baja)}" style="color:#6b6e76">Darme de baja</a></p>
</div></body></html>`,
    texto: `${texto.join('\n\n')}\n\n--\n${pie}\nDarme de baja: ${baja}`,
  };
}
