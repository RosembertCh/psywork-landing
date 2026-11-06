/* Agente de leads de PsyWork para Google Apps Script.
   - Guarda cada lead de la guía gratuita en la hoja "Leads".
   - Le envía la guía al momento y te avisa a ti por email.
   - Cada hora envía el siguiente email de la secuencia a quien le toque.
   - Deja de escribir a quien se dé de baja, y no manda emails de venta a quien
     marques como comprador (columna "Comprador" = SI).
   Puesta en marcha: ver README.md de esta carpeta. */

const CONFIG = {
  // Dirección pública de la web, sin barra final (GitHub Pages).
  SITE: 'https://USUARIO.github.io/REPOSITORIO',
  CHECKOUT: 'https://pay.hotmart.com/Y106895319B?checkoutMode=10',
  REMITENTE: 'PsyWork',
  FIRMA: 'El equipo de PsyWork',
  // A quién avisar de cada lead nuevo. Vacío = la cuenta dueña del script.
  AVISAR_A: '',
  HOJA: 'Leads',
};

/* Secuencia de seguimiento.
   dia:   días desde el registro (el 0 sale al momento).
   venta: si es true, no se envía a quien esté marcado como comprador.
   Bloques: texto → párrafo · { lista: [...] } · { boton: [texto, destino] }
   Destinos: guia, muestra, checkout. {n} es el nombre del lead. */
const SECUENCIA = [
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

const COLS = ['Alta', 'Nombre', 'Email', 'Origen', 'Enviados', 'Baja', 'Comprador'];
const HORA = 3600e3;
const SEPARACION_MIN = 20 * HORA; // nunca dos emails de la secuencia con menos de 20 h entre sí

/* ── Ejecuta esto una vez desde el editor (botón ▶ con "instalar" seleccionado) ── */
function instalar() {
  hoja_();
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SECRETO')) props.setProperty('SECRETO', Utilities.getUuid() + Utilities.getUuid());
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'seguimiento').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('seguimiento').timeBased().everyHours(1).create();
  Logger.log('Listo. Hoja "%s" preparada y seguimiento programado cada hora.', CONFIG.HOJA);
}

/* ── El formulario de la web envía aquí nombre y email ── */
function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.web) return json_({ ok: true }); // trampa para bots
  const email = String(p.email || '').trim().toLowerCase();
  const nombre = String(p.name || '').trim().slice(0, 100);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json_({ ok: false, error: 'email' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = hoja_();
    if (fila_(sh, email)) return json_({ ok: true, repetido: true });
    const lead = { alta: new Date(), nombre, email, origen: String(p.origen || '').slice(0, 300), enviados: {}, baja: '', comprador: '' };
    sh.appendRow([lead.alta, lead.nombre, lead.email, lead.origen, '{}', '', '']);
    enviarPaso_(lead, 0);
    guardar_(sh, sh.getLastRow(), lead);
    avisar_(lead);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

/* ── Enlace de baja de los emails ── */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.accion !== 'baja') return HtmlService.createHtmlOutput('PsyWork');
  const email = String(p.e || '').toLowerCase();
  const ok = email && p.t === token_(email);
  if (ok) {
    const sh = hoja_(), fila = fila_(sh, email);
    if (fila) sh.getRange(fila, COLS.indexOf('Baja') + 1).setValue('SI');
  }
  return HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;max-width:480px;margin:64px auto;padding:0 16px;color:#242426">' +
    (ok ? '<h2>Te has dado de baja</h2><p>No volverás a recibir emails de PsyWork.</p>'
        : '<h2>Enlace no válido</h2><p>Escríbenos respondiendo a cualquiera de nuestros emails y te damos de baja.</p>') +
    '</div>').setTitle('PsyWork');
}

/* ── Se ejecuta cada hora: envía el siguiente email a quien le toque ── */
function seguimiento() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const sh = hoja_();
    const datos = sh.getDataRange().getValues();
    const ahora = new Date();
    for (let r = 1; r < datos.length; r++) {
      const lead = leer_(datos[r]);
      const i = siguientePaso_(lead, ahora);
      if (i === null) continue;
      if (MailApp.getRemainingDailyQuota() < 2) { Logger.log('Cuota diaria de Gmail agotada; sigo en la próxima hora.'); break; }
      try {
        enviarPaso_(lead, i, ahora);
        guardar_(sh, r + 1, lead);
      } catch (err) {
        Logger.log('Error con %s: %s', lead.email, err);
      }
    }
  } finally {
    lock.releaseLock();
  }
}

function siguientePaso_(lead, ahora) {
  if (lead.baja || !lead.email) return null;
  const alta = new Date(lead.alta).getTime();
  const fechas = Object.keys(lead.enviados).map(k => new Date(lead.enviados[k]).getTime());
  const ultimo = fechas.length ? Math.max.apply(null, fechas) : 0;
  for (let i = 0; i < SECUENCIA.length; i++) {
    const paso = SECUENCIA[i];
    if (lead.enviados[i]) continue;
    if (paso.venta && lead.comprador) continue;
    if (ahora - alta < paso.dia * 24 * HORA) return null;
    if (ultimo && ahora - ultimo < SEPARACION_MIN) return null;
    return i;
  }
  return null;
}

function enviarPaso_(lead, i, ahora) {
  const m = plantilla_(SECUENCIA[i], lead);
  MailApp.sendEmail({ to: lead.email, subject: m.asunto, htmlBody: m.html, body: m.texto, name: CONFIG.REMITENTE });
  lead.enviados[i] = (ahora || new Date()).toISOString();
}

function avisar_(lead) {
  const a = CONFIG.AVISAR_A || Session.getEffectiveUser().getEmail();
  const url = SpreadsheetApp.getActive().getUrl();
  MailApp.sendEmail({
    to: a, name: 'PsyWork', subject: 'Nuevo lead: ' + (lead.nombre || lead.email),
    body: 'Nuevo lead de la guía gratuita.\n\nNombre: ' + lead.nombre + '\nEmail: ' + lead.email +
          '\nOrigen: ' + (lead.origen || '(directo)') + '\n\nYa le hemos enviado la guía. Hoja de leads: ' + url,
  });
}

function plantilla_(paso, lead) {
  const pila = (lead.nombre || '').split(/\s+/)[0];
  const n = pila ? pila[0].toUpperCase() + pila.slice(1) : '';
  const destinos = { guia: CONFIG.SITE + '/descargas/5-worksheets.pdf', muestra: CONFIG.SITE + '/descargas/ficha-muestra.pdf', checkout: CONFIG.CHECKOUT };
  const asunto = (n ? paso.asunto[0] : paso.asunto[paso.asunto.length - 1]).replace('{n}', n);
  const baja = ScriptApp.getService().getUrl() + '?accion=baja&e=' + encodeURIComponent(lead.email) + '&t=' + token_(lead.email);
  const p = 'margin:0 0 16px;font-size:16px;line-height:1.6;color:#242426';
  const html = ['<p style="' + p + '">' + (n ? 'Hola, ' + esc_(n) + ':' : 'Hola:') + '</p>'];
  const texto = [n ? 'Hola, ' + n + ':' : 'Hola:'];
  paso.cuerpo.forEach(b => {
    if (typeof b === 'string') { html.push('<p style="' + p + '">' + b + '</p>'); texto.push(sinEtiquetas_(b)); }
    else if (b.lista) {
      html.push('<ul style="margin:0 0 16px;padding-left:20px">' + b.lista.map(li => '<li style="' + p + ';margin-bottom:8px">' + li + '</li>').join('') + '</ul>');
      texto.push(b.lista.map(li => '- ' + sinEtiquetas_(li)).join('\n'));
    } else if (b.boton) {
      const href = destinos[b.boton[1]];
      html.push('<p style="margin:8px 0 24px"><a href="' + esc_(href) + '" style="display:inline-block;background:#35363b;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 22px;border-radius:999px">' + b.boton[0] + ' <span style="color:#d9ff5c">→</span></a></p>');
      texto.push(b.boton[0] + ': ' + href);
    }
  });
  html.push('<p style="' + p + '">Un abrazo,<br>' + esc_(CONFIG.FIRMA) + '</p>');
  texto.push('Un abrazo,\n' + CONFIG.FIRMA);
  const pie = 'Recibes este email porque descargaste la guía gratuita de PsyWork.';
  return {
    asunto: asunto,
    html: '<div style="background:#ebeff5;padding:24px 16px"><div style="max-width:560px;margin:0 auto;font-family:Inter,-apple-system,\'Segoe UI\',Roboto,Arial,sans-serif">' +
          '<div style="background:#ffffff;border-radius:20px;padding:32px 28px">' + html.join('\n') + '</div>' +
          '<p style="font-size:12px;line-height:1.5;color:#6b6e76;text-align:center;margin:16px 8px">' + pie + '<br><a href="' + esc_(baja) + '" style="color:#6b6e76">Darme de baja</a></p></div></div>',
    texto: texto.join('\n\n') + '\n\n--\n' + pie + '\nDarme de baja: ' + baja,
  };
}

/* ── Utilidades de la hoja ── */
function hoja_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CONFIG.HOJA);
  if (!sh) sh = ss.insertSheet(CONFIG.HOJA);
  if (sh.getLastRow() === 0) { sh.appendRow(COLS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, COLS.length).setFontWeight('bold'); }
  return sh;
}
function fila_(sh, email) {
  const col = sh.getRange(1, COLS.indexOf('Email') + 1, Math.max(sh.getLastRow(), 1)).getValues();
  for (let r = 1; r < col.length; r++) if (String(col[r][0]).toLowerCase() === email) return r + 1;
  return 0;
}
function leer_(row) {
  let enviados = {};
  try { enviados = JSON.parse(row[4] || '{}'); } catch (err) { enviados = {}; }
  const si = v => /^(si|sí|x|true|1)$/i.test(String(v).trim());
  return { alta: row[0], nombre: row[1], email: String(row[2]).trim().toLowerCase(), origen: row[3], enviados: enviados, baja: si(row[5]), comprador: si(row[6]) };
}
function guardar_(sh, fila, lead) {
  sh.getRange(fila, COLS.indexOf('Enviados') + 1).setValue(JSON.stringify(lead.enviados));
}
function token_(email) {
  const sig = Utilities.computeHmacSha256Signature(email, PropertiesService.getScriptProperties().getProperty('SECRETO'));
  return Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '').slice(0, 32);
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function esc_(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function sinEtiquetas_(s) { return s.replace(/<[^>]+>/g, ''); }
