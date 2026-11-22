/* Le Fil des Moires : épreuve du jour.
   Jours 1 à 30 : le Chant I écrit (chant1.js ; les jours 1 à 3 gardent les combats du prologue).
   Si l'Hydre éveillée n'est pas vaincue au jour 30, la finale revient chaque jour.
   Une fois le Sceau de Maïa tenu : le Chant II (chant2.js), compté à partir du lendemain de la victoire (histoire.debutChant2).
   Si Campé n'est pas vaincue au jour 60 du Chant, la finale revient chaque jour.
   Ensuite, en attendant le Chant III : une épreuve générée à partir de la date. */
(function (racine) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const D = node ? require('./data.js') : racine.Donnees;
  const M = node ? require('./engine.js') : racine.Moteur;
  const C = node ? require('./chant1.js') : racine.Chant1;
  const C2 = node ? require('./chant2.js') : racine.Chant2;

  // Gardien selon le jour de la semaine (0 = dimanche)
  const GARDIENS = ['hydre', 'hydre', 'cyclope', 'chimere', 'hydre', 'cyclope', 'chimere'];
  const LIEUX = {
    hydre: ["L'Étang des Sept Têtes", "Les Roselières noires", "Le Gué des Brumes"],
    cyclope: ["Le Col du Géant", "Les Éboulis gris", "La Carrière oubliée"],
    chimere: ["La Lande brûlée", "Les Ruines fumantes", "Le Vallon des Cendres"]
  };
  const PRESAGES = {
    hydre: ["« L'eau dort, mais ce qui dort dessous a plusieurs têtes. »", "« Coupe une tête, deux autres te regardent. Le feu se souvient de la recette. »"],
    cyclope: ["« Un œil unique veille sur la pierre. La lumière le blesse plus que l'acier. »", "« La montagne marche. Elle ne voit qu'une chose à la fois. »"],
    chimere: ["« Trois bêtes, une seule faim. Les crocs vont par deux. »", "« La lande fume encore. Ce qui l'a brûlée respire tout près. »"]
  };
  const PAIRES = [['satyre', 'harpie'], ['sirene', 'harpie'], ['satyre', 'sirene'], ['harpie', 'harpie'], ['sirene', 'sirene']];

  function jourSemaine(date) { const [a, m, j] = date.split('-').map(Number); return new Date(a, m - 1, j).getDay(); }

  const DURCI = { pvMax: 1.35, attaque: 1.2 };
  const DURCI2 = { pvMax: 1.1, attaque: 1.05 };
  const EQUIPE_COMPLETE = { errant: 'tout', phaena: 'tout', griffon: 'tout' };
  function epreuve(jour, date, histoire) {
    histoire = histoire || {};
    const chap = C.chapitreDu(jour);
    if (jour <= 3) return Object.assign({ jour, chant: 'I', chapitre: chap }, D.JOURS[jour - 1], C.jourDuChant(jour, histoire));
    const finaleRatee = jour > C.DERNIER_JOUR && !(histoire.sceaux || []).includes('maia');
    if (jour <= C.DERNIER_JOUR || finaleRatee) {
      const j = C.jourDuChant(finaleRatee ? C.DERNIER_JOUR : jour, histoire);
      const ep = Object.assign({ jour, chant: 'I', chapitre: C.chapitreDu(finaleRatee ? C.DERNIER_JOUR : jour), equipe: EQUIPE_COMPLETE, gloire: true }, j);
      // Les jours sans Gardien comptent trois rencontres : on les durcit un peu pour qu'ils restent des épreuves
      if (!ep.rencontres.some(r => r.ennemis.some(id => D.ENNEMIS[id].gardien)))
        ep.rencontres = ep.rencontres.map(r => Object.assign({}, r, { modif: Object.assign({ pvMax: 1, attaque: 1 }, r.modif || {}, { pvMax: (r.modif && r.modif.pvMax || 1) * DURCI.pvMax, attaque: (r.modif && r.modif.attaque || 1) * DURCI.attaque }) }));
      if (finaleRatee) { ep.titre = j.titre + ', encore'; ep.presage = "« L'Hydre a replongé, mais le Sceau de Maïa tremble toujours. Le Chant ne s'achèvera pas sans toi. »"; }
      return ep;
    }
    // Chant II
    const debut = histoire.debutChant2 || (C.DERNIER_JOUR + 1);
    const jc = jour - debut + C2.PREMIER_JOUR;
    const campe = (histoire.sceaux || []).includes('campe');
    if (jc >= C2.PREMIER_JOUR && (jc <= C2.DERNIER_JOUR || !campe)) {
      const ratee = jc > C2.DERNIER_JOUR;
      const k = ratee ? C2.DERNIER_JOUR : jc;
      const j = C2.jourDuChant(k, histoire);
      const ep = Object.assign({ jour, jc: k, cle: 'j' + k, chant: 'II', chapitre: C2.chapitreDu(k), equipe: EQUIPE_COMPLETE, gloire: true }, j);
      // Les ennemis du Chant II sont plus forts de nature : les jours sans Gardien ne sont durcis que légèrement
      if (!ep.rencontres.some(r => r.ennemis.some(id => D.ENNEMIS[id].gardien)))
        ep.rencontres = ep.rencontres.map(r => Object.assign({}, r, { modif: Object.assign({ pvMax: 1, attaque: 1 }, r.modif || {}, { pvMax: (r.modif && r.modif.pvMax || 1) * DURCI2.pvMax, attaque: (r.modif && r.modif.attaque || 1) * DURCI2.attaque }) }));
      if (ratee) { ep.titre = j.titre + ', encore'; ep.presage = "« Campé a resserré ses chaînes, mais le deuxième Sceau tremble toujours. Le Chant ne s'achèvera pas sans toi. »";
        // chaque nouvelle tentative compense la montée des ennemis avec les jours
        const k2 = Math.max(0.8, 1 - 0.03 * (jc - C2.DERNIER_JOUR));
        ep.rencontres = ep.rencontres.map(r => Object.assign({}, r, { modif: Object.assign({}, r.modif || {}, { pvMax: (r.modif && r.modif.pvMax || 1) * k2, attaque: (r.modif && r.modif.attaque || 1) * k2 }) })); }
      return ep;
    }
    return generee(jour, date, campe);
  }

  const GARDIENS2 = ['campe', 'chimere_forges', 'arges', 'talos', 'chimere_forges', 'arges', 'talos'];
  const LIEUX2 = { chimere_forges: ['Le Col de cendre', 'Les Forges froides', 'La Route des charbonniers'], arges: ['La Forge de la lueur', "L'Atelier de l'éclair", 'Les Galeries de suie'],
    talos: ['Le Lac de lave', 'La Statue sans visage', 'Le Labyrinthe de bronze'], campe: ['Les Portes de bronze', 'Le Phlégéthon', 'Les Cellules vides'] };
  const PRESAGES2 = { chimere_forges: ["« La Chimère des Forges a retrouvé la route. Elle crache encore du bronze. »"], arges: ["« Une lueur blanche dans les galeries : Argès forge de nouveau, et il a oublié qui tu es. »"],
    talos: ["« Le géant de bronze s'est relevé du lac. L'Onde fend toujours son bronze. »"], campe: ["« Les chaînes du Tartare s'agitent. Campé veut éprouver le Sceau, encore une fois. »"] };
  const PAIRES2 = [['salamandre', 'chien_cendre'], ['kere', 'automate'], ['salamandre', 'kere'], ['chien_cendre', 'chien_cendre'], ['automate', 'salamandre']];
  function generee(jour, date, chant2) {
    if (chant2) return generee2(jour, date);
    const hasard = M.creerHasard(M.graineDuJour(date + '|epreuve|' + jour));
    const choisir = l => l[Math.floor(hasard() * l.length)];
    const js = jourSemaine(date);
    const dimanche = js === 0;
    const gardien = dimanche ? choisir(['hydre', 'cyclope', 'chimere']) : GARDIENS[js];
    const paire = choisir(PAIRES);
    const lieu = choisir(LIEUX[gardien]);
    const g = D.ENNEMIS[gardien];
    return {
      jour, genere: true, dimanche, gardienId: gardien, interlude: true,
      titre: (dimanche ? 'Épreuve des Dieux : ' : '') + lieu,
      presage: choisir(PRESAGES[gardien]) + ' Le Chant II se prépare.',
      bonus: dimanche ? { xp: 1.5, drachmes: 1.5 } : null,
      nouveau: dimanche ? 'Dimanche : un Gardien renforcé, et des récompenses multipliées par 1,5.' : 'Gardien du jour : ' + g.emoji + ' ' + g.nom + '.',
      equipe: { errant: 'tout', phaena: 'tout', griffon: 'tout' },
      gloire: true,
      rencontres: [
        { nom: 'Rencontre : ' + paire.map(id => D.ENNEMIS[id].nom).join(' et '), ennemis: paire },
        { nom: 'Le Gardien : ' + g.nom, ennemis: [gardien], modif: dimanche ? { pvMax: 1.2, attaque: 1.1 } : null }
      ]
    };
  }

  function generee2(jour, date) {
    const hasard = M.creerHasard(M.graineDuJour(date + '|epreuve2|' + jour));
    const choisir = l => l[Math.floor(hasard() * l.length)];
    const js = jourSemaine(date), dimanche = js === 0;
    const gardien = dimanche ? 'campe' : GARDIENS2[js];
    const paire = choisir(PAIRES2), g = D.ENNEMIS[gardien];
    const garde = gardien === 'campe' ? { nom: 'Le Gardien : ' + g.nom, ennemis: ['chaine', 'campe', 'chaine'], modif: dimanche ? { pvMax: 1.1, attaque: 1.05 } : null }
      : { nom: 'Le Gardien : ' + g.nom, ennemis: [gardien], modif: dimanche ? { pvMax: 1.2, attaque: 1.1 } : null };
    return {
      jour, genere: true, dimanche, gardienId: gardien, interlude: true, chaleur: gardien === 'arges' || gardien === 'talos',
      titre: (dimanche ? 'Épreuve des Dieux : ' : '') + choisir(LIEUX2[gardien]),
      presage: choisir(PRESAGES2[gardien]) + ' Le Chant III se prépare.',
      bonus: dimanche ? { xp: 1.5, drachmes: 1.5 } : null,
      nouveau: dimanche ? 'Dimanche : un Gardien renforcé, et des récompenses multipliées par 1,5.' : 'Gardien du jour : ' + g.emoji + ' ' + g.nom + '.',
      equipe: EQUIPE_COMPLETE, gloire: true,
      rencontres: [{ nom: 'Rencontre : ' + paire.map(id => D.ENNEMIS[id].nom).join(' et '), ennemis: paire }, garde]
    };
  }

  const Epreuves = { epreuve, jourSemaine };
  if (node) module.exports = Epreuves; else racine.Epreuves = Epreuves;
})(typeof window !== 'undefined' ? window : this);
