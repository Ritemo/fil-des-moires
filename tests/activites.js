/* Tests des activités de l'Agora : node tests/activites.js */
const A = require('../activites.js'), M = require('../engine.js');
let ok = 0, ko = 0;
const verifier = (c, m) => { if (c) ok++; else { ko++; console.log('❌ ' + m); } };
const profil = () => ({ joursJoues: 8, niveau: 5, xp: 0, drachmes: 1000, pseudo: 'Test', compagnons: ['errant', 'phaena', 'griffon'], creatures: ['satyre'], creature: 'griffon',
  cartes: { frappe: { niveau: 2 }, torche: { niveau: 1 }, charge: { niveau: 1 }, ares: { niveau: 1 }, rayon: { niveau: 1 }, ronces: { niveau: 1 }, soin: { niveau: 1 }, presage: { niveau: 1 }, serres: { niveau: 1 }, eclair: { niveau: 1 }, pique: { niveau: 1 }, epines_s: { niveau: 1 } },
  equipement: { errant: ['frappe', 'torche', 'charge', 'ares'], phaena: ['rayon', 'ronces', 'soin', 'presage'], griffon: ['serres', 'eclair', 'pique'] }, vus: {} });

// Oracle : une question par jour, identique pour tous, pas de répétition avant d'avoir tout vu
const n0 = Math.ceil(A.joursDepuis('2027-01-01') / A.QUESTIONS.length) * A.QUESTIONS.length, vues = new Set();
for (let i = 0; i < A.QUESTIONS.length; i++) vues.add(A.oracleDuJour(new Date((n0 + i) * 864e5).toISOString().slice(0, 10)).question);
verifier(vues.size === A.QUESTIONS.length, 'Oracle : questions répétées dans un cycle (' + vues.size + ')');
A.QUESTIONS.forEach(q => verifier(q[1].length === 3 && q[2] >= 0 && q[2] < 3, 'Oracle : question mal formée ' + q[0]));
let p = profil(); A.initialiser(p);
const q = A.oracleDuJour('2026-11-20'), r = A.repondreOracle(p, '2026-11-20', q.bonne);
verifier(r.juste && p.activites.materiaux.eclat === 1 && p.drachmes === 1020, 'Oracle : récompense');
verifier(A.repondreOracle(p, '2026-11-20', 0) === null, 'Oracle : une seule réponse par jour');

// Forge
p.activites.materiaux = { airain: 20, olivier: 20, laine: 20, eclat: 20, perle: 5 };
verifier(A.forger(p, 'athena') === 1 && p.activites.talisman === 'athena', 'Forge : premier talisman équipé');
A.forger(p, 'athena'); A.forger(p, 'athena');
verifier(p.activites.talismans.athena === 3 && !A.peutForger(p, 'athena'), 'Forge : niveau 3 maximum');
const sans = A.equipeHorsChant(Object.assign(profil(), { activites: null })), avec = A.equipeHorsChant(p);
verifier(avec[0].pvMax > sans[0].pvMax, 'Forge : le talisman renforce l\'équipe');

// Expéditions
p = profil(); A.initialiser(p);
verifier(A.partirExpedition(p, '2026-11-20', 'satyre', 'foret'), 'Expédition : départ');
verifier(!A.recolterExpedition(p, '2026-11-20'), 'Expédition : pas de retour le jour même');
const e = A.recolterExpedition(p, '2026-11-21');
verifier(e && e.affine && Object.values(e.materiaux).reduce((x, y) => x + y, 0) >= 5, 'Expédition : butin (bonus d\'affinité)');

// Arène : l'ombre joue et le combat se termine
p = profil(); A.initialiser(p);
let fins = 0;
for (let g = 1; g <= 20; g++) {
  const etat = M.creerCombat({ graine: g, allies: A.equipeHorsChant(p), ennemis: A.equipeOmbre(p, 'x'), gloireActive: false });
  for (let n = 0; n < 500 && !etat.fini; n++) {
    const d = M.debutTour(etat); if (etat.fini || M.verifierFin(etat) || d.passe) continue;
    if (d.acteur.camp === 'ennemi') { M.tourEnnemi(etat, d.acteur); continue; }
    const c = M.competencesDisponibles(etat, d.acteur).filter(x => x.possible && x.type === 'attaque').pop();
    if (!c) { M.agir(etat, d.acteur.uid, 'garde', (M.vivants(etat, 'allie').find(u => u !== d.acteur) || d.acteur).uid); continue; }
    M.agir(etat, d.acteur.uid, c.id, M.ciblesPossibles(etat, d.acteur, c)[0].uid);
  }
  if (etat.fini) fins++;
}
verifier(fins === 20, 'Arène : combats terminés ' + fins + '/20');
A.resultatArene(p, '2026-11-20', 'x', false);
verifier(p.activites.arene.trophees === 0, 'Arène : les trophées ne passent pas sous zéro');

// Titan : semaine, objectif, paliers
verifier(A.semaine('2026-11-22') === '2026-11-16' && A.semaine('2026-11-23') === '2026-11-23', 'Titan : la semaine commence le lundi');
p = profil(); A.initialiser(p);
A.enregistrerTitan(p, '2026-11-20', 2000);
const t = A.totalTitan(p, '2026-11-20', [{ nom: 'M', titan: { semaine: '2026-11-16', degats: 1500 } }]);
verifier(t.total === 3500 && t.objectif === 6000, 'Titan : dégâts additionnés');
verifier(A.paliersAReclamer(p, '2026-11-20', t.total, t.objectif).length === 2, 'Titan : paliers 25 et 50 %');
verifier(A.reclamerPalier(p, '2026-11-20', 25) && !A.reclamerPalier(p, '2026-11-20', 25), 'Titan : palier réclamé une fois');
verifier(A.etatTitan(p, '2026-11-24').degats === 0, 'Titan : remise à zéro chaque lundi');

console.log((ko ? '❌ ' : '✅ ') + ok + ' vérifications réussies, ' + ko + ' échec(s) (activités).');
process.exit(ko ? 1 : 0);
