/* Le Fil des Moires : épreuve du jour.
   Jours 1 à 3 : le prologue écrit. À partir du jour 4 : une épreuve générée à partir de la date. */
(function (racine) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const D = node ? require('./data.js') : racine.Donnees;
  const M = node ? require('./engine.js') : racine.Moteur;

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

  function epreuve(jour, date) {
    if (jour <= 3) return Object.assign({ jour }, D.JOURS[jour - 1]);
    const hasard = M.creerHasard(M.graineDuJour(date + '|epreuve|' + jour));
    const choisir = l => l[Math.floor(hasard() * l.length)];
    const js = jourSemaine(date);
    const dimanche = js === 0;
    const gardien = dimanche ? choisir(['hydre', 'cyclope', 'chimere']) : GARDIENS[js];
    const paire = choisir(PAIRES);
    const lieu = choisir(LIEUX[gardien]);
    const g = D.ENNEMIS[gardien];
    return {
      jour, genere: true, dimanche, gardienId: gardien,
      titre: (dimanche ? 'Épreuve des Dieux : ' : '') + lieu,
      presage: choisir(PRESAGES[gardien]),
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
