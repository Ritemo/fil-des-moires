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
    const m = 1 + 0.07 * (profil.niveau - 1) + 0.012 * (jour - 4);
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

  const Progression = {
    NIVEAU_MAX_CARTE, NIVEAU_MAX_EQUIPE, SLOTS, NOMS_RARETE, COULEURS_RARETE,
    initialiser, rarete, carteInfo, coutAmelioration, peutAmeliorer, ameliorer, basculerEquipement,
    equipeDuJoueur, ennemisPourJoueur, butin, xpPourNiveau, gains, ajouterXp, herosDisponibles, genererDon, appliquerDon,
    multiplicateurCarte, multiplicateurEquipe
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Progression;
  else racine.Progression = Progression;
})(typeof window !== 'undefined' ? window : this);
