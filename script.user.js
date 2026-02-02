// ==UserScript==
// @name         Prueba OdooRCP para TamperMonkey
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @author       Jesús Lorenzo
// @grant        GM_xmlhttpRequest
// @connect      *
// @require      https://github.com/Zarritas/tampermonkey-odoo-rpc/raw/refs/heads/main/OdooRPC.js
// ==/UserScript==

(function () {
  "use strict";
  let odooRPC = null
  const odooRPC = new OdooRPC(
    "https://odoo.factorlibre.com",
    "factorlibre_db",
    {
      lang: CONFIG.LANG,
      tz: CONFIG.TIMEZONE,
    }
  );
  odooRPC.authenticate();
  console.log("Correcto")
})();
