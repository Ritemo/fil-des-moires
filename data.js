/* Le Fil des Moires : contenu de la phase 0 (héros, ennemis, épreuve, conseils de Clotho). */
(function (racine) {
  'use strict';

  const garde = { id: 'garde', nom: 'Garde', type: 'garde', cible: 'autreAllie', cout: 0, poids: 'leger', affinite: 'airain',
    desc: "Protège un allié jusqu'à ton prochain tour : tu encaisses à sa place la moitié du coup." };

  const HEROS = [
    {
      id: 'errant', nom: "L'Errant", emoji: '🧔🏻', role: 'Hoplite', affinite: 'airain',
      pvMax: 170, attaque: 30, defense: 20, vitesse: 100, energieDepart: 2,
      competences: [
        { id: 'frappe', nom: 'Frappe', type: 'attaque', cible: 'ennemi', puissance: 40, cout: 0, poids: 'normal', affinite: 'airain', desc: 'Un coup de glaive simple.' },
        { id: 'torche', nom: 'Coup de torche', type: 'attaque', cible: 'ennemi', puissance: 34, cout: 1, poids: 'normal', affinite: 'flamme', brulure: { tours: 2, degats: 8 }, desc: 'Flamme. Brûle la cible 2 tours. Cautérise les plaies de l\'Hydre.' },
        { id: 'charge', nom: 'Charge lourde', type: 'attaque', cible: 'ennemi', puissance: 72, cout: 2, poids: 'lourd', affinite: 'airain', etourdit: 0.3, desc: 'Lourd : frappe fort mais te recule dans la file. 30 % d\'étourdir.' },
        { id: 'ares', nom: "Colère d'Arès", type: 'attaque', cible: 'ennemi', puissance: 115, cout: 3, poids: 'lourd', affinite: 'airain', hubris: 50, desc: 'Énorme, mais +50 Hubris. À 100, Némésis frappe.' },
        garde,
        { id: 'prouesse', nom: 'Phalange des Moires', type: 'attaque', cible: 'ennemi', zone: true, puissance: 85, cout: 0, poids: 'normal', affinite: 'airain', prouesse: true, desc: 'Prouesse (Gloire pleine) : toute l\'équipe frappe tous les ennemis.' }
      ]
    },
    {
      id: 'phaena', nom: 'Phaéna', emoji: '🧝🏻‍♀️', role: 'Oracle', affinite: 'lumiere',
      pvMax: 115, attaque: 27, defense: 14, vitesse: 115, energieDepart: 2,
      competences: [
        { id: 'rayon', nom: 'Rayon', type: 'attaque', cible: 'ennemi', puissance: 36, cout: 0, poids: 'normal', affinite: 'lumiere', desc: 'Lumière. Fort contre l\'Ombre.' },
        { id: 'ronces', nom: 'Ronces de Déméter', type: 'attaque', cible: 'ennemi', puissance: 46, cout: 2, poids: 'normal', affinite: 'sylve', recul: 40, desc: 'Sylve, fort contre l\'Onde. Recule la cible dans la file.' },
        { id: 'soin', nom: 'Baume de Déméter', type: 'soin', cible: 'allie', puissance: 48, cout: 2, poids: 'normal', affinite: 'sylve', desc: 'Rend environ 48 PV à un allié.' },
        { id: 'presage', nom: 'Présage', type: 'presage', cible: 'autreAllie', cout: 2, poids: 'leger', affinite: 'lumiere', desc: 'Léger. L\'allié choisi joue juste après toi.' },
        garde
      ]
    },
    {
      id: 'griffon', nom: 'Griffon', emoji: '🦅', role: 'Créature liée', affinite: 'foudre',
      pvMax: 125, attaque: 32, defense: 15, vitesse: 130, energieDepart: 2,
      competences: [
        { id: 'serres', nom: 'Serres', type: 'attaque', cible: 'ennemi', puissance: 30, cout: 0, poids: 'leger', affinite: 'airain', desc: 'Léger : tu rejoues vite.' },
        { id: 'eclair', nom: 'Éclair', type: 'attaque', cible: 'ennemi', puissance: 52, cout: 2, poids: 'normal', affinite: 'foudre', desc: 'Foudre, fort contre le Vent.' },
        { id: 'pique', nom: 'Piqué orageux', type: 'attaque', cible: 'ennemi', puissance: 88, cout: 3, poids: 'lourd', affinite: 'foudre', hubris: 40, desc: 'Lourd, +40 Hubris.' },
        garde
      ]
    }
  ];

  const ENNEMIS = {
    satyre: {
      id: 'satyre', nom: 'Satyre ivre', emoji: '🐐', affinite: 'sylve', pvMax: 130, attaque: 27, defense: 14, vitesse: 105,
      comportement: 'aleatoire',
      competences: [
        { id: 'coupcorne', nom: 'Coup de corne', type: 'attaque', cible: 'ennemi', puissance: 32, poids: 'normal', affinite: 'airain' },
        { id: 'flute', nom: 'Flûte de Pan', type: 'attaque', cible: 'ennemi', zone: true, puissance: 18, poids: 'normal', affinite: 'sylve', chaque: 3 }
      ]
    },
    harpie: {
      id: 'harpie', nom: 'Harpie', emoji: '🦇', affinite: 'vent', pvMax: 100, attaque: 25, defense: 10, vitesse: 135,
      comportement: 'agressif',
      competences: [
        { id: 'griffes', nom: 'Griffes', type: 'attaque', cible: 'ennemi', puissance: 28, poids: 'leger', affinite: 'airain' },
        { id: 'bourrasque', nom: 'Bourrasque', type: 'attaque', cible: 'ennemi', puissance: 38, poids: 'normal', affinite: 'vent' }
      ]
    },
    hydre: {
      id: 'hydre', nom: "Hydre de l'Étang", emoji: '🐉', affinite: 'onde', pvMax: 560, attaque: 31, defense: 20, vitesse: 90,
      mecanique: 'hydre', tetes: 1, tetesMax: 4, comportement: 'aleatoire', gardien: true,
      competences: [
        { id: 'morsure', nom: 'Morsure', type: 'attaque', cible: 'ennemi', puissance: 30, poids: 'normal', affinite: 'airain' },
        { id: 'jet', nom: "Jet d'eau", type: 'attaque', cible: 'ennemi', puissance: 36, poids: 'normal', affinite: 'onde' },
        { id: 'deluge', nom: 'Déluge', type: 'attaque', cible: 'ennemi', zone: true, puissance: 44, poids: 'lourd', affinite: 'onde', chaque: 3 }
      ]
    }
  };

  // L'épreuve de la phase 0 : 2 rencontres, toujours les mêmes ennemis, mais le hasard dépend du jour.
  const EPREUVE = {
    titre: "L'Étang des Sept Têtes",
    presage: "« Le fil se noue près d'un étang noir. Un chant de flûte, des ailes, puis une bête qui ne meurt pas comme les autres. »",
    rencontres: [
      { nom: 'Rencontre 1 : la clairière', ennemis: ['satyre', 'harpie'] },
      { nom: 'Le Gardien : l\'Hydre', ennemis: ['hydre'] }
    ],
    soinEntre: 0.3
  };

  // Conseils de Clotho, déclenchés la première fois qu'une situation arrive.
  const CLOTHO = {
    debut: "Je suis Clotho. J'ai filé ton fil, il est encore vierge. En haut, la File : qui joue, et dans quel ordre. Touche une compétence, puis une cible.",
    poids: "Chaque action a un poids. Léger : tu rejoues vite. Lourd : tu frappes fort, mais tu recules dans la File. Regarde-la avant de choisir.",
    efficace: "Efficace ! Flamme bat Sylve, Sylve bat Onde, Onde bat Flamme. Foudre bat Vent, Vent bat Roc, Roc bat Foudre.",
    peuEfficace: "Peu efficace. Cette affinité est faible contre ta cible. Touche le ⓘ de la File pour revoir le cycle.",
    gloire: "La Gloire est pleine. L'Errant peut lancer la Phalange des Moires : toute l'équipe frappe ensemble.",
    hubris: "Attention à l'Hubris. Les dieux tolèrent l'audace, pas l'orgueil. À 100, Némésis te fait perdre un tour.",
    nemesis: "Némésis est passée. Je te l'avais dit, les fils trop tendus se rompent.",
    annonce: "Une icône ⚠️ dans la File : l'ennemi prépare un grand coup. Une Garde, un soin ou un Présage au bon moment changent tout.",
    gardien: "Le Gardien. Cette Hydre fait repousser une tête à chaque gros coup qui n'est pas de Flamme. Le feu cautérise, mais l'eau résiste au feu. À toi de doser.",
    tete: "Une tête repousse. Chaque tête, c'est une morsure de plus à chacun de ses tours.",
    ko: "Un des tiens est tombé. Il se relèvera demain, mais l'épreuve du jour n'attend pas.",
    victoire: "Le fil tient. Pour aujourd'hui.",
    defaite: "Le fil a cédé, pas rompu. Reviens demain, ou rejoue en Écho pour apprendre, sans récompense."
  };

  const Donnees = { HEROS, ENNEMIS, EPREUVE, CLOTHO };
  if (typeof module !== 'undefined' && module.exports) module.exports = Donnees;
  else racine.Donnees = Donnees;
})(typeof window !== 'undefined' ? window : this);
