/* Cohérence des données : épreuves 1 à 60, ennemis, choix et conditions du Chant, personnages, cartes. node tests/coherence.js */
const D=require('../data.js'),E=require('../epreuves.js'),C=require('../chant1.js'),A=require('../activites.js'),P=require('../progression.js');
const pb=[];
const H={choix:{},jauges:{},sceaux:[]};
for(let j=1;j<=60;j++){ let ep; try{ep=E.epreuve(j,'2027-01-'+String((j%28)+1).padStart(2,'0'),H);}catch(e){pb.push('épreuve '+j+' : '+e.message);continue;}
  if(!ep.titre) pb.push('épreuve '+j+' sans titre');
  if(!ep.presage) pb.push('épreuve '+j+' sans présage');
  (ep.rencontres||[]).forEach(r=>r.ennemis.forEach(id=>{ if(!D.ENNEMIS[id]) pb.push('épreuve '+j+' : ennemi inconnu '+id); }));
}
// choix : toutes les combinaisons de j6/j14/j17/j21
const opts={}; for(let j=1;j<=30;j++){ const d=C.JOURS[j]; if(d&&d.choix) opts['j'+j]=d.choix.options.map(o=>o.id); }
// conditions qui référencent des choix inexistants
const src=require('fs').readFileSync(__dirname + '/../chant1.js','utf8'); (src.match(/'(j\d+)(!?=)(\w+)'/g)||[]).forEach(c=>{const m=c.match(/'(j\d+)!?=(\w+)'/); if(!opts[m[1]]||!opts[m[1]].includes(m[2])) pb.push('condition orpheline '+c);});
// personnages
for(let j=1;j<=30;j++){ const d=C.JOURS[j]; if(!d) {pb.push('jour '+j+' absent du Chant');continue;} (d.scene||[]).forEach(l=>{ if(!C.PERSOS[l[0]]) pb.push('jour '+j+' : personnage inconnu '+l[0]); }); }
// cartes et évolutions
const cartes=new Set(D.HEROS.concat(D.CREATURES).flatMap(h=>h.competences.map(c=>c.id)));
Object.keys(D.EVOLUTIONS||{}).forEach(id=>{ if(!cartes.has(id)) pb.push('évolution d\'une carte inconnue '+id); });
// créatures liables ont des compétences
D.CREATURES.forEach(c=>{ if(!c.competences||!c.competences.length) pb.push('créature sans carte '+c.id); if(!D.ENNEMIS[c.id]) pb.push('créature sans ennemi '+c.id); });
// emojis utilisés dans les données sans image
console.log(pb.length ? '❌ ' + pb.join('\n❌ ') : '✅ Cohérence des données : aucun problème');
process.exit(pb.length ? 1 : 0);
