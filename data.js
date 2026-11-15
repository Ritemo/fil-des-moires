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
      desc: "Un fêtard des bois, plus dangereux qu'il n'en a l'air. Il frappe au hasard.",
      special: 'Tous les 3 tours, Flûte de Pan : touche toute ton équipe (annoncée par ⚠️).',
      competences: [
        { id: 'coupcorne', nom: 'Coup de corne', type: 'attaque', cible: 'ennemi', puissance: 32, poids: 'normal', affinite: 'airain' },
        { id: 'flute', nom: 'Flûte de Pan', type: 'attaque', cible: 'ennemi', zone: true, puissance: 18, poids: 'normal', affinite: 'sylve', chaque: 3 }
      ]
    },
    harpie: {
      id: 'harpie', nom: 'Harpie', emoji: '🦇', affinite: 'vent', pvMax: 100, attaque: 25, defense: 10, vitesse: 135,
      comportement: 'agressif',
      desc: 'Rapide et cruelle, elle vise toujours le plus faible de ton équipe.',
      special: 'Très rapide : elle joue souvent. Cible en priorité le héros qui a le moins de PV.',
      competences: [
        { id: 'griffes', nom: 'Griffes', type: 'attaque', cible: 'ennemi', puissance: 28, poids: 'leger', affinite: 'airain' },
        { id: 'bourrasque', nom: 'Bourrasque', type: 'attaque', cible: 'ennemi', puissance: 38, poids: 'normal', affinite: 'vent' }
      ]
    },
    hydre: {
      id: 'hydre', nom: "Hydre de l'Étang", emoji: '🐉', affinite: 'onde', pvMax: 560, attaque: 31, defense: 20, vitesse: 90,
      mecanique: 'hydre', tetes: 1, tetesMax: 4, comportement: 'aleatoire', gardien: true,
      desc: "La gardienne de l'étang. On dit qu'elle ne meurt pas comme les autres bêtes.",
      special: "Chaque coup de 30 dégâts ou plus qui n'est pas de Flamme fait repousser une tête (max 4). Chaque tête = une morsure de plus par tour. Un coup de Flamme cautérise : plus de repousse pendant 2 de ses tours. Tous les 3 tours : Déluge sur toute l'équipe.",
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
    peuEfficace: "Peu efficace. Cette affinité est faible contre ta cible. Touche 📖 en haut à droite pour revoir le cycle dans le Lexique.",
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

  // Lexique consultable à tout moment
  const LEXIQUE = [
    { cat: 'Combat', icone: '⏳', terme: 'File', texte: "La rangée en haut de l'écran : l'ordre des 8 prochains tours. Le plus grand jeton joue maintenant." },
    { cat: 'Combat', icone: '🔹', terme: 'Énergie', texte: "Les points bleus sous chaque héros. +1 au début de chaque tour (max 5). Les compétences fortes en coûtent (🔹🔹 = 2 points). Les compétences gratuites n'en coûtent pas." },
    { cat: 'Combat', icone: '💥', terme: 'Puissance', texte: "La force de base d'une attaque (Puiss. 40). Les dégâts réels dépendent aussi de l'attaque du lanceur, de la défense de la cible, de l'affinité et d'un peu de hasard." },
    { cat: 'Combat', icone: '🪶', terme: 'Poids', texte: "Léger : tu rejoues vite. Normal. Lourd : tu frappes fort mais tu recules dans la File." },
    { cat: 'Combat', icone: '🛡️', terme: 'Garde', texte: "Tu protèges un allié jusqu'à ton prochain tour : le prochain coup qui le vise est pour toi, et tu n'en prends que la moitié." },
    { cat: 'Combat', icone: '⏩', terme: 'Présage', texte: "Compétence de Phaéna : l'allié choisi joue juste après elle." },
    { cat: 'Combat', icone: '🏆', terme: 'Gloire', texte: "Jauge commune. Elle monte quand tu touches, surtout avec un coup efficace, un critique ou un ennemi vaincu. Pleine : la Prouesse est disponible." },
    { cat: 'Combat', icone: '⚔️', terme: 'Prouesse', texte: "La Phalange des Moires : l'Errant frappe tous les ennemis d'un coup. Vide la Gloire." },
    { cat: 'Combat', icone: '🩷', terme: 'Hubris', texte: "La fine barre rose sous l'Énergie. Les compétences les plus puissantes la remplissent. À 100 : Némésis." },
    { cat: 'Combat', icone: '⚖️', terme: 'Némésis', texte: "La punition de l'orgueil : tu perds ton prochain tour et 15 % de tes PV. L'Hubris retombe à 0." },
    { cat: 'Combat', icone: '⚠️', terme: 'Annonce', texte: "Un ⚠️ sur un jeton de la File : cet ennemi prépare un grand coup. Le nom du coup s'affiche quand c'est son tour." },
    { cat: 'États', icone: '🔥', terme: 'Brûlure', texte: "Perd quelques PV au début de ses 2 prochains tours." },
    { cat: 'États', icone: '💫', terme: 'Étourdi', texte: "Perd son prochain tour." },
    { cat: 'États', icone: '♨️', terme: 'Cautérisé', texte: "Propre à l'Hydre : aucune tête ne peut repousser pendant 2 de ses tours." },
    { cat: 'États', icone: '🐍', terme: 'Têtes', texte: "Nombre de têtes de l'Hydre. Chaque tête = une attaque par tour." },
    { cat: 'Épreuve', icone: '📅', terme: 'Épreuve du jour', texte: "Une nouvelle épreuve chaque jour. Une seule tentative compte pour les récompenses." },
    { cat: 'Épreuve', icone: '🔁', terme: 'Mode Écho', texte: "Rejouer l'épreuve après ta tentative, pour t'entraîner. Aucune récompense." },
    { cat: 'Épreuve', icone: '⭐', terme: 'Étoiles', texte: "3 : victoire sans perte. 2 : un héros tombé. 1 : victoire de justesse." }
  ];

  const Donnees = { HEROS, ENNEMIS, EPREUVE, CLOTHO, LEXIQUE };
  if (typeof module !== 'undefined' && module.exports) module.exports = Donnees;
  else racine.Donnees = Donnees;
})(typeof window !== 'undefined' ? window : this);
