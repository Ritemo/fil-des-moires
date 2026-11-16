/* Rappel quotidien : envoie à chaque joueur (via ntfy) le titre de sa prochaine épreuve.
   Lancé chaque matin par le robot « Rappel » (GitHub Actions). Secrets : SAUVEGARDE_URL et SAUVEGARDE_CLE
   (adresse /exec et clé du joueur principal du script de sauvegarde). */
const E = require('../epreuves.js');
const url = process.env.SAUVEGARDE_URL, cle = process.env.SAUVEGARDE_CLE;
const TEST = process.env.RAPPEL_TEST === 'true';   // lancement manuel « test » : envoie même si la quête est déjà jouée
const JEU = 'https://ritemo.github.io/fil-des-moires/';
// Date du jour à Paris
const aujourdhui = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());

(async () => {
  if (!url || !cle) { console.log('Secrets SAUVEGARDE_URL et SAUVEGARDE_CLE absents : rien à faire.'); return; }
  const r = await fetch(url + '?cle=' + encodeURIComponent(cle) + '&rappels=1');
  const j = await r.json();
  if (!j.ok) throw new Error('Script de sauvegarde : ' + (j.erreur || 'réponse inattendue') + (j.rappels ? '' : ' (le script est-il à jour ?)'));
  console.log('Script de sauvegarde joint : ' + (j.rappels || []).length + ' rappel(s) activé(s).');
  // Mode « annonce de test » : simule la fin d'épreuve d'un joueur et prévient les autres, comme le script le fera
  if (process.env.ANNONCE_DE) {
    for (const joueur of j.rappels || []) {
      if (joueur.nom === process.env.ANNONCE_DE) continue;
      const env = await fetch('https://ntfy.sh/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: joueur.ntfy, title: '🧪 Test · 🧵 ' + process.env.ANNONCE_DE + ' a tissé le jour 2', message: 'La forêt de Phaéna · ★★☆\nCeci est un essai : les vraies annonces arriveront ainsi quand un autre tisserand finit son épreuve.', click: JEU, tags: ['crossed_swords'] }) });
      console.log('Annonce de test envoyée à ' + joueur.nom + ' -> ' + env.status);
    }
    return;
  }
  for (const joueur of j.rappels || []) {
    if (joueur.derniereDate === aujourdhui && !TEST) { console.log(joueur.nom + ' a déjà joué aujourd\'hui.'); continue; }
    const jour = joueur.jour + 1;
    const ep = E.epreuve(jour, aujourdhui, { choix: joueur.choix, sceaux: joueur.sceaux });
    const titre = 'Jour ' + jour + ' : ' + ep.titre.replace(/^Le Prologue : /, '');
    const corps = ep.presage + (ep.nouveau ? '\n' + ep.nouveau : '');
    // publication JSON : accepte les accents et les emojis dans le titre
    const env = await fetch('https://ntfy.sh/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: joueur.ntfy, title: (TEST ? '🧪 Test · ' : '🧵 ') + titre, message: corps, click: JEU, tags: ['crossed_swords'] }) });
    console.log(joueur.nom + ' : ' + titre + ' -> ' + env.status);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
