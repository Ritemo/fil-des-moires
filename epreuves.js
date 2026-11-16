/* Le Fil des Moires : épreuve du jour.
   Jours 1 à 30 : le Chant I écrit (chant1.js ; les jours 1 à 3 gardent les combats du prologue).
   Si l'Hydre éveillée n'est pas vaincue au jour 30, la finale revient chaque jour.
   Ensuite, en attendant le Chant II : une épreuve générée à partir de la date. */
(function (racine) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const D = node ? require('./data.js') : racine.Donnees;
  const M = node ? require('./engine.js') : racine.Moteur;
  const C = node ? require('./chant1.js') : racine.Chant1;

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
    return generee(jour, date);
  }

  function generee(jour, date) {
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

  const Epreuves = { epreuve, jourSemaine };
  if (node) module.exports = Epreuves; else racine.Epreuves = Epreuves;
})(typeof window !== 'undefined' ? window : this);
