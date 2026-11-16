/* Le Fil des Moires : contenu de la phase 0 (héros, ennemis, épreuve, conseils de Clotho). */
(function (racine) {
  'use strict';

  const garde = { id: 'garde', art: '🛡️', nom: 'Garde', type: 'garde', cible: 'autreAllie', cout: 0, poids: 'leger', affinite: 'airain',
    desc: "Protège un allié jusqu'à ton prochain tour : tu encaisses à sa place la moitié du coup." };

  const HEROS = [
    {
      id: 'errant', nom: "L'Errant", emoji: '🧔🏻', role: 'Hoplite', affinite: 'airain',
      bio: "Un mortel sans nom, éveillé dans une clairière avec un glaive trop beau pour un vagabond. Son fil est vierge : Atropos ne peut pas le voir.",
      pvMax: 170, attaque: 30, defense: 20, vitesse: 100, energieDepart: 2,
      competences: [
        { id: 'frappe', art: '🗡️', nom: 'Frappe', type: 'attaque', cible: 'ennemi', puissance: 40, cout: 0, poids: 'normal', affinite: 'airain', desc: 'Un coup de glaive simple.' },
        { id: 'torche', art: '🔥', nom: 'Coup de torche', type: 'attaque', cible: 'ennemi', puissance: 34, cout: 1, poids: 'normal', affinite: 'flamme', brulure: { tours: 2, degats: 8 }, desc: 'Flamme. Brûle la cible 2 tours. Cautérise les plaies de l\'Hydre.' },
        { id: 'charge', art: '🐂', nom: 'Charge lourde', type: 'attaque', cible: 'ennemi', puissance: 72, cout: 2, poids: 'lourd', affinite: 'airain', etourdit: 0.3, desc: 'Lourd : frappe fort mais te recule dans la file. 30 % d\'étourdir.' },
        { id: 'ares', art: '⚔️', nom: "Colère d'Arès", type: 'attaque', cible: 'ennemi', puissance: 115, cout: 3, poids: 'lourd', affinite: 'airain', desc: 'Le coup le plus puissant de l\'Errant. Lourd et coûteux.' },
        { id: 'pommeau', art: '🔨', nom: 'Coup de pommeau', type: 'attaque', cible: 'ennemi', puissance: 22, cout: 0, poids: 'leger', affinite: 'airain', etourdit: 0.5, desc: 'Léger. 50 % d\'étourdir la cible.' },
        { id: 'ralliement', art: '📯', nom: 'Cri de ralliement', type: 'ralliement', cible: 'aucune', zone: true, puissance: 20, gloire: 25, cout: 2, poids: 'normal', affinite: 'airain', desc: '+25 Gloire et environ 20 PV pour toute l\'équipe.' },
        { id: 'mur', art: '🛡️', nom: 'Mur de boucliers', voie: 'hoplite', type: 'bouclier', cible: 'aucune', zone: true, cout: 2, poids: 'leger', affinite: 'airain', desc: 'Léger. Toute l\'équipe prend moitié moins de dégâts au prochain coup reçu.' },
        { id: 'coupbouclier', art: '🔰', nom: 'Coup de bouclier', voie: 'hoplite', type: 'attaque', cible: 'ennemi', puissance: 34, cout: 1, poids: 'normal', affinite: 'airain', etourdit: 0.6, desc: '60 % d\'étourdir la cible.' },
        { id: 'fleche', art: '🏹', nom: "Flèche d'Artémis", voie: 'chasseur', type: 'attaque', cible: 'ennemi', puissance: 46, cout: 1, poids: 'leger', affinite: 'sylve', critique: 0.5, desc: 'Sylve, légère. 50 % de coup critique.' },
        { id: 'pluie', art: '🌧️', nom: 'Pluie de flèches', voie: 'chasseur', type: 'attaque', cible: 'ennemi', zone: true, puissance: 30, cout: 2, poids: 'normal', affinite: 'vent', desc: 'Vent. Touche tous les ennemis.' },
        { id: 'lameombre', art: '🌑', nom: "Lame d'ombre", voie: 'mystique', type: 'attaque', cible: 'ennemi', puissance: 54, cout: 1, poids: 'normal', affinite: 'ombre', desc: 'Ombre, forte contre la Lumière.' },
        { id: 'benediction', art: '🕊️', nom: 'Bénédiction', voie: 'mystique', type: 'benediction', cible: 'allie', puissance: 36, cout: 2, poids: 'normal', affinite: 'lumiere', desc: 'Soigne un allié (environ 36 PV) et rend son prochain coup critique.' },
        garde,
        { id: 'prouesse', art: '🏛️', nom: 'Phalange des Moires', type: 'attaque', cible: 'ennemi', zone: true, puissance: 85, cout: 0, poids: 'normal', affinite: 'airain', prouesse: true, desc: 'Prouesse (Gloire pleine) : toute l\'équipe frappe tous les ennemis.' }
      ]
    },
    {
      id: 'phaena', nom: 'Phaéna', emoji: '🧝🏻‍♀️', role: 'Oracle', affinite: 'lumiere',
      titre: "l'oracle aux yeux d'or",
      bio: "Elle voit le fil de chaque être, sauf le tien. Elle a quitté le sanctuaire d'Apollon quand ses visions ont commencé à se contredire. Derrière toi, dit-elle, il y a un nœud.",
      apport: "Elle soigne, protège et manipule la File : avec son Présage, un allié rejoue juste après elle.",
      pvMax: 115, attaque: 27, defense: 14, vitesse: 115, energieDepart: 2,
      competences: [
        { id: 'rayon', art: '☀️', nom: 'Rayon', type: 'attaque', cible: 'ennemi', puissance: 36, cout: 0, poids: 'normal', affinite: 'lumiere', desc: 'Lumière. Fort contre l\'Ombre.' },
        { id: 'ronces', art: '🌿', nom: 'Ronces de Déméter', type: 'attaque', cible: 'ennemi', puissance: 46, cout: 2, poids: 'normal', affinite: 'sylve', recul: 40, desc: 'Sylve, fort contre l\'Onde. Recule la cible dans la file.' },
        { id: 'soin', art: '🍯', nom: 'Baume de Déméter', type: 'soin', cible: 'allie', puissance: 48, cout: 2, poids: 'normal', affinite: 'sylve', desc: 'Rend environ 48 PV à un allié.' },
        { id: 'aube', art: '🌅', nom: "Aube d'Apollon", type: 'soin', cible: 'allie', zone: true, puissance: 30, cout: 3, poids: 'normal', affinite: 'lumiere', desc: 'Soigne toute l\'équipe (environ 30 PV chacun).' },
        { id: 'oeil', art: '👁️', nom: "Œil d'Apollon", type: 'oeil', cible: 'autreAllie', cout: 1, poids: 'leger', affinite: 'lumiere', desc: 'Léger. Le prochain coup de l\'allié choisi sera critique.' },
        { id: 'presage', art: '🔮', nom: 'Présage', type: 'presage', cible: 'autreAllie', cout: 2, poids: 'leger', affinite: 'lumiere', desc: 'Léger. L\'allié choisi joue juste après toi.' },
        garde
      ]
    },
    {
      id: 'griffon', nom: 'Kelos', emoji: '🦅', role: 'Griffon d\'orage', affinite: 'foudre',
      titre: "le griffon d'orage",
      bio: "Un griffon à demi effiloché, que tu as trouvé pris dans les ronces au bord de l'Étang. Tu as noué ton fil au sien : il ne te quittera plus. Il ne parle pas, mais ses plumes disent tout.",
      apport: "Très rapide, il frappe souvent avec des attaques légères, et foudroie les créatures du Vent.",
      pvMax: 125, attaque: 32, defense: 15, vitesse: 130, energieDepart: 2,
      competences: [
        { id: 'serres', art: '🦅', nom: 'Serres', type: 'attaque', cible: 'ennemi', puissance: 30, cout: 0, poids: 'leger', affinite: 'airain', desc: 'Léger : tu rejoues vite.' },
        { id: 'eclair', art: '⚡', nom: 'Éclair', type: 'attaque', cible: 'ennemi', puissance: 52, cout: 2, poids: 'normal', affinite: 'foudre', desc: 'Foudre, fort contre le Vent.' },
        { id: 'cri', art: '📢', nom: 'Cri perçant', type: 'attaque', cible: 'ennemi', puissance: 20, cout: 0, poids: 'leger', affinite: 'airain', recul: 50, desc: 'Léger. Fait reculer la cible dans la File.' },
        { id: 'rafale', art: '🌪️', nom: 'Rafale', type: 'attaque', cible: 'ennemi', zone: true, puissance: 34, cout: 3, poids: 'normal', affinite: 'vent', desc: 'Vent. Touche tous les ennemis.' },
        { id: 'pique', art: '🌩️', nom: 'Piqué orageux', type: 'attaque', cible: 'ennemi', puissance: 88, cout: 3, poids: 'lourd', affinite: 'foudre', desc: 'Lourd : un plongeon dévastateur.' },
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
    sirene: {
      id: 'sirene', nom: 'Sirène des récifs', emoji: '🧜‍♀️', affinite: 'onde', pvMax: 105, attaque: 26, defense: 12, vitesse: 120,
      comportement: 'aleatoire',
      desc: "Elle chantait pour noyer les marins. L'Effilochage a rendu son chant fou.",
      special: "Tous les 3 tours, son Chant touche toute l'équipe et peut étourdir (25 %).",
      competences: [
        { id: 'griffe', nom: 'Griffe', type: 'attaque', cible: 'ennemi', puissance: 30, poids: 'normal', affinite: 'airain' },
        { id: 'vague', nom: 'Vague', type: 'attaque', cible: 'ennemi', puissance: 36, poids: 'normal', affinite: 'onde' },
        { id: 'chant', nom: 'Chant des abysses', type: 'attaque', cible: 'ennemi', zone: true, puissance: 16, etourdit: 0.25, poids: 'normal', affinite: 'onde', chaque: 3 }
      ]
    },
    cyclope: {
      id: 'cyclope', nom: 'Cyclope des Monts', emoji: '👹', affinite: 'roc', pvMax: 1000, attaque: 54, defense: 24, vitesse: 85,
      mecanique: 'cyclope', comportement: 'agressif', gardien: true,
      desc: "Un géant à l'œil unique, geôlier oublié d'une prison de pierre.",
      special: "Lent mais très fort. Un coup de Lumière l'aveugle : sa prochaine attaque a de grandes chances de rater. Tous les 3 tours : Séisme sur toute l'équipe.",
      competences: [
        { id: 'massue', nom: 'Massue', type: 'attaque', cible: 'ennemi', puissance: 44, poids: 'lourd', affinite: 'airain' },
        { id: 'rocher', nom: 'Jet de rocher', type: 'attaque', cible: 'ennemi', puissance: 38, poids: 'normal', affinite: 'roc' },
        { id: 'seisme', nom: 'Séisme', type: 'attaque', cible: 'ennemi', zone: true, puissance: 40, poids: 'lourd', affinite: 'roc', chaque: 3 }
      ]
    },
    chimere: {
      id: 'chimere', nom: 'Chimère', emoji: '🦁', affinite: 'flamme', pvMax: 880, attaque: 44, defense: 18, vitesse: 115,
      comportement: 'aleatoire', gardien: true,
      desc: "Lion, chèvre et serpent à la fois. Trois têtes, trois colères.",
      special: "Ses Crocs frappent deux fois de suite. Tous les 3 tours, son Souffle brûle toute l'équipe.",
      competences: [
        { id: 'crocs', nom: 'Crocs jumeaux', type: 'attaque', cible: 'ennemi', puissance: 22, coups: 2, poids: 'normal', affinite: 'airain' },
        { id: 'cornes', nom: 'Cornes de chèvre', type: 'attaque', cible: 'ennemi', puissance: 34, poids: 'normal', affinite: 'flamme' },
        { id: 'souffle', nom: 'Souffle ardent', type: 'attaque', cible: 'ennemi', zone: true, puissance: 30, brulure: { tours: 2, degats: 7 }, poids: 'lourd', affinite: 'flamme', chaque: 3 }
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
    },
    // ---------- Chant I : les Vals d'Aelwen ----------
    dryade: {
      id: 'dryade', nom: 'Dryade effilochée', emoji: '🧚‍♀️', affinite: 'sylve', pvMax: 115, attaque: 24, defense: 14, vitesse: 100,
      comportement: 'aleatoire',
      desc: "Gardienne d'un arbre, elle ne reconnaît plus personne. Sa sève est devenue grise.",
      special: 'Tous les 3 tours, Sève grise : soigne un de ses alliés (ou elle-même). Abats-la en premier.',
      competences: [
        { id: 'branche', nom: 'Coup de branche', type: 'attaque', cible: 'ennemi', puissance: 30, poids: 'normal', affinite: 'airain' },
        { id: 'epines', nom: 'Épines', type: 'attaque', cible: 'ennemi', puissance: 34, poids: 'normal', affinite: 'sylve' },
        { id: 'sevegrise', nom: 'Sève grise', type: 'soin', cible: 'allie', puissance: 40, poids: 'normal', affinite: 'sylve', chaque: 3 }
      ]
    },
    effile: {
      id: 'effile', nom: 'Effilé', emoji: '🥷', affinite: 'ombre', pvMax: 115, attaque: 25, defense: 13, vitesse: 112,
      comportement: 'agressif', mortel: true,
      desc: "Un fidèle d'Atropos. Il s'est coupé ses propres souvenirs et sourit comme quelqu'un qui n'a plus peur de rien.",
      special: "Son Coupe-souvenir peut te faire oublier ton prochain tour (25 %). C'est un mortel : on ne lie pas un fil humain.",
      competences: [
        { id: 'dague', nom: 'Dague grise', type: 'attaque', cible: 'ennemi', puissance: 28, poids: 'leger', affinite: 'airain' },
        { id: 'coupesouvenir', nom: 'Coupe-souvenir', type: 'attaque', cible: 'ennemi', puissance: 26, etourdit: 0.25, poids: 'normal', affinite: 'ombre' }
      ]
    },
    sanglier: {
      id: 'sanglier', nom: "Sanglier d'Érymanthe", emoji: '🐗', affinite: 'roc', pvMax: 900, attaque: 50, defense: 26, vitesse: 95,
      comportement: 'aleatoire', gardien: true,
      desc: "Une bête de légende, aux défenses de pierre. L'Effilochage l'a rendue folle de rage.",
      special: "Roc : la Foudre glisse sur lui, le Vent l'ébranle. Tous les 3 tours, Piétinement sur toute l'équipe.",
      competences: [
        { id: 'defenses', nom: 'Défenses', type: 'attaque', cible: 'ennemi', puissance: 40, poids: 'normal', affinite: 'airain' },
        { id: 'charge_s', nom: 'Charge de pierre', type: 'attaque', cible: 'ennemi', puissance: 56, poids: 'lourd', affinite: 'roc' },
        { id: 'pietinement', nom: 'Piétinement', type: 'attaque', cible: 'ennemi', zone: true, puissance: 38, poids: 'lourd', affinite: 'roc', chaque: 3 }
      ]
    },
    lysandre: {
      id: 'lysandre', nom: 'Lysandre la Coupeuse', emoji: '✂️', affinite: 'ombre', pvMax: 720, attaque: 42, defense: 20, vitesse: 118,
      comportement: 'agressif', gardien: true, mortel: true,
      desc: "La prêtresse des Effilés. Elle s'est coupé tous ses souvenirs, sauf sa promesse à Atropos.",
      special: "Ombre : la Lumière la blesse. Ses Ciseaux frappent deux fois. Tous les 3 tours, Grande Coupe sur toute l'équipe (20 % d'oublier son tour).",
      competences: [
        { id: 'ciseaux', nom: 'Ciseaux', type: 'attaque', cible: 'ennemi', puissance: 22, coups: 2, poids: 'normal', affinite: 'ombre' },
        { id: 'oubli', nom: 'Oubli', type: 'attaque', cible: 'ennemi', puissance: 30, etourdit: 0.3, poids: 'normal', affinite: 'ombre' },
        { id: 'grandecoupe', nom: 'Grande Coupe', type: 'attaque', cible: 'ennemi', zone: true, puissance: 32, etourdit: 0.2, poids: 'lourd', affinite: 'ombre', chaque: 3 }
      ]
    },
    hydre_eveillee: {
      id: 'hydre_eveillee', nom: "L'Hydre éveillée", emoji: '🐲', affinite: 'onde', pvMax: 600, attaque: 31, defense: 22, vitesse: 92,
      mecanique: 'hydre', tetes: 1, tetesMax: 5, comportement: 'aleatoire', gardien: true,
      desc: "Mille ans qu'elle garde la pierre d'étoile sous l'étang. Cette fois, elle ne replongera pas.",
      special: "Comme l'Hydre de l'Étang, en plus terrible : jusqu'à 5 têtes au lieu de 4. Chaque coup de 30 ou plus qui n'est pas de Flamme fait repousser une tête. La Flamme cautérise. Tous les 3 tours : Déluge sur toute l'équipe.",
      competences: [
        { id: 'morsure', nom: 'Morsure', type: 'attaque', cible: 'ennemi', puissance: 30, poids: 'normal', affinite: 'airain' },
        { id: 'jet', nom: "Jet d'eau", type: 'attaque', cible: 'ennemi', puissance: 38, poids: 'normal', affinite: 'onde' },
        { id: 'deluge', nom: 'Déluge', type: 'attaque', cible: 'ennemi', zone: true, puissance: 46, poids: 'lourd', affinite: 'onde', chaque: 3 }
      ]
    }
  };

  // Créatures qu'on peut lier après les avoir affaiblies (elles remplacent Kelos dans l'équipe, au choix)
  const LIER = { id: 'lier', art: '🧵', nom: 'Lier', type: 'lier', cible: 'liable', cout: 2, poids: 'normal', affinite: 'airain',
    desc: "Noue ton fil à celui d'une créature affaiblie (moins de 35 % de PV, hors Gardien). Plus elle est faible, plus le lien a de chances de tenir." };
  const CREATURES = [
    { id: 'satyre', nom: 'Satyre', emoji: '🐐', role: 'Créature liée', titre: 'le fêtard des bois', affinite: 'sylve',
      pvMax: 135, attaque: 28, defense: 15, vitesse: 108, energieDepart: 2,
      bio: "Il a dégrisé le jour où ton fil a touché le sien. Il en garde une reconnaissance bruyante, et une flûte.",
      apport: 'Robuste et polyvalent : il frappe, il soigne avec son vin, et sa flûte peut étourdir tous les ennemis.',
      competences: [
        { id: 'corne_l', art: '🐐', nom: 'Coup de corne', type: 'attaque', cible: 'ennemi', puissance: 40, cout: 0, poids: 'normal', affinite: 'airain', desc: 'Une charge tête baissée.' },
        { id: 'flute_l', art: '🪈', nom: 'Flûte de Pan', type: 'attaque', cible: 'ennemi', zone: true, puissance: 22, cout: 3, poids: 'normal', affinite: 'sylve', etourdit: 0.2, desc: 'Sylve. Touche tous les ennemis, 20 % d\'étourdir chacun.' },
        { id: 'vin_l', art: '🍷', nom: 'Vin de Dionysos', type: 'soin', cible: 'allie', puissance: 42, cout: 2, poids: 'normal', affinite: 'sylve', desc: 'Rend environ 42 PV à un allié.' }
      ] },
    { id: 'harpie', nom: 'Harpie', emoji: '🦇', role: 'Créature liée', titre: 'l\'aile noire', affinite: 'vent',
      pvMax: 105, attaque: 30, defense: 11, vitesse: 140, energieDepart: 2,
      bio: "Elle a cessé de crier le jour où tu l'as épargnée. Elle vole devant toi, et revient toujours.",
      apport: 'La plus rapide de toutes : elle joue souvent, frappe fort en Vent et repousse les ennemis dans la File.',
      competences: [
        { id: 'griffes_l', art: '🪶', nom: 'Griffes', type: 'attaque', cible: 'ennemi', puissance: 30, cout: 0, poids: 'leger', affinite: 'airain', desc: 'Légère : elle rejoue vite.' },
        { id: 'bourrasque_l', art: '🌪️', nom: 'Bourrasque', type: 'attaque', cible: 'ennemi', puissance: 50, cout: 2, poids: 'normal', affinite: 'vent', desc: 'Vent, fort contre le Roc.' },
        { id: 'cristrident_l', art: '📣', nom: 'Cri strident', type: 'attaque', cible: 'ennemi', puissance: 18, cout: 1, poids: 'leger', affinite: 'vent', recul: 60, desc: 'Légère. Repousse la cible loin dans la File.' }
      ] },
    { id: 'sirene', nom: 'Sirène', emoji: '🧜‍♀️', role: 'Créature liée', titre: 'la voix des récifs', affinite: 'onde',
      pvMax: 115, attaque: 29, defense: 13, vitesse: 122, energieDepart: 2,
      bio: "Ton fil a apaisé son chant. Elle chante encore, mais pour toi.",
      apport: 'L\'Onde qui manquait à l\'équipe : redoutable contre la Flamme et la Chimère. Elle soigne et endort.',
      competences: [
        { id: 'vague_l', art: '🌊', nom: 'Vague', type: 'attaque', cible: 'ennemi', puissance: 44, cout: 1, poids: 'normal', affinite: 'onde', desc: 'Onde, forte contre la Flamme.' },
        { id: 'chant_l', art: '🎶', nom: 'Chant des abysses', type: 'attaque', cible: 'ennemi', zone: true, puissance: 18, cout: 3, poids: 'normal', affinite: 'onde', etourdit: 0.3, desc: 'Onde. Touche tous les ennemis, 30 % d\'étourdir chacun.' },
        { id: 'ecume_l', art: '🫧', nom: 'Écume', type: 'soin', cible: 'allie', puissance: 36, cout: 2, poids: 'leger', affinite: 'onde', desc: 'Légère. Rend environ 36 PV à un allié.' }
      ] },
    { id: 'dryade', nom: 'Dryade', emoji: '🧚‍♀️', role: 'Créature liée', titre: 'la sève retrouvée', affinite: 'sylve',
      pvMax: 120, attaque: 26, defense: 14, vitesse: 104, energieDepart: 2,
      bio: "Ton fil a rendu sa sève verte. Elle ne retrouvera pas son arbre, alors elle a choisi de te suivre.",
      apport: 'La soigneuse de la nature : soins puissants, épines de Sylve contre l\'Onde, et des racines qui étourdissent.',
      competences: [
        { id: 'epines_l', art: '🌵', nom: 'Épines', type: 'attaque', cible: 'ennemi', puissance: 42, cout: 1, poids: 'normal', affinite: 'sylve', desc: 'Sylve, forte contre l\'Onde (et l\'Hydre).' },
        { id: 'seve_l', art: '🌿', nom: 'Sève verte', type: 'soin', cible: 'allie', puissance: 46, cout: 2, poids: 'normal', affinite: 'sylve', desc: 'Rend environ 46 PV à un allié.' },
        { id: 'racines_l', art: '🌳', nom: 'Racines', type: 'attaque', cible: 'ennemi', zone: true, puissance: 20, cout: 3, poids: 'normal', affinite: 'sylve', etourdit: 0.25, desc: 'Sylve. Touche tous les ennemis, 25 % d\'étourdir chacun.' }
      ] }
  ];

  // Rareté de chaque carte (la Garde n'est pas une carte : toujours disponible)
  const RARETES = {
    epines_l: 'commune', seve_l: 'rare', racines_l: 'epique', corne_l: 'commune', flute_l: 'epique', vin_l: 'rare', griffes_l: 'commune', bourrasque_l: 'rare', cristrident_l: 'rare', vague_l: 'rare', chant_l: 'epique', ecume_l: 'rare',
    mur: 'epique', coupbouclier: 'rare', fleche: 'rare', pluie: 'epique', lameombre: 'rare', benediction: 'epique',
    frappe: 'commune', torche: 'commune', pommeau: 'commune', charge: 'rare', ralliement: 'rare', ares: 'epique', prouesse: 'legendaire',
    rayon: 'commune', ronces: 'rare', soin: 'rare', aube: 'rare', presage: 'epique', oeil: 'epique',
    serres: 'commune', cri: 'commune', eclair: 'rare', rafale: 'rare', pique: 'epique'
  };
  // Les Voies de l'Errant : un passif et deux cartes exclusives
  const VOIES = {
    hoplite: { nom: 'Voie de l\'Hoplite', icone: '🛡️', resume: 'Tenir la ligne', passif: '+20 % de PV pour l\'Errant, et sa Garde n\'encaisse plus que 30 % du coup (au lieu de 50 %).',
      lore: "Le bouclier avant le glaive. Ceux qui marchent derrière toi rentreront chez eux.", cartes: ['mur', 'coupbouclier'] },
    chasseur: { nom: 'Voie du Chasseur', icone: '🏹', resume: 'Frapper juste et vite', passif: '+15 vitesse et +10 % de chance de critique pour l\'Errant.',
      lore: "Artémis t'a appris à voir la faille dans la cuirasse. Une seule flèche suffit, si elle part au bon moment.", cartes: ['fleche', 'pluie'] },
    mystique: { nom: 'Voie du Mystique', icone: '🔮', resume: 'Les fils et les ombres', passif: '+1 Énergie au départ et +1 Énergie maximum pour l\'Errant.',
      lore: "Ton fil est vierge : tu peux le tremper dans la lumière comme dans l'ombre. Clotho n'aime pas ça.", cartes: ['lameombre', 'benediction'] }
  };
  // Serments : à certains niveaux d'équipe, un choix définitif entre deux bénédictions
  const SERMENTS = {
    4: [{ id: 'aube', nom: "Serment de l'Aube", icone: '🌅', desc: '+1 Énergie au départ de chaque combat pour toute l\'équipe.' },
        { id: 'sang', nom: 'Serment du Sang', icone: '🩸', desc: '+10 % de PV pour toute l\'équipe.' }],
    8: [{ id: 'gloire', nom: 'Serment de Gloire', icone: '🏆', desc: 'La Gloire démarre à 30 au début de chaque épreuve.' },
        { id: 'vengeance', nom: 'Serment de Vengeance', icone: '⚔️', desc: '+15 % de dégâts tant qu\'un allié est tombé.' }],
    12: [{ id: 'fil', nom: 'Serment du Fil', icone: '🧵', desc: 'Tous les soins sont plus forts de 20 %.' },
         { id: 'airain', nom: "Serment de l'Airain", icone: '🛡️', desc: '+12 % de défense pour toute l\'équipe.' }],
    16: [{ id: 'hermes', nom: "Serment d'Hermès", icone: '🪽', desc: '+10 vitesse pour toute l\'équipe.' },
         { id: 'nemesis', nom: 'Serment de Némésis', icone: '🎯', desc: '+8 % de chance de critique pour toute l\'équipe.' }],
    20: [{ id: 'or', nom: "Serment d'Or", icone: '👑', desc: 'La Prouesse est plus puissante de 30 %.' },
         { id: 'souffle', nom: 'Second Souffle', icone: '💨', desc: 'Une fois par combat, le premier héros qui tombe se relève avec 25 % de ses PV.' }]
  };

  // Cartes possédées au départ (les autres se découvrent)
  const CARTES_DEPART = ['frappe', 'torche', 'charge', 'ares', 'prouesse', 'rayon', 'ronces', 'soin', 'presage', 'serres', 'eclair', 'pique'];
  // Équipement par défaut (4 cartes par héros)
  const EQUIPEMENT_DEPART = { errant: ['frappe', 'torche', 'charge', 'ares'], phaena: ['rayon', 'ronces', 'soin', 'presage'], griffon: ['serres', 'eclair', 'pique'] };

  // Épreuves par jour de jeu : le contenu se débloque progressivement.
  // equipe : héros présents et compétences disponibles ; gloire : jauge active ou non.
  const JOURS = [
    {
      titre: 'Le Prologue : la clairière',
      presage: "« Un mortel sans nom s'éveille dans une clairière. Une flûte ivre résonne entre les arbres. »",
      nouveau: 'Les bases du combat : la File, l\'Énergie et les affinités.',
      equipe: { errant: ['frappe', 'torche'] },
      gloire: false,
      rencontres: [{ nom: 'Le satyre de la clairière', ennemis: ['satyre'], modif: { pvMax: 0.8, attaque: 0.85 } }]
    },
    {
      titre: 'Le chemin des harpies',
      presage: "« Une oracle t'attend au bord du chemin. Au-dessus, des ailes noires tournent en cercle. »",
      nouveau: 'Phaéna rejoint l\'équipe : soins, Garde et poids des actions.',
      equipe: { errant: ['frappe', 'torche', 'charge', 'garde'], phaena: ['rayon', 'soin', 'ronces', 'garde'] },
      gloire: false,
      rencontres: [{ nom: 'Le chemin des harpies', ennemis: ['satyre', 'harpie'], modif: { pvMax: 0.85 } }]
    },
    {
      titre: "L'Étang des Sept Têtes",
      presage: "« Le fil se noue près d'un étang noir. Un chant de flûte, des ailes, puis une bête qui ne meurt pas comme les autres. »",
      nouveau: 'Kelos, le griffon d\'orage, se lie à toi. La Gloire et la Prouesse s\'éveillent. Premier Gardien.',
      equipe: { errant: 'tout', phaena: 'tout', griffon: 'tout' },
      gloire: true,
      rencontres: [
        { nom: 'Rencontre 1 : la clairière', ennemis: ['satyre', 'harpie'] },
        { nom: 'Le Gardien : l\'Hydre', ennemis: ['hydre'] }
      ]
    }
  ];
  // À partir du jour 4, l'épreuve complète (dans le prototype, toujours la même).
  function epreuveDuJour(n) { return JOURS[Math.min(n, JOURS.length) - 1]; }
  // Construit l'équipe d'un jour (copie des héros, compétences filtrées)
  function equipeDuJour(ep) {
    return HEROS.filter(h => ep.equipe[h.id]).map(h => {
      const liste = ep.equipe[h.id];
      const copie = JSON.parse(JSON.stringify(h));
      if (liste !== 'tout') copie.competences = copie.competences.filter(c => liste.includes(c.id));
      if (!ep.gloire) copie.competences = copie.competences.filter(c => !c.prouesse);
      return copie;
    });
  }
  function ennemisDeRencontre(r) {
    return r.ennemis.map(id => {
      const e = JSON.parse(JSON.stringify(ENNEMIS[id]));
      if (r.modif) Object.keys(r.modif).forEach(k => { e[k] = Math.round(e[k] * r.modif[k]); });
      return e;
    });
  }
  const SOIN_ENTRE = 0.3;

  // Conseils de Clotho, déclenchés la première fois qu'une situation arrive.
  const CLOTHO = {
    debut: "Je suis Clotho, et je tisse ta tapisserie. Chaque épreuve y ajoute un rang. En haut, la File montre qui joue, et dans quel ordre. Touche une compétence, puis une cible.",
    intention: "Au-dessus de chaque ennemi, son intention : ce qu'il va faire, à qui, et à peu près combien de dégâts. Profites-en.",
    energie: "Les points bleus 🔹, c'est ton Énergie : +1 à chaque tour. Le Coup de torche en coûte 1. Les attaques gratuites n'en coûtent pas.",
    fantome: "Quand tu choisis une compétence, un jeton en pointillés apparaît dans la File : c'est là que tu rejoueras.",
    don: "Le Don des Moires. Une carte nouvelle, des doublons pour renforcer une carte, ou des drachmes. Choisis selon ce qui te manque.",
    collection: "Ta Collection est sur l'accueil (📜). Avec assez de doublons et de drachmes, une carte monte de niveau. À partir du jour 4, tu choisiras aussi tes 4 cartes par héros avant de partir.",
    niveau: "Ton équipe monte de niveau. Elle frappe plus fort et résiste mieux. Les ennemis, eux aussi, grandissent avec toi.",
    lierCarte: "L'Errant a appris un geste nouveau : 🧵 Lier. Il ne sert pas à frapper. Quand une créature sauvage est presque à bout (moins de 35 % de PV), il peut nouer son fil au tien. Garde-la en vie jusque-là, puis essaie.",
    lienRate: "Le fil a glissé : ça arrive. Frappe-la encore un peu et retente, la chance monte quand ses PV baissent. Et chaque créature de cette espèce que tu vaincs rend le nœud suivant plus sûr.",
    choixCrea: "Tu as plusieurs créatures, maintenant. Une seule part avec toi : choisis-la en haut de la Préparation. Regarde ce qui t'attend aujourd'hui et prends celle dont l'affinité frappe fort contre.",
    codex: "Le Codex garde la trace de chaque créature croisée : vue, vaincue, liée. Les silhouettes sont celles que tu n'as pas encore rencontrées. Touche une fiche pour lire ce qu'on sait d'elle.",
    lier: "Ce fil est à nu. Avec 🧵 Lier, l'Errant peut le nouer au sien : la créature ne meurt pas, elle te suit. Plus elle est faible, plus le nœud tient. Les Gardiens 👑, eux, ne se lient pas.",
    lie: "Le nœud tient. Ta nouvelle créature t'attend dans la Préparation : tu pourras l'emmener à la place de Kelos. Le bouton « Codex des créatures », sur l'accueil, garde aussi sa trace.",
    tapisserie: "Voilà ton premier rang. Chaque jour en ajoutera un. Or pour une victoire parfaite, gris pour une défaite : l'histoire continue quand même.",
    discret: "Tu connais les bases. Désormais je me tais, sauf pour les nouveautés. Le bouton 💡 te donne un indice si tu en veux un.",
    poids: "Chaque action a un poids. Léger : tu rejoues vite. Lourd : tu frappes fort, mais tu recules dans la File. Le jeton en pointillés te montre où.",
    garde: "La Garde : protège un allié. Le prochain coup qui le vise sera pour toi, et tu n'en prendras que la moitié. Regarde les intentions pour savoir qui protéger.",
    efficace: "Efficace ! Flamme bat Sylve, Sylve bat Onde, Onde bat Flamme. Foudre bat Vent, Vent bat Roc, Roc bat Foudre.",
    peuEfficace: "Peu efficace. Cette affinité est faible contre ta cible. Touche 📖 en haut à droite pour revoir le cycle dans le Lexique.",
    gloireIntro: "Nouveau : la Gloire, la barre dorée sous ton équipe. Elle monte à chaque coup, surtout s'il est efficace. Pleine, elle débloque la Prouesse.",
    gloire: "La Gloire est pleine. L'Errant peut lancer la Phalange des Moires : toute l'équipe frappe ensemble.",
    hubris: "Attention à l'Hubris. Les dieux tolèrent l'audace, pas l'orgueil. À 100, Némésis te fait perdre un tour.",
    nemesis: "Némésis est passée. Je te l'avais dit, les fils trop tendus se rompent.",
    annonce: "⚠️ Un grand coup se prépare : il touchera toute ton équipe. Soigne ou frappe avant qu'il ne parte.",
    gardien: "Le Gardien. Cette Hydre fait repousser une tête à chaque gros coup qui n'est pas de Flamme. Le feu cautérise, mais l'eau résiste au feu. À toi de doser.",
    tete: "Une tête repousse. Chaque tête, c'est une morsure de plus à chacun de ses tours.",
    ko: "Un des tiens est tombé. Il se relèvera demain, mais l'épreuve du jour n'attend pas.",
    victoire: "Le fil tient. Pour aujourd'hui.",
    defaite: "Le fil a cédé, pas rompu. Reviens demain, ou rejoue en Écho pour apprendre, sans récompense."
  };

  // Lexique consultable à tout moment
  const LEXIQUE = [
    { cat: 'Récit', icone: '📜', terme: 'Chant', texte: "Une saison de 30 jours, dans une région, autour d'un Sceau. Le Chant I se passe dans les Vals d'Aelwen, en quatre chapitres. La Chronique (sur l'accueil) garde tout ce que tu y as vécu." },
    { cat: 'Récit', icone: '🔀', terme: 'Choix', texte: "Certains jours se terminent par un choix. Il est définitif : il change des répliques, des combats et parfois la fin du Chant." },
    { cat: 'Récit', icone: '✨', terme: 'Sceau', texte: "Une des sept pierres d'étoile qui enchaînent Kronar, le Titan qui dévore. Elles se fissurent. Celui du Chant I, le Sceau de Maïa, dort sous l'étang noir." },
    { cat: 'Récit', icone: '🥷', terme: 'Effilés', texte: "Le culte d'Atropos. Ces mortels se coupent eux-mêmes leurs souvenirs et veulent briser les Sceaux. On ne lie pas un fil humain." },
    { cat: 'Combat', icone: '⏳', terme: 'File', texte: "La rangée en haut de l'écran : l'ordre des 8 prochains tours. Le plus grand jeton joue maintenant." },
    { cat: 'Combat', icone: '🔹', terme: 'Énergie', texte: "Les points bleus sous chaque héros. +1 au début de chaque tour (max 5). Les compétences fortes en coûtent (🔹🔹 = 2 points). Les compétences gratuites n'en coûtent pas." },
    { cat: 'Combat', icone: '💥', terme: 'Puissance', texte: "La force de base d'une attaque (Puiss. 40). Les dégâts réels dépendent aussi de l'attaque du lanceur, de la défense de la cible, de l'affinité et d'un peu de hasard." },
    { cat: 'Combat', icone: '🪶', terme: 'Poids', texte: "Léger : tu rejoues vite. Normal. Lourd : tu frappes fort mais tu recules dans la File." },
    { cat: 'Combat', icone: '🛡️', terme: 'Garde', texte: "Tu protèges un allié jusqu'à ton prochain tour : le prochain coup qui le vise est pour toi, et tu n'en prends que la moitié." },
    { cat: 'Combat', icone: '⏩', terme: 'Présage', texte: "Compétence de Phaéna : l'allié choisi joue juste après elle." },
    { cat: 'Combat', icone: '🏆', terme: 'Gloire', texte: "Jauge commune. Elle monte quand tu touches, surtout avec un coup efficace, un critique ou un ennemi vaincu. Pleine : la Prouesse est disponible." },
    { cat: 'Combat', icone: '⚔️', terme: 'Prouesse', texte: "La Phalange des Moires : l'Errant frappe tous les ennemis d'un coup. Vide la Gloire." },
    { cat: 'Combat', icone: '🎯', terme: 'Intention', texte: "Au-dessus de chaque ennemi : ce qu'il fera à son prochain tour, sa cible et les dégâts estimés. ⚠️ signale un grand coup qui touche toute l'équipe." },
    { cat: 'Combat', icone: '◌', terme: 'Jeton fantôme', texte: "Le jeton en pointillés dans la File, quand tu choisis une compétence : là où ton héros rejouera ensuite." },
    { cat: 'Combat', icone: '💡', terme: 'Indice', texte: "Du jour 4 au jour 10, le bouton 💡 surligne une bonne action. Ensuite, à toi de jouer." },
    { cat: 'Épreuve', icone: '🧵', terme: 'Tapisserie', texte: "Chaque épreuve tisse un rang. Fil d'or : 3 étoiles. Couleur de ton affinité favorite : victoire. Gris : défaite, mais l'histoire continue. Touche un rang pour revoir ta journée." },
    { cat: 'États', icone: '🔥', terme: 'Brûlure', texte: "Perd quelques PV au début de ses 2 prochains tours." },
    { cat: 'États', icone: '💫', terme: 'Étourdi', texte: "Perd son prochain tour." },
    { cat: 'États', icone: '♨️', terme: 'Cautérisé', texte: "Propre à l'Hydre : aucune tête ne peut repousser pendant 2 de ses tours." },
    { cat: 'États', icone: '🐍', terme: 'Têtes', texte: "Nombre de têtes de l'Hydre. Chaque tête = une attaque par tour." },
    { cat: 'Combat', icone: '🧵', terme: 'Lier', texte: "Action de l'Errant (à partir du jour 4, 🔹2). Sur une créature à moins de 35 % de PV (hors Gardien), noue son fil au tien. Plus elle est faible, plus la chance est grande, et chaque spécimen déjà vaincu l'augmente encore. Une créature liée rejoint ta Collection." },
    { cat: 'Cartes', icone: '🐾', terme: 'Créature d\'équipe', texte: "Le troisième membre de ton équipe : Kelos ou une créature liée. Tu la choisis dans la Préparation, avant chaque épreuve. Ses cartes s'améliorent comme les autres." },
    { cat: 'Épreuve', icone: '📖', terme: 'Codex', texte: "Le bestiaire de tout ce que tu as croisé : vu, vaincu, lié. Les silhouettes ❔ sont les créatures qui t'attendent encore." },
    { cat: 'Cartes', icone: '🧭', terme: 'Voies', texte: "Au niveau 5, l'Errant choisit sa Voie : Hoplite (défense), Chasseur (vitesse, critiques) ou Mystique (Énergie, Ombre et Lumière). Chacune donne un passif et deux cartes exclusives. Au niveau 10, une Voie secondaire ajoute ses deux cartes (sans le passif)." },
    { cat: 'Cartes', icone: '📜', terme: 'Serments', texte: "Aux niveaux 4, 8, 12, 16 et 20, un choix définitif entre deux bénédictions pour toute l'équipe." },
    { cat: 'Cartes', icone: '🃏', terme: 'Cartes', texte: "Chaque capacité est une carte, avec une rareté (Commune, Rare, Épique, Légendaire) et un niveau de 1 à 5. Chaque niveau donne +10 % de puissance." },
    { cat: 'Cartes', icone: '⬆', terme: 'Améliorer', texte: "Il faut des doublons de la carte et des drachmes. Les cartes rares demandent moins de doublons que les communes." },
    { cat: 'Cartes', icone: '🪙', terme: 'Drachmes', texte: "La monnaie du jeu, gagnée à chaque épreuve (plus avec des étoiles). Elle sert à payer les améliorations." },
    { cat: 'Cartes', icone: '⚔️', terme: 'Préparation', texte: "À partir du jour 4, avant chaque épreuve, tu choisis 4 cartes par héros. La Garde et la Prouesse sont toujours disponibles." },
    { cat: 'Cartes', icone: '🎁', terme: 'Don des Moires', texte: "Après chaque victoire, choisis 1 récompense parmi 3 : une carte inédite, des doublons ou une bourse. Passer rapporte 25 drachmes." },
    { cat: 'Cartes', icone: '✨', terme: 'Niveau d\'équipe', texte: "L'XP des épreuves fait monter le niveau de l'équipe : +4 % de PV et d'attaque par niveau pour tous tes héros. Les ennemis grandissent aussi." },
    { cat: 'Épreuve', icone: '🏺', terme: 'Offrande du jour', texte: "Une amphore gratuite à ouvrir chaque jour sur l'accueil : des drachmes, des doublons, parfois une carte inédite. Sa qualité dépend de ta série. Les taux sont consultables." },
    { cat: 'Épreuve', icone: '🔥', terme: 'Série', texte: "Le nombre de jours de suite où tu ouvres l'Offrande. Paliers : 3, 7, 14 jours. Un jour manqué fait reculer d'un palier, sans remise à zéro." },
    { cat: 'Épreuve', icone: '🧵', terme: 'Fil de réserve', texte: "Gagné tous les 7 jours de série (2 au maximum). Il protège automatiquement ta série si tu manques un jour." },
    { cat: 'Épreuve', icone: '🛤️', terme: 'Route de la Tapisserie', texte: "Aux rangs 2, 4, 6, 9, 12 et 15 de ta Tapisserie, une récompense connue à l'avance : une carte inédite, un Fil de réserve ou une amphore dorée." },
    { cat: 'Épreuve', icone: '☀️', terme: 'Épreuve des Dieux', texte: "Le dimanche, le Gardien est renforcé, et l'XP et les drachmes sont multipliés par 1,5." },
    { cat: 'États', icone: '🔰', terme: 'Bouclier', texte: "Le prochain coup reçu est réduit de moitié." },
    { cat: 'États', icone: '🙈', terme: 'Aveuglé', texte: "Propre au Cyclope : touché par la Lumière, sa prochaine attaque a 45 % de chances de rater." },
    { cat: 'Épreuve', icone: '📅', terme: 'Épreuve du jour', texte: "Une nouvelle épreuve chaque jour. Une seule tentative compte pour les récompenses." },
    { cat: 'Épreuve', icone: '🔁', terme: 'Mode Écho', texte: "Rejouer l'épreuve après ta tentative, pour t'entraîner. Aucune récompense." },
    { cat: 'Épreuve', icone: '⭐', terme: 'Étoiles', texte: "3 : victoire sans perte. 2 : un héros tombé. 1 : victoire de justesse." }
  ];

  const Donnees = { LIER, CREATURES, VOIES, SERMENTS, RARETES, CARTES_DEPART, EQUIPEMENT_DEPART, HEROS, ENNEMIS, JOURS, CLOTHO, LEXIQUE, epreuveDuJour, equipeDuJour, ennemisDeRencontre, SOIN_ENTRE };
  if (typeof module !== 'undefined' && module.exports) module.exports = Donnees;
  else racine.Donnees = Donnees;
})(typeof window !== 'undefined' ? window : this);
