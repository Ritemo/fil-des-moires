/* Le Fil des Moires : Chant II, « La Forge sous la Montagne » (jours 31 à 60 du Chant).
   Même format que chant1.js. Les jours sont numérotés 31 à 60 : c'est le « jour du Chant » (jc), qui peut différer
   du nombre de jours joués si la finale du Chant I a dû être rejouée. Les choix sont gardés sous les clés j41, j48, j57.
   Une épreuve peut avoir « chaleur: true » (Chaleur des Forges) et « invite » (un allié de passage, voir data.js INVITES). */
(function (racine) {
  'use strict';
  const C1 = typeof module !== 'undefined' && module.exports ? require('./chant1.js') : racine.Chant1;

  // Nouveaux personnages (ajoutés à ceux du Chant I)
  Object.assign(C1.PERSOS, {
    cedalion: { nom: "Cédalion, apprenti d'Héphaïstos", emoji: '🧒🏻' },
    brontes: { nom: 'Brontès, Cyclope du tonnerre', emoji: '👹' },
    steropes: { nom: "Stéropès, Cyclope de l'éclair", emoji: '👺' },
    campe: { nom: 'Campé, la Geôlière', emoji: '🦂' }
  });

  const CHAPITRES = [
    { num: 'V', titre: 'Les Cendres du Nord', debut: 31, fin: 37 },
    { num: 'VI', titre: 'Les Forges éteintes', debut: 38, fin: 44 },
    { num: 'VII', titre: 'Le Labyrinthe de lave', debut: 45, fin: 51 },
    { num: 'VIII', titre: 'Les Portes du Tartare', debut: 52, fin: 60 }
  ];
  const chapitreDu = jc => CHAPITRES.find(c => jc >= c.debut && jc <= c.fin) || null;

  const R = (nom, ennemis, modif) => ({ nom, ennemis, modif: modif || null });
  const G = (nom, id, modif) => ({ nom: 'Le Gardien : ' + nom, ennemis: [id], modif: modif || null });

  const JOURS = {
    // ---------- Chapitre V : Les Cendres du Nord ----------
    31: {
      titre: 'Le quatrième fuseau',
      presage: "« Le Sceau de Maïa tient. Au Nord, la montagne fume, et la cendre tombe comme une neige tiède. »",
      nouveau: "Le Chant II commence. Nouvel ennemi : la Salamandre des braises (Flamme, on peut la lier). L'Onde l'éteint.",
      scene: [
        ['clotho', "Je t'ai promis un fil de plus. Le voici. Tu n'as pas été filé comme les autres, Errant."],
        ['clotho', "Sur le Grand Métier, il y a quatre fuseaux. Le quatrième n'avait jamais tourné. Je l'ai fait tourner une fois, une seule. C'est toi qui en es sorti."],
        ['phaena', "Voilà pourquoi je ne vois pas ton fil. Il ne vient pas du même endroit que les nôtres."],
        ['clotho', "Le deuxième Sceau est sous les Monts du Nord. Là-bas, les Forges d'Héphaïstos débordent. Va, et ne regarde pas trop la fumée."]
      ],
      rencontres: [R('La route du Nord', ['satyre', 'harpie']), R('La plaine tiède', ['salamandre', 'harpie']), R('Le ruisseau qui fume', ['salamandre', 'salamandre'])],
      fin: {
        victoire: ['phaena', "Même les salamandres fuient le Nord. Quelque chose, là-haut, est trop chaud pour elles."],
        defaite: ['phaena', "La cendre colle à tout. Reprenons notre souffle, la montagne ne bougera pas."]
      }
    },
    32: {
      titre: 'Les villages vides',
      presage: "« Les maisons sont debout, les tables mises, le pain froid. Personne. Seulement des traces de pattes dans la cendre. »",
      nouveau: 'Nouvel ennemi : le Chien de cendre (Ombre, très rapide, on peut le lier). La Lumière le dissipe.',
      scene: [
        ['narrateur', "Un village sur le flanc de la colline. Une marmite sur le feu éteint, une poupée sur le seuil."],
        ['phaena', "Ils ne sont pas morts. Leurs fils sont là, quelque part. Tirés vers le bas, vers la montagne."],
        ['kelos', "Kelos gronde. Dans les ruelles, des yeux de braise s'allument, deux par deux."]
      ],
      rencontres: [R('La place', ['chien_cendre', 'satyre']), R('Les ruelles', ['chien_cendre', 'harpie']), R('Le four banal', ['chien_cendre', 'salamandre'])],
      fin: {
        victoire: ['phaena', "Des chiens de garde. Ils gardaient quoi, à ton avis ? Ou qui ?"],
        defaite: ['phaena', "La meute nous a repoussés. Ils connaissent ces ruelles mieux que nous."]
      }
    },
    33: {
      titre: "L'apprenti qui lisait les braises",
      presage: "« Un garçon couvert de suie se cache dans un four à pain. Il dit que son maître a disparu dans la fumée. »",
      scene: [
        ['cedalion', "Ne me frappe pas ! Je m'appelle Cédalion. J'étais l'apprenti d'Héphaïstos, aux Forges."],
        ['cedalion', "Il y a trois lunes, il est descendu au fond de la Forge, là où le feu est le plus vieux. La fumée l'a avalé. Il n'est jamais remonté."],
        ['cedalion', "Je sais lire les braises. Elles disent que tu viens d'un fuseau qui ne tourne pas. C'est vrai ?"],
        ['clotho', "Garde-le près de toi. Un enfant qui lit les braises vaut mieux qu'une carte."]
      ],
      rencontres: [R('Le four', ['chien_cendre', 'chien_cendre']), R('Le chemin des charbonniers', ['salamandre', 'harpie']), R('Le pont de cendre', ['chien_cendre', 'salamandre', 'satyre'])],
      fin: {
        victoire: ['cedalion', "Tu te bats comme Héphaïstos forge : sans jamais t'arrêter. Je viens avec toi."],
        defaite: ['cedalion', "Les braises disent que tu te relèves toujours. Elles ne mentent jamais."]
      }
    },
    34: {
      titre: 'La forêt de pierre',
      presage: "« Une forêt entière changée en pierre grise. Les dryades n'ont pas eu le temps de fuir. »",
      nouveau: 'Les créatures se lient plus facilement aujourd\'hui (+10 %) : les bêtes perdues cherchent un fil.',
      lienBonus: 0.1,
      scene: [
        ['narrateur', "Des chênes de pierre, des feuilles de pierre, et dans les troncs, des visages qui ont crié."],
        ['phaena', "Le feu des Forges est monté jusqu'ici, puis il a refroidi d'un coup. Comme si on l'avait aspiré."],
        ['cedalion', "Mon maître disait : un feu qu'on vole laisse toujours de la pierre derrière lui."],
        ['aelis', "J'ai vu cette forêt en rêve, du bateau. Elle chantait encore.", 'j14=partir'],
        ['phaena', "Aëlis l'aurait pleurée en chantant. Elle connaissait toutes les forêts.", 'j14=rester']
      ],
      rencontres: [R('Les troncs gris', ['dryade', 'salamandre']), R('La clairière morte', ['chien_cendre', 'dryade']), R('Le chêne-roi', ['dryade', 'dryade', 'salamandre'])],
      fin: {
        victoire: ['phaena', "Une dryade a bougé un doigt, quand on est passés. Un seul. C'est déjà ça."],
        defaite: ['phaena', "La pierre gagne du terrain. Il faut monter plus vite."]
      }
    },
    35: {
      titre: 'Les Kères',
      presage: "« Sur l'ancien champ de bataille, des femmes ailées aux dents noires se penchent sur les blessés. »",
      nouveau: "Nouvel ennemi : la Kère, esprit de mort. Sa Soif lui rend la moitié des dégâts qu'elle inflige. On ne lie pas un esprit de mort.",
      scene: [
        ['cedalion', "Les Kères ! Les filles de la Nuit. Elles boivent ce qui reste de vie dans les blessés."],
        ['clotho', "Ce sont les servantes de ma sœur, quand elle a trop de travail. Atropos sait que tu es là."],
        ['lachesis', "Ne t'attarde pas sous leurs ailes, Errant. Elles mesurent mieux que moi ce qui reste à un fil."]
      ],
      rencontres: [R('Le champ de bataille', ['kere', 'chien_cendre']), R('Le tertre', ['kere', 'salamandre']), R('Le vol noir', ['kere', 'kere', 'harpie'])],
      fin: {
        victoire: ['clotho', "Elles sont reparties vers ma sœur. Elle saura que tu ne te laisses pas boire."],
        defaite: ['clotho', "Elles t'ont bu un peu de force. Ce n'est rien : je file plus vite qu'elles ne boivent."]
      }
    },
    36: {
      titre: 'Le passeur des cendres',
      presage: "« Au carrefour des trois chemins, un voyageur coiffé d'ailes vend des sandales contre la chaleur. »",
      nouveau: 'Événement : Hermès tient boutique. Récompenses multipliées par 1,5.',
      bonus: { xp: 1.5, drachmes: 1.5 },
      scene: [
        ['hermes', "Mon cher Errant ! Toujours vivant ? Atropos a perdu un pari contre moi, grâce à toi. Je te dois une faveur."],
        ['hermes', "Un conseil gratuit, ce qui est rare : sous la montagne, le feu ne ment pas, mais les statues, si."],
        ['hermes', "Ah, et tu n'as pas oublié les Sœurs Grises, j'espère. Elles, elles ne t'ont pas oublié.", 'j17=oeil'],
        ['cedalion', "Il est vraiment un dieu ? Il a volé mon dernier morceau de pain pendant qu'il parlait."]
      ],
      rencontres: [R('Le carrefour', ['satyre', 'chien_cendre']), R("L'auberge brûlée", ['salamandre', 'kere']), R('La sortie de la vallée', ['harpie', 'harpie', 'chien_cendre'])],
      fin: {
        victoire: ['hermes', "Joli ! Je reviendrai quand tu seras plus près des Portes. On aura besoin l'un de l'autre."],
        defaite: ['hermes', "Allons, debout. Je n'ai pas parié sur toi pour te voir dormir dans la cendre."]
      }
    },
    37: {
      titre: 'La Chimère des Forges',
      presage: "« Celle qu'Aëlis avait vue descendre vers le Nord a bu à la fournaise. Ses trois têtes crachent du bronze fondu. »",
      nouveau: 'Gardien : la Chimère des Forges. Ses Crocs frappent deux fois, sa Coulée de bronze brûle toute l\'équipe. L\'Onde la blesse.',
      scene: [
        ['aelis', "Je te l'avais dit, au jour des ruines : la Chimère descendait vers le Nord. Elle a grandi. Pas toi seulement.", 'j14=rester'],
        ['phaena', "Aëlis l'avait vue passer. Si seulement elle était là pour chanter.", 'j14=partir'],
        ['cedalion', "C'est elle qui gardait la route des Forges ! Mon maître la nourrissait de scories. Elle était presque gentille."],
        ['clotho', "Elle n'est plus gentille. Derrière elle, les Forges. Passe."]
      ],
      rencontres: [R('Le col de cendre', ['salamandre', 'chien_cendre']), G('Chimère des Forges', 'chimere_forges')],
      fin: {
        victoire: ['cedalion', "La route des Forges est ouverte ! Demain, je te montre où travaillait mon maître."],
        defaite: ['cedalion', "Elle retourne dormir sur la route. Elle ne bougera pas. Elle n'a nulle part où aller, elle non plus."]
      }
    },

    // ---------- Chapitre VI : Les Forges éteintes ----------
    38: {
      titre: 'Les portes de la Forge',
      presage: "« Les grandes portes d'airain sont ouvertes. De l'intérieur monte une chaleur qui ne s'éteint plus. »",
      nouveau: "Nouveauté : la Chaleur des Forges. Toutes les 9 actions, la chaleur monte et brûle tout le monde (de plus en plus fort), sauf les unités d'Onde et de Flamme. Ne traîne pas.",
      chaleur: true,
      scene: [
        ['cedalion', "Les portes. Jamais je ne les avais vues ouvertes. Le feu devrait être dans les fourneaux, pas partout."],
        ['phaena', "La chaleur tire sur mon fil. C'est étrange : comme si quelque chose, sous la Forge, respirait."],
        ['clotho', "Chaque fois que la chaleur monte, frappe plus fort. Elle ne t'attendra pas."]
      ],
      rencontres: [R('Le seuil brûlant', ['salamandre', 'salamandre']), R('La salle des soufflets', ['chien_cendre', 'salamandre']), R('Le couloir rouge', ['kere', 'salamandre'])],
      fin: {
        victoire: ['cedalion', "Tu as tenu dans la chaleur. Mon maître dirait que tu es bien trempé."],
        defaite: ['cedalion', "La chaleur t'a vaincu, pas les bêtes. Demain, va plus vite."]
      }
    },
    39: {
      titre: "Stéropès, l'éclair perdu",
      presage: "« Dans une forge éteinte, un Cyclope immense pleure sur une enclume froide. »",
      scene: [
        ['steropes', "Tu n'es pas le maître. Le maître est parti. Et Argès... Argès n'est plus Argès."],
        ['steropes', "Un fil est descendu du plafond de la Forge, un fil d'or. Il s'est noué à la tête d'Argès et il a tiré. Vers le bas."],
        ['steropes', "Brontès a voulu le retenir. Argès l'a enchaîné dans la forge du tonnerre. Moi, j'ai eu peur. Je me suis caché."],
        ['phaena', "Un fil tiré vers le bas. Comme les Effilés. Comme le fil d'or de Myrtos."]
      ],
      rencontres: [R("L'atelier de l'éclair", ['chien_cendre', 'kere']), R('Les fourneaux morts', ['salamandre', 'chien_cendre']), R('La cheminée', ['kere', 'kere'])],
      fin: {
        victoire: ['steropes', "Tu es fort, petit. Va voir Brontès. Lui, il saura quoi faire."],
        defaite: ['steropes', "Repose-toi près de mon enclume. Elle est froide, mais elle ne te fera pas de mal."]
      }
    },
    40: {
      titre: "L'enclume du maître",
      presage: "« Au cœur de la Forge, l'enclume d'Héphaïstos. Sur son bronze, une empreinte de main, et une seule phrase gravée. »",
      scene: [
        ['narrateur', "Sur l'enclume, gravé de la main du dieu : « Je descends chercher le fuseau qui ne tourne pas. »"],
        ['cedalion', "Le fuseau qui ne tourne pas... C'est ce que disaient les braises, quand je t'ai vu."],
        ['clotho', "Héphaïstos savait. Il a toujours voulu forger un fuseau neuf. Il est descendu voir ce qui avait fait tourner le mien."],
        ['lachesis', "Ou ce qui l'avait arrêté, ma sœur. Tu ne lui as jamais dit pour l'autre fil, n'est-ce pas ?"]
      ],
      rencontres: [R('La salle de l\'enclume', ['salamandre', 'kere']), R('Les réserves de bronze', ['chien_cendre', 'chien_cendre', 'salamandre']), R('Le trou de coulée', ['kere', 'salamandre', 'harpie'])],
      fin: {
        victoire: ['clotho', "Ne me demande pas ce que Lachésis voulait dire. Pas encore. Va délivrer Brontès."],
        defaite: ['clotho', "Reviens demain. Et ne pose pas de questions à ma sœur. Elle mesure tout, même ce qu'il ne faut pas."]
      }
    },
    41: {
      titre: 'Brontès enchaîné',
      presage: "« Dans la forge du tonnerre, un Cyclope enchaîné gronde si fort que la montagne tremble. »",
      nouveau: "Un choix t'attend à la fin de l'épreuve, quelle qu'en soit l'issue.",
      chaleur: true,
      scene: [
        ['brontes', "Qui vient ? Si c'est Argès, je te préviens, frère : ces chaînes ne tiendront plus longtemps."],
        ['brontes', "Ah. Un petit. Avec un fil que je ne vois pas. Libère-moi, petit, et je t'aiderai à frapper mon frère."],
        ['cedalion', "Son marteau ! Le marteau-tonnerre, celui qui forge la foudre de Zeus. Il est posé juste à côté de lui."],
        ['clotho', "Les gardiens d'Argès arrivent. Bats-toi d'abord. Tu choisiras ensuite."]
      ],
      rencontres: [R('La forge du tonnerre', ['chien_cendre', 'kere']), R('Les chaînes', ['salamandre', 'salamandre', 'chien_cendre']), R('Les fidèles d\'Argès', ['kere', 'chien_cendre', 'salamandre'])],
      fin: {
        victoire: ['clotho', "Les gardiens sont tombés. Brontès te regarde. Le marteau aussi, je crois. Choisis."],
        defaite: ['clotho', "Tu es tombé, mais les chaînes de Brontès sont à portée de main. Il te reste un choix."]
      },
      choix: {
        question: 'Brontès est enchaîné, son marteau-tonnerre posé à côté de lui. Que fais-tu ?',
        options: [
          { id: 'liberer', texte: 'Briser ses chaînes', jauge: 'honneur', effet: { xp: 80 },
            resultat: "Les chaînes tombent. Brontès se lève, et la Forge tremble. « Je viens avec toi jusqu'à Argès, petit. » (Brontès rejoint l'équipe jusqu'au Gardien, +80 XP)" },
          { id: 'marteau', texte: 'Prendre le marteau-tonnerre', jauge: 'ruse', effet: { carte: 'marteau' },
            resultat: "Tu soulèves le marteau. Il est lourd comme un orage. Brontès hurle, mais ses chaînes tiennent. (Nouvelle carte pour l'Errant : Marteau-tonnerre, Foudre)" },
          { id: 'offrande', texte: "Confier Brontès à Héphaïstos, par une offrande à l'enclume", jauge: 'piete', effet: { talisman: 1, drachmes: 20 },
            resultat: "Tu poses ta plus belle offrande sur l'enclume froide. Elle rougit un instant, comme si une main la frappait. Ton talisman brille. (Ton talisman équipé gagne un niveau, +20 drachmes)" }
        ],
        defaut: 'liberer'
      }
    },
    42: {
      titre: 'Les galeries de suie',
      presage: "« Les galeries descendent vers le cœur de la montagne. Les murs suent du bronze. »",
      scene: [
        ['brontes', "Je passe devant. Les galeries sont étroites, mais moi, je suis plus solide qu'elles.", 'j41=liberer'],
        ['narrateur', "Derrière toi, les chaînes de Brontès sonnent comme une cloche. Il ne te pardonne pas.", 'j41=marteau'],
        ['cedalion', "L'enclume a parlé, cette nuit. Le maître a entendu ton offrande, j'en suis sûr.", 'j41=offrande'],
        ['phaena', "Mon fil... Ce n'est rien. Il fait chaud, c'est tout."]
      ],
      invite: 'brontes', inviteSi: 'j41=liberer',
      rencontres: [R('La galerie basse', ['chien_cendre', 'salamandre']), R('Le puits de suie', ['kere', 'chien_cendre']), R('Le carrefour des tunnels', ['salamandre', 'kere', 'chien_cendre'])],
      fin: {
        victoire: ['cedalion', "On approche de la forge de la lueur. C'est là qu'Argès travaillait."],
        defaite: ['cedalion', "Les galeries tournent sur elles-mêmes. On a dû se perdre. Demain, je lirai les braises plus attentivement."]
      }
    },
    43: {
      titre: "La veille d'Argès",
      presage: "« La lueur d'Argès éclaire les galeries comme un orage. Il sait que tu viens. »",
      invite: 'brontes', inviteSi: 'j41=liberer',
      scene: [
        ['steropes', "Argès forge quelque chose, au fond. Pas des éclairs. Des chaînes. Des chaînes pour le Tartare."],
        ['brontes', "Mon frère n'est pas mauvais. C'est ce fil d'or. Coupe-le, et il reviendra. Ne le tue pas, petit.", 'j41=liberer'],
        ['lachesis', "J'ai mesuré le fil d'Argès. Il descend plus bas que la montagne. Bien plus bas."]
      ],
      rencontres: [R('Les étincelles', ['salamandre', 'salamandre', 'kere']), R('Les chiens de la lueur', ['chien_cendre', 'chien_cendre', 'chien_cendre']), R('Le seuil de la forge', ['kere', 'kere', 'salamandre'])],
      fin: {
        victoire: ['clotho', "Demain, Argès. La chaleur sera terrible. Dors près de Kelos : il est d'orage, il ne craint pas la lueur."],
        defaite: ['clotho', "Tu arriveras fatigué devant Argès. Ce n'est pas grave : il est fatigué aussi, depuis trois lunes."]
      }
    },
    44: {
      titre: 'Argès, Cyclope de la lueur',
      presage: "« Argès forge des chaînes dans la lumière blanche. Au-dessus de sa tête, un fil d'or tendu vers le bas. »",
      nouveau: "Gardien : Argès. Foudre : le Roc lui résiste, le Vent le fuit. Un coup de Lumière l'aveugle. Chaleur des Forges.",
      chaleur: true,
      invite: 'brontes', inviteSi: 'j41=liberer',
      scene: [
        ['brontes', "Frère ! C'est moi. Lâche ce fil, Argès, lâche-le !", 'j41=liberer'],
        ['narrateur', "Le marteau-tonnerre gronde dans ta main. Argès le reconnaît, et ses yeux se remplissent de rage.", 'j41=marteau'],
        ['phaena', "Le fil d'or ! Si on le coupe, il redeviendra lui-même. Mais il faut d'abord qu'il tombe."],
        ['clotho', "Tiens bon dans la chaleur. Frappe vite, frappe fort."]
      ],
      rencontres: [R('La forge de la lueur', ['salamandre', 'kere']), G('Argès, Cyclope de la lueur', 'arges')],
      fin: {
        victoire: ['clotho', "Le fil d'or s'est rompu. Argès dort, et il se réveillera lui-même. Mais regarde : le fil descendait encore plus bas."],
        defaite: ['clotho', "Argès est trop fort aujourd'hui. Le fil le rend infatigable. Reviens : ce fil-là, je veux le voir rompu."]
      }
    },

    // ---------- Chapitre VII : Le Labyrinthe de lave ----------
    45: {
      titre: 'Sous la Forge',
      presage: "« Sous la Forge, des galeries de lave refroidie. Et des servantes de bronze qui gardent un maître absent. »",
      nouveau: "Nouvel ennemi : l'Automate de bronze (Airain, solide, on peut le lier). Son Engrenage la protège tous les 3 tours.",
      scene: [
        ['cedalion', "Les servantes du maître ! Il les a forgées pour porter ses outils. Elles me connaissent, elles vont nous laisser passer."],
        ['narrateur', "Les servantes de bronze tournent la tête vers vous, toutes en même temps, et lèvent le poing."],
        ['cedalion', "...Ou pas."]
      ],
      rencontres: [R("L'entrée des galeries", ['automate', 'salamandre']), R('La salle des moules', ['automate', 'chien_cendre']), R('Le fleuve figé', ['automate', 'automate'])],
      fin: {
        victoire: ['cedalion', "Elles n'ont plus de maître. Elles gardent tout ce qui bouge. C'est triste, des servantes sans personne à servir."],
        defaite: ['cedalion', "Elles ne se fatiguent jamais. Il faudra les prendre de vitesse."]
      }
    },
    46: {
      titre: 'La statue sans visage',
      presage: "« Au centre du labyrinthe, une statue de bronze. Son visage a été effacé au burin. Sur le socle, une phrase. »",
      scene: [
        ['narrateur', "Sur le socle, en lettres que personne ne lit plus : « Celui qui fit tourner le quatrième fuseau »."],
        ['phaena', "Une statue d'homme, avec un glaive. Il te ressemble, Errant. Il te ressemble beaucoup."],
        ['clotho', "...Il y a eu un Errant avant toi. Il y a très longtemps. Je ne voulais pas que tu le saches comme ça."],
        ['atropos', "Tu ne voulais pas qu'il le sache du tout, ma sœur. Regarde-le bien, Errant. Regarde ce qu'on a fait de son visage."]
      ],
      rencontres: [R('Les gardiennes de la statue', ['automate', 'kere']), R('Le cercle de lave', ['salamandre', 'automate', 'chien_cendre']), R('Le socle', ['automate', 'automate', 'kere'])],
      fin: {
        victoire: ['clotho', "Je te dirai tout. Pas ici, pas devant elle. Quand le deuxième Sceau tiendra."],
        defaite: ['clotho', "Relève-toi. Ce qui est arrivé au premier ne t'arrivera pas. Je ne le permettrai pas."]
      }
    },
    47: {
      titre: 'La lame d\'étoile',
      presage: "« Une silhouette grise marche dans les galeries. Elle porte une lame qui brille comme une étoile tombée. »",
      scene: [
        ['lysandre', "Je t'ai cherché longtemps. Ma Dame m'a donné ceci : une lame forgée dans un éclat de ses ciseaux.", 'j21!=epargner'],
        ['lysandre', "Je suis revenue. Je ne sais pas pourquoi. Ma Dame m'a donné une lame, et je n'arrive pas à la lever contre toi.", 'j21=epargner'],
        ['phaena', "Son fil a un nœud, tout petit. Celui que tu as fait, au bois des Effilés."],
        ['lysandre', "Demain, à la statue. Viens seul. Enfin, viens avec qui tu veux. Les autres ne comptent pas."]
      ],
      rencontres: [R('Les fidèles de Lysandre', ['effile', 'automate']), R('Le pont de lave', ['effile', 'kere', 'salamandre']), R('La galerie des échos', ['effile', 'effile', 'chien_cendre'])],
      fin: {
        victoire: ['clotho', "Elle t'attend. Atropos lui a donné une arme qui peut couper les fils sans destin. Le tien, Errant."],
        defaite: ['clotho', "Elle a vu ta chute. Elle n'est pas venue t'achever. Retiens ça."]
      }
    },
    48: {
      titre: 'Le souvenir de Lysandre',
      presage: "« Devant la statue sans visage, Lysandre lève sa lame d'étoile. Elle a pleuré, une fois. Elle ne sait plus pourquoi. »",
      nouveau: "Gardienne : Lysandre à la lame d'étoile. Un choix t'attend à la fin de l'épreuve, quelle qu'en soit l'issue.",
      scene: [
        ['lysandre', "Ma Dame dit que le premier Errant a fini comme ça : un visage effacé. Elle dit que je dois t'épargner ça."],
        ['lysandre', "Je ne me souviens pas de mon nom. Le vrai. Toi, tu te souviens du tien ?"],
        ['phaena', "Errant... Mon fil tremble près d'elle. Près de cette lame. Fais vite."]
      ],
      rencontres: [R('Le cercle de la statue', ['effile', 'kere']), G("Lysandre à la lame d'étoile", 'lysandre_lame')],
      fin: {
        victoire: ['clotho', "Lysandre est à genoux. Sa lame est tombée près de toi. Choisis ce que tu fais d'elle."],
        defaite: ['clotho', "Elle ne t'a pas coupé. Elle aurait pu. Maintenant, c'est à toi de choisir."]
      },
      choix: {
        question: 'Lysandre est à genoux devant la statue, sa lame d\'étoile à terre. Que fais-tu ?',
        options: [
          { id: 'nom', texte: 'L\'aider à retrouver son nom', jauge: 'piete', effet: { xp: 60 },
            resultat: "Tu poses ta main sur son fil, là où est le nœud. Elle murmure un nom : « Ismène ». Elle pleure, et cette fois, elle sait pourquoi. Elle quitte Atropos. (+60 XP)" },
          { id: 'partir', texte: 'La laisser partir, libre', jauge: 'honneur', effet: { drachmes: 60 },
            resultat: "Tu lui rends sa lame. Elle te regarde longtemps, puis s'éloigne dans les galeries. « Je te dois quelque chose. Je ne sais pas encore quoi. » (+60 drachmes)" },
          { id: 'lame', texte: 'La tromper pour lui prendre sa lame', jauge: 'ruse', effet: { drachmes: 40, fil: 1 },
            resultat: "Tu lui tends la main, elle la prend, et tu glisses la lame d'étoile dans ton manteau. Elle s'en aperçoit trop tard. Son cri résonne dans tout le labyrinthe. (+40 drachmes, un Fil de réserve)" }
        ],
        defaut: 'partir'
      }
    },
    49: {
      titre: 'Le fil de Phaéna',
      presage: "« Plus le Sceau est proche, plus le fil de Phaéna s'amincit. Ce matin, ses yeux d'or sont pâles. »",
      scene: [
        ['phaena', "Je vais bien. Je vois moins bien les fils, c'est tout. Le tien, je ne l'ai jamais vu, alors ça ne change rien."],
        ['clotho', "Les Sceaux tiennent la tapisserie. Plus on s'en approche, plus les fils fragiles tirent. Le sien est le plus fin que je connaisse."],
        ['cedalion', "Les braises disent qu'elle tiendra. Les braises ne mentent jamais. Presque jamais."],
        ['lysandre', "Je connais ce mal. Je l'ai eu quand je coupais mes souvenirs. Elle tiendra si on ne la laisse pas seule.", 'j48=nom']
      ],
      rencontres: [R('Les galeries profondes', ['automate', 'chien_cendre']), R('La salle des soupirs', ['kere', 'kere', 'automate']), R('Le passage étroit', ['salamandre', 'automate', 'chien_cendre'])],
      fin: {
        victoire: ['phaena', "Merci. De ne rien dire. De continuer comme si de rien n'était."],
        defaite: ['phaena', "Ce n'est pas à cause de moi, j'espère. Dis-moi que ce n'est pas à cause de moi."]
      }
    },
    50: {
      titre: 'Le cœur de lave',
      presage: "« Le labyrinthe débouche sur un lac de lave. Au milieu, une île, et sur l'île, un géant de bronze endormi. »",
      chaleur: true,
      scene: [
        ['cedalion', "Talos ! Le géant de bronze que le maître avait forgé pour la Crète. On le disait mort depuis l'Âge des Héros."],
        ['cedalion', "Une seule veine court dans son corps, fermée par un clou à la cheville. Mais l'eau, l'eau froide... ça fend le bronze chaud."],
        ['narrateur', "Autour du lac, les servantes de bronze se réveillent une à une. Elles gardent son sommeil."]
      ],
      rencontres: [R('La rive de lave', ['automate', 'salamandre']), R("L'éboulis brûlant", ['automate', 'chien_cendre']), R('Le gué de pierre', ['automate', 'kere'])],
      fin: {
        victoire: ['cedalion', "Demain, il se réveillera. Prends de l'Onde avec toi, si tu en as. Beaucoup d'Onde."],
        defaite: ['cedalion', "Les servantes nous ont repoussés. Talos dort toujours. Pour l'instant."]
      }
    },
    51: {
      titre: 'Talos, le géant de bronze',
      presage: "« Talos se lève du lac de lave. Ses yeux s'allument. Derrière lui, une porte dans la roche, qui descend. »",
      nouveau: "Gardien : Talos. Très solide. Un coup d'Onde fend son bronze : les 2 coups suivants font 50 % de dégâts en plus. Chaleur des Forges.",
      chaleur: true,
      scene: [
        ['narrateur', "Le géant se dresse, rouge de lave. Le lac bouillonne autour de ses chevilles."],
        ['cedalion', "L'Onde d'abord ! Fends le bronze, puis frappe de toutes tes forces."],
        ['lysandre', "Je reste. Je ne frappe pas pour toi. Je frappe pour la statue.", 'j48=nom'],
        ['clotho', "Derrière lui, la route du Tartare. Le deuxième Sceau est au bout."]
      ],
      rencontres: [R("Les servantes de l'île", ['automate', 'automate']), G('Talos, le géant de bronze', 'talos')],
      fin: {
        victoire: ['clotho', "Talos s'est écroulé dans le lac. La porte est ouverte. Tout en bas, j'entends des chaînes."],
        defaite: ['clotho', "Talos t'a repoussé. Il ne poursuit pas : il garde. Reviens avec plus d'Onde, ou plus de rage."]
      }
    },

    // ---------- Chapitre VIII : Les Portes du Tartare ----------
    52: {
      titre: 'La descente',
      presage: "« Un escalier taillé dans la roche descend plus bas que les racines des montagnes. L'air sent le fer et la nuit. »",
      scene: [
        ['narrateur', "Mille marches. Puis mille autres. La chaleur de la Forge disparaît, et un froid ancien la remplace."],
        ['hermes', "Je t'avais dit que je reviendrais ! Je connais ce chemin : je le prends chaque jour avec les âmes des morts."],
        ['hermes', "Tu es le premier vivant que j'accompagne depuis Orphée. Il n'a pas très bien fini, mais c'était un musicien."]
      ],
      rencontres: [R("L'escalier", ['kere', 'chien_cendre']), R('Le palier des ombres', ['kere', 'effile']), R('Les dernières marches', ['kere', 'kere', 'chien_cendre'])],
      fin: {
        victoire: ['hermes', "Bravo ! Les Kères n'aiment pas les vivants qui descendent. Elles préfèrent qu'on tombe."],
        defaite: ['hermes', "Allons, on remonte d'une marche et on recommence. C'est le métier."]
      }
    },
    53: {
      titre: 'Le Phlégéthon',
      presage: "« Un fleuve de feu coule sous la terre. Il n'éclaire rien. Il brûle seulement. »",
      nouveau: 'Chaleur des Forges, une dernière fois.',
      chaleur: true,
      scene: [
        ['hermes', "Le Phlégéthon, le fleuve de feu. Ne le touche pas. Ne le regarde pas trop non plus."],
        ['cedalion', "C'est là que le feu de la Forge descendait. Le maître disait que tout le feu du monde vient d'ici."],
        ['phaena', "Errant, je ne vois plus les fils des bêtes. Seulement des ombres. Dis-moi où frapper."]
      ],
      rencontres: [R('La rive brûlante', ['salamandre', 'salamandre', 'kere']), R('Le pont de basalte', ['automate', 'kere']), R("L'autre rive", ['salamandre', 'chien_cendre', 'kere'])],
      fin: {
        victoire: ['hermes', "Traversé ! Pas un cheveu brûlé. Bon, quelques-uns. Je n'en parlerai à personne."],
        defaite: ['hermes', "Le fleuve nous a repoussés. Personne ne traverse du premier coup. Sauf moi."]
      }
    },
    54: {
      titre: 'Le gué des ombres',
      presage: "« Les ombres des morts font la queue devant un gué. Certaines te reconnaissent. Tu ne sais pas comment. »",
      nouveau: 'Événement : Hermès guide les âmes. Récompenses multipliées par 1,5.',
      bonus: { xp: 1.5, drachmes: 1.5 },
      scene: [
        ['narrateur', "Une ombre de vieil homme te salue de la tête. « Tu as repris le glaive, à ce que je vois. »"],
        ['hermes', "Elles te prennent pour lui. Le premier. Les morts ont la mémoire longue et la vue courte."],
        ['nikias', "Je ne suis pas mort, rassure-toi ! Je suis venu en rêve. Ianthe voulait que tu saches qu'elle se souvient de toi.", 'j6=ianthe'],
        ['clotho', "Ne t'arrête pas. Les ombres retiennent ceux qui écoutent trop."]
      ],
      rencontres: [R('Les ombres agitées', ['kere', 'effile']), R('Le gué', ['kere', 'chien_cendre']), R('Les gardiens du gué', ['automate', 'effile', 'harpie'])],
      fin: {
        victoire: ['hermes', "Joli travail. Les ombres te laissent passer. Au-delà, les Portes de bronze."],
        defaite: ['hermes', "Les ombres t'ont ralenti. Elles ont tout leur temps, elles. Pas toi."]
      }
    },
    55: {
      titre: 'Atropos',
      presage: "« Devant les Portes du Tartare, une femme voilée t'attend, des ciseaux à la main. »",
      nouveau: 'Atropos te parle enfin.',
      scene: [
        ['atropos', "Enfin. Je te vois, Errant. Pas ton fil : lui, je ne le verrai jamais. Mais toi, je te vois."],
        ['atropos', "Ton amie aux yeux d'or s'effiloche. Son fil est usé jusqu'à la corde. Laisse-moi le couper proprement, et je laisse le tien tranquille."],
        ['phaena', "Errant... Si c'est le prix..."],
        ['narrateur', "Tu ne réponds pas. Tu poses la main sur ton glaive, et tu te places devant Phaéna."],
        ['atropos', "Comme le premier. Exactement comme le premier. Mes Kères vont t'apprendre ce que coûte un refus."],
        ['lachesis', "Ma sœur ne ment jamais, Errant. Mais elle ne dit jamais tout non plus."]
      ],
      rencontres: [R('Les Kères d\'Atropos', ['kere', 'kere']), R('Les Effilés', ['effile', 'effile', 'kere']), R('Le voile', ['kere', 'kere', 'effile'])],
      fin: {
        victoire: ['clotho', "Elle est partie. Elle reviendra. Merci, Errant. Pour Phaéna. Pour avoir dit non."],
        defaite: ['clotho', "Elle ne coupera pas Phaéna. Pas tant que je file. Relève-toi."]
      }
    },
    56: {
      titre: 'Les Portes de bronze',
      presage: "« Les Portes du Tartare, hautes comme le ciel. Des chaînes énormes pendent de leurs gonds et bougent toutes seules. »",
      nouveau: 'Nouvel ennemi : la Chaîne du Tartare. Elle protège sa Geôlière. Le Vent l\'ébranle.',
      scene: [
        ['cedalion', "Les chaînes qui tenaient les Cyclopes ! Le maître les avait forgées, il y a des siècles. Il en était si fier."],
        ['narrateur', "Derrière les Portes, une voix râpeuse, comme du fer qu'on traîne. « Qui frappe à ma porte ? »"],
        ['campe', "Un vivant. Un vivant sans fil. Il y a longtemps que je n'en avais pas vu. Le dernier est resté chez moi."]
      ],
      rencontres: [R('Les gonds', ['chaine', 'kere']), R('Les chaînes vives', ['chaine', 'automate']), R('Le seuil du Tartare', ['chaine', 'chaine', 'kere'])],
      fin: {
        victoire: ['clotho', "Les Portes s'entrouvrent. Le Sceau est derrière, et Campé le garde. Il faudra payer pour passer."],
        defaite: ['clotho', "Les chaînes t'ont repoussé. Elles obéissent à Campé, et Campé ne dort jamais."]
      }
    },
    57: {
      titre: 'Le prix du Sceau',
      presage: "« Le deuxième Sceau de Maïa bat sous les Portes. Pour le renforcer, il faut lui donner quelque chose. »",
      nouveau: "Un choix t'attend à la fin de l'épreuve, quelle qu'en soit l'issue.",
      scene: [
        ['clotho', "Le Sceau tient la porte du Tartare fermée. Il faiblit. Pour qu'il tienne encore mille ans, il faut lui offrir de la force."],
        ['hermes', "Ou alors, on peut s'arranger. Je connais un passage. Personne n'en paie jamais le prix tout de suite."],
        ['lachesis', "Tu as toujours payé ta part, Errant. Le Sceau le sait.", 'dominante=honneur'],
        ['lachesis', "Tu as toujours trouvé une porte de derrière. Le Sceau le sait aussi.", 'dominante=ruse'],
        ['lachesis', "Tu as toujours donné aux dieux. Le Sceau l'a senti.", 'dominante=piete']
      ],
      rencontres: [R('Le vestibule', ['kere', 'chaine']), R('La garde de Campé', ['chaine', 'effile', 'kere']), R('Le Sceau', ['automate', 'chaine', 'kere'])],
      fin: {
        victoire: ['clotho', "Le Sceau est devant toi. Il attend ton offrande. Choisis bien."],
        defaite: ['clotho', "Tu es tombé, mais le Sceau est à portée de main. Il attend ton offrande."]
      },
      choix: {
        question: 'Que donnes-tu au deuxième Sceau de Maïa ?',
        options: [
          { id: 'creature', texte: "Une créature de l'Enclos, qui tiendra la porte", jauge: 'honneur', effet: { liberer: 1, xp: 100 },
            resultat: "Ta créature s'avance d'elle-même vers le Sceau. Sa force passe dans la pierre, et le Sceau s'éclaire. Campé sera plus faible. (Une créature de l'Enclos te quitte, +100 XP. Si tu n'en as pas, Kelos prête un peu de sa force)" },
          { id: 'gloire', texte: 'Ta Gloire', jauge: 'piete', effet: { drachmes: 50 },
            resultat: "Tu poses la main sur le Sceau, et toute ta Gloire s'y écoule. Tu te sens plus léger, et plus seul. (La finale commencera sans Gloire, mais Campé sera plus faible. +50 drachmes)" },
          { id: 'ruse', texte: 'Passer par le chemin d\'Hermès, sans payer', jauge: 'ruse', effet: { drachmes: 100 },
            resultat: "Hermès te fait passer par une fissure. « Personne n'en paie jamais le prix tout de suite », répète-t-il en souriant. Tout de suite. (+100 drachmes. Un prix sera demandé plus tard...)" }
        ],
        defaut: 'gloire'
      }
    },
    58: {
      titre: 'Lysandre',
      presage: "« Dans les couloirs du Tartare, une silhouette grise t'attend. Tu sais déjà laquelle. »",
      scene: [
        ['lysandre', "Je reviens comme je suis partie : libre. Je ne te dois rien, mais je te donne un conseil : Campé déteste la lumière."],
        ['clotho', "Elle t'a laissé passer. Les Effilés, eux, ne te laisseront pas."]
      ],
      rencontres: [R('Le couloir gris', ['effile', 'effile', 'kere']), R('Les fidèles d\'Atropos', ['effile', 'kere', 'chaine']), R('La cellule vide', ['kere', 'kere', 'effile'])],
      variantes: {
        'j48=nom': {
          titre: 'Ismène',
          presage: "« Une femme aux cheveux gris t'attend, une lame d'étoile à la main. Elle s'appelle Ismène, maintenant. »",
          nouveau: 'Ismène (Lysandre) rejoint ton équipe pour la journée.',
          invite: 'lysandre_amie',
          scene: [
            ['lysandre', "Je m'appelle Ismène. Je te l'ai dit, je crois. Je le redis pour l'entendre."],
            ['lysandre', "Atropos a envoyé tous ses Effilés. Ils étaient mes frères. Je vais leur rendre leurs noms, un par un."],
            ['phaena', "Son fil est entier, maintenant. C'est la plus belle chose que j'ai vue depuis longtemps."]
          ],
          fin: {
            victoire: ['lysandre', "Ils dorment. Quand ils se réveilleront, ils se souviendront. Merci, Errant."],
            defaite: ['lysandre', "Relève-toi. Je ne vais nulle part. Plus jamais."]
          }
        },
        'j48=lame': {
          titre: 'La vengeance de Lysandre',
          presage: "« Lysandre t'attend dans le Tartare. Sans sa lame, elle a pris des ciseaux ordinaires. Ils coupent quand même. »",
          nouveau: "Gardienne : Lysandre, furieuse. Sans sa lame d'étoile, elle frappe moins fort, mais elle ne s'arrêtera pas.",
          scene: [
            ['lysandre', "Tu m'as tendu la main. Tu m'as volée. Ma Dame avait raison sur toi : tu es comme le premier."],
            ['phaena', "Elle est venue seule. Pas pour Atropos. Pour toi."]
          ],
          rencontres: [R('Le couloir gris', ['effile', 'kere']), G('Lysandre la Coupeuse', 'lysandre_lame', { attaque: 0.85 })],
          fin: {
            victoire: ['phaena', "Elle s'est enfuie dans le noir. Elle ne t'oubliera pas. Elle n'oublie plus rien, maintenant."],
            defaite: ['phaena', "Elle aurait pu nous couper. Elle a seulement pris ce que tu lui avais pris. Et elle est partie."]
          }
        }
      },
      fin: {
        victoire: ['clotho', "Demain, la veille. Après-demain, Campé."],
        defaite: ['clotho', "Les Effilés sont nombreux. Mais tu es plus têtu qu'eux."]
      }
    },
    59: {
      titre: 'La veille du Tartare',
      presage: "« Les chaînes de Campé s'agitent. Cette nuit, tout ce qui est enfermé ici veut sortir. »",
      nouveau: 'La veille : trois rencontres sans répit. Demain, Campé.',
      scene: [
        ['clotho', "Si le deuxième Sceau cède, les Titans du fond du Tartare remonteront. Même Atropos ne veut pas ça. Pas encore."],
        ['cedalion', "Les braises sont froides, ici. Je ne peux plus rien lire. Mais je sais que tu vas gagner."],
        ['phaena', "Demain, je me battrai même si je ne vois plus rien. Tu me diras où frapper, comme au début."]
      ],
      rencontres: [R('Les cellules ouvertes', ['chaine', 'kere', 'kere'], { pvMax: 0.85 }), R('Les prisonniers', ['automate', 'effile', 'kere'], { pvMax: 0.85 }), R('Le chemin de Campé', ['chaine', 'chaine', 'kere'], { pvMax: 0.85 })],
      fin: {
        victoire: ['phaena', "On a tenu. Les chaînes se taisent. Elles attendent leur maîtresse."],
        defaite: ['phaena', "Ils nous ont repoussés. Il faudra affronter Campé fatigués."]
      }
    },
    60: {
      titre: 'Campé, la Geôlière',
      presage: "« Dans la dernière salle du Tartare, une femme-dragon enroulée autour du deuxième Sceau. Ses chaînes se dressent. »",
      nouveau: "Finale du Chant II : Campé, en deux phases. D'abord ses Chaînes, qui la protègent (elle ne prend que 35 % des dégâts). Puis elle enrage. La Lumière la blesse. Récompenses doublées.",
      final: true, sceau: 'campe', bonus: { xp: 2, drachmes: 2 },
      scene: [
        ['campe', "Le dernier Errant a frappé à ma porte, lui aussi. Il est resté. Tu veux voir où ?"],
        ['phaena', "Le Sceau est sous elle. Il bat comme un cœur fatigué."],
        ['narrateur', "Le Sceau brille d'une lumière douce : la créature que tu as offerte tient la porte avec lui.", 'j57=creature'],
        ['narrateur', "Ta Gloire est dans le Sceau. Tu commences les mains vides, mais la pierre tient mieux.", 'j57=gloire'],
        ['hermes', "Ne regarde pas derrière toi. Le prix suivra plus tard. Toujours plus tard.", 'j57=ruse'],
        ['lysandre', "Ismène est là. Frappe ses chaînes, je surveille tes arrières.", 'j48=nom'],
        ['lachesis', "J'ai mesuré ton fil, Errant. Droit comme une lance. L'Honneur te gardera debout.", 'dominante=honneur'],
        ['lachesis', "J'ai mesuré ton fil, Errant. Il passe entre les mailles. Ta Ruse trouvera les failles de ses chaînes.", 'dominante=ruse'],
        ['lachesis', "J'ai mesuré ton fil, Errant. Les dieux le tiennent par l'autre bout. Ils ne le lâcheront pas ce soir.", 'dominante=piete'],
        ['clotho', "Brise les chaînes, puis frappe la Geôlière. Je tiens l'autre bout de ton fil."]
      ],
      rencontres: [R('Les cellules du fond', ['kere', 'effile']), { nom: 'Le Gardien : Campé, la Geôlière', ennemis: ['chaine', 'campe', 'chaine'], modif: null }],
      variantes: {
        'j57=creature': { rencontres: [R('Les cellules du fond', ['kere', 'effile']), { nom: 'Le Gardien : Campé, la Geôlière', ennemis: ['chaine', 'campe', 'chaine'], modif: { pvMax: 0.85 } }] },
        'j57=gloire': { gloireBonus: -100, rencontres: [R('Les cellules du fond', ['kere', 'effile']), { nom: 'Le Gardien : Campé, la Geôlière', ennemis: ['chaine', 'campe', 'chaine'], modif: { pvMax: 0.8 } }] },
        'j48=nom': { invite: 'lysandre_amie' }
      },
      fin: {
        victoire: ['clotho', "Le deuxième Sceau tient. Il en reste cinq, Errant. Et le fil de Phaéna tient aussi. Pour l'instant."],
        defaite: ['clotho', "Campé a resserré ses chaînes. Le Sceau tremble. Reviens demain : tant qu'elle n'est pas vaincue, le Chant ne s'achève pas."]
      },
      epilogue: ['atropos', "Tu as vu sa statue. Tu sais maintenant comment finissent ceux qui font tourner ce fuseau."]
    }
  };

  function jourDuChant(jc, histoire) {
    const base = JOURS[jc];
    if (!base) return null;
    const j = Object.assign({}, base);
    Object.keys(base.variantes || {}).forEach(cond => { if (C1.verifie(cond, histoire)) Object.assign(j, base.variantes[cond]); });
    j.scene = (j.scene || []).filter(l => C1.verifie(l[2], histoire));
    if (j.inviteSi && !C1.verifie(j.inviteSi, histoire)) delete j.invite;
    return j;
  }

  const Chant2 = { PERSOS: C1.PERSOS, CHAPITRES, JOURS, chapitreDu, jourDuChant, PREMIER_JOUR: 31, DERNIER_JOUR: 60 };
  if (typeof module !== 'undefined' && module.exports) module.exports = Chant2; else racine.Chant2 = Chant2;
})(typeof window !== 'undefined' ? window : this);
