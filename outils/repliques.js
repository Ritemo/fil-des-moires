/* Liste toutes les répliques de l'histoire à enregistrer (scènes, fins d'épreuve, résultats des choix).
   Usage : node outils/repliques.js > repliques.json   (utilisé par le robot « Voix ») */
const C = require('../chant1.js'), C2 = require('../chant2.js');
const { cleVoix, nettoyer } = require('../voix.js');
const vues = new Map();
const ajouter = (qui, texte) => {
  if (!texte) return;
  const q = qui === 'kelos' ? 'narrateur' : qui;
  const id = cleVoix(q, texte);
  if (!vues.has(id)) vues.set(id, { id, qui: q, texte: nettoyer(texte) });
};
Object.values(C.JOURS).concat(Object.values(C2.JOURS)).forEach(j => {
  if (j.epilogue) ajouter(j.epilogue[0], j.epilogue[1]);
  const blocs = [j].concat(Object.values(j.variantes || {}));
  blocs.forEach(b => {
    (b.scene || []).forEach(l => ajouter(l[0], l[1]));
    if (b.fin) ['victoire', 'defaite'].forEach(k => b.fin[k] && ajouter(b.fin[k][0], b.fin[k][1]));
    if (b.choix) b.choix.options.forEach(o => ajouter('narrateur', o.resultat));
  });
});
(C.INTRO || []).forEach(l => ajouter(l.qui, l.texte));
ajouter('clotho', "Je te lirai les paroles de l'histoire.");
process.stdout.write(JSON.stringify([...vues.values()], null, 1));
