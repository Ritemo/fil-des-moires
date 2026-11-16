/* Le Fil des Moires : synchronisation de la sauvegarde entre appareils (via Google Apps Script). */
(function (racine) {
  'use strict';
  const lireConf = () => { try { return JSON.parse(localStorage.getItem('fdm_sync') || 'null'); } catch (e) { return null; } };
  const ecrireConf = c => { try { localStorage.setItem('fdm_sync', JSON.stringify(c)); } catch (e) { /* rien */ } };
  let etat = 'local'; // local | ok | envoi | horsligne | erreur
  let minuterie = null;
  let surEtat = () => {};

  function changer(e) { etat = e; surEtat(e); }

  // Récupère la sauvegarde distante. Renvoie le profil distant ou null.
  async function telecharger() {
    const c = lireConf(); if (!c) { changer('local'); return null; }
    try {
      const r = await fetch(c.url + '?cle=' + encodeURIComponent(c.cle), { cache: 'no-store' });
      const j = await r.json();
      if (!j.ok) { changer('erreur'); return null; }
      changer('ok');
      return j.donnees;
    } catch (e) { changer('horsligne'); return null; }
  }

  // Envoie le profil (avec un petit délai pour regrouper les sauvegardes rapprochées)
  function envoyer(profil, immediat) {
    const c = lireConf(); if (!c || !profil || !profil.maj) return;
    clearTimeout(minuterie);
    minuterie = setTimeout(async () => {
      changer('envoi');
      try {
        // text/plain évite la requête préalable CORS, refusée par Apps Script
        const r = await fetch(c.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ cle: c.cle, profil }) });
        const j = await r.json();
        changer(j.ok ? 'ok' : 'erreur');
      } catch (e) { changer('horsligne'); }
    }, immediat ? 0 : 800);
  }

  async function tester(url, cle) {
    try {
      const r = await fetch(url + '?cle=' + encodeURIComponent(cle), { cache: 'no-store' });
      const j = await r.json();
      return j.ok ? 'ok' : (j.erreur === 'cle' ? 'cle' : 'erreur');
    } catch (e) { return 'reseau'; }
  }

  racine.Sync = {
    conf: lireConf, configurer: ecrireConf, telecharger, envoyer, tester,
    etat: () => etat, surChangement: f => { surEtat = f; }
  };
})(window);
