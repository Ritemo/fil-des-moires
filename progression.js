/* Le Fil des Moires : progression (cartes, niveaux, XP, drachmes, Don des Moires).
   Logique pure, utilisable dans le navigateur (window.Progression) et dans Node. */
(function (racine) {
  'use strict';
  const D = typeof module !== 'undefined' && module.exports ? require('./data.js') : racine.Donnees;
  const M = typeof module !== 'undefined' && module.exports ? require('./engine.js') : racine.Moteur;

  const NIVEAU_MAX_CARTE = 5;
  const NIVEAU_MAX_EQUIPE = 20;
  const SLOTS = 4;
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
    return profil;
  }

  // ---------- Cartes ----------
  const rarete = id => D.RARETES[id] || 'commune';
  function carteInfo(id) {
    for (const h of D.HEROS) { const c = h.competences.find(x => x.id === id); if (c) return { carte: c, heros: h }; }
    return null;
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
    const base = D.equipeDuJour(ep);
    return base.map(h => {
      const modele = D.HEROS.find(x => x.id === h.id);
      let comps;
      if (jour > 3) {
        const equipees = (profil.equipement[h.id] || []).filter(id => profil.cartes[id]);
        comps = modele.competences.filter(c => equipees.includes(c.id) || c.type === 'garde' || (c.prouesse && ep.gloire));
        comps = JSON.parse(JSON.stringify(comps));
      } else comps = h.competences.filter(c => profil.cartes[c.id] || c.type === 'garde');
      comps.forEach(c => {
        const carte = profil.cartes[c.id];
        c.niveau = carte ? carte.niveau : 1;
        if (c.puissance) c.puissance = Math.round(c.puissance * multiplicateurCarte(c.niveau));
      });
      const m = multiplicateurEquipe(profil.niveau);
      return Object.assign({}, h, { competences: comps, pvMax: Math.round(h.pvMax * m), attaque: Math.round(h.attaque * m) });
    });
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
  function herosDisponibles(profil) { return D.HEROS.filter((h, i) => (profil.joursJoues || 0) >= i).map(h => h.id); }
  function genererDon(profil, graine) {
    const hasard = M.creerHasard(graine);
    const heros = herosDisponibles(profil);
    const options = [];
    // 1. Une carte inédite, si possible
    const inedites = Object.keys(D.RARETES).filter(id => !profil.cartes[id] && heros.includes(carteInfo(id).heros.id));
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
    const inedites = Object.keys(D.RARETES).filter(id => !profil.cartes[id] && heros.includes(carteInfo(id).heros.id));
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
    QUALITES, ROUTE, offrandeDisponible, ouvrirOffrande, remplirAmphore, qualiteSerie, prochainPalier, reclamerRoute, ecartJours,
    NIVEAU_MAX_CARTE, NIVEAU_MAX_EQUIPE, SLOTS, NOMS_RARETE, COULEURS_RARETE,
    initialiser, rarete, carteInfo, coutAmelioration, peutAmeliorer, ameliorer, basculerEquipement,
    equipeDuJoueur, ennemisPourJoueur, butin, xpPourNiveau, gains, ajouterXp, herosDisponibles, genererDon, appliquerDon,
    multiplicateurCarte, multiplicateurEquipe
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Progression;
  else racine.Progression = Progression;
})(typeof window !== 'undefined' ? window : this);
