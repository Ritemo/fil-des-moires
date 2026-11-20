/* Le Fil des Moires : progression (cartes, niveaux, XP, drachmes, Don des Moires).
   Logique pure, utilisable dans le navigateur (window.Progression) et dans Node. */
(function (racine) {
  'use strict';
  const D = typeof module !== 'undefined' && module.exports ? require('./data.js') : racine.Donnees;
  const M = typeof module !== 'undefined' && module.exports ? require('./engine.js') : racine.Moteur;

  const NIVEAU_MAX_CARTE = 5;
  const NIVEAU_MAX_EQUIPE = 20;
  const SLOTS = 4;
  // L'Enclos de Chiron : créatures liées, une fiche par créature (on peut lier plusieurs fois la même espèce)
  const LIENS_MAX = 10;
  const TRAITS = [
    { id: 'vif', nom: 'Vif', desc: '+8 vitesse', appliquer: u => { u.vitesse += 8; } },
    { id: 'robuste', nom: 'Robuste', desc: '+10 % PV', appliquer: u => { u.pvMax = Math.round(u.pvMax * 1.1); } },
    { id: 'feroce', nom: 'Féroce', desc: '+8 % attaque', appliquer: u => { u.attaque = Math.round(u.attaque * 1.08); } },
    { id: 'placide', nom: 'Placide', desc: '+10 % défense', appliquer: u => { u.defense = Math.round(u.defense * 1.1); } },
    { id: 'fidele', nom: 'Fidèle', desc: '+1 énergie au départ', appliquer: u => { u.energieDepart = (u.energieDepart != null ? u.energieDepart : 2) + 1; } }
  ];
  // Doublons nécessaires pour passer du niveau n au niveau n+1 (index n-1)
  const DOUBLONS = { commune: [2, 4, 6, 10], rare: [1, 2, 4, 6], epique: [1, 2, 3, 4], legendaire: [1, 1, 2, 2] };
  const DRACHMES = [20, 50, 100, 200];
  const NOMS_RARETE = { commune: 'Commune', rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire' };
  const COULEURS_RARETE = { commune: '#b9a58f', rare: '#5fb2e8', epique: '#b07be0', legendaire: '#e0b04f' };

  // ---------- Profil ----------
  function initialiser(profil) {
    if (!profil.cartes) {
      profil.cartes = {};
      D.CARTES_DEPART.forEach(id => { profil.cartes[id] = { niveau: 1, doublons: 0 }; });
    }
    if (!profil.equipement) profil.equipement = JSON.parse(JSON.stringify(D.EQUIPEMENT_DEPART));
    if (profil.niveau == null) profil.niveau = 1;
    if (profil.xp == null) profil.xp = 0;
    if (profil.drachmes == null) profil.drachmes = 0;
    if (!profil.creatures) profil.creatures = [];
    if (!profil.creature) profil.creature = 'griffon';
    if (!profil.liens) {
      profil.liens = profil.creatures.map((id, k) => nouveauLien(profil, id, 'ancien' + k));
      const actif = profil.liens.find(l => l.espece === profil.creature);
      profil.lienActif = actif ? actif.uid : null;
    }
    if (!profil.codex) profil.codex = {};
    if (!profil.histoire) profil.histoire = { choix: {}, jauges: { honneur: 0, ruse: 0, piete: 0 }, sceaux: [] };
    return profil;
  }

  // ---------- Cartes ----------
  const rarete = id => D.RARETES[id] || 'commune';
  function carteInfo(id) {
    for (const h of D.HEROS.concat(D.CREATURES)) { const c = h.competences.find(x => x.id === id); if (c) return { carte: c, heros: h }; }
    return null;
  }
  // ---------- Évolutions (niveau 5) ----------
  const evolution = id => D.EVOLUTIONS[id] || null;
  function peutEvoluer(profil, id) {
    const c = profil.cartes[id];
    return !!(c && c.niveau >= NIVEAU_MAX_CARTE && !c.evoluee && evolution(id) && profil.drachmes >= D.COUT_EVOLUTION);
  }
  function evoluer(profil, id) {
    if (!peutEvoluer(profil, id)) return false;
    profil.drachmes -= D.COUT_EVOLUTION;
    profil.cartes[id].evoluee = true;
    return true;
  }
  // Applique l'évolution à une copie de la carte (nom, illustration, effet, puissance)
  function carteEvoluee(profil, carte) {
    const c = profil.cartes[carte.id], e = evolution(carte.id);
    if (!c || !c.evoluee || !e) return carte;
    const x = Object.assign({}, carte, JSON.parse(JSON.stringify(e.mod)), { nom: e.nom, art: e.art, evoluee: true, desc: carte.desc + ' Évoluée : ' + e.desc });
    if (x.puissance) x.puissance = Math.round(x.puissance * e.mult);
    return x;
  }
  function coutAmelioration(profil, id) {
    const c = profil.cartes[id];
    if (!c || c.niveau >= NIVEAU_MAX_CARTE) return null;
    return { doublons: DOUBLONS[rarete(id)][c.niveau - 1], drachmes: DRACHMES[c.niveau - 1] };
  }
  function peutAmeliorer(profil, id) {
    const cout = coutAmelioration(profil, id);
    return !!cout && profil.cartes[id].doublons >= cout.doublons && profil.drachmes >= cout.drachmes;
  }
  function ameliorer(profil, id) {
    if (!peutAmeliorer(profil, id)) return false;
    const cout = coutAmelioration(profil, id);
    profil.cartes[id].doublons -= cout.doublons;
    profil.drachmes -= cout.drachmes;
    profil.cartes[id].niveau++;
    return true;
  }
  // Équiper / déséquiper une carte (4 au maximum par héros)
  function basculerEquipement(profil, herosId, carteId) {
    const liste = profil.equipement[herosId] || (profil.equipement[herosId] = []);
    const i = liste.indexOf(carteId);
    if (i >= 0) { if (liste.length > 1) liste.splice(i, 1); return true; }
    if (liste.length >= SLOTS) return false;
    liste.push(carteId);
    return true;
  }
  const multiplicateurCarte = niveau => 1 + 0.1 * (niveau - 1);
  const multiplicateurEquipe = niveau => 1 + 0.04 * (niveau - 1);

  // Équipe pour une épreuve. Jours 1 à 3 : le tutoriel impose les compétences. Ensuite : l'équipement du joueur.
  function equipeDuJoueur(ep, profil, jour) {
    let base = D.equipeDuJour(ep);
    // Créature d'équipe : remplace Kelos à partir du jour 4
    if (jour > 3 && profil.creature && profil.creature !== 'griffon' && profil.creatures.includes(profil.creature)) {
      const cr = JSON.parse(JSON.stringify(D.CREATURES.find(c => c.id === profil.creature)));
      base = base.map(h => h.id === 'griffon' ? cr : h);
    }
    return base.map(h => {
      const modele = D.HEROS.concat(D.CREATURES).find(x => x.id === h.id);
      let comps;
      if (jour > 3) {
        const equipees = (profil.equipement[h.id] || []).filter(id => profil.cartes[id]);
        comps = modele.competences.filter(c => equipees.includes(c.id) || c.type === 'garde' || (c.prouesse && ep.gloire));
        comps = JSON.parse(JSON.stringify(comps)).map(c => carteEvoluee(profil, c));
        if (!comps.some(c => c.type === 'garde')) comps.push(JSON.parse(JSON.stringify(D.HEROS[0].competences.find(c => c.type === 'garde'))));
        if (h.id === 'errant') comps.push(JSON.parse(JSON.stringify(D.LIER)));
      } else comps = h.competences.filter(c => profil.cartes[c.id] || c.type === 'garde');
      comps.forEach(c => {
        const carte = profil.cartes[c.id];
        c.niveau = carte ? carte.niveau : 1;
        if (c.puissance) c.puissance = Math.round(c.puissance * multiplicateurCarte(c.niveau));
      });
      const m = multiplicateurEquipe(profil.niveau);
      const u = Object.assign({}, h, { competences: comps, pvMax: Math.round(h.pvMax * m), attaque: Math.round(h.attaque * m) });
      appliquerPassifs(u, profil);
      const la = lienActif(profil);
      if (la && la.espece === u.id && profil.creature === u.id) { const t = trait(la.trait); if (t) { t.appliquer(u); u.traitNom = t.nom; u.traitDesc = t.desc; } if (la.surnom) u.nom = la.surnom; }
      return u;
    });
  }
  // Penchant du joueur (Honneur, Ruse, Piété) : choix du Chant (5 points) + activités (histoire.echos)
  function majDominante(profil) {
    const h = profil.histoire || {}, j = h.jauges || {}, e = h.echos || {};
    const sc = {}; ['honneur', 'ruse', 'piete'].forEach(k => { sc[k] = 5 * (j[k] || 0) + (e[k] || 0); });
    const tri = Object.keys(sc).sort((a, b) => sc[b] - sc[a]);
    if (profil.histoire) profil.histoire.dominante = sc[tri[0]] >= 5 && sc[tri[0]] > sc[tri[1]] ? tri[0] : null;
  }
  // Passifs de Voie (Errant) et de Serments (toute l'équipe)
  function appliquerPassifs(u, profil) {
    // Faveur du penchant
    const d = profil.histoire && profil.histoire.dominante;
    if (d === 'honneur') u.pvMax = Math.round(u.pvMax * 1.05);
    if (d === 'ruse') u.critBonus = (u.critBonus || 0) + 0.05;
    if (d === 'piete') u.soinMult = (u.soinMult || 1) * 1.1;
    const s = profil.serments || {};
    const a = id => Object.values(s).includes(id);
    if (u.id === 'errant') {
      if (profil.voie === 'hoplite') { u.pvMax = Math.round(u.pvMax * 1.2); u.gardeReduction = 0.3; }
      if (profil.voie === 'chasseur') { u.vitesse += 15; u.critBonus = (u.critBonus || 0) + 0.1; }
      if (profil.voie === 'mystique') { u.energieDepart = (u.energieDepart || 2) + 1; u.energieMax = 6; }
    }
    if (a('aube')) u.energieDepart = (u.energieDepart || 2) + 1;
    if (a('sang')) u.pvMax = Math.round(u.pvMax * 1.1);
    if (a('vengeance')) u.vengeance = true;
    if (a('fil')) u.soinMult = 1.2;
    if (a('airain')) u.defense = Math.round(u.defense * 1.12);
    if (a('hermes')) u.vitesse += 10;
    if (a('nemesis')) u.critBonus = (u.critBonus || 0) + 0.08;
    if (a('or')) u.competences.filter(c => c.prouesse).forEach(c => { c.puissance = Math.round(c.puissance * 1.3); });
  }
  const gloireDepart = profil => Object.values(profil.serments || {}).includes('gloire') ? 30 : 0;
  const secondSouffle = profil => Object.values(profil.serments || {}).includes('souffle');

  // ---------- Voies et Serments ----------
  // Prochain choix en attente : { type: 'voie' | 'voie2' | 'serment', niveau? }
  function choixEnAttente(profil) {
    profil.serments = profil.serments || {};
    if (profil.niveau >= 5 && !profil.voie) return { type: 'voie' };
    for (const n of Object.keys(D.SERMENTS).map(Number)) if (profil.niveau >= n && !profil.serments[n]) return { type: 'serment', niveau: n };
    if (profil.niveau >= 10 && profil.voie && !profil.voie2) return { type: 'voie2' };
    return null;
  }
  function donnerCartesVoie(profil, voie) {
    D.VOIES[voie].cartes.forEach(id => { if (!profil.cartes[id]) profil.cartes[id] = { niveau: 1, doublons: 0 }; });
  }
  function choisirVoie(profil, voie, secondaire) {
    if (!D.VOIES[voie]) return false;
    if (secondaire) { if (voie === profil.voie) return false; profil.voie2 = voie; }
    else profil.voie = voie;
    donnerCartesVoie(profil, voie);
    return true;
  }
  function choisirSerment(profil, niveau, id) {
    profil.serments = profil.serments || {};
    if (profil.serments[niveau] || !D.SERMENTS[niveau].some(x => x.id === id)) return false;
    profil.serments[niveau] = id;
    return true;
  }
  // Les ennemis suivent le niveau de l'équipe à partir du jour 4
  function ennemisPourJoueur(r, profil, jour) {
    const e = D.ennemisDeRencontre(r);
    if (jour <= 3) return e;
    const m = 1.04 + 0.07 * (profil.niveau - 1) + 0.012 * (jour - 4);
    return e.map(x => Object.assign(x, { pvMax: Math.round(x.pvMax * m), attaque: Math.round(x.attaque * m) }));
  }

  // ---------- XP et drachmes ----------
  const xpPourNiveau = n => Math.round(50 * Math.pow(n, 1.2)); // XP pour passer du niveau n à n+1
  function gains(victoire, etoiles) {
    return { xp: victoire ? 100 + 30 * etoiles : 50, drachmes: victoire ? 30 + 15 * etoiles : 15 };
  }
  // Ajoute de l'XP. Renvoie le nombre de niveaux gagnés.
  function ajouterXp(profil, xp) {
    let niveaux = 0;
    profil.xp += xp;
    while (profil.niveau < NIVEAU_MAX_EQUIPE && profil.xp >= xpPourNiveau(profil.niveau)) {
      profil.xp -= xpPourNiveau(profil.niveau); profil.niveau++; niveaux++;
    }
    return niveaux;
  }

  // Butin automatique d'une victoire : quelques doublons de cartes équipées
  function butin(profil, graine, etoiles) {
    const hasard = M.creerHasard(graine);
    const heros = herosDisponibles(profil);
    const equipees = heros.flatMap(h => profil.equipement[h] || []).filter(id => profil.cartes[id]);
    const resultat = {};
    for (let i = 0; i < 1 + etoiles; i++) {
      const id = equipees[Math.floor(hasard() * equipees.length)];
      if (!id) break;
      profil.cartes[id].doublons++; resultat[id] = (resultat[id] || 0) + 1;
    }
    return resultat;
  }

  // ---------- Don des Moires : 1 récompense parmi 3 ----------
  function herosDisponibles(profil) { return D.HEROS.filter((h, i) => (profil.joursJoues || 0) >= i).map(h => h.id).concat(profil.creatures || []); }

  // ---------- Créatures liées et Codex ----------
  function nouveauLien(profil, id, graine, date, jour) {
    const cr = D.CREATURES.find(c => c.id === id) || { nom: id };
    const hasard = M.creerHasard(M.graineDuJour(id + '|' + graine));
    const meme = (profil.liens || []).filter(l => l.espece === id).length;
    return { uid: id + '-' + Date.now().toString(36) + Math.floor(hasard() * 1e6).toString(36), espece: id,
      surnom: cr.nom + (meme ? ' ' + ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][Math.min(8, meme - 1)] : ''),
      trait: TRAITS[Math.floor(hasard() * TRAITS.length)].id, date: date || null, jour: jour || null };
  }
  // Lier une créature : une nouvelle fiche dans l'Enclos (10 au maximum). Enclos plein : son fil renforce ses cartes.
  function lierCreature(profil, id, graine, date) {
    const cr = D.CREATURES.find(c => c.id === id);
    if (!cr) return null;
    const nouvelle = !profil.creatures.includes(id);
    if (nouvelle) profil.creatures.push(id);
    cr.competences.forEach(c => { if (!profil.cartes[c.id]) profil.cartes[c.id] = { niveau: 1, doublons: 0 }; });
    if (!profil.equipement[id]) profil.equipement[id] = cr.competences.map(c => c.id);
    if ((profil.liens || []).length >= LIENS_MAX) {
      cr.competences.forEach(c => { profil.cartes[c.id].doublons++; });
      return { id, nouvelle, plein: true };
    }
    const lien = nouveauLien(profil, id, graine || Date.now(), date, profil.joursJoues);
    profil.liens.push(lien);
    return { id, nouvelle, lien };
  }
  function lienActif(profil) { return (profil.liens || []).find(l => l.uid === profil.lienActif) || null; }
  function choisirLien(profil, uid) {
    if (uid === 'griffon') { profil.lienActif = null; profil.creature = 'griffon'; return true; }
    const l = (profil.liens || []).find(x => x.uid === uid); if (!l) return false;
    profil.lienActif = uid; profil.creature = l.espece; return true;
  }
  function libererLien(profil, uid) {
    const k = (profil.liens || []).findIndex(x => x.uid === uid); if (k < 0) return false;
    const l = profil.liens.splice(k, 1)[0];
    if (profil.lienActif === uid) { profil.lienActif = null; profil.creature = 'griffon'; }
    // plus aucune créature de cette espèce : elle quitte la liste des créatures (ses cartes restent dans la collection)
    if (!profil.liens.some(x => x.espece === l.espece)) profil.creatures = profil.creatures.filter(id => id !== l.espece);
    return true;
  }
  function trait(id) { return TRAITS.find(t => t.id === id); }
  const liable = id => D.CREATURES.some(c => c.id === id);
  function noterCodex(profil, id, champ) {
    const e = profil.codex[id] || (profil.codex[id] = { vu: false, vaincus: 0, lie: false });
    if (champ === 'vu') e.vu = true;
    if (champ === 'vaincu') { e.vu = true; e.vaincus++; }
    if (champ === 'lie') { e.vu = true; e.lie = true; }
  }
  // Chaque spécimen déjà vaincu facilite le lien (+5 %, jusqu'à +30 %)
  function lienBonus(profil) {
    const b = {};
    Object.keys(profil.codex || {}).forEach(id => { b[id] = Math.min(0.3, 0.05 * profil.codex[id].vaincus); });
    return b;
  }
  // ---------- Récit : choix du Chant ----------
  // option : { id, jauge, effet: { drachmes, xp, fil } }. Renvoie le nombre de niveaux gagnés.
  function appliquerChoix(profil, cle, option) {
    const h = profil.histoire;
    if (h.choix[cle]) return 0;
    h.choix[cle] = option.id;
    if (option.jauge) h.jauges[option.jauge] = (h.jauges[option.jauge] || 0) + 1;
    majDominante(profil);
    const e = option.effet || {};
    if (e.drachmes) profil.drachmes += e.drachmes;
    if (e.fil) profil.filsReserve = Math.min(3, (profil.filsReserve || 0) + e.fil);
    return e.xp ? ajouterXp(profil, e.xp) : 0;
  }
  // Applique les bonus du jour (fêtes, dieux, finale) aux gains
  function bonusDuJour(g, ep) {
    const b = ep && ep.bonus;
    if (!b || !g) return g;
    return { xp: Math.round(g.xp * (b.xp || 1)), drachmes: Math.round(g.drachmes * (b.drachmes || 1)) };
  }

  function genererDon(profil, graine) {
    const hasard = M.creerHasard(graine);
    const heros = herosDisponibles(profil);
    const options = [];
    // 1. Une carte inédite, si possible
    const inedites = Object.keys(D.RARETES).filter(id => !profil.cartes[id] && !carteInfo(id).carte.voie && heros.includes(carteInfo(id).heros.id));
    if (inedites.length && hasard() < 0.5) options.push({ type: 'carte', id: inedites[Math.floor(hasard() * inedites.length)] });
    // 2. Des doublons d'une carte équipée (ou possédée)
    const equipees = heros.flatMap(h => profil.equipement[h] || []).filter(id => profil.cartes[id] && profil.cartes[id].niveau < NIVEAU_MAX_CARTE);
    const candidates = equipees.length ? equipees : Object.keys(profil.cartes);
    const id = candidates[Math.floor(hasard() * candidates.length)];
    const nb = { commune: 4, rare: 3, epique: 2, legendaire: 1 }[rarete(id)];
    options.push({ type: 'doublons', id, nombre: nb });
    // 3. Une bourse de drachmes
    options.push({ type: 'drachmes', nombre: 40 + Math.floor(hasard() * 4) * 10 });
    // Toujours 3 options : à défaut de carte inédite, des doublons d'une autre carte
    if (options.length < 3) {
      const autre = candidates.filter(x => x !== id);
      const id2 = autre.length ? autre[Math.floor(hasard() * autre.length)] : id;
      options.unshift({ type: 'doublons', id: id2, nombre: { commune: 4, rare: 3, epique: 2, legendaire: 1 }[rarete(id2)] });
    }
    return options;
  }
  function appliquerDon(profil, option) {
    if (!option) { profil.drachmes += 25; return; } // passer
    if (option.type === 'carte') {
      profil.cartes[option.id] = { niveau: 1, doublons: 0 };
      const h = carteInfo(option.id).heros.id;
      if ((profil.equipement[h] || []).length < SLOTS) profil.equipement[h].push(option.id);
    } else if (option.type === 'doublons') {
      profil.cartes[option.id].doublons += option.nombre;
    } else if (option.type === 'drachmes') profil.drachmes += option.nombre;
  }

  // ---------- Offrande du jour, série douce, Fil de réserve ----------
  const PALIERS_SERIE = [0, 3, 7, 14];
  const QUALITES = {
    argile: { nom: 'Amphore d\'argile', icone: '🏺', objets: 2, inedite: 0.05, drachmes: [15, 25] },
    bronze: { nom: 'Amphore de bronze', icone: '🏺', objets: 3, inedite: 0.08, drachmes: [20, 35] },
    argent: { nom: 'Amphore d\'argent', icone: '⚱️', objets: 3, inedite: 0.12, drachmes: [40, 60] },
    doree: { nom: 'Amphore dorée', icone: '🏆', objets: 4, inedite: 0.2, drachmes: [60, 90] }
  };
  const qualiteSerie = n => n >= 14 ? 'doree' : n >= 7 ? 'argent' : n >= 3 ? 'bronze' : 'argile';
  function ecartJours(a, b) { const [x, y] = [a, b].map(d => { const [an, m, j] = d.split('-').map(Number); return Date.UTC(an, m - 1, j); }); return Math.round((y - x) / 86400000); }
  function offrandeDisponible(profil, date) { return !profil.offrande || profil.offrande.date !== date; }
  // Contenu d'une amphore de qualité donnée
  function remplirAmphore(profil, qualite, graine) {
    const q = QUALITES[qualite], hasard = M.creerHasard(graine), objets = [];
    const heros = herosDisponibles(profil);
    const equipees = heros.flatMap(h => profil.equipement[h] || []).filter(id => profil.cartes[id] && profil.cartes[id].niveau < NIVEAU_MAX_CARTE);
    const inedites = Object.keys(D.RARETES).filter(id => !profil.cartes[id] && !carteInfo(id).carte.voie && heros.includes(carteInfo(id).heros.id));
    objets.push({ type: 'drachmes', nombre: q.drachmes[0] + Math.floor(hasard() * (q.drachmes[1] - q.drachmes[0] + 1)) });
    for (let i = 1; i < q.objets; i++) {
      if (inedites.length && hasard() < q.inedite) { const id = inedites.splice(Math.floor(hasard() * inedites.length), 1)[0]; objets.push({ type: 'carte', id }); continue; }
      const id = equipees.length ? equipees[Math.floor(hasard() * equipees.length)] : Object.keys(profil.cartes)[0];
      objets.push({ type: 'doublons', id, nombre: { commune: 2, rare: 1, epique: 1, legendaire: 1 }[rarete(id)] + (qualite === 'argent' || qualite === 'doree' ? 1 : 0) });
    }
    return objets;
  }
  function appliquerObjets(profil, objets) { objets.forEach(o => appliquerDon(profil, o)); }
  // Ouvre l'Offrande : met à jour la série, puis remplit l'amphore
  function ouvrirOffrande(profil, date, graine) {
    if (!offrandeDisponible(profil, date)) return null;
    const serie = profil.serie || (profil.serie = { jours: 0, dernier: null });
    let protege = false, recul = false;
    if (serie.dernier) {
      const ecart = ecartJours(serie.dernier, date);
      if (ecart === 1) serie.jours++;
      else if (ecart === 2 && (profil.filsReserve || 0) > 0) { profil.filsReserve--; serie.jours++; protege = true; }
      else if (ecart > 1) {
        // Série douce : on recule d'un palier au lieu de repartir à zéro
        const palier = PALIERS_SERIE.filter(p => p <= serie.jours).pop();
        const idx = PALIERS_SERIE.indexOf(palier);
        serie.jours = PALIERS_SERIE[Math.max(0, idx - 1)] + 1; recul = true;
      }
    } else serie.jours = 1;
    serie.dernier = date;
    let filGagne = false;
    if (serie.jours % 7 === 0 && (profil.filsReserve || 0) < 2) { profil.filsReserve = (profil.filsReserve || 0) + 1; filGagne = true; }
    const qualite = qualiteSerie(serie.jours);
    const objets = remplirAmphore(profil, qualite, graine);
    appliquerObjets(profil, objets);
    profil.offrande = { date };
    return { qualite, objets, serie: serie.jours, protege, recul, filGagne };
  }

  // ---------- Route de la Tapisserie ----------
  const ROUTE = { 2: 'carte', 4: 'fil', 6: 'carte', 9: 'amphore', 12: 'carte', 15: 'carte' };
  const ORDRE_ROUTE = ['ralliement', 'aube', 'rafale', 'pommeau', 'oeil', 'cri'];
  function prochainPalier(profil) {
    const n = profil.rangs.length;
    const p = Object.keys(ROUTE).map(Number).find(k => k > n);
    return p ? { rang: p, type: ROUTE[p] } : null;
  }
  // Réclame la récompense du palier atteint (une seule fois)
  function reclamerRoute(profil, graine) {
    const n = profil.rangs.length, type = ROUTE[n];
    profil.route = profil.route || {};
    if (!type || profil.route[n]) return null;
    profil.route[n] = true;
    if (type === 'fil') { profil.filsReserve = Math.min(2, (profil.filsReserve || 0) + 1); return { rang: n, type }; }
    if (type === 'amphore') { const objets = remplirAmphore(profil, 'doree', graine); appliquerObjets(profil, objets); return { rang: n, type, objets }; }
    const heros = herosDisponibles(profil);
    const id = ORDRE_ROUTE.find(x => !profil.cartes[x] && heros.includes(carteInfo(x).heros.id)) || ORDRE_ROUTE.find(x => !profil.cartes[x]);
    if (!id) { profil.drachmes += 100; return { rang: n, type: 'drachmes', nombre: 100 }; }
    appliquerDon(profil, { type: 'carte', id });
    return { rang: n, type: 'carte', id };
  }

  const Progression = {
    peutEvoluer, evoluer, carteEvoluee, lierCreature, liable, noterCodex, lienBonus, appliquerChoix, bonusDuJour,
    choixEnAttente, choisirVoie, choisirSerment, gloireDepart, secondSouffle, appliquerPassifs,
    QUALITES, ROUTE, offrandeDisponible, ouvrirOffrande, remplirAmphore, qualiteSerie, prochainPalier, reclamerRoute, ecartJours,
    NIVEAU_MAX_CARTE, NIVEAU_MAX_EQUIPE, SLOTS, LIENS_MAX, TRAITS, trait, lienActif, choisirLien, libererLien, NOMS_RARETE, COULEURS_RARETE,
    initialiser, rarete, carteInfo, coutAmelioration, peutAmeliorer, ameliorer, basculerEquipement,
    equipeDuJoueur, ennemisPourJoueur, butin, xpPourNiveau, gains, ajouterXp, herosDisponibles, genererDon, appliquerDon,
    multiplicateurCarte, multiplicateurEquipe
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Progression;
  else racine.Progression = Progression;
})(typeof window !== 'undefined' ? window : this);
