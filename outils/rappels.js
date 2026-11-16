/* Rappel quotidien : envoie à chaque joueur (via ntfy) le titre de sa prochaine épreuve.
   Lancé chaque matin par le robot « Rappel » (GitHub Actions). Secrets : SAUVEGARDE_URL et SAUVEGARDE_CLE
   (adresse /exec et clé du joueur principal du script de sauvegarde). */
const E = require('../epreuves.js');
const url = process.env.SAUVEGARDE_URL, cle = process.env.SAUVEGARDE_CLE;
const JEU = 'https://ritemo.github.io/fil-des-moires/';
// Date du jour à Paris
const aujourdhui = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());

(async () => {
  if (!url || !cle) { console.log('Secrets SAUVEGARDE_URL et SAUVEGARDE_CLE absents : rien à faire.'); return; }
  const r = await fetch(url + '?cle=' + encodeURIComponent(cle) + '&rappels=1');
  const j = await r.json();
  if (!j.ok) throw new Error('Script de sauvegarde : ' + (j.erreur || 'réponse inattendue') + (j.rappels ? '' : ' (le script est-il à jour ?)'));
  console.log('Script de sauvegarde joint : ' + (j.rappels || []).length + ' rappel(s) activé(s).');
  for (const joueur of j.rappels || []) {
    if (joueur.derniereDate === aujourdhui) { console.log(joueur.nom + ' a déjà joué aujourd\'hui.'); continue; }
    const jour = joueur.jour + 1;
    const ep = E.epreuve(jour, aujourdhui, { choix: joueur.choix, sceaux: joueur.sceaux });
    const titre = 'Jour ' + jour + ' : ' + ep.titre.replace(/^Le Prologue : /, '');
    const corps = ep.presage + (ep.nouveau ? '\n' + ep.nouveau : '');
    // publication JSON : accepte les accents et les emojis dans le titre
    const env = await fetch('https://ntfy.sh/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: joueur.ntfy, title: '🧵 ' + titre, message: corps, click: JEU, tags: ['crossed_swords'] }) });
    console.log(joueur.nom + ' : ' + titre + ' -> ' + env.status);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
