/* Simulation de 14 jours de jeu avec progression : node tests/progression.js */
const M = require('../engine.js');
const D = require('../data.js');
const P = require('../progression.js');
const E = require('../epreuves.js');
const dateDu = (base, j) => { const d = new Date(2026, 10, 16 + base % 7 + j); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const assert = require('assert');
const { choisirAction } = require('./ia.js');

function jouerJour(profil, jour, graine) {
  const ep = E.epreuve(jour, dateDu(graine, jour), profil.histoire);
  let reprise = null, gloire = 0, etat;
  for (const [k, r] of ep.rencontres.entries()) {
    etat = M.creerCombat({ graine: graine + k * 101, allies: P.equipeDuJoueur(ep, profil, jour), ennemis: P.ennemisPourJoueur(r, profil, jour), reprise, gloire: k === 0 ? P.gloireDepart(profil) + (ep.gloireBonus || 0) : gloire, gloireActive: ep.gloire, secondSouffle: P.secondSouffle(profil) });
    let n = 0;
    while (!etat.fini && n++ < 600) {
      const d = M.debutTour(etat);
      if (M.verifierFin(etat)) break;
      if (d.passe) continue;
      if (d.acteur.camp === 'ennemi') M.tourEnnemi(etat, d.acteur);
      else { const c = choisirAction(etat, d.acteur); M.agir(etat, d.acteur.uid, c.comp.id, c.cible ? c.cible.uid : null); }
    }
    if (etat.fini !== 'victoire') return { victoire: false, etoiles: 0, ep };
    reprise = {};
    etat.unites.filter(u => u.camp === 'allie').forEach(u => { reprise[u.id] = { pv: u.ko ? Math.round(u.pvMax * .25) : Math.min(u.pvMax, u.pv + Math.round(u.pvMax * D.SOIN_ENTRE)), energie: u.energie }; });
    gloire = etat.gloire;
  }
  return { victoire: true, etoiles: M.etoiles(etat), ep };
}

// Offrande et série douce
{
  const q = P.initialiser({ joursJoues: 3, rangs: [] });
  assert(P.ouvrirOffrande(q, '2026-11-16', 1).serie === 1);
  assert(P.ouvrirOffrande(q, '2026-11-16', 1) === null, 'Une seule Offrande par jour');
  ['2026-11-17', '2026-11-18', '2026-11-19'].forEach((d, i) => P.ouvrirOffrande(q, d, i));
  assert.strictEqual(q.serie.jours, 4);
  P.ouvrirOffrande(q, '2026-11-25', 9);
  assert.strictEqual(q.serie.jours, 1, 'Recul d\'un palier (de 3+ vers 0+1)');
  q.rangs = [{}, {}]; assert.strictEqual(P.reclamerRoute(q, 3).type, 'carte'); assert.strictEqual(P.reclamerRoute(q, 3), null);
}

// Joueur type : prend le Don « carte inédite » sinon les doublons, et améliore dès que possible
function campagne(graineBase, jours) {
  const profil = P.initialiser({ joursJoues: 0 });
  const journal = [];
  for (let jour = 1; jour <= jours; jour++) {
    const r = jouerJour(profil, jour, graineBase + jour * 7919);
    const g = P.bonusDuJour(P.gains(r.victoire, r.etoiles), r.ep);
    // Choix du récit au hasard ; la finale gagnée scelle le Sceau de Maïa
    if (r.ep.choix && (r.victoire || !r.ep.choix.seulementVictoire)) P.appliquerChoix(profil, 'j' + jour, r.ep.choix.options[Math.floor(M.creerHasard(graineBase + jour)() * r.ep.choix.options.length)]);
    if (r.ep.final && r.victoire && !profil.histoire.sceaux.includes('maia')) profil.histoire.sceaux.push('maia');
    P.ajouterXp(profil, g.xp); profil.drachmes += g.drachmes; profil.joursJoues = jour;
    if (r.victoire) {
      P.butin(profil, graineBase + jour * 3, r.etoiles);
      const opts = P.genererDon(profil, graineBase + jour);
      P.appliquerDon(profil, opts.find(o => o.type === 'carte') || opts.find(o => o.type === 'doublons'));
    }
    // Choix de Voie et de Serments au hasard, et équipe les cartes de Voie
    let ch; const hz = M.creerHasard(graineBase + jour * 5);
    while ((ch = P.choixEnAttente(profil))) {
      if (ch.type === 'serment') P.choisirSerment(profil, ch.niveau, D.SERMENTS[ch.niveau][Math.floor(hz() * 2)].id);
      else { const vs = Object.keys(D.VOIES).filter(v => v !== profil.voie); const v = vs[Math.floor(hz() * vs.length)]; P.choisirVoie(profil, v, ch.type === 'voie2');
        if (ch.type === 'voie') profil.equipement.errant = ['frappe', 'torche'].concat(D.VOIES[v].cartes); }
    }
    let ok = true; while (ok) { ok = false; for (const id of Object.keys(profil.cartes)) if (P.ameliorer(profil, id)) ok = true; }
    for (const id of Object.keys(profil.cartes)) if (P.evoluer(profil, id)) evolutions++;
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

let evolutions = 0;
const N = 120, JOURS = 32;
const vict = Array(JOURS + 1).fill(0); let niv7 = 0, niv14 = 0, cartes7 = 0, max7 = 0;
for (let i = 0; i < N; i++) {
  const { journal } = campagne(1000 + i * 31, JOURS);
  journal.forEach(j => { if (j.victoire) vict[j.jour]++; });
  niv7 += journal[6].niveau; niv14 += journal[13].niveau; cartes7 += journal[6].cartes; max7 += journal[6].maxNiv;
}
const pct = j => Math.round(100 * vict[j] / N);
console.log('Victoires par jour (%) :', Array.from({ length: JOURS }, (_, i) => 'J' + (i + 1) + ' ' + pct(i + 1)).join(' · '));
const moy = (a, b) => Math.round(Array.from({ length: b - a + 1 }, (_, i) => pct(a + i)).reduce((x, y) => x + y) / (b - a + 1));
console.log('Moyenne jours 4 à 14 :', moy(4, 14) + ' %', '· jours 15 à 21 :', moy(15, 21) + ' %', '· jours 22 à 30 :', moy(22, 30) + ' %');
console.log('Jour 7 : niveau moyen ' + (niv7 / N).toFixed(1) + ', cartes possédées ' + (cartes7 / N).toFixed(1) + ', meilleure carte niveau ' + (max7 / N).toFixed(1) + ' · Jour 14 : niveau ' + (niv14 / N).toFixed(1));
{ let m = 0; for (let i = 0; i < 20; i++) m += campagne(5000 + i, 32).journal[31].maxNiv; console.log('Meilleure carte au jour 32 : niveau ' + (m / 20).toFixed(1)); }
console.log('Évolutions faites en moyenne sur 32 jours : ' + (evolutions / N).toFixed(1));
{ const q = P.initialiser({}); q.cartes.frappe.niveau = 5; q.drachmes = 300; assert(P.evoluer(q, 'frappe') && q.drachmes === 0 && !P.evoluer(q, 'frappe')); }
console.log('Tests progression OK');
