/* Le Fil des Moires : moteur de combat (logique pure, sans interface).
   Fonctionne dans le navigateur (window.Moteur) et dans Node (module.exports). */
(function (racine) {
  'use strict';

  // ---------- Hasard avec graine (mulberry32) ----------
  function creerHasard(graine) {
    let a = graine >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function graineDuJour(date, profil) {
    const texte = date + '|' + (profil || 'errant');
    let h = 2166136261;
    for (let i = 0; i < texte.length; i++) { h ^= texte.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // ---------- Affinités ----------
  const AFFINITES = {
    flamme: { nom: 'Flamme', couleur: '#e4572e', icone: '🔥' },
    sylve: { nom: 'Sylve', couleur: '#4caf50', icone: '🌿' },
    onde: { nom: 'Onde', couleur: '#2e86de', icone: '🌊' },
    foudre: { nom: 'Foudre', couleur: '#f1c40f', icone: '⚡' },
    vent: { nom: 'Vent', couleur: '#76d7c4', icone: '🌪️' },
    roc: { nom: 'Roc', couleur: '#a0785a', icone: '🪨' },
    lumiere: { nom: 'Lumière', couleur: '#f5e6a8', icone: '☀️' },
    ombre: { nom: 'Ombre', couleur: '#7d5ba6', icone: '🌑' },
    airain: { nom: 'Airain', couleur: '#b8a07a', icone: '🛡️' }
  };
  const FORT_CONTRE = {
    flamme: ['sylve'], sylve: ['onde'], onde: ['flamme'],
    foudre: ['vent'], vent: ['roc'], roc: ['foudre'],
    lumiere: ['ombre'], ombre: ['lumiere'], airain: []
  };
  function multiplicateur(attaque, defense) {
    if ((FORT_CONTRE[attaque] || []).includes(defense)) return 1.5;
    if ((FORT_CONTRE[defense] || []).includes(attaque) && attaque !== 'lumiere' && attaque !== 'ombre') return 0.67;
    return 1;
  }

  // ---------- Poids des actions (délai avant le prochain tour) ----------
  const POIDS = { leger: 60, normal: 100, lourd: 150 };
  const NOM_POIDS = { leger: 'Léger', normal: 'Normal', lourd: 'Lourd' };
  function delai(poids, vitesse) { return POIDS[poids] * 100 / vitesse; }

  // ---------- Création ----------
  function copier(o) { return JSON.parse(JSON.stringify(o)); }

  function creerUnite(modele, camp, index) {
    const u = copier(modele);
    u.uid = camp + index + '_' + modele.id;
    u.camp = camp;
    u.pv = u.pvMax;
    u.energie = u.energieDepart != null ? u.energieDepart : 2;
    u.energieMax = u.energieMax || 5;
    u.hubris = 0;
    u.etats = {}; // brulure: {tours, degats}, etourdi: tours, cauterise: tours
    u.gardePar = null;
    u.prochain = 0;
    u.tetes = u.tetes || 0;
    u.intention = null;
    u.ko = false;
    return u;
  }

  function creerCombat(options) {
    const hasard = creerHasard(options.graine || 1);
    const etat = {
      hasard,
      temps: 0,
      tour: 0,
      gloire: options.gloire || 0,
      gloireActive: options.gloireActive !== false,
      unites: [],
      journal: [],
      premieresFois: options.premieresFois || {},
      fini: null
    };
    options.allies.forEach((m, i) => etat.unites.push(creerUnite(m, 'allie', i)));
    options.ennemis.forEach((m, i) => etat.unites.push(creerUnite(m, 'ennemi', i)));
    // Report des PV / énergie entre deux rencontres
    if (options.reprise) {
      etat.unites.forEach(u => {
        const r = options.reprise[u.id];
        if (r) { u.pv = r.pv; u.energie = r.energie; u.ko = u.pv <= 0; u.hubris = r.hubris || 0; }
      });
    }
    etat.unites.forEach(u => { u.prochain = delai('normal', u.vitesse) * (0.4 + 0.6 * hasard()); });
    etat.unites.filter(u => u.camp === 'ennemi').forEach(u => planifier(etat, u));
    return etat;
  }

  function vivants(etat, camp) { return etat.unites.filter(u => !u.ko && (!camp || u.camp === camp)); }
  function unite(etat, uid) { return etat.unites.find(u => u.uid === uid); }

  // ---------- File d'initiative ----------
  function acteurSuivant(etat) {
    const v = vivants(etat);
    v.sort((a, b) => a.prochain - b.prochain || b.vitesse - a.vitesse);
    return v[0] || null;
  }

  // Prévision des n prochains tours (on suppose des actions de poids normal,
  // sauf pour les ennemis dont l'intention est connue).
  function prevision(etat, n, fantome) {
    const sim = vivants(etat).map(u => ({ uid: u.uid, t: u.prochain, v: u.vitesse, intention: u.intention, camp: u.camp }));
    if (fantome) {
      // L'acteur actuel a déjà joué ce tour : on le replace là où l'action choisie le renverra
      const a = sim.find(s => s.uid === fantome.uid);
      if (a) { a.t = etat.temps + delai(fantome.poids || 'normal', a.v); a.fantome = true; }
    }
    const resultat = [];
    const premiers = {};
    for (let i = 0; i < n && sim.length; i++) {
      sim.sort((a, b) => a.t - b.t || b.v - a.v);
      const s = sim[0];
      const montrerIntention = s.camp === 'ennemi' && !premiers[s.uid] && s.intention && s.intention.annonce;
      resultat.push({ uid: s.uid, annonce: montrerIntention ? s.intention.competence : null, fantome: !!(s.fantome && !premiers[s.uid]) });
      premiers[s.uid] = true;
      s.t += delai('normal', s.v);
    }
    return resultat;
  }

  // ---------- Début de tour ----------
  function debutTour(etat) {
    const acteur = acteurSuivant(etat);
    const evenements = [];
    if (!acteur) return { acteur: null, evenements, passe: true };
    etat.temps = acteur.prochain;
    etat.tour++;
    // une Garde dure jusqu'au prochain tour du gardien
    etat.unites.forEach(u => { if (u.gardePar === acteur.uid) u.gardePar = null; });
    acteur.energie = Math.min(acteur.energieMax, acteur.energie + 1);

    // Brûlure
    if (acteur.etats.brulure) {
      const b = acteur.etats.brulure;
      acteur.pv = Math.max(0, acteur.pv - b.degats);
      evenements.push({ type: 'brulure', cible: acteur.uid, degats: b.degats });
      b.tours--;
      if (b.tours <= 0) delete acteur.etats.brulure;
      if (acteur.pv <= 0) { tomber(etat, acteur, evenements); finTour(etat, acteur, 'normal'); verifierFin(etat); return { acteur, evenements, passe: true }; }
    }
    if (acteur.etats.cauterise) {
      acteur.etats.cauterise--;
      if (acteur.etats.cauterise <= 0) delete acteur.etats.cauterise;
    }
    // Étourdi (ou Némésis)
    if (acteur.etats.etourdi) {
      acteur.etats.etourdi--;
      if (acteur.etats.etourdi <= 0) delete acteur.etats.etourdi;
      evenements.push({ type: 'etourdi', cible: acteur.uid });
      finTour(etat, acteur, 'leger');
      return { acteur, evenements, passe: true };
    }
    return { acteur, evenements, passe: false };
  }

  function finTour(etat, acteur, poids) {
    acteur.prochain = etat.temps + delai(poids, acteur.vitesse);
  }

  function tomber(etat, u, evenements) {
    u.ko = true; u.pv = 0; u.etats = {};
    evenements.push({ type: 'ko', cible: u.uid });
    if (u.camp === 'ennemi') gagnerGloire(etat, 20, evenements);
  }

  function gagnerGloire(etat, n, evenements) {
    if (!etat.gloireActive) return;
    const avant = etat.gloire;
    etat.gloire = Math.min(100, etat.gloire + n);
    if (avant < 100 && etat.gloire >= 100) evenements.push({ type: 'gloirePleine' });
  }

  function verifierFin(etat) {
    if (!vivants(etat, 'ennemi').length) etat.fini = 'victoire';
    else if (!vivants(etat, 'allie').length) etat.fini = 'defaite';
    return etat.fini;
  }

  // ---------- Actions possibles ----------
  function competencesDisponibles(etat, acteur) {
    return acteur.competences.map(c => {
      let ok = acteur.energie >= (c.cout || 0);
      if (c.prouesse && etat.gloire < 100) ok = false;
      return Object.assign({}, c, { possible: ok });
    });
  }

  function ciblesPossibles(etat, acteur, comp) {
    if (comp.cible === 'ennemi') return vivants(etat, acteur.camp === 'allie' ? 'ennemi' : 'allie');
    if (comp.cible === 'allie') return vivants(etat, acteur.camp);
    if (comp.cible === 'autreAllie') return vivants(etat, acteur.camp).filter(u => u.uid !== acteur.uid);
    return [];
  }

  // ---------- Dégâts ----------
  function calculerDegats(etat, attaquant, cible, comp) {
    const mult = multiplicateur(comp.affinite, cible.affinite);
    let critique = etat.hasard() < (comp.critique || 0.1);
    if (attaquant.etats && attaquant.etats.critique) { critique = true; delete attaquant.etats.critique; }
    const variation = 0.9 + 0.2 * etat.hasard();
    let d = comp.puissance * attaquant.attaque / (attaquant.attaque + cible.defense) * 1.6;
    d = d * mult * (critique ? 1.5 : 1) * variation;
    return { degats: Math.max(1, Math.round(d)), mult, critique };
  }

  function infliger(etat, attaquant, cibleInitiale, comp, evenements) {
    let cible = cibleInitiale;
    let reduction = 1;
    // Garde : un allié intercepte le coup et en encaisse la moitié
    if (cible.gardePar) {
      const gardien = unite(etat, cible.gardePar);
      if (gardien && !gardien.ko) {
        evenements.push({ type: 'interception', gardien: gardien.uid, protege: cible.uid });
        cible = gardien; reduction = 0.5; cibleInitiale.gardePar = null;
      }
    }
    const precision = attaquant.etats && attaquant.etats.aveugle ? 0.55 : (comp.precision || 0.95);
    if (etat.hasard() > precision) {
      evenements.push({ type: 'rate', source: attaquant.uid, cible: cible.uid });
      return;
    }
    const r = calculerDegats(etat, attaquant, cible, comp);
    const degats = Math.max(1, Math.round(r.degats * reduction));
    cible.pv = Math.max(0, cible.pv - degats);
    evenements.push({ type: 'degats', source: attaquant.uid, cible: cible.uid, degats, mult: r.mult, critique: r.critique, affinite: comp.affinite });

    if (attaquant.camp === 'allie') {
      gagnerGloire(etat, 6 + (r.mult > 1 ? 10 : 0) + (r.critique ? 8 : 0), evenements);
    }
    // Effets
    if (comp.brulure && cible.pv > 0) {
      cible.etats.brulure = { tours: comp.brulure.tours, degats: comp.brulure.degats };
      evenements.push({ type: 'etat', cible: cible.uid, etat: 'brulure' });
    }
    if (comp.etourdit && cible.pv > 0 && etat.hasard() < comp.etourdit) {
      cible.etats.etourdi = 1;
      evenements.push({ type: 'etat', cible: cible.uid, etat: 'etourdi' });
    }
    if (comp.recul && cible.pv > 0) {
      cible.prochain += comp.recul;
      evenements.push({ type: 'recul', cible: cible.uid });
    }
    // Mécanique de l'Hydre : la Flamme cautérise, sinon un gros coup fait repousser une tête
    if (cible.mecanique === 'hydre' && cible.pv > 0) {
      if (comp.affinite === 'flamme') {
        cible.etats.cauterise = 2;
        evenements.push({ type: 'cauterise', cible: cible.uid });
      } else if (degats >= 30 && !cible.etats.cauterise && cible.tetes < cible.tetesMax) {
        cible.tetes++;
        evenements.push({ type: 'tete', cible: cible.uid, tetes: cible.tetes });
      }
    }
    // Mécanique du Cyclope : la Lumière l'aveugle
    if (cible.mecanique === 'cyclope' && comp.affinite === 'lumiere' && cible.pv > 0 && !cible.etats.aveugle) {
      cible.etats.aveugle = true;
      evenements.push({ type: 'aveugle', cible: cible.uid });
    }
    if (cible.pv <= 0) tomber(etat, cible, evenements);
  }

  // ---------- Exécution d'une action ----------
  function agir(etat, acteurUid, compId, cibleUid) {
    const acteur = unite(etat, acteurUid);
    const comp = acteur.competences.find(c => c.id === compId);
    const evenements = [{ type: 'action', source: acteur.uid, competence: comp.id, nom: comp.nom }];
    if (!comp) throw new Error('Compétence inconnue : ' + compId);
    acteur.energie -= comp.cout || 0;
    if (comp.prouesse) etat.gloire = 0;
    const cible = cibleUid ? unite(etat, cibleUid) : null;

    if (comp.type === 'attaque') {
      const cibles = comp.zone ? ciblesPossibles(etat, acteur, comp) : [cible];
      const coups = comp.coups || 1;
      cibles.forEach(c => { for (let i = 0; i < coups && !c.ko; i++) infliger(etat, acteur, c, comp, evenements); });
    } else if (comp.type === 'soin') {
      const cibles = comp.zone ? vivants(etat, acteur.camp) : [cible];
      cibles.forEach(c => {
        const soin = Math.round(comp.puissance * (0.9 + 0.2 * etat.hasard()));
        const avant = c.pv;
        c.pv = Math.min(c.pvMax, c.pv + soin);
        evenements.push({ type: 'soin', source: acteur.uid, cible: c.uid, soin: c.pv - avant });
      });
    } else if (comp.type === 'garde') {
      cible.gardePar = acteur.uid;
      evenements.push({ type: 'garde', source: acteur.uid, cible: cible.uid });
    } else if (comp.type === 'ralliement') {
      vivants(etat, acteur.camp).forEach(c => {
        const avant = c.pv;
        c.pv = Math.min(c.pvMax, c.pv + Math.round(comp.puissance * (0.9 + 0.2 * etat.hasard())));
        evenements.push({ type: 'soin', source: acteur.uid, cible: c.uid, soin: c.pv - avant });
      });
      gagnerGloire(etat, comp.gloire || 0, evenements);
    } else if (comp.type === 'oeil') {
      cible.etats.critique = true;
      evenements.push({ type: 'oeil', source: acteur.uid, cible: cible.uid });
    } else if (comp.type === 'presage') {
      // Avance un allié : il jouera juste après
      cible.prochain = etat.temps + 1;
      evenements.push({ type: 'presage', source: acteur.uid, cible: cible.uid });
    }

    // Hubris
    if (comp.hubris) {
      acteur.hubris += comp.hubris;
      evenements.push({ type: 'hubris', cible: acteur.uid, valeur: acteur.hubris });
      if (acteur.hubris >= 100) {
        acteur.hubris = 0;
        acteur.etats.etourdi = 1;
        const perte = Math.round(acteur.pvMax * 0.15);
        acteur.pv = Math.max(1, acteur.pv - perte);
        evenements.push({ type: 'nemesis', cible: acteur.uid, degats: perte });
      }
    }

    // Mécanique de l'Hydre : attaques supplémentaires par tête
    if (acteur.mecanique === 'hydre' && comp.type === 'attaque' && !comp.zone) {
      for (let i = 1; i < acteur.tetes; i++) {
        const v = vivants(etat, 'allie');
        if (!v.length) break;
        const c = v[Math.floor(etat.hasard() * v.length)];
        evenements.push({ type: 'teteAttaque', source: acteur.uid });
        infliger(etat, acteur, c, comp, evenements);
      }
    }

    if (acteur.etats.aveugle && comp.type === 'attaque') delete acteur.etats.aveugle;
    finTour(etat, acteur, comp.poids || 'normal');
    if (acteur.camp === 'ennemi') planifier(etat, acteur);
    verifierFin(etat);
    return evenements;
  }

  // ---------- IA ennemie ----------
  function planifier(etat, ennemi) {
    const comps = ennemi.competences;
    ennemi.compteur = (ennemi.compteur || 0) + 1;
    let choix = comps.find(c => c.chaque && ennemi.compteur % c.chaque === 0);
    if (!choix) {
      const normales = comps.filter(c => !c.chaque);
      choix = normales[Math.floor(etat.hasard() * normales.length)];
    }
    let cible = null;
    if (!choix.zone) {
      const cibles = ciblesPossibles(etat, ennemi, choix);
      if (ennemi.comportement === 'agressif') cible = cibles.slice().sort((a, b) => a.pv - b.pv)[0];
      else cible = cibles[Math.floor(etat.hasard() * cibles.length)];
    }
    ennemi.intention = { competence: choix.id, annonce: true, cible: cible ? cible.uid : null, grand: !!choix.chaque };
  }

  function tourEnnemi(etat, ennemi) {
    const comp = ennemi.competences.find(c => c.id === ennemi.intention.competence);
    let cible = null;
    if (!comp.zone) {
      cible = ennemi.intention.cible ? unite(etat, ennemi.intention.cible) : null;
      if (!cible || cible.ko) {
        const cibles = ciblesPossibles(etat, ennemi, comp);
        cible = cibles[Math.floor(etat.hasard() * cibles.length)];
      }
    }
    return agir(etat, ennemi.uid, comp.id, cible ? cible.uid : null);
  }

  // Fourchette de dégâts attendue (sans critique, sans Garde)
  function estimer(attaquant, cible, comp) {
    const mult = multiplicateur(comp.affinite, cible.affinite);
    const base = comp.puissance * attaquant.attaque / (attaquant.attaque + cible.defense) * 1.6 * mult;
    return { min: Math.max(1, Math.round(base * 0.9)), max: Math.max(1, Math.round(base * 1.1)), mult };
  }

  // ---------- Résultat ----------
  function etoiles(etat) {
    if (etat.fini !== 'victoire') return 0;
    const ko = etat.unites.filter(u => u.camp === 'allie' && u.ko).length;
    return ko === 0 ? 3 : ko === 1 ? 2 : 1;
  }

  const Moteur = {
    AFFINITES, FORT_CONTRE, POIDS, NOM_POIDS,
    creerHasard, graineDuJour, multiplicateur, creerCombat, vivants, unite,
    acteurSuivant, prevision, debutTour, competencesDisponibles, ciblesPossibles,
    agir, tourEnnemi, verifierFin, etoiles, calculerDegats, estimer, delai, planifier
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Moteur;
  else racine.Moteur = Moteur;
})(typeof window !== 'undefined' ? window : this);
