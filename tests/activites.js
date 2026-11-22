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
verifier(A.forger(p, 'athena') === 1 && p.activites.portes.errant === 'athena', 'Forge : premier talisman porté par l\'Errant');
A.forger(p, 'athena'); A.forger(p, 'athena');
verifier(p.activites.talismans.athena === 3 && !A.peutForger(p, 'athena'), 'Forge : niveau 3 maximum');
const sans = A.equipeHorsChant(Object.assign(profil(), { activites: null })), avec = A.equipeHorsChant(p);
verifier(avec[0].pvMax > sans[0].pvMax && avec[1].pvMax === sans[1].pvMax, 'Forge : le talisman ne renforce que son porteur');
A.forger(p, 'zeus'); verifier(p.activites.portes.phaena === 'zeus', 'Forge : le deuxième talisman va à Phaéna');
A.porter(p, 'compagnon', 'athena'); verifier(!p.activites.portes.errant && p.activites.portes.compagnon === 'athena', 'Forge : un talisman ne se porte qu\'une fois');
const eq3 = A.equipeHorsChant(p); verifier(eq3[2].pvMax > sans[2].pvMax && eq3[1].attaque > sans[1].attaque && eq3[0].pvMax === sans[0].pvMax, 'Forge : chacun son talisman');
const vieux = profil(); vieux.activites = { talisman: 'athena', talismans: { athena: 2 } }; A.initialiser(vieux);
verifier(vieux.activites.portes.errant === 'athena', 'Forge : ancienne partie, talisman donné à l\'Errant');
verifier(A.equipeOmbre({ equipement: p.equipement, cartes: p.cartes, compagnons: p.compagnons, creature: 'griffon', niveau: 5, activites: { talisman: 'athena', talismans: { athena: 3 } } }, 'x').length === 3, 'Forge : ombre d\'un ancien script');

// Expéditions (en parallèle)
p = profil(); A.initialiser(p);
p.liens = [{ uid: 'l1', espece: 'satyre', surnom: 'Bacchos' }, { uid: 'l2', espece: 'satyre', surnom: 'Silène' }, { uid: 'l3', espece: 'satyre', surnom: 'Pan' }];
const t0 = Date.UTC(2026, 10, 20, 8);
verifier(A.explorateursEnclos(p).length === 4, 'Expédition : Kelos + 3 liens explorateurs');
verifier(A.partirExpedition(p, t0, 'l1', 'foret', 'court'), 'Expédition : départ courte');
verifier(!A.partirExpedition(p, t0, 'l1', 'foret', 'long'), 'Expédition : une créature ne part pas deux fois');
verifier(A.partirExpedition(p, t0, 'l2', 'foret', 'long') && A.partirExpedition(p, t0, 'griffon', 'foret', 'moyen'), 'Expédition : trois en parallèle');
verifier(!A.partirExpedition(p, t0, 'l3', 'foret', 'court'), 'Expédition : trois places au maximum');
const idc = p.activites.expeditions[0].id;
verifier(!A.recolterExpedition(p, '2026-11-20', t0 + 3600e3, idc), 'Expédition : pas de retour avant 2 h');
const e = A.recolterExpedition(p, '2026-11-20', t0 + 2 * 3600e3, idc);
verifier(e && e.affine && Object.values(e.materiaux).reduce((x, y) => x + y, 0) >= 2, 'Expédition : butin de la courte (bonus d\'affinité)');
verifier(A.partirExpedition(p, t0 + 2 * 3600e3, 'l3', 'foret', 'court'), 'Expédition : place libérée');
const el = A.recolterExpedition(p, '2026-11-20', t0 + 9 * 3600e3, p.activites.expeditions.find(x => x.creature === 'l2').id);
verifier(el && el.drachmes > e.drachmes && Object.values(el.materiaux).reduce((x, y) => x + y, 0) >= 5, 'Expédition : la longue rapporte plus');
const anc = profil(); A.initialiser(anc); anc.activites.expedition = { creature: 'griffon', lieu: 'foret', date: '2026-11-19' };
verifier(A.migrerExpeditions(anc).length === 1 && A.expeditionPrete(anc, '2026-11-20', t0), 'Expédition : l\'ancienne expédition est migrée et prête');

// Labyrinthe
p = profil(); A.initialiser(p); p.vus = { satyre: 1, sanglier: 1, harpie: 1 };
const s1 = A.salleLabyrinthe(p, 1, 42), s5 = A.salleLabyrinthe(p, 5, 42);
verifier(s1.ennemis.length > 0 && s5.ennemis.length > 0, 'Labyrinthe : des ennemis à chaque salle');
verifier(JSON.stringify(A.salleLabyrinthe(p, 3, 42)) === JSON.stringify(A.salleLabyrinthe(p, 3, 42)), 'Labyrinthe : salle déterministe');
const bf = A.deuxBienfaits(2, 42); verifier(bf.length === 2 && bf[0].id !== bf[1].id, 'Labyrinthe : deux bienfaits différents');
const f3 = A.finLabyrinthe(p, '2026-11-20', 3), d0 = p.drachmes;
verifier(f3.nouveau && f3.gains.drachmes > 0, 'Labyrinthe : première descente récompensée');
const f2 = A.finLabyrinthe(p, '2026-11-20', 2);
verifier(!f2.nouveau && p.drachmes === d0 && A.etatLabyrinthe(p, '2026-11-20').descentes === 2, 'Labyrinthe : une descente moins bonne ne rapporte rien');
const hon = (p.histoire && p.histoire.penchants && p.histoire.penchants.honneur) || 0;
A.finLabyrinthe(p, '2026-11-20', 6);
verifier(A.etatLabyrinthe(p, '2026-11-20').best === 6 && p.drachmes > d0, 'Labyrinthe : amélioration récompensée');
verifier(A.etatLabyrinthe(p, '2026-11-21').best === 0, 'Labyrinthe : remise à zéro le lendemain');

// Astragales
const sc = c => A.valeurCoup(c).score;
verifier(sc([1, 3, 4, 6]) === 100 && sc([1, 1, 1, 1]) === -1 && sc([6, 6, 6, 6]) === 56 && sc([1, 3, 3, 6]) === 13, 'Astragales : valeur des coups');
p = profil(); A.initialiser(p); p.drachmes = 1000;
let n = 0; while (A.jouerAstragales(p, '2026-11-20')) n++;
verifier(n === A.PARTIES_MAX, 'Astragales : dix parties par jour');
const x = A.etatAstragales(p, '2026-11-20'); verifier(p.drachmes === 1000 + x.bilan, 'Astragales : bilan cohérent');
p.drachmes = 5; verifier(!A.jouerAstragales(p, '2026-11-21'), 'Astragales : pas de partie sans la mise');

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

// Penchant : un choix du Chant (10) pèse plus que quelques activités
p = profil(); A.initialiser(p); p.histoire = { choix: {}, jauges: { honneur: 1 }, sceaux: [] };
for (let i = 0; i < 5; i++) A.noterPenchant(p, 'ruse', 1);
verifier(A.dominante(p) === 'honneur', 'Penchant : le choix du Chant domine');
for (let i = 0; i < 6; i++) A.noterPenchant(p, 'ruse', 1);
verifier(A.dominante(p) === 'ruse', 'Penchant : les activités finissent par compter');

// Fêtes : 2 jours tous les 9 jours, les mêmes pour tous
let jf = 0; for (let i = 0; i < 90; i++) if (A.feteDuJour(new Date(Date.UTC(2027, 0, 1) + i * 864e5).toISOString().slice(0, 10))) jf++;
verifier(jf === 20, 'Fêtes : 20 jours de fête sur 90 (' + jf + ')');

// Marchand : 4 articles, un achat par article et par semaine
p = profil(); A.initialiser(p); p.drachmes = 2000;
const et = A.etalage(p, '2026-11-23');
verifier(et.length === 4 && JSON.stringify(et) === JSON.stringify(A.etalage(p, '2026-11-26')), 'Marchand : étalage stable dans la semaine');
verifier(A.acheter(p, '2026-11-23', et[0].id) && !A.acheter(p, '2026-11-24', et[0].id), 'Marchand : un seul achat par article');

// Fragments et hauts faits
p = profil(); A.initialiser(p);
for (let i = 0; i < 12; i++) A.donnerFragment(p, () => 0);
verifier(p.activites.fragments.length === 12 && A.donnerFragment(p) === null && A.serieComplete(p, 'atropos'), 'Fragments : 12 au total, pas de doublon');
const hf = A.verifierHautsFaits(p, '2026-11-23');
verifier(hf.some(h => h.id === 'fragments') && hf.some(h => h.id === 'premier') && A.verifierHautsFaits(p, '2026-11-24').length === 0, 'Hauts faits : débloqués une seule fois');
verifier(A.titresDisponibles(p).some(t => t.nom === 'Lecteur de fils') && A.nomTitre('fragments') === 'Lecteur de fils', 'Hauts faits : titres');

console.log((ko ? '❌ ' : '✅ ') + ok + ' vérifications réussies, ' + ko + ' échec(s) (activités).');
process.exit(ko ? 1 : 0);
