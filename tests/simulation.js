/* Tests et équilibrage : node tests/simulation.js
   Joue des centaines d'épreuves avec une IA « joueur raisonnable » et une IA « joueur naïf ». */
const M = require('../engine.js');
const D = require('../data.js');
const assert = require('assert');

function choisirAction(etat, acteur, naif) {
  const comps = M.competencesDisponibles(etat, acteur).filter(c => c.possible);
  const ennemis = M.vivants(etat, 'ennemi');
  const allies = M.vivants(etat, 'allie');
  if (naif) {
    const c = comps.find(c => c.type === 'attaque' && !c.zone) ;
    return { comp: c, cible: ennemis[0] };
  }
  const pro = comps.find(c => c.prouesse);
  if (pro) return { comp: pro, cible: null };
  const blesse = allies.slice().sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0];
  const soin = comps.find(c => c.type === 'soin');
  if (soin && blesse.pv / blesse.pvMax < 0.45) return { comp: soin, cible: blesse };
  const hydre = ennemis.find(e => e.mecanique === 'hydre');
  if (hydre && hydre.tetes >= 2 && !hydre.etats.cauterise) {
    const torche = comps.find(c => c.affinite === 'flamme');
    if (torche) return { comp: torche, cible: hydre };
  }
  let meilleur = null;
  for (const c of comps.filter(c => c.type === 'attaque' && !c.prouesse)) {
    if (c.hubris && acteur.hubris + c.hubris >= 100) continue;
    for (const e of ennemis) {
      let score = c.puissance * M.multiplicateur(c.affinite, e.affinite) / (c.poids === 'lourd' ? 1.3 : c.poids === 'leger' ? 0.75 : 1);
      if (hydre && e === hydre && !hydre.etats.cauterise && c.affinite !== 'flamme' && c.puissance >= 60) score *= 0.6;
      score += (1 - e.pv / e.pvMax) * 10;
      if (!meilleur || score > meilleur.score) meilleur = { comp: c, cible: e, score };
    }
  }
  return meilleur;
}

function jouerEpreuve(graine, naif) {
  let reprise = null, gloire = 0, tours = 0, etat;
  for (const r of D.EPREUVE.rencontres) {
    etat = M.creerCombat({ graine: graine + tours, allies: D.HEROS, ennemis: r.ennemis.map(id => D.ENNEMIS[id]), reprise, gloire });
    let garde = 0;
    while (!etat.fini && garde++ < 500) {
      const d = M.debutTour(etat);
      if (M.verifierFin(etat)) break;
      if (d.passe) continue;
      if (d.acteur.camp === 'ennemi') M.tourEnnemi(etat, d.acteur);
      else {
        const choix = choisirAction(etat, d.acteur, naif);
        M.agir(etat, d.acteur.uid, choix.comp.id, choix.cible ? choix.cible.uid : null);
      }
      // invariants
      etat.unites.forEach(u => { assert(u.pv >= 0 && u.pv <= u.pvMax, 'PV hors bornes'); assert(u.energie <= u.energieMax); });
    }
    assert(etat.fini, 'Combat sans fin');
    tours += etat.tour;
    if (etat.fini === 'defaite') return { victoire: false, tours, etoiles: 0 };
    reprise = {};
    etat.unites.filter(u => u.camp === 'allie').forEach(u => {
      const pv = u.ko ? Math.round(u.pvMax * 0.25) : Math.min(u.pvMax, u.pv + Math.round(u.pvMax * D.EPREUVE.soinEntre));
      reprise[u.id] = { pv, energie: u.energie, hubris: u.hubris };
    });
    gloire = etat.gloire;
  }
  return { victoire: true, tours, etoiles: M.etoiles(etat) };
}

// Tests unitaires
assert.strictEqual(M.multiplicateur('flamme', 'sylve'), 1.5);
assert.strictEqual(M.multiplicateur('flamme', 'onde'), 0.67);
assert.strictEqual(M.multiplicateur('lumiere', 'ombre'), 1.5);
assert.strictEqual(M.multiplicateur('ombre', 'lumiere'), 1.5);
assert.strictEqual(M.multiplicateur('airain', 'onde'), 1);
const h1 = M.creerHasard(42), h2 = M.creerHasard(42);
assert.strictEqual(h1(), h2(), 'Graine non déterministe');
assert.strictEqual(M.graineDuJour('2026-11-16'), M.graineDuJour('2026-11-16'));
const e = M.creerCombat({ graine: 7, allies: D.HEROS, ennemis: [D.ENNEMIS.satyre] });
assert.strictEqual(M.prevision(e, 8).length, 8);

// Équilibrage
for (const naif of [false, true]) {
  let v = 0, et = 0, t = 0; const N = 400;
  for (let i = 0; i < N; i++) { const r = jouerEpreuve(1000 + i * 7, naif); if (r.victoire) v++; et += r.etoiles; t += r.tours; }
  console.log((naif ? 'Joueur naïf      ' : 'Joueur raisonnable') + ' : victoires ' + Math.round(100 * v / N) + ' %, étoiles moyennes ' + (et / N).toFixed(2) + ', tours moyens ' + Math.round(t / N));
}
console.log('Tests OK');
