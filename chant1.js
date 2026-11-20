/* Le Fil des Moires : Chant I, « Les Vals d'Aelwen » (jours 1 à 30).
   Chaque jour : un titre, un Présage, une scène avant le combat, les rencontres, une réplique de fin
   (victoire ou défaite) et parfois un choix. Les choix sont gardés dans profil.histoire.choix (clé « j6 », etc.)
   et changent des répliques ou des combats plus tard.
   Une réplique : [qui, texte] ou [qui, texte, condition]. Condition : 'j6=ianthe', 'j21!=epargner' ou 'dominante=honneur' (penchant du joueur : honneur, ruse ou piete). */
(function (racine) {
  'use strict';

  const PERSOS = {
    narrateur: { nom: '', emoji: '📜' },
    clotho: { nom: 'Clotho', emoji: '🧶' },
    phaena: { nom: 'Phaéna', emoji: '🧝🏻‍♀️' },
    kelos: { nom: 'Kelos', emoji: '🦅' },
    nikias: { nom: 'Nikias, berger de Myrtos', emoji: '🧑‍🌾' },
    aelis: { nom: 'Aëlis, gardienne des chants', emoji: '🧝🏻' },
    hermes: { nom: 'Hermès', emoji: '🪽' },
    dionysos: { nom: 'Dionysos', emoji: '🍇' },
    artemis: { nom: "Artémis, par la voix de l'autel", emoji: '🏹' },
    soeurs: { nom: 'Les Sœurs Grises', emoji: '👁️' },
    lachesis: { nom: 'Lachésis', emoji: '📏' },
    atropos: { nom: 'Atropos', emoji: '✂️' },
    lysandre: { nom: 'Lysandre la Coupeuse', emoji: '✂️' }
  };

  const CHAPITRES = [
    { num: 'I', titre: "L'Éveil", debut: 1, fin: 7 },
    { num: 'II', titre: "Les Ruines d'Aelwen", debut: 8, fin: 14 },
    { num: 'III', titre: 'Les Effilés', debut: 15, fin: 21 },
    { num: 'IV', titre: "L'Étang noir", debut: 22, fin: 30 }
  ];
  const chapitreDu = jour => CHAPITRES.find(c => jour >= c.debut && jour <= c.fin) || null;

  const R = (nom, ennemis, modif) => ({ nom, ennemis, modif: modif || null });
  const G = (nom, id, modif) => ({ nom: 'Le Gardien : ' + nom, ennemis: [id], modif: modif || null });

  // Jours 1 à 3 : le combat vient du prologue (data.js), le Chant n'ajoute que le récit.
  const JOURS = {
    1: {
      scene: [
        ['narrateur', "Une clairière. De la rosée, un glaive d'airain dans l'herbe, et toi, sans nom ni souvenir."],
        ['clotho', "Ah, tu t'éveilles. Ne cherche pas ton nom : je l'ai gardé. Pour l'instant, tu es l'Errant."],
        ['clotho', "Quelqu'un vient. Il a bu plus que de raison, et son fil est tout emmêlé. Lève ton glaive."]
      ],
      fin: {
        victoire: ['clotho', "Le satyre s'est enfui en titubant. Tu sais te battre : ça, au moins, ton corps s'en souvient."],
        defaite: ['clotho', "Un satyre ivre t'a mis à terre. Ce n'est pas grave : un fil se renforce à chaque nœud."]
      }
    },
    2: {
      scene: [
        ['clotho', "Au bord du chemin, une femme aux yeux d'or t'attend. Elle croit savoir qui tu es."],
        ['phaena', "Je vois le fil de chaque être. Le tien, je ne le vois pas. C'est la première fois de ma vie."],
        ['phaena', "Les harpies tournent au-dessus de nous. Je viens avec toi : j'ai besoin de comprendre."]
      ],
      fin: {
        victoire: ['phaena', "Tu te bats comme quelqu'un qui a fait la guerre. Longtemps. Je me demande où."],
        defaite: ['phaena', "Relève-toi. Les harpies ne reviennent jamais deux fois au même endroit."]
      }
    },
    3: {
      scene: [
        ['clotho', "Plus loin, un étang noir. Quelque chose y dort, et ce quelque chose a plusieurs têtes."],
        ['phaena', "Un griffon est pris dans les ronces, là-bas. Son fil est à moitié défait. Si on le libère..."],
        ['kelos', "Un cri d'orage. Le griffon te fixe longtemps, puis baisse la tête."]
      ],
      fin: {
        victoire: ['clotho', "L'Hydre a replongé, blessée. Elle ne meurt pas : elle attend. Nous la reverrons."],
        defaite: ['clotho', "L'Hydre t'a repoussé. Elle n'est pas pressée : cet étang est à elle depuis mille ans."]
      }
    },

    // ---------- Chapitre I : L'Éveil ----------
    4: {
      titre: 'Myrtos, le village sans noms',
      presage: "« Un village où l'on oublie jusqu'au nom de ses enfants. Les bêtes rôdent autour des bergeries. »",
      nouveau: 'Les Bergers d\'Arcadie ont besoin de toi. Trois rencontres, sans Gardien.',
      scene: [
        ['narrateur', "Myrtos. Des bergeries, un puits, et des gens qui te regardent sans savoir s'ils te connaissent."],
        ['nikias', "Je m'appelle Nikias. Je crois. Hier, mon voisin ne savait plus son propre nom, et les bêtes deviennent folles."],
        ['phaena', "Leurs fils s'effilochent. Pas tous, pas encore. Mais ça commence toujours par les plus petits."]
      ],
      rencontres: [R('Les bergeries', ['satyre', 'harpie']), R('Le puits', ['satyre', 'satyre']), R('La route du bois', ['harpie', 'harpie', 'satyre'])],
      fin: {
        victoire: ['nikias', "Tu as chassé les bêtes. Je me souviendrai de toi, je te le promets. J'espère."],
        defaite: ['nikias', "Ce n'est pas ta faute, étranger. Plus rien ne tient, ici, depuis quelque temps."]
      }
    },
    5: {
      titre: 'Le Bois des Dryades',
      presage: "« Dans le bois, les arbres pleurent une sève grise. Leurs gardiennes ne reconnaissent plus personne. »",
      nouveau: 'Nouvel ennemi : la Dryade effilochée. Elle soigne ses alliés, abats-la en premier. On peut la lier.',
      scene: [
        ['phaena', "Les dryades protègent ce bois depuis l'Âge d'Argent. Regarde-les : leur fil part en charpie."],
        ['clotho', "Une dryade qu'on lie ne s'effiloche plus. Pense à ton fil, Errant, pas seulement à ton glaive."]
      ],
      rencontres: [R('La lisière', ['dryade', 'satyre']), R('Les chênes gris', ['dryade', 'harpie']), R('Le cœur du bois', ['dryade', 'dryade', 'satyre'])],
      fin: {
        victoire: ['phaena', "La sève redevient verte, par endroits. Ce n'est pas rien."],
        defaite: ['phaena', "Le bois s'est refermé sur nous. Il a peur, je crois. Comme tout le monde."]
      }
    },
    6: {
      titre: "Le fil d'or",
      presage: "« Cette nuit, un fil d'or pendait du ciel, coupé net. À Myrtos, une enfant n'est pas rentrée. »",
      nouveau: "Un choix t'attend à la fin de l'épreuve, quelle qu'en soit l'issue.",
      scene: [
        ['nikias', "Ma fille, Ianthe. Elle est partie vers le bois hier soir et... je ne sais plus de quelle couleur sont ses yeux."],
        ['phaena', "Et là-haut, ce fil d'or qui pend. Il descend vers l'étang. Je n'ai jamais vu un fil coupé aussi net."],
        ['clotho', "Coupé net... Non. Ce n'est rien. Bats-toi d'abord, tu choisiras ensuite."]
      ],
      rencontres: [R('Le sentier', ['harpie', 'dryade']), R('Les ronciers', ['satyre', 'sirene']), R('La croisée', ['harpie', 'harpie', 'satyre'])],
      fin: {
        victoire: ['clotho', "Le chemin est libre. Maintenant, choisis : on ne suit pas deux fils à la fois."],
        defaite: ['clotho', "Tu es tombé, mais le jour n'est pas fini. Il te reste un choix à faire."]
      },
      choix: {
        question: "Le bois, où Ianthe a disparu, ou le fil d'or qui pend vers l'étang ?",
        options: [
          { id: 'ianthe', texte: 'Chercher Ianthe dans le bois', jauge: 'honneur', effet: { drachmes: 40 },
            resultat: "Tu retrouves Ianthe endormie sous un chêne. Elle reconnaît son père. Nikias pleure, et les bergers te donnent ce qu'ils ont. (+40 drachmes)" },
          { id: 'fil', texte: "Suivre le fil d'or", jauge: 'piete', effet: { fil: 1 },
            resultat: "Au bout du fil, sur la berge de l'étang, une écaille de pierre étoilée, tiède comme une main. Phaéna la regarde longtemps sans rien dire. (+1 Fil de réserve)" }
        ]
      }
    },
    7: {
      titre: "La Bête d'Érymanthe",
      presage: "« La terre tremble au pas d'une bête de pierre. Elle a déjà renversé trois bergeries. »",
      nouveau: "Gardien : le Sanglier d'Érymanthe. Roc : il résiste à la Foudre et craint le Vent.",
      scene: [
        ['nikias', "Ianthe dort enfin. Mais le sanglier descend sur Myrtos, et je n'ai que mon bâton.", 'j6=ianthe'],
        ['nikias', "Les bergers ont retrouvé Ianthe au matin. Elle ne me reconnaît pas. Et maintenant, le sanglier descend sur Myrtos.", 'j6!=ianthe'],
        ['kelos', "Kelos recule d'un pas, plumes hérissées. La foudre glisse sur la pierre, et il le sait."],
        ['clotho', "Si une créature liée a le vent sous les ailes, c'est le jour de l'emmener."]
      ],
      rencontres: [R('Les collines', ['satyre', 'dryade']), G("Sanglier d'Érymanthe", 'sanglier')],
      fin: {
        victoire: ['nikias', "Myrtos tient debout. Ce soir, on dira ton nom autour du feu, même si tu n'en as pas."],
        defaite: ['nikias', "La bête est repartie dans les collines, repue. On reconstruira. On a l'habitude, maintenant."]
      }
    },

    // ---------- Chapitre II : Les Ruines d'Aelwen ----------
    8: {
      titre: "Les Ruines d'Aelwen",
      presage: "« Des colonnes blanches dans la mousse. Un chant ancien flotte encore entre les pierres. »",
      scene: [
        ['narrateur', "Les ruines eldranes. Une femme très vieille, très droite, chante à mi-voix devant un autel brisé."],
        ['aelis', "Je suis Aëlis, gardienne des chants. Mon peuple part vers l'Ouest. Moi, je reste encore un peu."],
        ['aelis', "Pardonne-moi. Je me suis inclinée devant toi sans savoir pourquoi. Cela ne m'était jamais arrivé."]
      ],
      rencontres: [R("L'allée des colonnes", ['harpie', 'dryade']), R('Le théâtre effondré', ['satyre', 'satyre']), R("L'autel brisé", ['dryade', 'dryade', 'harpie'])],
      fin: {
        victoire: ['aelis', "Tu as rendu le silence à mes pierres. Reviens demain : j'ai des choses à te montrer."],
        defaite: ['aelis', "Les ruines ont l'habitude des défaites. Elles en ont vu plus que toi."]
      }
    },
    9: {
      titre: 'Le messager aux sandales ailées',
      presage: "« Un vent moqueur souffle sur les ruines. Au nord, la montagne gronde comme une porte qu'on secoue. »",
      nouveau: 'Gardien : un Cyclope descendu des Monts Gris. La Lumière l\'aveugle. Hermès double tes drachmes du jour.',
      bonus: { drachmes: 2 },
      scene: [
        ['hermes', "Te voilà ! Toujours aussi mal coiffé. Oh, pardon : tu ne te souviens pas de moi. Ça viendra."],
        ['hermes', "Un conseil d'ami : un cyclope a quitté les Monts Gris. Or les cyclopes ne quittent jamais les Monts Gris."],
        ['phaena', "Il te tutoie. Les dieux ne tutoient pas les mortels. Qui es-tu, Errant ?"]
      ],
      rencontres: [R('Le chemin du nord', ['harpie', 'satyre']), G('Cyclope des Monts', 'cyclope')],
      fin: {
        victoire: ['hermes', "Joli. Tiens, quelques drachmes pour la route. Ne dis pas à Zeus que je suis passé."],
        defaite: ['hermes', "Aïe. Bon, je repasserai. Je repasse toujours, c'est mon métier."]
      }
    },
    10: {
      titre: 'Le sanctuaire muet',
      presage: "« L'oracle est partie prier seule. Sans ses yeux d'or, il faudra voir clair par toi-même. »",
      nouveau: "Phaéna est absente aujourd'hui : l'Errant et ta créature partent à deux.",
      equipe: { errant: 'tout', griffon: 'tout' },
      scene: [
        ['phaena', "Il y a un sanctuaire d'Apollon dans ces ruines. Je dois lui demander pourquoi mes visions se contredisent."],
        ['phaena', "Seule. Ne me suis pas. Je te retrouve demain."],
        ['clotho', "À deux, alors. Garde ton Énergie et pense à la Garde : personne ne soignera tes plaies aujourd'hui."]
      ],
      rencontres: [R('Le parvis', ['satyre', 'harpie'], { pvMax: 0.85 }), R('Les escaliers', ['dryade', 'satyre'], { pvMax: 0.85 })],
      fin: {
        victoire: ['clotho', "Tu t'en es sorti sans elle. Ne le lui dis pas trop vite : elle aurait peur de ne plus servir."],
        defaite: ['clotho', "Sans ses soins, c'était rude. Demain, elle sera là."]
      }
    },
    11: {
      titre: "Ce que voit l'oracle",
      presage: "« Phaéna est revenue, les yeux rougis. Apollon ne lui a pas répondu. Ou alors, il a menti. »",
      scene: [
        ['phaena', "Apollon s'est tu. Mais dans son sanctuaire, j'ai essayé encore de voir ton fil."],
        ['phaena', "Je ne le vois toujours pas. Par contre, derrière toi, il y a un nœud. Énorme, ancien. Comme une cicatrice."],
        ['clotho', "Un nœud ? Elle a de bons yeux, ton oracle. Trop bons, peut-être."]
      ],
      rencontres: [R('La source', ['sirene', 'harpie']), R('Les thermes', ['dryade', 'satyre']), R('Le bassin', ['harpie', 'sirene', 'dryade'])],
      fin: {
        victoire: ['phaena', "On en reparlera. Ou jamais. Je ne sais pas si j'ai envie de savoir."],
        defaite: ['phaena', "Je t'ai mal soigné aujourd'hui. Mes visions me brouillent la vue."]
      }
    },
    12: {
      titre: 'La fête de Dionysos',
      presage: "« Des tambourins dans les ruines ! Un dieu a décidé qu'on ferait la fête. Fin du monde ou pas. »",
      nouveau: 'Événement : les ennemis sont ivres (plus lents, moins forts) et les récompenses sont multipliées par 1,5.',
      bonus: { xp: 1.5, drachmes: 1.5 },
      scene: [
        ['dionysos', "Une fin du monde ? Raison de plus pour danser ! Qui veut du vin ? Toi, l'air sombre, tu en as besoin."],
        ['phaena', "C'est Dionysos. Le seul dieu que l'Effilochage fait rire. Je ne sais pas si c'est rassurant."],
        ['kelos', "Kelos trempe le bec dans une amphore, éternue, et a l'air très content de lui."]
      ],
      rencontres: [R('La farandole', ['satyre', 'satyre'], { vitesse: 0.85, attaque: 0.9 }), R('Le banquet', ['satyre', 'satyre', 'harpie'], { vitesse: 0.85, attaque: 0.9 }), R('Les danseuses', ['satyre', 'sirene', 'satyre'], { vitesse: 0.85, attaque: 0.9 })],
      fin: {
        victoire: ['dionysos', "Bravo ! Tu danses avec un glaive, mais tu danses. Reviens quand tu veux."],
        defaite: ['dionysos', "Tombé ? Tout le monde tombe, à mes fêtes. Bois un coup et rentre."]
      }
    },
    13: {
      titre: 'Les Effilés',
      presage: "« Une fumée noire monte des ruines. Des hommes en gris ont mis le feu à la bibliothèque des chants. »",
      nouveau: "Nouvel ennemi : l'Effilé. Son Coupe-souvenir peut te faire oublier un tour. C'est un mortel : il ne se lie pas.",
      scene: [
        ['aelis', "Ils brûlent les chants ! Des mortels en robes grises, qui se coupent eux-mêmes la mémoire."],
        ['narrateur', "Un Effilé se retourne. Ses yeux sont calmes. Il sourit comme on sourit à un enfant qui a peur."],
        ['clotho', "Les Effilés. Ils prient ma sœur Atropos, et ils croient que la fin du monde est une délivrance."]
      ],
      rencontres: [R('La bibliothèque', ['effile', 'harpie']), R('Les rayonnages', ['effile', 'effile']), R('Le brasier', ['effile', 'dryade', 'satyre'])],
      fin: {
        victoire: ['aelis', "La moitié des chants est sauvée. L'autre moitié, je la porte dans ma tête. Pour l'instant."],
        defaite: ['aelis', "Les chants brûlent. Ce n'est pas la première fois. Ce sera peut-être la dernière."]
      }
    },
    14: {
      titre: 'Le départ des Eldrans',
      presage: "« Les Eldrans se rassemblent au bord du fleuve. Derrière eux, une bête à trois têtes rôde dans la fumée. »",
      nouveau: 'Gardien : une Chimère, échappée des Forges du nord. Un choix t\'attend à la fin.',
      scene: [
        ['aelis', "Mon peuple descend le fleuve jusqu'à la mer, puis l'Ouest. Ils disent que ce monde est perdu."],
        ['aelis', "Une chimère est descendue des Forges, chassée par une chaleur qui ne s'éteint plus. Elle attend les retardataires."],
        ['phaena', "Les Forges qui débordent, un cyclope hors de ses montagnes... Tout bouge, dans le nord."]
      ],
      rencontres: [R('La berge', ['effile', 'harpie']), G('Chimère', 'chimere')],
      fin: {
        victoire: ['aelis', "La route du fleuve est libre. Il me reste une décision à prendre, et c'est toi qui vas la prendre."],
        defaite: ['aelis', "La chimère s'est repliée, mais elle reviendra. Il faut décider maintenant."]
      },
      choix: {
        question: 'Aëlis peut partir avec les siens, ou rester défendre les Vals avec son chant. Que lui conseilles-tu ?',
        options: [
          { id: 'partir', texte: "L'escorter jusqu'aux barques", jauge: 'piete', effet: { xp: 80 },
            resultat: "Les barques glissent vers l'Ouest. Avant de monter, Aëlis glisse une feuille d'argent dans ta main : « Pour le jour où tu te souviendras. » (+80 XP)" },
          { id: 'rester', texte: 'La convaincre de rester', jauge: 'honneur', effet: { drachmes: 30 },
            resultat: "Aëlis regarde partir les siens, puis se tourne vers toi. « Un chant de plus, pour un monde de plus. Soit. » (+30 drachmes)" }
        ]
      }
    },

    // ---------- Chapitre III : Les Effilés ----------
    15: {
      titre: 'Myrtos sous la cendre',
      presage: "« Les Effilés marchent sur Myrtos. Ils disent qu'ils viennent libérer les bergers de leurs souvenirs. »",
      scene: [
        ['nikias', "Ils sont dans le village ! Ils disent que l'oubli ne fait pas mal. Je ne veux pas oublier !"],
        ['nikias', "Ianthe s'est cachée dans la bergerie. Elle se souvient de moi, elle. Je ne les laisserai pas lui prendre ça.", 'j6=ianthe'],
        ['nikias', "Ianthe ne me reconnaît toujours pas. Les Effilés disent que c'est un cadeau. Ils mentent, n'est-ce pas ?", 'j6!=ianthe'],
        ['phaena', "Leur chef n'est pas là. Ce sont des fidèles, rien de plus. Ça ne les rend pas moins dangereux."]
      ],
      rencontres: [R('La grand-place', ['effile', 'satyre']), R('Les bergeries', ['effile', 'harpie']), R('Le puits', ['effile', 'effile', 'satyre'])],
      fin: {
        victoire: ['nikias', "Ils sont partis. En s'enfuyant, ils répétaient un nom, comme une prière : Lysandre."],
        defaite: ['nikias', "Ils ont pris trois souvenirs à Myrtos. Trois vies entières. Et ils sont partis en chantant."]
      }
    },
    16: {
      titre: "L'autel d'Artémis",
      presage: "« Au cœur du bois, un autel de chasse. Kelos refuse d'avancer, puis refuse de partir. »",
      scene: [
        ['kelos', "Kelos se pose sur l'autel et pousse un cri long et doux, que tu ne lui connaissais pas."],
        ['phaena', "Il connaît cet endroit. Dans son fil, il y a un écho... la meute d'Artémis."],
        ['artemis', "Il était de ma meute. Prends soin de lui, mortel au fil vierge, ou je viendrai le reprendre."]
      ],
      rencontres: [R("L'orée", ['dryade', 'dryade']), R('Le gué des biches', ['harpie', 'sirene']), R("L'autel", ['dryade', 'satyre', 'harpie'])],
      fin: {
        victoire: ['artemis', "Tu as protégé mon bois. Les bêtes s'en souviendront. Moi aussi."],
        defaite: ['clotho', "Artémis est farouche, pas cruelle. Elle t'a vu tomber pour son bois. Elle s'en souviendra."]
      }
    },
    17: {
      titre: 'Les Sœurs Grises',
      presage: "« Trois vieilles femmes, un seul œil. Elles vendent ce qu'elles savent contre ce que tu as vécu. »",
      nouveau: "Un marché t'attend à la fin de l'épreuve.",
      scene: [
        ['soeurs', "Approche, fil vierge. Nous savons ce qui dort sous l'étang. Le prix ? Un souvenir. Un petit. Le premier."],
        ['phaena', "Ne leur donne rien. Elles ont pris la mémoire de plus de rois que l'Effilochage."],
        ['soeurs', "Mais d'abord, débarrasse-nous de ces vauriens. On ne fait pas affaire au milieu des harpies."]
      ],
      rencontres: [R('La masure', ['harpie', 'harpie']), R('Le cercle de pierres', ['effile', 'harpie']), R('Le nid', ['harpie', 'harpie', 'effile'])],
      fin: {
        victoire: ['soeurs', "Bien, bien. Maintenant, parlons affaires."],
        defaite: ['soeurs', "Tombé ? Tant pis pour toi. Nos prix, eux, ne changent pas."]
      },
      choix: {
        question: "Les Sœurs Grises offrent le secret de l'étang contre le souvenir de ton premier combat.",
        options: [
          { id: 'souvenir', texte: 'Donner le souvenir', jauge: 'piete', effet: {},
            resultat: "Le satyre de la clairière s'efface de ta mémoire. En échange : « L'Hydre ne garde pas l'étang. Elle garde ce qui dort dessous, une pierre d'étoile. Et sa plus vieille tête craint le feu. » L'Hydre éveillée aura une tête de moins." },
          { id: 'oeil', texte: 'Leur voler leur œil', jauge: 'ruse', effet: { drachmes: 80 },
            resultat: "Pendant qu'elles se le passent, tu attrapes l'œil. Elles crachent le secret, l'Hydre garde une pierre d'étoile, et paient pour le récupérer. Elles ne l'oublieront pas. (+80 drachmes)" }
        ]
      }
    },
    18: {
      titre: 'Les captifs du bois',
      presage: "« Les Effilés ont enchaîné des créatures dans une clairière. Ils veulent couper leurs fils, un par un. »",
      nouveau: 'Beaucoup de créatures à lier aujourd\'hui : affaiblis-les sans les achever.',
      scene: [
        ['phaena', "Des satyres, des dryades, une harpie. Enchaînés. Les Effilés appellent ça « les délivrer »."],
        ['clotho', "Affaiblis-les, ne les achève pas. Un fil qu'on lie, ils ne peuvent plus le couper."]
      ],
      rencontres: [R('Les chaînes', ['effile', 'satyre']), R('Les cages', ['effile', 'dryade']), R('Le billot', ['effile', 'harpie', 'dryade'])],
      fin: {
        victoire: ['phaena', "Ceux qu'on n'a pas pu lier se sont enfuis. Libres. C'est déjà beaucoup."],
        defaite: ['phaena', "Ils ont emmené les captifs plus loin. Je ne sais pas où."]
      }
    },
    19: {
      titre: 'Le rêve de la porte',
      presage: "« Cette nuit, tu as rêvé d'une montagne voilée et d'une porte qui se fermait. Tu étais de l'autre côté. »",
      scene: [
        ['narrateur', "Tu t'éveilles en sueur. Dans ton rêve, quelqu'un te disait adieu. Une voix de femme, très douce, et triste."],
        ['phaena', "Tu as parlé en dormant. Un nom. Je ne l'ai pas compris, mais Kelos s'est réveillé d'un coup."],
        ['clotho', "Les rêves sont des fils qui dépassent. Ne tire pas dessus trop fort, Errant. Pas encore."]
      ],
      rencontres: [R('Les roseaux', ['sirene', 'sirene']), R('Le ponton', ['effile', 'sirene']), R("L'île aux saules", ['harpie', 'effile', 'sirene'])],
      fin: {
        victoire: ['clotho', "Bien. Garde les yeux ouverts le jour, et les rêves pour la nuit."],
        defaite: ['clotho', "Tu avais la tête ailleurs. Dans une montagne, je crois."]
      }
    },
    20: {
      titre: 'Les ciseaux dans le ciel',
      presage: "« Au crépuscule, des fils d'or tombent du ciel, coupés net. Les Effilés les ramassent comme des reliques. »",
      nouveau: 'Gardien : la Chimère, revenue. Les Effilés l\'ont apprivoisée.',
      scene: [
        ['phaena', "Je l'ai vue. Une seconde. Une ombre immense, et deux lames qui se refermaient sur le ciel."],
        ['clotho', "Ma sœur Atropos. Elle ne descend jamais : elle coupe d'en haut. Ne la regarde pas, Phaéna."],
        ['phaena', "Tu as peur. Une Moire qui a peur. Je ne pensais jamais voir ça."]
      ],
      rencontres: [R('Le camp gris', ['effile', 'effile']), G('Chimère', 'chimere')],
      fin: {
        victoire: ['clotho', "Les Effilés ont perdu leur bête. Lysandre va venir elle-même, maintenant."],
        defaite: ['clotho', "La chimère garde le camp des Effilés. Demain, il faudra passer quand même."]
      }
    },
    21: {
      titre: 'Lysandre la Coupeuse',
      presage: "« Elle s'est coupé tous ses souvenirs, sauf un : sa promesse à Atropos. »",
      nouveau: 'Gardienne : Lysandre la Coupeuse. Ombre : la Lumière de Phaéna la blesse.',
      scene: [
        ['lysandre', "Errant. Ma Dame m'a parlé de toi : le fil qu'elle ne voit pas. Laisse-moi le couper, et tu dormiras enfin."],
        ['lysandre', "Je ne me souviens ni de ma mère, ni de mon nom d'avant. Je n'ai jamais été aussi légère."],
        ['phaena', "Son fil est presque vide. Il ne reste qu'un nœud, très serré. Sa promesse."]
      ],
      rencontres: [R('Le cercle des fidèles', ['effile', 'effile']), G('Lysandre la Coupeuse', 'lysandre')],
      fin: {
        victoire: ['lysandre', "Pourquoi est-ce que je pleure ? Je ne me souviens de rien qui mérite qu'on pleure."],
        defaite: ['lysandre', "Tu résistes. Ma Dame sera patiente. Elle l'est toujours."]
      },
      choix: {
        seulementVictoire: true, defaut: 'fuite',
        question: 'Lysandre est à terre, désarmée. Que fais-tu d\'elle ?',
        options: [
          { id: 'epargner', texte: 'La laisser partir', jauge: 'honneur', effet: { xp: 60 },
            resultat: "Elle se relève sans un mot et disparaît entre les arbres. Sur la mousse, elle a laissé ses ciseaux. (+60 XP)" },
          { id: 'juger', texte: 'La ramener à Myrtos', jauge: 'ruse', effet: { drachmes: 60 },
            resultat: "Les bergers l'enferment dans la bergerie de Nikias. Elle ne résiste pas. Elle sourit, et ça les inquiète plus que tout. (+60 drachmes)" }
        ]
      }
    },

    // ---------- Chapitre IV : L'Étang noir ----------
    22: {
      titre: "L'étang déborde",
      presage: "« L'étang noir a débordé pendant la nuit. Ses eaux n'ont pas de reflet. »",
      scene: [
        ['phaena', "L'eau monte vers Myrtos. Et dessous, quelque chose respire. Lentement."],
        ['phaena', "L'écaille d'étoile que tu as trouvée au bord de l'étang... elle brûle, ce matin.", 'j6=fil'],
        ['clotho', "C'est ici que dort le Sceau de Maïa, une des sept pierres qui enchaînent Kronar. Et il se fissure."]
      ],
      rencontres: [R('Les prés noyés', ['sirene', 'sirene']), R('Le moulin', ['sirene', 'harpie']), R('La digue', ['sirene', 'dryade', 'sirene'])],
      fin: {
        victoire: ['clotho', "Tu as repoussé les eaux. Pour un jour. L'étang a plus de patience que nous."],
        defaite: ['clotho', "L'eau a gagné trois pas sur Myrtos. Il faudra faire mieux demain."]
      }
    },
    23: {
      titre: 'Le chant des roseaux',
      presage: "« Les sirènes de l'étang chantent toute la nuit. Les bergers marchent vers l'eau en dormant. »",
      scene: [
        ['nikias', "J'ai retrouvé trois bergers dans l'eau jusqu'à la taille, les yeux ouverts. Ils souriaient."],
        ['phaena', "Les sirènes ne sont pas cruelles, elles sont folles. Leur fil est noué à celui de l'Hydre."]
      ],
      rencontres: [R('Les roseaux', ['sirene', 'sirene']), R('La rive', ['sirene', 'effile']), R('Le chœur', ['sirene', 'sirene', 'harpie'])],
      fin: {
        victoire: ['nikias', "Ils se sont réveillés. Trempés, furieux, vivants."],
        defaite: ['nikias', "On a attaché les dormeurs à leurs lits. On tiendra."]
      }
    },
    24: {
      titre: 'Le cyclope de la berge',
      presage: "« Le cyclope des Monts Gris est revenu. Il ne se bat pas : il garde l'étang, comme on garde une prison. »",
      nouveau: 'Gardien : le Cyclope des Monts, de retour.',
      scene: [
        ['hermes', "Encore lui ? Il a fui sa montagne parce que la prison de Kronar tremble. Ici aussi, ça tremble. Il ne sait plus où se mettre."],
        ['hermes', "Tu le battais à mains nues, autrefois. Oups. Je n'ai rien dit."],
        ['phaena', "Autrefois ? Hermès ! Reviens ici !"]
      ],
      rencontres: [R('Les éboulis', ['harpie', 'effile']), G('Cyclope des Monts', 'cyclope')],
      fin: {
        victoire: ['phaena', "Il a reculé jusqu'aux collines. Et Hermès a disparu, bien sûr."],
        defaite: ['phaena', "Le cyclope ne nous poursuit pas. Il retourne garder son étang. Étrange geôlier."]
      }
    },
    25: {
      titre: "La chasse d'Artémis",
      presage: "« Une trompe de chasse résonne dans les Vals. Artémis lâche sa meute sur les bêtes rendues folles. »",
      nouveau: 'Événement : chasse divine. Les créatures se lient plus facilement (+15 %) et les récompenses sont multipliées par 1,5.',
      bonus: { xp: 1.5, drachmes: 1.5 }, lienBonus: 0.15,
      scene: [
        ['artemis', "Mes chiens chassent ce qui est perdu. Toi, lie ce qui peut encore être sauvé. Chacun son gibier."],
        ['kelos', "Kelos répond à la trompe par un cri d'orage. Il vole plus vite qu'il n'a jamais volé."]
      ],
      rencontres: [R('La battue', ['satyre', 'dryade']), R('Le vallon', ['harpie', 'sirene']), R('La curée', ['dryade', 'satyre', 'harpie'])],
      fin: {
        victoire: ['artemis', "Bonne chasse, mortel. Ma meute te salue. Lui aussi, je crois."],
        defaite: ['artemis', "On ne gagne pas toutes les chasses. Mais on y retourne."]
      }
    },
    26: {
      titre: 'Le hameau oublié',
      presage: "« Ce matin, le hameau de Kélia n'existe plus. Personne ne se souvient qu'il ait existé. Sauf toi. »",
      nouveau: 'Gardien : la Chimère, une dernière fois.',
      scene: [
        ['nikias', "Kélia ? Il n'y a jamais eu de hameau de l'autre côté du gué. Tu as dû rêver, étranger."],
        ['phaena', "Je ne m'en souviens pas non plus. Mais il y a un trou dans la trame, là-bas. Un trou propre. Coupé."],
        ['clotho', "Ton fil est vierge : ses ciseaux n'atteignent pas tes souvenirs. Tu es le seul à porter Kélia, maintenant."],
        ['soeurs', "Coucou, voleur ! On a payé quelques harpies pour te dire bonjour.", 'j17=oeil']
      ],
      rencontres: [R('Le gué', ['effile', 'sirene']), G('Chimère', 'chimere')],
      variantes: { 'j17=oeil': { rencontres: [R('La vengeance des Sœurs', ['harpie', 'harpie', 'harpie']), R('Le gué', ['effile', 'sirene']), G('Chimère', 'chimere')] } },
      fin: {
        victoire: ['clotho', "Garde Kélia en toi. Un jour, on la retissera. Je te le promets, et je ne promets jamais."],
        defaite: ['clotho', "Garde Kélia en toi, même vaincu. Tant que quelqu'un s'en souvient, le trou n'est pas tout à fait vide."]
      }
    },
    27: {
      titre: "Le dernier chant d'Aelwen",
      presage: "« Les Effilés se rassemblent sur l'autre rive. Dans les ruines, une voix eldrane chante encore. »",
      scene: [
        ['narrateur', "La feuille d'argent d'Aëlis s'est mise à chanter toute seule. Une seule note, très pure.", 'j14=partir'],
        ['phaena', "Elle te protège. Les Eldrans ne donnent pas leurs chants à n'importe qui.", 'j14=partir'],
        ['aelis', "Je suis restée, alors je chante. Pour toi, pour Myrtos, pour Kélia que personne n'a connue.", 'j14=rester'],
        ['aelis', "Quand tu affronteras l'Hydre, je serai sur la berge. Mon chant te portera.", 'j14=rester'],
        ['clotho', "Les Effilés veulent atteindre l'étang avant toi. Ne les laisse pas passer."]
      ],
      rencontres: [R('Le pont', ['effile', 'effile']), R('Les ruines', ['effile', 'dryade']), R('La rive', ['effile', 'effile', 'harpie'])],
      fin: {
        victoire: ['phaena', "Ils ont reculé. Mais ils attendent quelque chose, sur l'autre rive. Ou quelqu'un."],
        defaite: ['phaena', "Ils sont passés. Il faudra les rattraper avant l'étang."]
      }
    },
    28: {
      titre: 'Lysandre revient',
      presage: "« Les Effilés ont brisé la bergerie de Nikias. Lysandre est libre, et elle n'a rien oublié de toi. »",
      nouveau: 'Gardienne : Lysandre la Coupeuse, plus forte que la première fois.',
      scene: [
        ['lysandre', "Tu m'as enfermée. C'était gentil. Ma Dame, elle, ne m'a jamais enfermée.", 'j21=juger'],
        ['lysandre', "La dernière fois, tu as eu de la chance. Ma Dame dit que la chance aussi, ça se coupe.", 'j21!=juger'],
        ['clotho', "Si elle passe, l'Hydre s'éveille cette nuit. Tiens bon."]
      ],
      rencontres: [R('Le gué', ['effile', 'effile']), G('Lysandre la Coupeuse', 'lysandre', { attaque: 1.05 })],
      variantes: {
        'j21=epargner': {
          titre: "L'avertissement",
          presage: "« Une silhouette grise t'attend au gué. Elle a laissé ses ciseaux dans le bois. »",
          nouveau: 'Pas de Gardien aujourd\'hui : quelqu\'un a choisi ton camp.',
          scene: [
            ['lysandre', "Je ne sais pas pourquoi je suis venue. Je ne me souviens pas de toi, mais mes mains, si."],
            ['lysandre', "Ils vont réveiller l'Hydre demain soir. Ma Dame veut que le Sceau de Maïa cède. Va plus vite qu'eux."],
            ['phaena', "Son fil... il y a un nouveau nœud dedans. Tout petit. C'est toi."]
          ],
          rencontres: [R('Le gué', ['effile', 'effile']), R('Les fidèles', ['effile', 'sirene']), R("L'arrière-garde", ['effile', 'effile', 'dryade'])],
          fin: {
            victoire: ['phaena', "Lysandre est repartie vers l'est, seule. Je crois qu'elle ne retournera pas chez eux."],
            defaite: ['phaena', "Lysandre nous a regardés tomber, puis elle est partie. Elle avait l'air triste. Elle ne sait pas pourquoi."]
          }
        }
      },
      fin: {
        victoire: ['clotho', "Lysandre s'est enfuie vers l'est. Elle ne reviendra pas avant longtemps."],
        defaite: ['clotho', "Elle est passée. L'Hydre s'éveillera plus en colère encore."]
      }
    },
    29: {
      titre: "La veille de l'étang",
      presage: "« Le Sceau de Maïa bat sous l'eau, comme un cœur. Cette nuit, tout ce qui vit dans l'étang se lève. »",
      nouveau: "La veille : trois rencontres sans répit. Demain, l'Hydre éveillée.",
      scene: [
        ['clotho', "Errant. Ta tapisserie, celle que je tisse chaque jour... elle compte plus que tu ne crois."],
        ['clotho', "Non. Pas maintenant. Gagne demain, et je te dirai un fil de plus."],
        ['kelos', "Kelos dort contre toi, la tête sous l'aile. Il ne l'avait jamais fait."]
      ],
      rencontres: [R('Les eaux montent', ['sirene', 'sirene', 'harpie'], { pvMax: 0.85 }), R('Les fidèles', ['effile', 'sirene', 'dryade'], { pvMax: 0.85 }), R('Le chœur noyé', ['sirene', 'sirene', 'effile'], { pvMax: 0.85 })],
      fin: {
        victoire: ['phaena', "On a tenu toute la nuit. L'eau ne monte plus. Elle attend."],
        defaite: ['phaena', "Les eaux nous ont repoussés. Il faudra affronter l'Hydre fatigués."]
      }
    },
    30: {
      titre: "L'Hydre éveillée",
      presage: "« Mille ans qu'elle garde la pierre d'étoile. Cette nuit, l'Hydre s'éveille pour de bon. »",
      nouveau: 'Finale du Chant I : l\'Hydre éveillée, jusqu\'à cinq têtes. La Flamme reste sa faiblesse. Récompenses doublées.',
      final: true, bonus: { xp: 2, drachmes: 2 },
      scene: [
        ['narrateur', "L'étang se soulève. Une tête, puis deux, puis cinq. Sous elles, une lueur d'étoile bat comme un cœur."],
        ['phaena', "Son fil est noué à quelque chose d'immense, sous la pierre. Quelque chose qui a faim."],
        ['aelis', "Je suis sur la berge, Errant. Écoute : ce chant est pour toi. (Ta Gloire démarre plus haut.)", 'j14=rester'],
        ['phaena', "Les Sœurs Grises disaient vrai : sa plus vieille tête protège la pierre. Elle ne repoussera pas.", 'j17=souvenir'],
        ['lachesis', "J'ai mesuré ton fil, Errant. Il est droit, et il tient sa parole. L'Honneur te donnera la force de rester debout.", 'dominante=honneur'],
        ['lachesis', "J'ai mesuré ton fil, Errant. Il se faufile là où les autres cassent. Ta Ruse trouvera la faille.", 'dominante=ruse'],
        ['lachesis', "J'ai mesuré ton fil, Errant. Il a été offert aux dieux plus d'une fois. Ils s'en souviendront ce soir.", 'dominante=piete'],
        ['clotho', "Tiens bon, mon fil. Je tiens l'autre bout."]
      ],
      rencontres: [R('La berge', ['sirene', 'effile']), G("L'Hydre éveillée", 'hydre_eveillee')],
      variantes: {
        'j17=souvenir': { rencontres: [R('La berge', ['sirene', 'effile']), G("L'Hydre éveillée", 'hydre_eveillee', { tetesMax: 0.8 })] },
        'j14=rester': { gloireBonus: 25 }
      },
      fin: {
        victoire: ['clotho', "Le Sceau de Maïa tient. Fissuré, mais il tient. Il en reste six, Errant. Et ma sœur ne dort jamais."],
        defaite: ['clotho', "L'Hydre a replongé, et le Sceau tremble encore. Reviens demain : tant qu'elle n'est pas vaincue, le Chant ne s'achève pas."]
      }
    }
  };

  // La cinématique d'introduction : le Grand Métier, les Moires, le fil de l'Errant et la tapisserie
  const INTRO = [
    { plan: 'metier', qui: 'narrateur', texte: "Avant les dieux, il y avait la Nuit. Et dans la Nuit, un métier à tisser plus vaste que le ciel : le Grand Métier." },
    { plan: 'fils', qui: 'narrateur', texte: "Le monde est une tapisserie tendue sur ce métier. Chaque être vivant y est un fil : sa couleur dit ce qu'il est, sa longueur, combien de temps il vivra." },
    { plan: 'soeurs', qui: 'clotho', texte: "Nous sommes trois sœurs, les Moires. Moi, Clotho, je file. Lachésis mesure. Atropos coupe." },
    { plan: 'effilochage', qui: 'narrateur', texte: "Mais depuis une génération, le monde s'effiloche. Des fils se défont, des villages s'oublient, et la nuit, des fils d'or pendent du ciel, coupés." },
    { plan: 'errant', qui: 'clotho', texte: "Ma sœur Atropos veut tout trancher. Alors j'ai filé, en secret, un fil qu'elle ne peut pas voir. Un fil sans destin. C'est toi, l'Errant." },
    { plan: 'tissage', qui: 'clotho', texte: "Chaque jour, tu affronteras une épreuve. Et chaque soir, je tisserai ce que tu as fait dans ta tapisserie : un rang par jour." },
    { plan: 'qualite', qui: 'clotho', texte: "Une victoire parfaite, et le rang brille d'or. Une défaite, et il s'abîme. Mais le fil ne rompt jamais : on continue le lendemain." },
    { plan: 'chant', qui: 'clotho', texte: "Trente rangs font un Chant, et un motif apparaît. Garde-la belle, ta tapisserie. Elle compte plus que tu ne crois." }
  ];

  // Évalue une condition « j6=ianthe » ou « j21!=epargner »
  function verifie(cond, histoire) {
    if (!cond) return true;
    const choix = Object.assign({}, (histoire && histoire.choix) || {}, { dominante: histoire && histoire.dominante });
    const m = cond.match(/^(\w+)(!?=)(\w+)$/);
    if (!m) return true;
    return m[2] === '=' ? choix[m[1]] === m[3] : choix[m[1]] !== m[3];
  }

  // Le jour du Chant, avec ses variantes appliquées selon les choix déjà faits
  function jourDuChant(jour, histoire) {
    const base = JOURS[jour];
    if (!base) return null;
    const j = Object.assign({}, base);
    Object.keys(base.variantes || {}).forEach(cond => { if (verifie(cond, histoire)) Object.assign(j, base.variantes[cond]); });
    j.scene = (j.scene || []).filter(l => verifie(l[2], histoire));
    return j;
  }

  const Chant1 = { INTRO, PERSOS, CHAPITRES, JOURS, chapitreDu, jourDuChant, verifie, DERNIER_JOUR: 30 };
  if (typeof module !== 'undefined' && module.exports) module.exports = Chant1; else racine.Chant1 = Chant1;
})(typeof window !== 'undefined' ? window : this);
