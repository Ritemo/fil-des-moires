/* IA « joueur raisonnable » (et naïf) partagée par les tests */
const M = require('../engine.js');
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

module.exports = { choisirAction };
