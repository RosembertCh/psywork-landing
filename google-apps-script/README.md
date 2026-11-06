# Formulario de la guía con Google Sheets + Gmail

`Codigo.gs` recibe los datos del formulario de la web y:

1. Guarda el lead en la hoja **Leads** (fecha, nombre, email, origen).
2. Le envía al momento la guía por email desde tu Gmail.
3. Te avisa a ti por email de cada lead nuevo.
4. Cada hora envía el siguiente email de la secuencia (días 1, 3, 5 y 7).
5. No vuelve a escribir a quien se dé de baja, y no manda los emails de venta (días 5 y 7) a quien marques con `SI` en la columna **Comprador**.

## Puesta en marcha (una sola vez)

1. Crea una hoja de cálculo nueva en Google Sheets (por ejemplo, "Leads PsyWork").
2. Menú **Extensiones → Apps Script**. Borra lo que haya y pega el contenido de `Codigo.gs`.
3. Arriba del todo, en `CONFIG.SITE`, pon la dirección de la web sin barra final, por ejemplo `https://usuario.github.io/psywork-landing`.
4. Guarda (icono del disquete). En el desplegable de funciones elige **instalar** y pulsa **Ejecutar**. Google te pedirá permisos: acepta (en "Google no ha verificado esta aplicación" pulsa *Configuración avanzada → Ir a…*; el script es tuyo).
5. **Implementar → Nueva implementación** → tipo **Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
   Pulsa **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
6. En `index.html` de la web, pon esa URL en `const LEAD_ENDPOINT = '';` y vuelve a subir la web.

Si más adelante cambias el código, usa **Implementar → Gestionar implementaciones → Editar → Nueva versión** para que la URL siga siendo la misma.

## Límites

- Gmail gratuito permite unos 100 emails al día desde scripts. Si se llega al límite, el seguimiento espera a la hora siguiente; la guía en pantalla se entrega siempre.
- Las compras no se marcan solas: cuando alguien compre, escribe `SI` en su columna **Comprador**.
