/* Simulation de 14 jours de jeu avec progression : node tests/progression.js */
const M = require('../engine.js');
const D = require('../data.js');
const P = require('../progression.js');
const assert = require('assert');
const { choisirAction } = require('./ia.js');

function jouerJour(profil, jour, graine) {
  const ep = D.epreuveDuJour(jour);
  let reprise = null, gloire = 0, etat;
  for (const [k, r] of ep.rencontres.entries()) {
    etat = M.creerCombat({ graine: graine + k * 101, allies: P.equipeDuJoueur(ep, profil, jour), ennemis: P.ennemisPourJoueur(r, profil, jour), reprise, gloire, gloireActive: ep.gloire });
    let n = 0;
    while (!etat.fini && n++ < 600) {
      const d = M.debutTour(etat);
      if (M.verifierFin(etat)) break;
      if (d.passe) continue;
      if (d.acteur.camp === 'ennemi') M.tourEnnemi(etat, d.acteur);
      else { const c = choisirAction(etat, d.acteur); M.agir(etat, d.acteur.uid, c.comp.id, c.cible ? c.cible.uid : null); }
    }
    if (etat.fini !== 'victoire') return { victoire: false, etoiles: 0 };
    reprise = {};
    etat.unites.filter(u => u.camp === 'allie').forEach(u => { reprise[u.id] = { pv: u.ko ? Math.round(u.pvMax * .25) : Math.min(u.pvMax, u.pv + Math.round(u.pvMax * D.SOIN_ENTRE)), energie: u.energie }; });
    gloire = etat.gloire;
  }
  return { victoire: true, etoiles: M.etoiles(etat) };
}

// Joueur type : prend le Don « carte inédite » sinon les doublons, et améliore dès que possible
function campagne(graineBase, jours) {
  const profil = P.initialiser({ joursJoues: 0 });
  const journal = [];
  for (let jour = 1; jour <= jours; jour++) {
    const r = jouerJour(profil, jour, graineBase + jour * 7919);
    const g = P.gains(r.victoire, r.etoiles);
    P.ajouterXp(profil, g.xp); profil.drachmes += g.drachmes; profil.joursJoues = jour;
    if (r.victoire) {
      P.butin(profil, graineBase + jour * 3, r.etoiles);
      const opts = P.genererDon(profil, graineBase + jour);
      P.appliquerDon(profil, opts.find(o => o.type === 'carte') || opts.find(o => o.type === 'doublons'));
    }
    let ok = true; while (ok) { ok = false; for (const id of Object.keys(profil.cartes)) if (P.ameliorer(profil, id)) ok = true; }
    journal.push({ jour, victoire: r.victoire, niveau: profil.niveau, cartes: Object.keys(profil.cartes).length, maxNiv: Math.max(...Object.values(profil.cartes).map(c => c.niveau)) });
  }
  return { profil, journal };
}

// Tests unitaires
const p = P.initialiser({});
assert.strictEqual(p.cartes.frappe.niveau, 1);
assert(!P.peutAmeliorer(p, 'frappe'));
p.cartes.frappe.doublons = 2; p.drachmes = 20;
assert(P.ameliorer(p, 'frappe') && p.cartes.frappe.niveau === 2 && p.drachmes === 0);
assert.strictEqual(P.ajouterXp(P.initialiser({}), 50), 1);
assert.strictEqual(P.genererDon(P.initialiser({ joursJoues: 3 }), 5).length, 3);

const N = 120, JOURS = 14;
const vict = Array(JOURS + 1).fill(0); let niv7 = 0, niv14 = 0, cartes7 = 0, max7 = 0;
for (let i = 0; i < N; i++) {
  const { journal } = campagne(1000 + i * 31, JOURS);
  journal.forEach(j => { if (j.victoire) vict[j.jour]++; });
  niv7 += journal[6].niveau; niv14 += journal[13].niveau; cartes7 += journal[6].cartes; max7 += journal[6].maxNiv;
}
const pct = j => Math.round(100 * vict[j] / N);
console.log('Victoires par jour (%) :', Array.from({ length: JOURS }, (_, i) => 'J' + (i + 1) + ' ' + pct(i + 1)).join(' · '));
const moy = (a, b) => Math.round(Array.from({ length: b - a + 1 }, (_, i) => pct(a + i)).reduce((x, y) => x + y) / (b - a + 1));
console.log('Moyenne jours 4 à 14 :', moy(4, 14) + ' %');
console.log('Jour 7 : niveau moyen ' + (niv7 / N).toFixed(1) + ', cartes possédées ' + (cartes7 / N).toFixed(1) + ', meilleure carte niveau ' + (max7 / N).toFixed(1) + ' · Jour 14 : niveau ' + (niv14 / N).toFixed(1));
console.log('Tests progression OK');
