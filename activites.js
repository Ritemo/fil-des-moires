/* Le Fil des Moires : activités de l'Agora (Oracle, Forge, Expéditions, Arène, Titan).
   Logique pure : fonctionne dans le navigateur (window.Activites) et dans Node (module.exports). */
(function (racine) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const D = node ? require('./data.js') : racine.Donnees;
  const M = node ? require('./engine.js') : racine.Moteur;
  const P = node ? require('./progression.js') : racine.Progression;

  // Jours joués nécessaires pour ouvrir chaque activité (une par jour, pour les découvrir une à une)
  const DEBLOCAGE = { oracle: 3, forge: 4, arene: 4, expedition: 5, titan: 6, marchand: 4 };
  const NOMS = {
    oracle: { nom: "L'Oracle de Delphes", emoji: '🔮', court: 'Oracle' },
    forge: { nom: "La Forge d'Héphaïstos", emoji: '⚒️', court: 'Forge' },
    arene: { nom: "L'Arène des ombres", emoji: '🏟️', court: 'Arène' },
    expedition: { nom: 'Les Expéditions', emoji: '🗺️', court: 'Expéditions' },
    titan: { nom: 'Le Titan de la semaine', emoji: '🗿', court: 'Titan' },
    marchand: { nom: 'Le Marchand Hermès', emoji: '🪽', court: 'Hermès' }
  };
  const MATERIAUX = {
    airain: { nom: 'Airain', emoji: '⚙️' },
    olivier: { nom: "Bois d'olivier", emoji: '🪵' },
    laine: { nom: 'Laine sacrée', emoji: '🧶' },
    eclat: { nom: "Éclat d'oracle", emoji: '🔮' },
    perle: { nom: 'Perle de Thétis', emoji: '💎' }
  };

  function hasardDe(texte) { return M.creerHasard(M.graineDuJour(texte)); }
  function joursDepuis(date) { const [a, m, j] = date.split('-').map(Number); return Math.floor(Date.UTC(a, m - 1, j) / 86400000); }
  function dateDe(n) { const d = new Date(n * 86400000); return d.toISOString().slice(0, 10); }

  function initialiser(profil) {
    const a = profil.activites = profil.activites || {};
    a.materiaux = Object.assign({ airain: 0, olivier: 0, laine: 0, eclat: 0, perle: 0 }, a.materiaux || {});
    a.talismans = a.talismans || {};
    if (a.talisman === undefined) a.talisman = null;
    a.oracle = a.oracle || { serie: 0, justes: 0 };
    a.expedition = a.expedition || null;
    a.arene = a.arene || { trophees: 0, journal: [] };
    a.titan = a.titan || {};
    return a;
  }
  function debloquee(profil, id) { return (profil.joursJoues || 0) >= DEBLOCAGE[id]; }
  function ajouterMateriaux(profil, m) { Object.keys(m).forEach(k => { profil.activites.materiaux[k] = (profil.activites.materiaux[k] || 0) + m[k]; }); }

  // ====================== ORACLE DE DELPHES ======================
  // [question, [3 réponses], indice de la bonne, explication]
  const QUESTIONS = [
    ['Combien les Moires sont-elles ?', ['Deux', 'Trois', 'Neuf'], 1, 'Clotho file, Lachésis mesure et Atropos coupe le fil de chaque vie.'],
    ['Laquelle des Moires coupe le fil de la vie ?', ['Clotho', 'Lachésis', 'Atropos'], 2, "Atropos, « celle qu'on ne peut détourner », tient les ciseaux."],
    ['Quel héros a tué la Méduse ?', ['Persée', 'Thésée', 'Jason'], 0, "Persée l'a décapitée en regardant son reflet dans le bouclier poli d'Athéna."],
    ["Quel monstre vivait au cœur du labyrinthe de Crète ?", ['Le Minotaure', 'La Chimère', 'Le Cyclope'], 0, 'Thésée le vainquit, guidé par le fil que lui avait donné Ariane.'],
    ["Grâce à quoi Thésée est-il ressorti du labyrinthe ?", ['Une torche', "Un fil d'Ariane", 'Une carte de Dédale'], 1, "Ariane lui donna une pelote : il la déroula à l'aller et la suivit au retour."],
    ["Combien de travaux Héraclès a-t-il accomplis ?", ['Sept', 'Dix', 'Douze'], 2, "Douze travaux, imposés par le roi Eurysthée."],
    ["Quel était le premier des travaux d'Héraclès ?", ['Le lion de Némée', "L'Hydre de Lerne", 'Les écuries d\'Augias'], 0, "Sa peau impénétrable devint ensuite le manteau du héros."],
    ["Pourquoi l'Hydre de Lerne était-elle si redoutable ?", ['Elle volait', 'Ses têtes repoussaient', 'Elle était invisible'], 1, "Chaque tête coupée repoussait : Iolaos cautérisa les plaies avec une torche."],
    ["Qui a aidé Héraclès à vaincre l'Hydre ?", ['Iolaos', 'Achille', 'Orphée'], 0, "Son neveu Iolaos brûlait chaque cou tranché pour empêcher la repousse."],
    ['Quel dieu règne sur les mers ?', ['Hadès', 'Poséidon', 'Apollon'], 1, "Poséidon porte le trident et fait trembler la terre."],
    ['Quel est le symbole de Poséidon ?', ['La foudre', 'Le trident', "L'arc d'argent"], 1, 'Son trident lui sert à soulever les tempêtes et faire jaillir les sources.'],
    ['Qui règne sur le royaume des morts ?', ['Hadès', 'Arès', 'Hermès'], 0, 'Hadès, frère de Zeus et de Poséidon, reçut le monde souterrain en partage.'],
    ['Quel chien garde les Enfers ?', ['Orthros', 'Cerbère', 'Argos'], 1, 'Cerbère, le chien à trois têtes, empêche les morts de repartir.'],
    ["Quel passeur fait traverser le Styx aux âmes ?", ['Charon', 'Hermès', 'Éaque'], 0, "On plaçait une obole dans la bouche des défunts pour payer Charon."],
    ["De quelle tête Athéna est-elle née ?", ['De celle de Zeus', "De celle d'Héra", 'De celle de Cronos'], 0, 'Elle jaillit tout armée du crâne de Zeus, fendu par Héphaïstos.'],
    ["Quel arbre Athéna a-t-elle offert aux Athéniens ?", ['Le chêne', "L'olivier", 'Le laurier'], 1, "L'olivier l'emporta sur la source salée de Poséidon : la ville prit son nom."],
    ['Quel oiseau accompagne Athéna ?', ['Le corbeau', 'La chouette', "L'aigle"], 1, 'La chouette, symbole de sagesse, figure sur les pièces athéniennes.'],
    ['Quel dieu forge les armes des dieux ?', ['Héphaïstos', 'Arès', 'Dionysos'], 0, 'Le dieu boiteux travaille sous les volcans, aidé des Cyclopes.'],
    ['Qui est le dieu de la guerre brutale ?', ['Apollon', 'Arès', 'Hermès'], 1, 'Arès aime la mêlée ; Athéna, elle, incarne la stratégie.'],
    ['Quel dieu porte des sandales ailées ?', ['Hermès', 'Éros', 'Hélios'], 0, 'Messager des dieux, Hermès guide aussi les âmes vers les Enfers.'],
    ["Où se trouvait le plus célèbre oracle d'Apollon ?", ['Olympie', 'Delphes', 'Sparte'], 1, "La Pythie y rendait ses oracles, assise sur un trépied."],
    ["Comment s'appelle la prêtresse de l'oracle de Delphes ?", ['La Sibylle', 'La Pythie', 'Cassandre'], 1, "Son nom vient du serpent Python, tué par Apollon à Delphes."],
    ["Quel monstre Apollon a-t-il tué à Delphes ?", ['Python', 'Typhon', 'Ladon'], 0, "Le serpent Python gardait le site avant qu'Apollon n'y fonde son sanctuaire."],
    ["Quel héros est parti chercher la Toison d'or ?", ['Ulysse', 'Jason', 'Bellérophon'], 1, "Jason partit sur l'Argo avec les Argonautes."],
    ["Comment s'appelle le navire de Jason ?", ["L'Argo", "L'Odyssée", 'Le Pégase'], 0, 'Ses compagnons sont restés célèbres sous le nom d\'Argonautes.'],
    ["Quel cheval ailé est né du sang de Méduse ?", ['Pégase', 'Arion', 'Bucéphale'], 0, "Bellérophon le chevaucha pour vaincre la Chimère."],
    ["Quel monstre crachait du feu avec une tête de lion et une queue de serpent ?", ['La Chimère', 'Le Sphinx', 'Scylla'], 0, 'Bellérophon la vainquit du haut de Pégase.'],
    ['Qui a vaincu le Sphinx de Thèbes ?', ['Œdipe', 'Héraclès', 'Créon'], 0, "Œdipe résolut l'énigme : l'homme marche à quatre, deux puis trois pattes."],
    ["Quelle est la réponse à l'énigme du Sphinx ?", ['Le temps', "L'homme", 'Le serpent'], 1, 'Enfant à quatre pattes, adulte sur deux jambes, vieillard avec une canne.'],
    ["Combien d'années Ulysse a-t-il mis à rentrer à Ithaque ?", ['Trois', 'Dix', 'Vingt'], 1, 'Dix ans de guerre à Troie, puis dix ans d\'errance pour rentrer.'],
    ["Comment Ulysse a-t-il échappé au Cyclope Polyphème ?", ['En le crevant à l\'œil', 'En l\'endormant avec une flûte', 'En se changeant en mouton'], 0, "Il l'aveugla, puis sortit de la grotte accroché sous un bélier."],
    ["Quel nom Ulysse a-t-il donné au Cyclope ?", ['Personne', 'Nul', 'Odysseus'], 0, "Quand Polyphème cria « Personne me tue ! », aucun Cyclope ne vint l'aider."],
    ["Comment Ulysse a-t-il résisté au chant des Sirènes ?", ['Il s\'est bouché les oreilles', 'Il s\'est fait attacher au mât', 'Il a chanté plus fort'], 1, "Ses marins avaient de la cire dans les oreilles ; lui voulait entendre."],
    ["Qui attendit Ulysse en tissant le jour et défaisant la nuit ?", ['Pénélope', 'Circé', 'Calypso'], 0, 'Elle promit de choisir un prétendant une fois son ouvrage fini… qu\'elle défaisait chaque nuit.'],
    ["Quelle magicienne changea les compagnons d'Ulysse en cochons ?", ['Médée', 'Circé', 'Hécate'], 1, "Hermès donna à Ulysse une herbe, le moly, pour résister au sortilège."],
    ['Quel est le talon faible d\'Achille ?', ['Le gauche', 'Celui par lequel sa mère le tenait', 'Aucun'], 1, 'Thétis le plongea dans le Styx en le tenant par le talon.'],
    ['Qui a tué Achille ?', ['Hector', 'Pâris', 'Ajax'], 1, "Une flèche de Pâris, guidée par Apollon, l'atteignit au talon."],
    ['Quelle ruse a permis de prendre Troie ?', ['Un tunnel', 'Un cheval de bois', 'Une fausse paix'], 1, "Une idée d'Ulysse : des soldats cachés dans le ventre du cheval."],
    ["Quelle pomme a déclenché la guerre de Troie ?", ["La pomme d'or de la Discorde", 'Une pomme des Hespérides empoisonnée', 'La pomme de Perséphone'], 0, "« À la plus belle » : Pâris la donna à Aphrodite, qui lui promit Hélène."],
    ['Quel titan a volé le feu pour le donner aux hommes ?', ['Atlas', 'Prométhée', 'Cronos'], 1, "Zeus le fit enchaîner : un aigle lui dévorait le foie chaque jour."],
    ['Quel titan porte le ciel sur ses épaules ?', ['Atlas', 'Hypérion', 'Océan'], 0, "C'est sa punition pour avoir combattu les dieux de l'Olympe."],
    ["Qu'a libéré Pandore en ouvrant la jarre ?", ['Les maux du monde', 'Les vents', 'Les étoiles'], 0, "Seule l'Espérance resta au fond de la jarre."],
    ['Quel titan a dévoré ses enfants ?', ['Cronos', 'Japet', 'Cœos'], 0, "Rhéa lui fit avaler une pierre à la place de Zeus, qui fut sauvé."],
    ["Quel musicien est descendu aux Enfers chercher Eurydice ?", ['Orphée', 'Apollon', 'Pan'], 0, "Il ne devait pas se retourner… et se retourna au dernier moment."],
    ['Quel instrument jouait Orphée ?', ['La flûte', 'La lyre', 'Le tambourin'], 1, "Sa lyre charmait les bêtes, les arbres et même Hadès."],
    ['Quel dieu joue de la flûte de roseaux et vit dans les bois ?', ['Pan', 'Dionysos', 'Priape'], 0, "La syrinx porte le nom de la nymphe changée en roseau pour lui échapper."],
    ['Qui est le dieu du vin et de la fête ?', ['Dionysos', 'Hermès', 'Hestia'], 0, "Il est suivi de satyres et de ménades."],
    ['Quelles créatures mi-femmes mi-oiseaux volaient la nourriture de Phinée ?', ['Les Harpies', 'Les Gorgones', 'Les Grées'], 0, "Les Boréades, fils du vent du nord, les chassèrent."],
    ["Quel était le pouvoir du regard de Méduse ?", ['Endormir', 'Changer en pierre', 'Rendre fou'], 1, "Même morte, sa tête pétrifiait encore : Persée l'offrit à Athéna."],
    ["Qui sont les trois Gorgones ?", ['Méduse, Sthéno, Euryale', 'Méduse, Scylla, Charybde', 'Alecto, Mégère, Tisiphone'], 0, "Seule Méduse était mortelle."],
    ["Quel géant de bronze gardait les côtes de Crète ?", ['Talos', 'Argos', 'Antée'], 0, "Médée le vainquit en ôtant le clou qui retenait son unique veine."],
    ['Quel tourbillon redoutable faisait face à Scylla ?', ['Charybde', 'Typhon', 'Céto'], 0, "« Tomber de Charybde en Scylla » : passer d'un danger à un autre."],
    ["Quel monstre géant Zeus a-t-il enfoui sous l'Etna ?", ['Typhon', 'Encelade', 'Python'], 0, "On disait que ses colères faisaient gronder le volcan."],
    ['Qui a sculpté une statue si belle qu\'Aphrodite lui donna vie ?', ['Pygmalion', 'Dédale', 'Narcisse'], 0, "La statue devint Galatée."],
    ["Pourquoi Icare est-il tombé ?", ['Ses ailes ont gelé', "La cire de ses ailes a fondu", 'Un aigle l\'a attaqué'], 1, "Il vola trop près du soleil malgré les conseils de Dédale, son père."],
    ['Qui est tombé amoureux de son propre reflet ?', ['Narcisse', 'Adonis', 'Hyacinthe'], 0, "La nymphe Écho, qui l'aimait, ne put que répéter ses derniers mots."],
    ['Quelle déesse fit pousser les moissons et pleura sa fille ?', ['Déméter', 'Héra', 'Hestia'], 0, "Quand Perséphone est aux Enfers, c'est l'hiver."],
    ["Pourquoi Perséphone doit-elle rester une partie de l'année aux Enfers ?", ['Elle a mangé des grains de grenade', 'Elle a perdu un pari', 'Hadès l\'a enchaînée'], 0, "Qui mange la nourriture des morts doit y revenir."],
    ['Quelle déesse est la reine des dieux ?', ['Héra', 'Athéna', 'Rhéa'], 0, "Épouse de Zeus, protectrice du mariage, souvent jalouse."],
    ['Qui est la déesse de la chasse ?', ['Artémis', 'Aphrodite', 'Iris'], 0, "Sœur jumelle d'Apollon, armée d'un arc d'argent."],
    ['Quelle messagère des dieux voyage sur l\'arc-en-ciel ?', ['Iris', 'Éos', 'Niké'], 0, "Iris porte surtout les messages d'Héra."],
    ['Quelle déesse ailée personnifie la victoire ?', ['Niké', 'Tyché', 'Némésis'], 0, "Une marque de chaussures lui a emprunté son nom."],
    ['Quelle déesse punit la démesure (l\'hubris) ?', ['Némésis', 'Éris', 'Até'], 0, "Dans le jeu aussi, trop d'hubris réveille Némésis !"],
    ["Que gardait le dragon Ladon ?", ['La Toison d\'or', 'Les pommes d\'or des Hespérides', "L'entrée des Enfers"], 1, "Héraclès dut rapporter ces pommes lors de son onzième travail."],
    ['Quelle créature volait de ses ailes de bronze près du lac Stymphale ?', ['Des oiseaux', 'Des chauves-souris', 'Des dragons'], 0, "Héraclès les effraya avec des crotales de bronze avant de les abattre."],
    ['Qui a tissé si bien qu\'elle défia Athéna et fut changée en araignée ?', ['Arachné', 'Philomèle', 'Io'], 0, "Arachné tissait divinement, mais l'orgueil la perdit."],
    ['Sur quel mont vivent les dieux grecs ?', ["L'Olympe", "L'Ida", 'Le Parnasse'], 0, "Le plus haut sommet de Grèce, près de 2 900 mètres."],
    ["Quel peuple de guerrières combattit Héraclès et Achille ?", ['Les Amazones', 'Les Ménades', 'Les Néréides'], 0, "Héraclès dut rapporter la ceinture de leur reine Hippolyte."],
    ["Qui sont les Néréides ?", ['Des nymphes de la mer', 'Des nymphes des arbres', 'Des nymphes des montagnes'], 0, "Les cinquante filles de Nérée ; Thétis, mère d'Achille, en est une."],
    ['Comment appelle-t-on les nymphes des arbres ?', ['Les Dryades', 'Les Naïades', 'Les Oréades'], 0, "Une Dryade meurt quand son arbre est abattu."],
    ['Que boivent les dieux pour rester immortels ?', ["L'ambroisie et le nectar", "L'hydromel", "L'eau du Léthé"], 0, "L'ambroisie se mange, le nectar se boit."],
    ["Que fait oublier l'eau du Léthé ?", ['Sa vie passée', 'La douleur', 'La peur'], 0, "Les âmes y boivent avant de renaître."],
    ["Quel roi changeait en or tout ce qu'il touchait ?", ['Midas', 'Crésus', 'Minos'], 0, "Même sa nourriture devenait or : il dut se laver dans le Pactole."],
    ["Quel supplice subit Sisyphe aux Enfers ?", ['Pousser un rocher sans fin', 'Avoir soif devant l\'eau', 'Remplir un tonneau percé'], 0, "Le rocher redévale la pente juste avant le sommet."],
    ["Qui fut puni de faim et de soif éternelles, l'eau et les fruits se dérobant ?", ['Tantale', 'Ixion', 'Tityos'], 0, "D'où l'expression « supplice de Tantale »."]
  ];
  function oracleDuJour(date) {
    const n = joursDepuis(date), cycle = Math.floor(n / QUESTIONS.length);
    // ordre mélangé par cycle : toutes les questions passent avant qu'une ne revienne (les mêmes pour tous les joueurs)
    const h = hasardDe('oracle|' + cycle), ordre = QUESTIONS.map((_, i) => i);
    for (let i = ordre.length - 1; i > 0; i--) { const j = Math.floor(h() * (i + 1)); [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; }
    const q = QUESTIONS[ordre[n % QUESTIONS.length]];
    return { question: q[0], reponses: q[1], bonne: q[2], explication: q[3] };
  }
  function oracleFait(profil, date) { return profil.activites.oracle.date === date; }
  function repondreOracle(profil, date, choix) {
    const o = profil.activites.oracle, q = oracleDuJour(date);
    if (o.date === date) return null;
    const juste = choix === q.bonne;
    o.date = date; o.choix = choix; o.juste = juste;
    const hier = dateDe(joursDepuis(date) - 1);
    o.serie = juste ? (o.derniereJuste === hier ? (o.serie || 0) + 1 : 1) : 0;
    if (juste) { o.derniereJuste = date; o.justes = (o.justes || 0) + 1; }
    const x = (feteDuJour(date) || {}).id === 'selene' ? 2 : 1;
    const gains = { drachmes: (juste ? 20 : 5) * x, materiaux: juste ? { eclat: (o.serie % 5 === 0 ? 2 : 1) * x } : {} };
    profil.drachmes += gains.drachmes; ajouterMateriaux(profil, gains.materiaux);
    if (juste) { noterPenchant(profil, 'piete', 2); if (o.justes % 7 === 0) gains.fragment = donnerFragment(profil, hasardDe('oracle-frag|' + date)); }
    return { juste, gains, q };
  }

  // ====================== FORGE D'HÉPHAÏSTOS ======================
  // Un talisman équipé donne un bonus à toute l'équipe (épreuves, Arène, Titan). Trois niveaux.
  const TALISMANS = [
    { id: 'athena', nom: "Amulette d'Athéna", emoji: '🪬', effet: n => 'PV de l\'équipe +' + [6, 10, 15][n - 1] + ' %',
      cout: [{ airain: 3, olivier: 2, drachmes: 40 }, { airain: 5, olivier: 4, eclat: 1, drachmes: 90 }, { airain: 8, olivier: 6, perle: 1, drachmes: 160 }],
      appliquer: (u, n) => { u.pvMax = Math.round(u.pvMax * (1 + [0.06, 0.10, 0.15][n - 1])); } },
    { id: 'zeus', nom: 'Plume de Zeus', emoji: '🪶', effet: n => 'Attaque de l\'équipe +' + [5, 8, 12][n - 1] + ' %',
      cout: [{ airain: 2, eclat: 2, drachmes: 50 }, { airain: 4, eclat: 3, drachmes: 100 }, { airain: 6, eclat: 4, perle: 1, drachmes: 180 }],
      appliquer: (u, n) => { u.attaque = Math.round(u.attaque * (1 + [0.05, 0.08, 0.12][n - 1])); } },
    { id: 'hermes', nom: "Sandales d'Hermès", emoji: '🪽', effet: n => 'Vitesse de l\'équipe +' + [6, 10, 15][n - 1],
      cout: [{ laine: 3, olivier: 1, drachmes: 40 }, { laine: 5, olivier: 2, eclat: 1, drachmes: 90 }, { laine: 7, olivier: 3, perle: 1, drachmes: 160 }],
      appliquer: (u, n) => { u.vitesse += [6, 10, 15][n - 1]; } },
    { id: 'pythie', nom: 'Œil de la Pythie', emoji: '🧿', effet: n => 'Chance de critique +' + [5, 8, 12][n - 1] + ' %',
      cout: [{ eclat: 3, laine: 1, drachmes: 50 }, { eclat: 4, laine: 3, drachmes: 100 }, { eclat: 6, laine: 4, perle: 1, drachmes: 180 }],
      appliquer: (u, n) => { u.critBonus = (u.critBonus || 0) + [0.05, 0.08, 0.12][n - 1]; } },
    { id: 'olivier', nom: "Couronne d'olivier", emoji: '🫒', effet: n => 'Soins +' + [10, 20, 30][n - 1] + ' %' + (n === 3 ? ', +1 énergie au départ' : ''),
      cout: [{ olivier: 3, laine: 2, drachmes: 40 }, { olivier: 5, laine: 3, eclat: 1, drachmes: 90 }, { olivier: 7, laine: 5, perle: 1, drachmes: 160 }],
      appliquer: (u, n) => { u.soinMult = (u.soinMult || 1) * (1 + [0.1, 0.2, 0.3][n - 1]); if (n === 3) u.energieDepart = (u.energieDepart != null ? u.energieDepart : 2) + 1; } }
  ];
  function talisman(id) { return TALISMANS.find(t => t.id === id); }
  function coutForge(profil, id) { const t = talisman(id), n = profil.activites.talismans[id] || 0; return n >= 3 ? null : t.cout[n]; }
  function peutForger(profil, id) {
    const c = coutForge(profil, id); if (!c) return false;
    return Object.keys(c).every(k => k === 'drachmes' ? profil.drachmes >= c[k] : (profil.activites.materiaux[k] || 0) >= c[k]);
  }
  function forger(profil, id) {
    if (!peutForger(profil, id)) return false;
    const c = coutForge(profil, id);
    Object.keys(c).forEach(k => { if (k === 'drachmes') profil.drachmes -= c[k]; else profil.activites.materiaux[k] -= c[k]; });
    profil.activites.talismans[id] = (profil.activites.talismans[id] || 0) + 1;
    if (!profil.activites.talisman) profil.activites.talisman = id;
    return profil.activites.talismans[id];
  }
  // Applique le talisman équipé à une équipe (liste d'unités du moteur)
  function appliquerTalisman(equipe, act) {
    const id = act && act.talisman, n = id && act.talismans && act.talismans[id];
    const t = id && talisman(id);
    if (t && n) equipe.forEach(u => t.appliquer(u, n));
    return equipe;
  }

  // ====================== EXPÉDITIONS ======================
  const LIEUX = [
    { id: 'foret', nom: "La forêt d'automne", emoji: '🌳', jour: 1, affinite: 'sylve', butin: ['olivier', 'olivier', 'laine', 'airain'],
      recits: ["{c} revient les pattes couvertes de feuilles rousses, fier d'un tas de branches d'olivier.", "{c} a suivi un satyre jusqu'à sa cachette : il y avait de quoi se servir.", "Au creux d'un chêne creux, {c} a trouvé un nid de laine abandonné.", "{c} a passé la nuit à chasser des lucioles. Il ramène quand même quelque chose.", "Une dryade a confié à {c} un présent pour toi, en échange d'un peu de calme."] },
    { id: 'ruines', nom: "Les ruines d'Aelwen", emoji: '🏛️', jour: 8, affinite: 'roc', butin: ['airain', 'airain', 'eclat', 'olivier'],
      recits: ["Sous une colonne effondrée, {c} a déterré des pièces d'airain.", "{c} a fouillé l'autel brisé : un éclat d'oracle y brillait encore.", "{c} a entendu des voix dans les ruines. Il n'a pas traîné, mais n'est pas revenu les mains vides.", "Un bouclier rongé, quelques clous de bronze : {c} a tout rapporté.", "{c} a dormi au pied d'une statue sans visage. Au matin, il y avait une offrande à ses pieds."] },
    { id: 'fils', nom: 'Le bois des Effilés', emoji: '🧵', jour: 15, affinite: 'ombre', butin: ['laine', 'laine', 'eclat', 'perle'],
      recits: ["{c} revient emmêlé dans des fils dorés. Tu en démêles de la laine sacrée.", "Les Effilés ont ignoré {c}. Il en a profité pour ramasser ce qu'ils laissaient tomber.", "{c} a suivi un fil qui pendait du ciel. Au bout, un éclat d'oracle.", "{c} tremble un peu en rentrant, mais serre quelque chose de précieux.", "Dans le bois sans bruit, {c} a trouvé une bobine abandonnée."] },
    { id: 'etang', nom: "L'Étang noir", emoji: '🌙', jour: 22, affinite: 'onde', butin: ['perle', 'eclat', 'laine', 'airain'],
      recits: ["{c} a plongé dans l'eau noire et ressort avec une perle de Thétis.", "Sur la rive, {c} a trouvé des coquillages… et mieux encore.", "Quelque chose a bougé sous la surface. {c} a filé, en emportant son butin.", "{c} a veillé toute la nuit au bord de l'étang. La lune lui a laissé un cadeau.", "Entre les roseaux, {c} a repêché un trésor englouti."] }
  ];
  function lieuxOuverts(profil) { return LIEUX.filter(l => (profil.joursJoues || 0) + 1 >= l.jour); }
  function explorateurs(profil) {
    const ids = (profil.compagnons || []).includes('griffon') ? ['griffon'] : [];
    return ids.concat(profil.creatures || []).map(id => D.HEROS.concat(D.CREATURES).find(x => x.id === id)).filter(Boolean);
  }
  function partirExpedition(profil, date, creatureId, lieuId) {
    if (profil.activites.expedition) return false;
    if (profil.activites.derniereExpedition === date) return false;
    profil.activites.expedition = { creature: creatureId, lieu: lieuId, date };
    profil.activites.derniereExpedition = date;
    return true;
  }
  function expeditionPrete(profil, date) { const e = profil.activites.expedition; return !!e && e.date < date; }
  function recolterExpedition(profil, date) {
    const e = profil.activites.expedition;
    if (!e || e.date >= date) return null;
    const lieu = LIEUX.find(l => l.id === e.lieu), cr = D.HEROS.concat(D.CREATURES).find(x => x.id === e.creature) || { nom: 'Ta créature', affinite: '' };
    const h = hasardDe('expedition|' + e.date + '|' + e.creature + '|' + e.lieu + '|' + (profil.pseudo || ''));
    const affine = cr.affinite === lieu.affinite;
    const n = 3 + Math.floor(h() * 3) + (affine ? 2 : 0), materiaux = {};
    for (let i = 0; i < n; i++) { const m = lieu.butin[Math.floor(h() * lieu.butin.length)]; materiaux[m] = (materiaux[m] || 0) + 1; }
    const fete = (feteDuJour(date) || {}).id === 'dionysies';
    if (fete) for (let i = 0; i < 3; i++) { const m = lieu.butin[Math.floor(h() * lieu.butin.length)]; materiaux[m] = (materiaux[m] || 0) + 1; }
    const drachmes = 15 + Math.floor(h() * 21);
    const recit = lieu.recits[Math.floor(h() * lieu.recits.length)].replace('{c}', cr.nom);
    profil.drachmes += drachmes; ajouterMateriaux(profil, materiaux);
    profil.activites.expedition = null;
    profil.activites.expeditionsFaites = (profil.activites.expeditionsFaites || 0) + 1;
    noterPenchant(profil, 'ruse', 2);
    const fragment = h() < 0.3 ? donnerFragment(profil, h) : null;
    return { lieu, creature: cr, materiaux, drachmes, recit, affine, fete, fragment };
  }

  // ====================== ARÈNE DES OMBRES ======================
  const LIGUES = [[0, 'Ligue de bronze', '🥉'], [100, "Ligue d'argent", '🥈'], [300, "Ligue d'or", '🥇'], [600, "Ligue de l'Olympe", '🏛️']];
  function ligue(trophees) { let l = LIGUES[0]; LIGUES.forEach(x => { if (trophees >= x[0]) l = x; }); return { min: l[0], nom: l[1], emoji: l[2] }; }
  // Équipe d'un joueur (pour toi, ou pour l'ombre d'un autre joueur) hors épreuve du Chant
  function equipeHorsChant(p) {
    const comp = p.compagnons || ['errant'];
    const equipe = {}; D.HEROS.forEach(h => { if (h.id === 'errant' || comp.includes(h.id)) equipe[h.id] = 'tout'; });
    const pseudo = { equipement: p.equipement || {}, cartes: p.cartes || {}, compagnons: comp, creature: p.creature, creatures: p.creatures || [],
      niveau: p.niveau || 1, serments: p.serments || {}, voie: p.voie, histoire: { choix: {} } };
    const unites = P.equipeDuJoueur({ equipe, gloire: false }, pseudo, 10)
      .map(u => Object.assign(u, { competences: u.competences.filter(c => c.type !== 'lier' && !c.prouesse) }));
    return appliquerTalisman(unites, p.activites || p.act);
  }
  // L'ombre d'un joueur devient une équipe ennemie pilotée par l'ordinateur
  function equipeOmbre(fiche, nom) {
    // une ombre est un peu plus faible que l'original (90 %) : tu gardes l'avantage du vivant
    return equipeHorsChant(fiche).map(u => Object.assign(u, { pvMax: Math.round(u.pvMax * 0.9), attaque: Math.round(u.attaque * 0.9), ombre: true, comportement: 'agressif', nom: u.nom + (nom ? ' (' + nom + ')' : ''),
      desc: "L'ombre d'un tisserand, telle qu'elle était à sa dernière sauvegarde.", special: 'Elle joue ses cartes comme un vrai joueur.' }));
  }
  function areneFaite(profil, date) { return profil.activites.arene.date === date; }
  function resultatArene(profil, date, adversaire, victoire) {
    const a = profil.activites.arene;
    a.date = date;
    const x = (feteDuJour(date) || {}).id === 'panathenees' ? 2 : 1;
    const delta = victoire ? 30 * x : -10;
    a.trophees = Math.max(0, (a.trophees || 0) + delta);
    a.journal = [{ date, adversaire, victoire }].concat(a.journal || []).slice(0, 10);
    const gains = { drachmes: (victoire ? 25 : 5) * x, materiaux: victoire ? { airain: x } : {}, trophees: delta };
    profil.drachmes += gains.drachmes; ajouterMateriaux(profil, gains.materiaux);
    if (victoire) noterPenchant(profil, 'honneur', 2);
    return gains;
  }

  // ====================== TITAN DE LA SEMAINE ======================
  const TITANS = [
    { id: 'talos', nom: 'Talos, le géant de bronze', emoji: '🗿', affinite: 'airain', desc: 'Le gardien de bronze de la Crète, réveillé par les fils qui se défont.',
      coup: { id: 'poing', nom: 'Poing de bronze', puissance: 44, affinite: 'airain' }, zone: { id: 'seisme', nom: 'Séisme', puissance: 30, affinite: 'roc' } },
    { id: 'charybde', nom: 'Charybde, le gouffre', emoji: '🐙', affinite: 'onde', desc: 'Le tourbillon qui avale les navires, remonté des profondeurs.',
      coup: { id: 'tentacule', nom: 'Tentacule', puissance: 42, affinite: 'onde' }, zone: { id: 'tourbillon', nom: 'Tourbillon', puissance: 30, affinite: 'onde' } },
    { id: 'typhon', nom: 'Typhon, sous l\'Etna', emoji: '🌋', affinite: 'flamme', desc: 'Le père des monstres gronde sous le volcan qui le retient.',
      coup: { id: 'lave', nom: 'Jet de lave', puissance: 44, affinite: 'flamme' }, zone: { id: 'eruption', nom: 'Éruption', puissance: 32, affinite: 'flamme' } },
    { id: 'nemee', nom: 'Le lion de Némée', emoji: '🦁', affinite: 'roc', desc: 'Sa peau ne craint aucune lame : il faut beaucoup de coups pour l\'user.',
      coup: { id: 'griffes', nom: 'Griffes', puissance: 46, affinite: 'roc' }, zone: { id: 'rugissement', nom: 'Rugissement', puissance: 28, affinite: 'vent' } },
    { id: 'ladon', nom: 'Ladon, le dragon aux cent têtes', emoji: '🐉', affinite: 'sylve', desc: 'Le gardien des pommes d\'or ne dort jamais.',
      coup: { id: 'morsure', nom: 'Morsures', puissance: 42, affinite: 'sylve' }, zone: { id: 'souffle', nom: 'Souffle venimeux', puissance: 30, affinite: 'sylve' } }
  ];
  const ACTIONS_TITAN = 12;          // actions de ton équipe par assaut
  const OBJECTIF_PAR_JOUEUR = 3000;  // dégâts à infliger en une semaine, par joueur
  const PALIERS = [
    { pct: 25, libelle: '40 drachmes et 2 airain', gains: { drachmes: 40, materiaux: { airain: 2 } } },
    { pct: 50, libelle: '2 éclats d\'oracle et 2 laines sacrées', gains: { drachmes: 0, materiaux: { eclat: 2, laine: 2 } } },
    { pct: 75, libelle: '70 drachmes et 1 perle de Thétis', gains: { drachmes: 70, materiaux: { perle: 1 } } },
    { pct: 100, libelle: '1 Fil de réserve, 100 drachmes et 2 perles', gains: { drachmes: 100, materiaux: { perle: 2 }, fil: 1 } }
  ];
  function semaine(date) { const n = joursDepuis(date), lundi = n - ((n + 3) % 7); return dateDe(lundi); } // lundi de la semaine
  function titanDeLaSemaine(date) { const n = Math.floor((joursDepuis(semaine(date))) / 7); return TITANS[((n % TITANS.length) + TITANS.length) % TITANS.length]; }
  function etatTitan(profil, date) {
    const s = semaine(date), t = profil.activites.titan;
    if (t.semaine !== s) { profil.activites.titan = { semaine: s, degats: 0, essais: [], paliers: [] }; }
    return profil.activites.titan;
  }
  function titanFait(profil, date) { return etatTitan(profil, date).essais.includes(date); }
  // total de la semaine : tes dégâts + ceux des autres joueurs (lus dans le classement)
  function totalTitan(profil, date, autres) {
    const s = semaine(date);
    const lesAutres = (autres || []).filter(x => x && x.titan && x.titan.semaine === s);
    return { total: etatTitan(profil, date).degats + lesAutres.reduce((n, x) => n + (x.titan.degats || 0), 0),
      objectif: OBJECTIF_PAR_JOUEUR * (1 + (autres || []).length), contributions: lesAutres.map(x => ({ nom: x.nom, degats: x.titan.degats })) };
  }
  function uniteTitan(date, niveau, restant, objectif) {
    const T = titanDeLaSemaine(date), m = 1 + 0.05 * ((niveau || 1) - 1);
    return { id: 'titan_' + T.id, nom: T.nom, emoji: T.emoji, affinite: T.affinite, pvMax: objectif, attaque: Math.round(30 * m), defense: 22, vitesse: 85,
      gardien: true, liable: false, titan: true, comportement: 'agressif', desc: T.desc,
      special: 'Tous les 3 tours, ' + T.zone.nom + ' frappe toute ton équipe. Ton assaut dure ' + ACTIONS_TITAN + ' actions : inflige un maximum de dégâts.',
      competences: [Object.assign({ type: 'attaque', cible: 'ennemi', poids: 'normal' }, T.coup), Object.assign({ type: 'attaque', cible: 'ennemi', zone: true, poids: 'lourd', chaque: 3 }, T.zone)],
      pvDepart: Math.max(1, restant) };
  }
  function enregistrerTitan(profil, date, degats) {
    const t = etatTitan(profil, date);
    if (!t.essais.includes(date)) t.essais.push(date);
    t.degats += degats;
    return t;
  }
  function paliersAReclamer(profil, date, total, objectif) {
    const t = etatTitan(profil, date);
    return PALIERS.filter(p => total >= objectif * p.pct / 100 && !t.paliers.includes(p.pct));
  }
  function reclamerPalier(profil, date, pct) {
    const t = etatTitan(profil, date), p = PALIERS.find(x => x.pct === pct);
    if (!p || t.paliers.includes(pct)) return null;
    t.paliers.push(pct);
    profil.drachmes += p.gains.drachmes; ajouterMateriaux(profil, p.gains.materiaux);
    if (p.gains.fil) profil.filsReserve = (profil.filsReserve || 0) + p.gains.fil;
    if (pct === 100) profil.activites.titansVaincus = (profil.activites.titansVaincus || 0) + 1;
    const fragment = pct >= 50 && pct % 50 === 0 ? donnerFragment(profil, hasardDe('titan-frag|' + date + pct)) : null;
    return Object.assign({}, p, { fragment });
  }


  // ====================== PENCHANT (Honneur, Ruse, Piété) ======================
  // Les choix du Chant comptent 5 points, les activités 1 ou 2 : Arène = Honneur, Expéditions = Ruse, Oracle et Offrande = Piété.
  const PENCHANTS = {
    honneur: { nom: 'Honneur', emoji: '🛡️', titre: "Fil d'Honneur", faveur: '+5 % PV pour toute l\'équipe' },
    ruse: { nom: 'Ruse', emoji: '🦊', titre: 'Fil de Ruse', faveur: '+5 % de critique pour toute l\'équipe' },
    piete: { nom: 'Piété', emoji: '🕯️', titre: 'Fil de Piété', faveur: '+10 % de soins' }
  };
  function scoresPenchant(profil) {
    const h = profil.histoire || {}, j = h.jauges || {}, e = h.echos || {};
    const r = {}; Object.keys(PENCHANTS).forEach(k => { r[k] = 5 * (j[k] || 0) + (e[k] || 0); }); return r;
  }
  function dominante(profil) {
    const sc = scoresPenchant(profil), tri = Object.keys(sc).sort((a, b) => sc[b] - sc[a]);
    return sc[tri[0]] >= 5 && sc[tri[0]] > sc[tri[1]] ? tri[0] : null;
  }
  // Renvoie le nouveau penchant s'il vient de changer (Lachésis l'annonce)
  function noterPenchant(profil, id, n) {
    const h = profil.histoire = profil.histoire || { choix: {}, jauges: {}, sceaux: [] };
    h.echos = h.echos || {}; h.echos[id] = (h.echos[id] || 0) + (n || 1);
    return majDominante(profil);
  }
  function majDominante(profil) {
    const avant = profil.histoire.dominante || null, d = dominante(profil);
    profil.histoire.dominante = d;
    return d !== avant ? d : null;
  }

  // ====================== FÊTES ======================
  // Tous les 9 jours, une fête de 2 jours, la même pour tous les joueurs.
  const FETES = [
    { id: 'panathenees', nom: 'Les Panathénées', emoji: '🏟️', qui: 'lachesis', desc: 'Arène : trophées, drachmes et airain doublés pour une victoire.' },
    { id: 'dionysies', nom: 'Les Dionysies', emoji: '🍇', qui: 'dionysos', desc: 'Expéditions : 3 matériaux de plus au retour.' },
    { id: 'selene', nom: 'La Nuit de Séléné', emoji: '🌙', qui: 'clotho', desc: "Oracle : récompenses doublées." }
  ];
  function feteDuJour(date) { const n = joursDepuis(date); return n % 9 < 2 ? FETES[Math.floor(n / 9) % FETES.length] : null; }
  function prochaineFete(date) { const n = joursDepuis(date); for (let i = 0; i < 10; i++) { const f = feteDuJour(dateDe(n + i)); if (f) return { fete: f, dans: i }; } return null; }

  // ====================== FRAGMENTS DE LA TAPISSERIE ======================
  const SERIES = [
    { id: 'metier', nom: 'Le Grand Métier', emoji: '📜', qui: 'clotho',
      page: "Au début, nous étions trois autour du Métier, et le Métier avait quatre fuseaux. Le quatrième n'a jamais tourné. Mère Nuit disait qu'il attendait une main qui n'était pas encore née. Je l'ai regardé longtemps, Errant. Puis un soir, j'y ai enroulé ton fil." },
    { id: 'effiles', nom: 'Les Effilés', emoji: '🧵', qui: 'lachesis',
      page: "Je mesure tout ce qui est, et je n'arrive plus à mesurer les Effilés. Leur fil n'est pas coupé : il est tiré, maille après maille, vers le bas de la tapisserie. Quelque chose, sous le Métier, tire. Les Sceaux de Maïa le retiennent. Il en reste six." },
    { id: 'atropos', nom: "Le Fil d'Atropos", emoji: '✂️', qui: 'atropos',
      page: "Ma sœur croit que je coupe par plaisir. Je coupe ce qui pourrit, avant que la pourriture ne gagne le reste. Il y a eu un Errant avant toi. Clotho ne te l'a pas dit ? Son fil aussi était sans destin. Je n'ai pas eu à le couper. Il s'est défait tout seul. Demande-toi pourquoi." }
  ];
  const FRAGMENTS = [
    ['metier', 1, "« ...un métier plus vaste que le ciel, et quatre fuseaux de bronze... »"],
    ['metier', 2, "« ...Clotho file, Lachésis mesure, Atropos coupe. Le quatrième fuseau reste immobile... »"],
    ['metier', 3, "« ...les fils d'or ne pendent pas : ils ont été tirés vers le bas... »"],
    ['metier', 4, "« ...une main nouvelle, née hors du destin, fera tourner le dernier fuseau... »"],
    ['effiles', 1, "« ...à Myrtos, une tisserande défaisait la nuit ce qu'elle tissait le jour... »"],
    ['effiles', 2, "« ...l'Effilé ne meurt pas : il s'oublie, et le monde l'oublie avec lui... »"],
    ['effiles', 3, "« ...sept sceaux, posés par Maïa, la plus discrète des Pléiades... »"],
    ['effiles', 4, "« ...sous l'Étang noir, le premier sceau. Sous les Monts, le deuxième... »"],
    ['atropos', 1, "« ...les ciseaux d'Atropos sont faits d'une étoile tombée... »"],
    ['atropos', 2, "« ...elle a pleuré, une fois, en coupant un fil. Personne ne sait lequel... »"],
    ['atropos', 3, "« ...un autre fil sans destin, bien avant celui de l'Errant... »"],
    ['atropos', 4, "« ...son nom a été effacé de la tapisserie. Il en reste un trou, en haut à gauche... »"]
  ].map(([serie, n, texte]) => ({ id: serie + n, serie, n, texte }));
  function donnerFragment(profil, h) {
    const a = profil.activites, manquants = FRAGMENTS.filter(f => !(a.fragments || []).includes(f.id));
    if (!manquants.length) return null;
    const f = manquants[Math.floor((typeof h === 'function' ? h() : Math.random()) * manquants.length)];
    a.fragments = (a.fragments || []).concat(f.id);
    return f;
  }
  function serieComplete(profil, id) { return FRAGMENTS.filter(f => f.serie === id).every(f => (profil.activites.fragments || []).includes(f.id)); }

  // ====================== LE MARCHAND HERMÈS ======================
  const ARTICLES = [
    { id: 'eclats', nom: "3 éclats d'oracle", emoji: '🔮', prix: 60, mat: { eclat: 3 } },
    { id: 'airain', nom: '4 airain', emoji: '⚙️', prix: 50, mat: { airain: 4 } },
    { id: 'laine', nom: '4 laines sacrées', emoji: '🧶', prix: 50, mat: { laine: 4 } },
    { id: 'olivier', nom: "4 bois d'olivier", emoji: '🪵', prix: 45, mat: { olivier: 4 } },
    { id: 'perle', nom: '1 perle de Thétis', emoji: '💎', prix: 130, mat: { perle: 1 } },
    { id: 'fil', nom: '1 Fil de réserve', emoji: '🧵', prix: 160, fil: 1 },
    { id: 'fragment', nom: 'Un fragment de tapisserie', emoji: '📜', prix: 200, fragment: true },
    { id: 'doublons', nom: '3 exemplaires d\'une de tes cartes', emoji: '🃏', prix: 70, doublons: 3 }
  ];
  function etalage(profil, date) {
    const s = semaine(date), h = hasardDe('hermes|' + s + '|' + (profil.pseudo || ''));
    const pool = ARTICLES.filter(x => !x.fragment || FRAGMENTS.some(f => !(profil.activites.fragments || []).includes(f.id))).slice();
    const choix = [];
    while (choix.length < 4 && pool.length) choix.push(pool.splice(Math.floor(h() * pool.length), 1)[0]);
    // la carte proposée par Hermès : une de tes cartes qui peut encore progresser
    const cartes = Object.keys(profil.cartes || {}).filter(id => (profil.cartes[id].niveau || 1) < 5).sort();
    const carte = cartes.length ? cartes[Math.floor(h() * cartes.length)] : null;
    return choix.filter(x => !x.doublons || carte).map(x => Object.assign({}, x, x.doublons ? { carte } : {}));
  }
  function etatMarchand(profil, date) {
    const s = semaine(date), m = profil.activites.marchand;
    if (!m || m.semaine !== s) profil.activites.marchand = { semaine: s, achats: [], vu: false };
    return profil.activites.marchand;
  }
  function marchandNeuf(profil, date) { return !etatMarchand(profil, date).vu; }
  function acheter(profil, date, id) {
    const m = etatMarchand(profil, date), art = etalage(profil, date).find(x => x.id === id);
    if (!art || m.achats.includes(id) || profil.drachmes < art.prix) return null;
    profil.drachmes -= art.prix; m.achats.push(id);
    profil.activites.achatsTotal = (profil.activites.achatsTotal || 0) + 1;
    const r = { article: art };
    if (art.mat) ajouterMateriaux(profil, art.mat);
    if (art.fil) profil.filsReserve = (profil.filsReserve || 0) + art.fil;
    if (art.fragment) r.fragment = donnerFragment(profil);
    if (art.doublons && profil.cartes[art.carte]) profil.cartes[art.carte].doublons = (profil.cartes[art.carte].doublons || 0) + art.doublons;
    return r;
  }

  // ====================== HAUTS FAITS ======================
  const HAUTS_FAITS = [
    { id: 'premier', nom: 'Premier rang', titre: 'Apprenti tisserand', desc: 'Tisser son premier rang.', test: p => p.joursJoues >= 1 },
    { id: 'semaine', nom: 'Une semaine de fil', titre: 'Fil tenace', desc: 'Jouer 7 jours d\'affilée.', test: p => ((p.serie || {}).jours || 0) >= 7 },
    { id: 'parfaits', nom: "Main d'or", titre: "Main d'or", desc: 'Obtenir 5 rangs parfaits (3 étoiles).', test: p => (p.rangs || []).filter(r => r.victoire && r.etoiles === 3 && !r.echo).length >= 5 },
    { id: 'especes', nom: 'Ami des bêtes', titre: 'Ami des bêtes', desc: 'Lier 3 espèces différentes.', test: p => (p.creatures || []).length >= 3 },
    { id: 'enclos', nom: "Gardien de l'Enclos", titre: "Gardien de l'Enclos", desc: "Remplir les 10 places de l'Enclos.", test: p => (p.liens || []).length >= 10 },
    { id: 'oracle', nom: 'Voix de Delphes', titre: 'Voix de Delphes', desc: "10 bonnes réponses à l'Oracle.", test: p => (p.activites.oracle.justes || 0) >= 10 },
    { id: 'arene', nom: "Champion d'or", titre: "Champion d'or", desc: "Atteindre la Ligue d'or dans l'Arène (300 trophées).", test: p => (p.activites.arene.trophees || 0) >= 300 },
    { id: 'titan', nom: 'Tueur de Titans', titre: 'Tueur de Titans', desc: "Atteindre 100 % contre un Titan de la semaine.", test: p => (p.activites.titansVaincus || 0) >= 1 },
    { id: 'forge', nom: "Disciple d'Héphaïstos", titre: "Disciple d'Héphaïstos", desc: 'Forger un talisman au niveau 3.', test: p => Object.values(p.activites.talismans || {}).some(n => n >= 3) },
    { id: 'voyageur', nom: 'Grand voyageur', titre: 'Grand voyageur', desc: '10 expéditions.', test: p => (p.activites.expeditionsFaites || 0) >= 10 },
    { id: 'hermes', nom: "Ami d'Hermès", titre: "Ami d'Hermès", desc: '5 achats chez le Marchand.', test: p => (p.activites.achatsTotal || 0) >= 5 },
    { id: 'fragments', nom: 'Lecteur de fils', titre: 'Lecteur de fils', desc: 'Compléter une série de fragments.', test: p => SERIES.some(s => FRAGMENTS.filter(f => f.serie === s.id).every(f => (p.activites.fragments || []).includes(f.id))) },
    { id: 'penchant', nom: 'Un fil qui penche', titre: null, desc: 'Avoir un penchant affirmé (Honneur, Ruse ou Piété).', test: p => !!(p.histoire && p.histoire.dominante) },
    { id: 'hydre', nom: "Vainqueur de l'Hydre", titre: "Vainqueur de l'Hydre", desc: 'Achever le Chant I.', test: p => (p.rangs || []).some(r => r.jour === 30 && r.victoire && !r.echo) }
  ];
  function verifierHautsFaits(profil, date) {
    const a = profil.activites; a.hautsFaits = a.hautsFaits || {};
    const neufs = HAUTS_FAITS.filter(h => !a.hautsFaits[h.id] && (() => { try { return h.test(profil); } catch (e) { return false; } })());
    neufs.forEach(h => { a.hautsFaits[h.id] = date; });
    return neufs;
  }
  // Titres que le joueur peut porter : ceux de ses hauts faits, plus celui de son penchant
  function titresDisponibles(profil) {
    const a = profil.activites, t = HAUTS_FAITS.filter(h => h.titre && (a.hautsFaits || {})[h.id]).map(h => ({ id: h.id, nom: h.titre }));
    const d = profil.histoire && profil.histoire.dominante;
    if (d) t.push({ id: 'penchant_' + d, nom: PENCHANTS[d].titre });
    return t;
  }
  function nomTitre(id) {
    if (!id) return null;
    if (id.indexOf('penchant_') === 0) return (PENCHANTS[id.slice(9)] || {}).titre || null;
    const h = HAUTS_FAITS.find(x => x.id === id); return h ? h.titre : null;
  }

  // Combien d'activités attendent le joueur aujourd'hui (pour la pastille de l'onglet)
  function enAttente(profil, date) {
    let n = 0;
    if (debloquee(profil, 'oracle') && !oracleFait(profil, date)) n++;
    if (debloquee(profil, 'arene') && !areneFaite(profil, date)) n++;
    if (debloquee(profil, 'expedition') && (expeditionPrete(profil, date) || (!profil.activites.expedition && profil.activites.derniereExpedition !== date))) n++;
    if (debloquee(profil, 'titan') && !titanFait(profil, date)) n++;
    if (debloquee(profil, 'forge') && TALISMANS.some(t => peutForger(profil, t.id))) n++;
    if (debloquee(profil, 'marchand') && marchandNeuf(profil, date)) n++;
    return n;
  }

  const Activites = {
    DEBLOCAGE, NOMS, MATERIAUX, QUESTIONS, TALISMANS, LIEUX, TITANS, LIGUES, PALIERS, ACTIONS_TITAN, OBJECTIF_PAR_JOUEUR,
    initialiser, debloquee, ajouterMateriaux, joursDepuis,
    oracleDuJour, oracleFait, repondreOracle,
    talisman, coutForge, peutForger, forger, appliquerTalisman,
    lieuxOuverts, explorateurs, partirExpedition, expeditionPrete, recolterExpedition,
    ligue, equipeHorsChant, equipeOmbre, areneFaite, resultatArene,
    semaine, titanDeLaSemaine, etatTitan, titanFait, totalTitan, uniteTitan, enregistrerTitan, paliersAReclamer, reclamerPalier,
    enAttente,
    PENCHANTS, scoresPenchant, dominante, noterPenchant, majDominante,
    FETES, feteDuJour, prochaineFete,
    SERIES, FRAGMENTS, donnerFragment, serieComplete,
    ARTICLES, etalage, etatMarchand, marchandNeuf, acheter,
    HAUTS_FAITS, verifierHautsFaits, titresDisponibles, nomTitre
  };
  if (node) module.exports = Activites; else racine.Activites = Activites;
})(typeof window !== 'undefined' ? window : this);
