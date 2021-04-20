// ==UserScript==
// @name         otlite translator help
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  add translator support for otlite, visit https://github.com/ddrpa/otlite for details.
// @author       ddrpa
// @match        https://ddrpa.github.io/otlite/
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  "use strict";

  const _ACCESS_TOKEN = "Get an access token from https://niutrans.com/Price and put here";

  const QPS = 3;
  const VERSION = 1.0;

  function _translate(source) {
    return new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "POST",
        url: "https://free.niutrans.com/NiuTransServer/translation",
        data: JSON.stringify({ from: "en", to: "zh", apikey: _ACCESS_TOKEN, src_text: source }),
        headers: {
          "Content-Type": "application/json",
        },
        onload: function (response) {
          try {
            const { tgt_text, to, from } = JSON.parse(response.responseText);
            if (null !== tgt_text && undefined !== tgt_text && tgt_text.length > 0) {
              return resolve(tgt_text);
            } else {
              return reject(new Error(response.responseText));
            }
          } catch (e) {
            return reject(e);
          }
        },
        onerror: reject,
      });
    });
  }

  const insertTask = (source) => {
    return _translate(source);
  };

  unsafeWindow.translatorHelper = { insertTask: insertTask, version: VERSION };
})();
