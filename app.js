/* Le Fil des Moires : interface (phase 0 bis). */
(function () {
  'use strict';
  if (window.Emojis) window.Emojis.activer(document.body);
  const SON = window.Son || { coup() {}, jouer() {}, tissage() {}, ambiance() {}, regler() {}, reglages: () => ({}) };
  const VOIX = window.Voix || { dire: () => Promise.resolve(), stop() {}, regler() {}, actif: () => false, disponible: () => false };
  const AMB = { I: 'foret', II: 'ruines', III: 'fils', IV: 'etang' };
  let ambChapitre = 'foret';
  const majAmbChapitre = ep => { ambChapitre = AMB[ep.chapitre ? ep.chapitre.num : 'IV'] || 'etang'; };
  // Un petit clic sur chaque bouton
  document.addEventListener('click', e => { if (e.target.closest('button, .tuile, .offrande, .option')) SON.jouer('clic'); }, true);
  // Au rafraîchissement, le navigateur restaure l'ancienne position de défilement : on la remet à zéro
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  // Hauteur réellement visible (certains Android comptent la barre de navigation dans 100vh / 100dvh)
  const majHauteur = () => document.documentElement.style.setProperty('--hauteur', (window.visualViewport ? window.visualViewport.height : window.innerHeight) + 'px');
  majHauteur();
  window.addEventListener('resize', majHauteur);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', majHauteur);
  window.addEventListener('pageshow', majHauteur);
  const M = window.Moteur, D = window.Donnees, T = window.Tapisserie, S = window.Sync, P = window.Progression, E = window.Epreuves, C = window.Chant1, A = window.Activites;
  const $ = id => document.getElementById(id);

  // ---------- Stockage (protégé : peut être indisponible) ----------
  const stock = {
    lire(cle, defaut) { try { const v = localStorage.getItem('fdm_' + cle); return v ? JSON.parse(v) : defaut; } catch (e) { return defaut; } },
    ecrire(cle, v) { try { localStorage.setItem('fdm_' + cle, JSON.stringify(v)); } catch (e) { /* rien */ } }
  };
  const aujourdhui = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const profilVide = () => ({ joursJoues: 0, rangs: [], derniereDate: null, clotho: 'auto', vus: {}, compagnons: ['errant'] });
  // Complète un profil ancien (compagnons déjà rencontrés d'après les jours joués)
  // Calage du 16 novembre 2026 : la phase de test est finie. Une partie avancée au-delà du jour 3 est ramenée
  // à « Hydre vaincue le 16 novembre » : le jour 4 commence le lendemain. Les cartes et niveaux gagnés sont gardés.
  let recalee = false;
  // Calage du 16/11/2026 (retour au jour 3) : appliqué une seule fois à l'époque. Désactivé : une partie
  // recommencée après cette date n'avait pas le drapeau calage1 et était renvoyée au jour 3 après le jour 4.
  function caler(p) {
    return;
    p.calage1 = true; recalee = true;
    p.rangs = (p.rangs || []).filter(r => !r.echo && r.jour <= 3);
    p.joursJoues = 3; p.derniereDate = '2026-11-16';
    if (p.histoire) { Object.keys(p.histoire.choix || {}).forEach(k => { if (+k.slice(1) > 3) delete p.histoire.choix[k]; }); p.histoire.sceaux = []; }
    if (p.route) Object.keys(p.route).forEach(k => { if (+k > 3) delete p.route[k]; });
    p.maj = Date.now();
  }
  // Réparation du 19/11/2026 : le jour 4 de Mathieu avait été effacé par l'ancien calage (gains conservés, rang perdu)
  function reparer(p) {
    if (p.reparation1 || p.pseudo !== 'Mathieu' || p.joursJoues !== 3 || p.derniereDate !== '2026-11-16') return;
    const r = p.rangs || [];
    if (r.length !== 3 || (r[2] || {}).date !== '2026-11-18' || !(p.activites && p.activites.oracle && p.activites.oracle.date === '2026-11-19')) return;
    r.push({ jour: 4, date: '2026-11-19', titre: 'Myrtos, le village sans noms', victoire: true, etoiles: 2, couleur: 'airain', motif: '🐐',
      resume: 'Victoire sur les bêtes de Myrtos (rang restauré après un souci de sauvegarde).' });
    p.rangs = r; p.joursJoues = 4; p.derniereDate = '2026-11-19'; p.reparation1 = true; p.maj = Date.now();
    recalee = true;
  }
  function migrer(p) {
    caler(p);
    reparer(p);
    P.initialiser(p);
    A.initialiser(p);
    if (!p.compagnons || (p.compagnons.length === 1 && p.joursJoues >= 2)) p.compagnons = ['errant'].concat(p.joursJoues >= 2 ? ['phaena'] : [], p.joursJoues >= 3 ? ['griffon'] : []);
    return p;
  }
  let profil = migrer(Object.assign(profilVide(), stock.lire('profil', {})));
  // Prochaine épreuve (titre et Présage), lue par le script de sauvegarde pour le rappel du matin
  function noterProchaine() {
    try {
      const d = new Date(); if (profil.derniereDate === aujourdhui()) d.setDate(d.getDate() + 1);
      const date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const jour = profil.joursJoues + 1, ep = E.epreuve(jour, date, profil.histoire);
      profil.prochaine = { jour, titre: ep.titre.replace(/^Le Prologue : /, ''), presage: ep.presage || '', nouveau: ep.nouveau || '' };
    } catch (e) { /* le rappel se contentera du numéro du jour */ }
  }
  const sauver = () => { noterProchaine(); profil.maj = Date.now(); stock.ecrire('profil', profil); S.envoyer(profil); };

  // ---------- Sauvegarde commune ----------
  // Au démarrage et quand l'appli revient au premier plan : on prend la version la plus récente.
  async function synchroniser() {
    if (partie) return;
    const distant = await S.telecharger();
    if (distant && distant.maj && distant.maj > (profil.maj || 0)) {
      profil = migrer(Object.assign(profilVide(), distant));
      stock.ecrire('profil', profil);
      if (recalee) { recalee = false; S.envoyer(profil, true); }
      if (!partie && $('accueil').classList.contains('actif')) accueil();
    } else if (S.conf() && (!distant || (profil.maj || 0) > (distant.maj || 0))) {
      if (profil.maj) S.envoyer(profil, true);
    }
  }
  const LIBELLES_SYNC = { local: '💾 Sauvegarde sur cet appareil seulement', ok: '☁️ Sauvegarde commune à jour', envoi: '☁️ Envoi en cours...', horsligne: '⚠️ Hors ligne : sauvegarde locale, synchro au retour du réseau', erreur: '⚠️ Sauvegarde commune : clé ou adresse incorrecte' };
  S.surChangement(e => { if ($('etatSync')) $('etatSync').textContent = LIBELLES_SYNC[e]; });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') synchroniser(); });

  let partie = null;
  let enAttente = null;
  let occupe = false;
  let vitesse = 1; // 1 = normal, 0.5 = rapide
  const T_ = ms => Math.round(ms * vitesse);

  // ---------- Guidage de Clotho ----------
  // bavarde : tous les conseils + suggestions ; discrète : nouveautés + bouton 💡 ; muette : nouveautés seulement
  function guidage() {
    if (profil.clotho !== 'auto') return profil.clotho;
    const j = partie ? partie.jour : profil.joursJoues + 1;
    return j <= 3 ? 'bavarde' : j <= 10 ? 'discrete' : 'muette';
  }
  const NOUVEAUTES = ['debut', 'garde', 'gloire', 'gloireIntro', 'don', 'collection', 'niveau', 'gardien', 'tapisserie', 'discret', 'intention', 'lierCarte', 'lier', 'lienRate', 'lie', 'choixCrea', 'codex', 'evolution', 'energie', 'prouesseDispo'];
  const fileClotho = [];
  function clotho(cle) {
    if (profil.vus[cle]) return;
    if (guidage() !== 'bavarde' && !NOUVEAUTES.includes(cle)) return;
    profil.vus[cle] = true; sauver();
    fileClotho.push(D.CLOTHO[cle]);
    if (!$('clotho').classList.contains('visible')) montrerClotho();
  }
  function montrerClotho() {
    const t = fileClotho.shift();
    if (!t) { $('clotho').classList.remove('visible'); $('voile').classList.remove('visible'); reprendre(); return; }
    $('clothoTexte').textContent = t;
    $('clotho').classList.add('visible'); $('voile').classList.add('visible');
  }
  $('clothoOk').onclick = montrerClotho;
  const bloque = () => $('clotho').classList.contains('visible') || $('modale').classList.contains('visible');
  function reprendre() { if (enAttente && !bloque()) { const f = enAttente; enAttente = null; f(); } }
  // Exécute f après ms, ou dès que Clotho ou le lexique se ferment
  function ensuite(f, ms) { setTimeout(() => { if (bloque()) enAttente = f; else f(); }, T_(ms || 0)); }

  // ---------- Petites aides ----------
  const aff = id => M.AFFINITES[id];
  const forces = a => (M.FORT_CONTRE[a] || []);
  const faiblesses = a => Object.keys(M.FORT_CONTRE).filter(k => M.FORT_CONTRE[k].includes(a));
  const listeAff = l => l.length ? l.map(a => aff(a).icone + ' ' + aff(a).nom).join(', ') : 'aucune';
  function resume(c) {
    const p = [c.cout ? '<b>🔹' + c.cout + '</b>' : 'Gratuit'];
    if (c.type === 'attaque') p.push('Puiss. ' + c.puissance + (c.zone ? ' (tous)' : ''));
    if (c.type === 'soin') p.push('Soin ' + c.puissance);
    p.push(M.NOM_POIDS[c.poids || 'normal']);
    return p.join(' · ');
  }
  const ONGLETS = ['tresors', 'collection', 'accueil', 'tapisserie', 'codex'];
  function ecran(id) {
    document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('actif', e.id === id));
    const onglet = ONGLETS.includes(id) && !(id === 'collection' && modePreparation);
    document.body.classList.toggle('fixe', onglet); document.documentElement.classList.toggle('fixe', onglet);
    SON.ambiance(id === 'combat' ? 'combat' : ambChapitre);
    $('chipsAccueil').style.display = onglet ? 'flex' : 'none';
    document.querySelectorAll('#ongletsBas button').forEach(b => b.classList.toggle('on', b.dataset.onglet === id));
    if (onglet) { majBandeau(); window.scrollTo(0, 0); }
  }
  // Bandeau du haut (niveau, drachmes) et pastilles des onglets
  function majBandeau() {
    $('niveauEquipe').textContent = profil.niveau;
    $('xpAccueil').style.width = Math.round(100 * profil.xp / P.xpPourNiveau(profil.niveau)) + '%';
    $('drachmesAccueil').textContent = profil.drachmes;
    const pastille = (onglet, html) => { const b = document.querySelector(`#ongletsBas [data-onglet="${onglet}"]`); b.querySelectorAll('.pastille, .point').forEach(x => x.remove()); if (html) b.insertAdjacentHTML('beforeend', html); };
    const n = nbAmeliorables();
    pastille('collection', n ? `<span class="pastille">⬆ ${n}</span>` : '');
    const tresor = (profil.joursJoues >= 1 && P.offrandeDisponible(profil, aujourdhui())) || P.choixEnAttente(profil);
    const nAct = A.enAttente(profil, aujourdhui());
    pastille('tresors', nAct ? `<span class="pastille">${nAct}</span>` : tresor ? '<span class="point"></span>' : '');
    const fait = profil.derniereDate === aujourdhui() && !(profil.rattrapage > 0);
    pastille('accueil', fait ? '' : '<span class="point"></span>');
  }
  document.querySelectorAll('#ongletsBas button').forEach(b => b.onclick = () => ({
    tresors: ouvrirTresors, collection: () => ouvrirCollection(false), accueil, tapisserie: ouvrirTapisserie, codex: ouvrirCodex
  })[b.dataset.onglet]());

  // ---------- Accueil ----------
  function accueil() {
    ecran('accueil');
    partie = null;
    const rattraper = profil.derniereDate === aujourdhui() && (profil.rattrapage || 0) > 0;
    const fait = profil.derniereDate === aujourdhui() && !rattraper;
    const jour = fait ? Math.max(1, profil.joursJoues) : profil.joursJoues + 1;
    const ep = E.epreuve(jour, aujourdhui(), profil.histoire);
    $('mode').textContent = '';
    $('titreEpreuve').textContent = 'Jour ' + jour + ' · ' + ep.titre;
    $('dateJour').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    $('presage').textContent = ep.presage;
    $('nouveau').textContent = '✨ ' + (ep.nouveau || '');
    $('nouveau').style.display = fait || !ep.nouveau ? 'none' : 'block';
    $('chapitreAccueil').textContent = nomChapitre(ep);
    majAmbChapitre(ep); SON.ambiance(ambChapitre);
    $('vignette').innerHTML = vignetteSvg(ep, fait);
    $('btnJouer').style.display = fait ? 'none' : 'block';
    $('btnJouer').textContent = rattraper ? 'Rattraper un jour : jour ' + jour : 'Commencer l\'épreuve';
    $('btnEcho').style.display = fait ? 'block' : 'none';
    const dernier = profil.rangs[profil.rangs.length - 1];
    $('etatJour').textContent = rattraper ? '🧵 Tu as manqué ' + (profil.rattrapage > 1 ? 'des jours' : 'un jour') + ' : tu peux rattraper ' + profil.rattrapage + ' épreuve' + (profil.rattrapage > 1 ? 's' : '') + ' en plus aujourd\'hui ou plus tard.'
      : fait && dernier ? 'Épreuve du jour terminée : ' + (dernier.victoire ? 'victoire ' + '★'.repeat(dernier.etoiles) : 'défaite') + '. Nouvelle épreuve demain.' : '';
    $('reglageClotho').value = profil.clotho;
    // Précédemment
    const hier = profil.rangs[profil.rangs.length - (fait ? 2 : 1)];
    $('precedemment').innerHTML = hier ? `<b>Précédemment</b> (jour ${hier.jour}) : ${hier.recit || hier.resume}` : '';
    $('precedemment').style.display = hier ? 'block' : 'none';
    // Aperçu : les rencontres du jour (les ennemis jamais vus restent des silhouettes)
    const vu = id => profil.codex[id] && profil.codex[id].vu;
    $('apercuJour').innerHTML = fait ? '' : '<div class="titre">Ce qui t\'attend</div>' + ep.rencontres.map((r, k) => {
      const g = r.ennemis.some(id => D.ENNEMIS[id].gardien);
      return `<div class="lig"><span>${g ? '👑 Gardien' : 'Rencontre ' + (k + 1)}</span><span>${r.ennemis.map(id => vu(id) ? D.ENNEMIS[id].emoji : '❔').join('')}</span></div>`;
    }).join('');
  }

  // ---------- Vignette illustrée de l'épreuve (SVG, selon le chapitre) ----------
  const PAYSAGES = {
    I: { ciel: ['#f4b26a', '#8a3f2c'], loin: '#7a3a24', pres: '#3a1e14', astre: '#ffe1a0', deco: 'foret' },
    II: { ciel: ['#b9c9d6', '#45566c'], loin: '#5f6f7e', pres: '#2c3640', astre: '#f4f1e4', deco: 'ruines' },
    III: { ciel: ['#c39be0', '#33204e'], loin: '#5a3c74', pres: '#22162e', astre: '#ffd27a', deco: 'fils' },
    IV: { ciel: ['#33426a', '#0c1222'], loin: '#1e2a44', pres: '#0d1424', astre: '#f2f0dc', deco: 'etang' }
  };
  function vignetteSvg(ep, fait) {
    const P_ = PAYSAGES[ep.chapitre ? ep.chapitre.num : 'IV'];
    const h = (a, b) => { let x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
    let deco = '';
    if (P_.deco === 'foret') {
      for (let i = 0; i < 9; i++) { const x = 20 + i * 40 + h(i, 1) * 14, t = 46 + h(i, 2) * 30; deco += `<rect x="${x - 2}" y="${150 - t * 0.35}" width="4" height="${t * 0.4}" fill="#2a140c"/><circle cx="${x}" cy="${150 - t * 0.55}" r="${t * 0.32}" fill="${['#b2481e', '#d0782a', '#8a2f16'][i % 3]}" opacity=".9"/>`; }
      for (let i = 0; i < 8; i++) deco += `<circle class="feuille" style="animation-delay:${(h(i, 3) * 6).toFixed(1)}s" cx="${h(i, 4) * 360}" cy="-6" r="2.4" fill="#e08a3a"/>`;
    } else if (P_.deco === 'ruines') {
      [[40, 70], [86, 46], [250, 76], [300, 30], [336, 58]].forEach(([x, t], i) => { deco += `<rect x="${x}" y="${150 - t}" width="14" height="${t}" fill="#e9e4d4" opacity=".85"/><rect x="${x - 3}" y="${150 - t}" width="20" height="5" fill="#d8d2c0"/>${i % 2 ? '' : `<path d="M${x} ${150 - t} l7 -6 l7 6z" fill="#cfc8b4"/>`}`; });
      deco += '<path d="M120 150 q40 -60 80 0" stroke="#e9e4d4" stroke-width="9" fill="none" opacity=".7"/>';
    } else if (P_.deco === 'fils') {
      for (let i = 0; i < 7; i++) deco += `<line class="filtombe" style="animation-delay:${(h(i, 5) * 5).toFixed(1)}s" x1="${30 + i * 50}" y1="-40" x2="${36 + i * 50}" y2="0" stroke="#f2c96a" stroke-width="1.6"/>`;
      for (let i = 0; i < 5; i++) deco += `<circle cx="${60 + i * 60}" cy="${132 - h(i, 6) * 10}" r="${18 + h(i, 7) * 12}" fill="#4a3060" opacity=".5"/>`;
    } else {
      deco += '<ellipse cx="180" cy="168" rx="190" ry="22" fill="#0a1830"/>';
      for (let i = 0; i < 6; i++) deco += `<rect class="reflet" style="animation-delay:${i * 0.5}s" x="${150 + h(i, 8) * 70}" y="${160 + i * 3}" width="${16 + h(i, 9) * 20}" height="1.5" fill="#e8e6d0" opacity=".5"/>`;
      for (let i = 0; i < 12; i++) { const x = h(i, 10) * 360; deco += `<path d="M${x} 170 q2 -18 ${(h(i, 11) - 0.5) * 8} -30" stroke="#22381e" stroke-width="2" fill="none"/>`; }
    }
    const etoiles = Array.from({ length: 14 }, (_, i) => `<circle class="scint" style="animation-delay:${(h(i, 12) * 3).toFixed(1)}s" cx="${h(i, 13) * 360}" cy="${h(i, 14) * 70}" r="${0.8 + h(i, 15)}" fill="#fff6d8"/>`).join('');
    // L'équipe à gauche, les ennemis du jour à droite (silhouettes pour ceux jamais vus)
    const equipe = ['errant'].concat(ep.equipe && ep.equipe.phaena === undefined ? [] : ['phaena'], [profil.creature || 'griffon'])
      .map(id => (D.HEROS.concat(D.CREATURES).find(x => x.id === id) || {}).emoji).filter(Boolean);
    const ids = [...new Set(ep.rencontres.flatMap(r => r.ennemis))];
    const gardien = ids.find(id => D.ENNEMIS[id].gardien);
    const vus = id => profil.codex[id] && profil.codex[id].vu;
    // Un emoji dans le SVG : image 3D si disponible, sinon texte
    const emo = (e, x, y, t, attrs) => { const s = window.Emojis && window.Emojis.src(e);
      return s ? `<image href="${s}" x="${x - t / 2}" y="${y - t * 0.88}" width="${t}" height="${t}" ${attrs || ''}/>` : `<text x="${x}" y="${y}" font-size="${t}" text-anchor="middle" ${attrs || ''}>${e}</text>`; };
    const ennemi = (id, x, y, t, k) => emo(D.ENNEMIS[id].emoji, x, y, t, `class="flotte" style="animation-delay:${k * 0.4}s" ${vus(id) ? '' : 'filter="url(#ombre)" opacity=".85"'}`);
    const foes = gardien ? ennemi(gardien, 262, 150, 74, 0) + ids.filter(i => i !== gardien).slice(0, 2).map((id, k) => ennemi(id, 205 + k * 105, 168, 28, k + 1)).join('')
      : ids.slice(0, 3).map((id, k) => ennemi(id, 214 + k * 44, 150 + (k % 2) * 12, 38, k)).join('');
    return `<svg viewBox="0 0 360 190" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P_.ciel[1]}"/><stop offset="1" stop-color="${P_.ciel[0]}"/></linearGradient>
        <filter id="ombre"><feColorMatrix type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.03  0 0 0 0 0.02  0 0 0 1 0"/></filter>
        <radialGradient id="halo"><stop offset="0" stop-color="${P_.astre}" stop-opacity=".9"/><stop offset="1" stop-color="${P_.astre}" stop-opacity="0"/></radialGradient></defs>
      <rect width="360" height="190" fill="url(#ciel)"/>${etoiles}
      <circle cx="300" cy="48" r="44" fill="url(#halo)"/><circle cx="300" cy="48" r="16" fill="${P_.astre}"/>
      <path d="M0 120 Q60 88 120 112 T240 104 T360 116 V190 H0Z" fill="${P_.loin}"/>
      ${deco}
      <path d="M0 160 Q90 140 180 158 T360 152 V190 H0Z" fill="${P_.pres}"/>
      ${foes}
      ${equipe.map((e, k) => emo(e, 64 + k * 42, 170 - (k % 2) * 5, 36)).join('')}
      ${fait ? '<rect width="360" height="190" fill="#000" opacity=".35"/><text x="180" y="104" font-size="20" text-anchor="middle" fill="#f6ead2" font-family="Georgia">Épreuve accomplie</text>' : ''}
    </svg>`;
  }

  // ======================================================================
  // ---------- Agora : activités du jour (Oracle, Forge, Arène, Expéditions, Titan) ----------
  // ======================================================================
  const INTROS = {
    oracle: "Chaque jour, la Pythie pose une énigme sur les mythes grecs. La même pour tous les tisserands : comparez vos réponses ! Une bonne réponse rapporte 20 drachmes et un éclat d'oracle, utile à la Forge. Cinq bonnes réponses d'affilée : un éclat de plus.",
    forge: "Héphaïstos forge des talismans avec tes matériaux (airain, bois d'olivier, laine sacrée, éclats d'oracle, perles). Le talisman équipé renforce toute ton équipe, dans les épreuves comme dans l'Arène et contre le Titan. Chaque talisman a trois niveaux.",
    arene: "Une fois par jour, affronte l'ombre d'un autre tisserand : son équipe, ses cartes et son talisman, pilotés par l'ordinateur. Une victoire rapporte 30 trophées et 25 drachmes, une défaite en coûte 10. Les trophées font monter de ligue.",
    expedition: "Envoie une créature explorer un lieu déjà traversé. Elle revient le lendemain avec des matériaux, des drachmes et une petite histoire. Si son affinité est celle du lieu, elle trouve davantage. Une expédition par jour.",
    titan: "Chaque semaine, un Titan se réveille. Tous les tisserands le combattent ensemble : un assaut par jour, de " + A.ACTIONS_TITAN + " actions, et vos dégâts s'additionnent. À 25, 50, 75 et 100 % de l'objectif, chacun réclame sa récompense. Le Titan change le lundi."
  };
  const matHtml = (m, filtre) => Object.keys(A.MATERIAUX).filter(k => !filtre || m[k]).map(k => `<span class="puce">${A.MATERIAUX[k].emoji} ${filtre ? '+' : ''}${m[k] || 0}${filtre ? ' ' + A.MATERIAUX[k].nom.toLowerCase() : ''}</span>`).join('');
  function ouvrirModale(titre, html) { $('titreModale').textContent = titre; $('onglets').innerHTML = ''; $('lexiqueCorps').innerHTML = html; $('lexiqueCorps').scrollTop = 0; $('modale').classList.add('visible'); }
  function introAct(id) {
    if (profil.vus['act_' + id]) return `<details class="explic"><summary>Comment ça marche ?</summary><p>${INTROS[id]}</p></details>`;
    profil.vus['act_' + id] = true; sauver();
    return `<div class="parchemin"><b>Clotho :</b> ${INTROS[id]}</div>`;
  }
  // Les autres joueurs (pour l'Arène et le Titan), lus dans le classement
  let cacheAutres = null;
  async function autresJoueurs(forcer) {
    if (cacheAutres && !forcer && cacheAutres.date === aujourdhui() && Date.now() - cacheAutres.t < 60000) return cacheAutres.liste;
    if (!S.conf()) return [];
    const r = await S.classement();
    if (r.erreur || !r.liste) return cacheAutres ? cacheAutres.liste : [];
    const moi = (S.conf() && S.conf().joueur) || '';
    const liste = r.liste.filter(j => j.joueur !== undefined ? j.joueur !== moi : j.nom !== profil.pseudo)
      .map(j => ({ nom: j.nom, niveau: j.niveau, titan: j.act && j.act.titan, trophees: j.act && j.act.trophees, fiche: j.fiche ? Object.assign({}, j.fiche, { niveau: j.niveau, activites: j.act }) : null }));
    cacheAutres = { date: aujourdhui(), t: Date.now(), liste };
    return liste;
  }

  function etatTuile(id) {
    const d = aujourdhui(), a = profil.activites;
    if (!A.debloquee(profil, id)) return { txt: 'Après le jour ' + A.DEBLOCAGE[id], ferme: true };
    if (id === 'oracle') return A.oracleFait(profil, d) ? { txt: a.oracle.juste ? '✅ Bonne réponse' : '❌ Raté, à demain' } : { txt: 'Une énigme t\'attend', pret: true };
    if (id === 'forge') { const n = A.TALISMANS.filter(t => A.peutForger(profil, t.id)).length; const t = a.talisman && A.talisman(a.talisman);
      return n ? { txt: '⬆ ' + n + ' forge' + (n > 1 ? 's' : '') + ' possible' + (n > 1 ? 's' : ''), pret: true } : { txt: t ? t.emoji + ' ' + t.nom + ' niv. ' + a.talismans[t.id] : Object.values(a.materiaux).reduce((x, y) => x + y, 0) + ' matériaux' }; }
    if (id === 'arene') { const l = A.ligue(a.arene.trophees); return A.areneFaite(profil, d) ? { txt: '✅ ' + l.emoji + ' ' + a.arene.trophees + ' trophées' } : { txt: 'Un duel t\'attend · ' + l.emoji + ' ' + a.arene.trophees, pret: true }; }
    if (id === 'expedition') { const e = a.expedition;
      if (A.expeditionPrete(profil, d)) return { txt: '🎁 Ta créature est rentrée !', pret: true };
      if (e) return { txt: '⏳ De retour demain' };
      return a.derniereExpedition === d ? { txt: '✅ Butin récolté' } : { txt: 'Envoie une créature explorer', pret: true }; }
    if (id === 'titan') { const T = A.titanDeLaSemaine(d); return A.titanFait(profil, d) ? { txt: '✅ ' + T.emoji + ' assaut du jour fait' } : { txt: T.emoji + ' ' + T.nom.split(',')[0] + ' t\'attend', pret: true }; }
    return { txt: '' };
  }
  function agoraHtml() {
    return '<div class="agora">' + ['oracle', 'arene', 'expedition', 'titan', 'forge'].map(id => {
      const e = etatTuile(id), n = A.NOMS[id];
      return `<button class="activite${e.ferme ? ' fermee' : ''}${e.pret ? ' prete' : ''}" data-act="${id}"><span class="ico">${e.ferme ? '🔒' : n.emoji}</span><b>${n.court}</b><span class="etat">${e.txt}</span></button>`;
    }).join('') + '</div>';
  }
  function brancherAgora(racine) {
    racine.querySelectorAll('.activite').forEach(b => b.onclick = () => {
      const id = b.dataset.act;
      if (!A.debloquee(profil, id)) return ouvrirModale(A.NOMS[id].emoji + ' ' + A.NOMS[id].nom, `<p>${INTROS[id]}</p><p class="small">🔒 S'ouvre quand tu auras terminé le jour ${A.DEBLOCAGE[id]}.</p>`);
      SON.jouer('page');
      ({ oracle: ouvrirOracle, forge: ouvrirForge, arene: ouvrirArene, expedition: ouvrirExpedition, titan: ouvrirTitan })[id]();
    });
  }
  const rafraichirAgora = () => { if ($('tresors').classList.contains('actif')) ouvrirTresors(); majBandeau(); };

  // ----- Oracle -----
  function ouvrirOracle() {
    const d = aujourdhui(), q = A.oracleDuJour(d), o = profil.activites.oracle;
    const corps = (fait) => `${introAct('oracle')}<div class="oracleQ">🔮 ${q.question}</div>
      <div class="oracleR">${q.reponses.map((r, i) => `<button data-i="${i}" class="${fait ? (i === q.bonne ? 'bonne' : i === o.choix ? 'fausse' : '') : ''}" ${fait ? 'disabled' : ''}>${r}</button>`).join('')}</div>
      <div id="oracleRes">${fait ? resultat() : ''}</div>`;
    const resultat = () => `<p class="${o.juste ? 'vert' : 'rouge'}"><b>${o.juste ? '✅ La Pythie sourit.' : '❌ La Pythie secoue la tête.'}</b> ${q.explication}</p>
      <p class="small">${o.juste ? 'Série de bonnes réponses : ' + o.serie + (o.serie % 5 === 4 ? ' (encore une pour un éclat bonus)' : '') : 'Reviens demain pour une nouvelle énigme.'}</p>`;
    ouvrirModale('🔮 L\'Oracle de Delphes', corps(A.oracleFait(profil, d)));
    $('lexiqueCorps').querySelectorAll('.oracleR button').forEach(b => b.onclick = () => {
      const r = A.repondreOracle(profil, d, +b.dataset.i); if (!r) return;
      SON.jouer(r.juste ? 'victoire' : 'rate'); sauver();
      $('lexiqueCorps').innerHTML = corps(true);
      $('oracleRes').insertAdjacentHTML('beforeend', `<div class="bourse"><span>🪙 +${r.gains.drachmes} drachmes</span>${matHtml(r.gains.materiaux, true)}</div>`);
      rafraichirAgora();
    });
  }

  // ----- Forge -----
  function ouvrirForge() {
    const a = profil.activites;
    const cout = c => Object.keys(c).map(k => { const ok = k === 'drachmes' ? profil.drachmes >= c[k] : (a.materiaux[k] || 0) >= c[k];
      return `<span class="puce${ok ? '' : ' manque'}">${k === 'drachmes' ? '🪙' : A.MATERIAUX[k].emoji} ${c[k]}</span>`; }).join('');
    const html = `${introAct('forge')}<div class="sousTitre">Tes matériaux</div><div>${matHtml(a.materiaux)}<span class="puce">🪙 ${profil.drachmes}</span></div>
      <p class="small">On en trouve à l'Oracle, en expédition, dans l'Arène et sur le Titan.</p>` +
      A.TALISMANS.map(t => { const n = a.talismans[t.id] || 0, c = A.coutForge(profil, t.id), equipe = a.talisman === t.id;
        return `<div class="talisman${equipe ? ' equipe' : ''}"><div class="ico">${t.emoji}</div><div class="txt"><b>${t.nom}</b> ${n ? '<span class="small">niv. ' + n + '/3</span>' : ''}
          <div class="small">${n ? t.effet(n) : 'Pas encore forgé'}${c ? ' · ' + (n ? 'niv. ' + (n + 1) + ' : ' : '') + t.effet(n + 1) : ''}</div>
          ${c ? `<div>${cout(c)}</div>` : '<div class="small">✨ Niveau maximal</div>'}
          <div class="boutons">${c ? `<button data-forge="${t.id}" ${A.peutForger(profil, t.id) ? '' : 'disabled'}>${n ? 'Améliorer' : 'Forger'}</button>` : ''}${n && !equipe ? `<button data-equipe="${t.id}">Équiper</button>` : ''}${equipe ? '<span class="small">✅ Équipé</span>' : ''}</div></div></div>`; }).join('');
    ouvrirModale('⚒️ La Forge d\'Héphaïstos', html);
    $('lexiqueCorps').querySelectorAll('[data-forge]').forEach(b => b.onclick = () => { const n = A.forger(profil, b.dataset.forge); if (n) { SON.jouer('evolue'); sauver(); ouvrirForge(); rafraichirAgora(); } });
    $('lexiqueCorps').querySelectorAll('[data-equipe]').forEach(b => b.onclick = () => { a.talisman = b.dataset.equipe; SON.jouer('clic'); sauver(); ouvrirForge(); rafraichirAgora(); });
  }

  // ----- Expéditions -----
  function ouvrirExpedition() {
    const d = aujourdhui(), a = profil.activites;
    if (A.expeditionPrete(profil, d)) {
      const r = A.recolterExpedition(profil, d); sauver(); SON.jouer('amphore');
      ouvrirModale('🗺️ Retour d\'expédition', `<div class="ficheEp gagne"><div class="ficheMotif">${r.creature.emoji || '🐾'}</div><div><b>${r.lieu.emoji} ${r.lieu.nom}</b><div class="small">${r.recit}</div></div></div>
        ${r.affine ? '<p class="small">🌟 Le lieu convenait à son affinité : butin plus généreux.</p>' : ''}
        <div class="bourse"><span>🪙 +${r.drachmes} drachmes</span>${matHtml(r.materiaux, true)}</div>
        <button class="principal" id="expeEncore" style="width:100%">Préparer la prochaine expédition</button>`);
      $('expeEncore').onclick = ouvrirExpedition; rafraichirAgora(); return;
    }
    if (a.expedition) { const e = a.expedition, l = A.LIEUX.find(x => x.id === e.lieu), c = A.explorateurs(profil).find(x => x.id === e.creature) || {};
      return ouvrirModale('🗺️ Les Expéditions', `${introAct('expedition')}<p>⏳ ${c.emoji || ''} <b>${c.nom || 'Ta créature'}</b> explore ${l.emoji} ${l.nom}. Elle rentrera demain.</p>`); }
    if (a.derniereExpedition === d) return ouvrirModale('🗺️ Les Expéditions', `${introAct('expedition')}<p>Une expédition par jour : prépare la prochaine demain.</p>`);
    const ex = A.explorateurs(profil), lieux = A.lieuxOuverts(profil);
    if (!ex.length) return ouvrirModale('🗺️ Les Expéditions', `${introAct('expedition')}<p>Il te faut une créature : Kelos, ou une créature liée.</p>`);
    let choixC = ex[0].id, choixL = lieux[0].id;
    const rendre = () => {
      const c = ex.find(x => x.id === choixC);
      ouvrirModale('🗺️ Les Expéditions', `${introAct('expedition')}<div class="sousTitre">Qui envoyer ?</div>
        <div class="choixLigne">${ex.map(x => `<button data-c="${x.id}" class="${x.id === choixC ? 'on' : ''}">${x.emoji} ${x.nom}<span class="small">${aff(x.affinite).icone}</span></button>`).join('')}</div>
        <div class="sousTitre">Où ?</div>
        ${lieux.map(l => `<button class="lieu${l.id === choixL ? ' on' : ''}" data-l="${l.id}"><span class="ico">${l.emoji}</span><span><b>${l.nom}</b><span class="small">${[...new Set(l.butin)].map(m => A.MATERIAUX[m].emoji).join(' ')} · affinité ${aff(l.affinite).icone} ${aff(l.affinite).nom}${c.affinite === l.affinite ? ' · 🌟 bonus' : ''}</span></span></button>`).join('')}
        ${A.LIEUX.length > lieux.length ? `<p class="small">🔒 D'autres lieux s'ouvriront quand tu les auras atteints dans le Chant.</p>` : ''}
        <button class="principal" id="expePartir" style="width:100%">Partir en expédition</button>`);
      $('lexiqueCorps').querySelectorAll('[data-c]').forEach(b => b.onclick = () => { choixC = b.dataset.c; rendre(); });
      $('lexiqueCorps').querySelectorAll('[data-l]').forEach(b => b.onclick = () => { choixL = b.dataset.l; rendre(); });
      $('expePartir').onclick = () => { if (A.partirExpedition(profil, d, choixC, choixL)) { SON.jouer('action'); sauver(); ouvrirExpedition(); rafraichirAgora(); } };
    };
    rendre();
  }

  // ----- Arène -----
  async function ouvrirArene() {
    const d = aujourdhui(), ar = profil.activites.arene, l = A.ligue(ar.trophees);
    const entete = `${introAct('arene')}<div class="bourse"><span>${l.emoji} ${l.nom}</span><span><b>${ar.trophees}</b> 🏆</span></div>`;
    const journalHtml = (ar.journal || []).length ? '<div class="sousTitre">Derniers duels</div>' + ar.journal.slice(0, 5).map(j => `<div class="small">${j.victoire ? '✅' : '❌'} ${quandLe(j.date)} contre l'ombre de ${j.adversaire}</div>`).join('') : '';
    if (A.areneFaite(profil, d)) return ouvrirModale('🏟️ L\'Arène des ombres', entete + '<p>Tu as déjà combattu aujourd\'hui. Reviens demain !</p>' + journalHtml);
    ouvrirModale('🏟️ L\'Arène des ombres', entete + '<p class="small">Recherche des ombres...</p>');
    const autres = (await autresJoueurs()).filter(j => j.fiche);
    const adv = autres.map(j => ({ nom: j.nom, fiche: j.fiche, niveau: j.niveau, trophees: j.trophees || 0 }));
    if (!adv.length) adv.push({ nom: profil.pseudo || 'toi', fiche: profil, niveau: profil.niveau, trophees: ar.trophees, soi: true });
    ouvrirModale('🏟️ L\'Arène des ombres', entete + '<div class="sousTitre">Choisis ton adversaire</div>' + adv.map((x, k) => {
      const eq = A.equipeOmbre(x.fiche);
      return `<button class="lieu" data-k="${k}"><span class="ico">${eq.map(u => u.emoji).join('')}</span><span><b>${x.soi ? 'Ta propre ombre' : 'L\'ombre de ' + x.nom}</b><span class="small">niveau ${x.niveau} · ${A.ligue(x.trophees).emoji} ${x.trophees} trophées${x.fiche.activites && x.fiche.activites.talisman ? ' · ' + A.talisman(x.fiche.activites.talisman).emoji : ''}</span></span></button>`;
    }).join('') + (autres.length ? '' : '<p class="small">Quand un autre tisserand partagera ta sauvegarde commune, tu affronteras son ombre.</p>') + journalHtml);
    $('lexiqueCorps').querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const x = adv[+b.dataset.k]; $('modale').classList.remove('visible');
      lancerActivite('arene', { titre: 'Arène · ombre de ' + (x.soi ? 'toi-même' : x.nom), adversaire: x.soi ? 'toi-même' : x.nom, ennemis: A.equipeOmbre(x.fiche, x.soi ? 'ombre' : x.nom) });
    });
  }

  // ----- Titan -----
  async function ouvrirTitan() {
    const d = aujourdhui(), T = A.titanDeLaSemaine(d);
    const rendre = autres => {
      const t = A.totalTitan(profil, d, autres), pct = Math.min(100, Math.round(100 * t.total / t.objectif)), et = A.etatTitan(profil, d);
      const fin = new Date(A.semaine(d) + 'T12:00:00'); fin.setDate(fin.getDate() + 6);
      const html = `${introAct('titan')}<div class="ficheEp ${pct >= 100 ? 'gagne' : ''}"><div class="ficheMotif">${T.emoji}</div><div><b>${T.nom}</b><div class="small">${T.desc}</div><div class="small">Jusqu'au dimanche ${fin.getDate()}/${fin.getMonth() + 1}</div></div></div>
        <div class="sousTitre">Dégâts de la semaine : ${t.total} / ${t.objectif}</div><div class="barreTitan"><i style="width:${pct}%"></i>${A.PALIERS.map(p => `<span style="left:${p.pct}%"></span>`).join('')}</div>
        <div class="small">Toi : ${et.degats}${t.contributions.map(c => ' · ' + c.nom + ' : ' + c.degats).join('')}</div>
        <div class="sousTitre">Récompenses</div>` + A.PALIERS.map(p => { const atteint = t.total >= t.objectif * p.pct / 100, pris = et.paliers.includes(p.pct);
          return `<div class="palier ${pris ? 'fait' : atteint ? 'prochain' : ''}"><span class="ic">${pris ? '✅' : atteint ? '🎁' : '🔒'}</span><span>${p.pct} % : ${p.libelle}</span>${atteint && !pris ? `<button data-p="${p.pct}">Réclamer</button>` : ''}</div>`; }).join('') +
        (A.titanFait(profil, d) ? '<p>✅ Ton assaut du jour est fait. Reviens demain !</p>' : `<button class="principal" id="titanGo" style="width:100%">Lancer l'assaut (${A.ACTIONS_TITAN} actions)</button>`);
      ouvrirModale('🗿 Le Titan de la semaine', html);
      $('lexiqueCorps').querySelectorAll('[data-p]').forEach(b => b.onclick = () => { if (A.reclamerPalier(profil, d, +b.dataset.p)) { SON.jouer('amphore'); sauver(); rendre(autres); rafraichirAgora(); } });
      if ($('titanGo')) $('titanGo').onclick = () => { $('modale').classList.remove('visible');
        lancerActivite('titan', { titre: 'Titan · ' + T.nom, ennemis: [A.uniteTitan(d, profil.niveau, t.objectif - t.total, t.objectif)] }); };
    };
    rendre([]);
    const autres = await autresJoueurs();
    if ($('modale').classList.contains('visible') && $('titreModale').textContent.includes('Titan')) rendre(autres);
  }

  // ----- Combat d'activité (Arène, Titan) -----
  function lancerActivite(mode, o) {
    const allies = A.equipeHorsChant(profil);
    partie = { mode, lies: [], echo: true, jour: profil.joursJoues, adversaire: o.adversaire,
      ep: { titre: o.titre, rencontres: [{ nom: o.titre, ennemis: o.ennemis.map(e => e.id) }], gloire: false, equipe: {}, choix: null },
      rencontre: 0, reprise: null, gloire: 0, graine: Math.floor(Math.random() * 1e9), affUsage: {}, coupMax: null, kos: 0, vaincus: 0,
      totalEnnemis: o.ennemis.length, dernierEnnemi: null, pvAff: {}, allies, ennemis: o.ennemis, actions: 0 };
    $('mode').textContent = mode === 'arene' ? 'Arène' : 'Titan';
    presenterEnnemis();
  }
  function terminerActivite() {
    const etat = partie.etat, d = aujourdhui();
    let titre, resume, parole, gains;
    if (partie.mode === 'arene') {
      const v = etat.fini === 'victoire';
      gains = A.resultatArene(profil, d, partie.adversaire, v);
      titre = v ? 'Victoire dans l\'Arène' : 'L\'ombre l\'emporte';
      resume = (v ? 'Tu as vaincu l\'ombre de ' : 'L\'ombre de ' + partie.adversaire + ' t\'a vaincu. ') + (v ? partie.adversaire + '. ' : '') + 'Trophées : ' + (gains.trophees > 0 ? '+' : '') + gains.trophees + ' (total ' + profil.activites.arene.trophees + ', ' + A.ligue(profil.activites.arene.trophees).nom + ').';
      parole = v ? 'Une ombre n\'est qu\'un souvenir. Toi, tu avances.' : 'Même les ombres apprennent. Demain, tu l\'auras.';
    } else {
      const t = etat.unites.find(u => u.titan), degats = Math.max(0, (t.pvDepart || t.pvMax) - t.pv);
      A.enregistrerTitan(profil, d, degats);
      gains = { drachmes: 10 + Math.round(degats / 50), materiaux: t.pv <= 0 ? { perle: 1 } : {} };
      profil.drachmes += gains.drachmes; A.ajouterMateriaux(profil, gains.materiaux);
      titre = t.pv <= 0 ? 'Le Titan est tombé !' : 'Assaut terminé';
      resume = 'Tu as infligé ' + degats + ' dégâts à ' + t.nom + '.' + (etat.fini === 'defaite' ? ' Ton équipe a dû se replier.' : '');
      parole = t.pv <= 0 ? 'Les tisserands unis ont fait plier un Titan.' : 'Chaque coup compte : vos dégâts s\'additionnent jusqu\'à dimanche.';
    }
    sauver(); cacheAutres = null;
    ecran('fin');
    document.querySelector('#fin .tapis').style.display = 'none';
    $('finTitre').textContent = titre;
    $('finEtoiles').textContent = partie.mode === 'arene' ? (etat.fini === 'victoire' ? '🏆' : '✕') : A.titanDeLaSemaine(d).emoji;
    $('finGains').innerHTML = `<div class="bourse"><span>${resume}</span></div><div class="bourse"><span>🪙 +${gains.drachmes} drachmes</span>${matHtml(gains.materiaux || {}, true)}</div>`;
    $('finQui').textContent = 'Clotho :'; $('finClotho').textContent = parole;
    $('btnRetour').disabled = false;
    SON.jouer(etat.fini === 'victoire' || partie.mode === 'titan' ? 'victoire' : 'defaite');
  }

  // ----- Annonce des nouveautés (une fois, à partir du 19 novembre 2026) -----
  function annoncerNouveautes() {
    if (profil.vus.agora1 || aujourdhui() < '2026-11-19' || profil.joursJoues < 1) return;
    profil.vus.agora1 = true; sauver();
    ouvrirModale('🏛️ Nouveau : l\'Agora', `<p>L'onglet <b>Trésors</b> devient l'<b>Agora</b> 🏛️ : en plus de l'épreuve du jour, cinq activités t'y attendent, à découvrir une par une.</p>` +
      ['oracle', 'arene', 'forge', 'expedition', 'titan'].map(id => `<div class="talisman"><div class="ico">${A.NOMS[id].emoji}</div><div class="txt"><b>${A.NOMS[id].nom}</b>
        <div class="small">${{ oracle: 'Une énigme mythologique par jour.', arene: 'Affronte l\'ombre d\'un autre tisserand.', forge: 'Forge des talismans qui renforcent ton équipe.', expedition: 'Envoie une créature explorer, elle revient le lendemain.', titan: 'Un Titan par semaine, à vaincre tous ensemble.' }[id]}</div>
        <div class="small">${A.debloquee(profil, id) ? '✅ Déjà ouvert' : '🔒 Après le jour ' + A.DEBLOCAGE[id]}</div></div></div>`).join('') +
      '<button class="principal" id="voirAgora" style="width:100%">Aller à l\'Agora</button>');
    $('voirAgora').onclick = () => { $('modale').classList.remove('visible'); ouvrirTresors(); };
  }

  // ======================================================================
  // ---------- Le Corbeau d'Hermès : messagerie entre joueurs ----------
  // ======================================================================
  const PRESAGES = ['Bien joué ! 👏', 'Tu as trouvé l\'énigme ? 🔮', 'On tape le Titan ? 🗿', 'Je t\'attends dans l\'Arène ⚔️', 'Bonne nuit 🌙', 'Courage pour l\'épreuve ! 🔥'];
  const REACTIONS = ['👏', '⚔️', '🔥', '😮'];
  let corbeau = { liste: [], ok: null, minuterie: null };
  try { corbeau.liste = JSON.parse(localStorage.getItem('fdm_msgs') || '[]'); } catch (e) { corbeau.liste = []; }
  const moiCorbeau = () => (S.conf() && S.conf().joueur) || '';
  const luCorbeau = () => +(localStorage.getItem('fdm_lu') || 0);
  function majPastilleCorbeau() {
    if (!$('btnCorbeau')) return;
    $('btnCorbeau').hidden = !S.conf();
    const n = corbeau.liste.filter(m => m.de !== moiCorbeau() && m.t > luCorbeau() && m.type !== 'reaction').length;
    $('pastilleCorbeau').textContent = n ? (n > 9 ? '9+' : n) : '';
    $('pastilleCorbeau').style.display = n ? '' : 'none';
  }
  async function relever() {
    if (!S.conf()) { majPastilleCorbeau(); return false; }
    const derniers = corbeau.liste.length ? corbeau.liste[corbeau.liste.length - 1].t : 0;
    const neufs = await S.messages(derniers);
    if (neufs === null) { corbeau.ok = corbeau.ok === null ? false : corbeau.ok; majPastilleCorbeau(); return false; }
    corbeau.ok = true;
    const ids = new Set(corbeau.liste.map(m => m.id));
    neufs.forEach(m => { if (!ids.has(m.id)) corbeau.liste.push(m); });
    corbeau.liste = corbeau.liste.slice(-200);
    try { localStorage.setItem('fdm_msgs', JSON.stringify(corbeau.liste)); } catch (e) { /* plein */ }
    majPastilleCorbeau();
    return neufs.length > 0;
  }
  const echapper = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function heure(t) { const d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function jourDe(t) { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function filCorbeau() {
    const moi = moiCorbeau(), reactions = {};
    corbeau.liste.filter(m => m.type === 'reaction').forEach(r => { (reactions[r.cible] = reactions[r.cible] || []).push(r); });
    let jourCourant = '', h = '';
    corbeau.liste.filter(m => m.type !== 'reaction').forEach(m => {
      const j = jourDe(m.t);
      if (j !== jourCourant) { jourCourant = j; h += `<div class="jourMsg">${quandLe(j)}</div>`; }
      const reac = (reactions[m.id] || []).map(r => `<span title="${echapper(r.nom)}">${echapper(r.texte)}</span>`).join('');
      if (m.type === 'annonce') {
        h += `<div class="annonceMsg"><div>🧵 <b>${echapper(m.nom)}</b> ${echapper(m.texte)}</div><div class="small">${heure(m.t)}</div>
          <div class="reacs">${reac}${m.de !== moi ? REACTIONS.map(e => `<button class="reagir" data-cible="${m.id}" data-e="${e}">${e}</button>`).join('') : ''}</div></div>`;
      } else {
        const mien = m.de === moi;
        h += `<div class="bulle ${mien ? 'mienne' : ''}">${mien ? '' : `<div class="auteur">${echapper(m.nom)}</div>`}<div>${echapper(m.texte)}</div>
          <div class="meta">${heure(m.t)}${reac ? ' · ' + reac : ''}${mien ? '' : ` <button class="reagir mini" data-cible="${m.id}" data-e="👏">👏</button>`}</div></div>`;
      }
    });
    return h || '<p class="small" style="text-align:center">Aucun message pour l\'instant. Le corbeau attend ton premier mot !</p>';
  }
  function ouvrirCorbeau() {
    ouvrirModale('🐦‍⬛ Le Corbeau d\'Hermès', `<div id="filMsgs" class="filMsgs">${filCorbeau()}</div>
      <div class="presages">${PRESAGES.map(p => `<button data-p="${echapper(p)}">${p}</button>`).join('')}</div>
      <div class="saisieMsg"><textarea id="texteMsg" rows="2" maxlength="500" placeholder="Écris à l'autre tisserand..."></textarea><button id="envoyerMsg" class="principal">Envoyer</button></div>
      <p class="small" id="etatMsg">${corbeau.ok === false ? '⚠️ Le script de sauvegarde doit être mis à jour (version 9) pour la messagerie.' : ''}</p>`);
    const fil = $('filMsgs');
    const rafraichir = () => { const bas = fil.scrollHeight - fil.scrollTop - fil.clientHeight < 40; fil.innerHTML = filCorbeau(); brancher(); if (bas) fil.scrollTop = fil.scrollHeight;
      if (corbeau.liste.length) localStorage.setItem('fdm_lu', String(Math.max(luCorbeau(), corbeau.liste[corbeau.liste.length - 1].t))); majPastilleCorbeau(); };
    const envoyer = async (msg) => {
      $('etatMsg').textContent = '🐦‍⬛ Le corbeau s\'envole...';
      const m = await S.poster(msg);
      if (!m) { $('etatMsg').textContent = '⚠️ Message non envoyé (réseau, ou script à mettre à jour en version 9).'; return false; }
      $('etatMsg').textContent = ''; SON.jouer('clic');
      await relever(); if (!corbeau.liste.some(x => x.id === m.id)) corbeau.liste.push(m);
      rafraichir(); fil.scrollTop = fil.scrollHeight; return true;
    };
    function brancher() {
      fil.querySelectorAll('.reagir').forEach(b => b.onclick = () => envoyer({ reaction: b.dataset.e, cible: b.dataset.cible }));
    }
    $('lexiqueCorps').querySelectorAll('.presages button').forEach(b => b.onclick = () => envoyer({ texte: b.dataset.p }));
    $('envoyerMsg').onclick = async () => { const t = $('texteMsg').value.trim(); if (!t) return; if (await envoyer({ texte: t })) $('texteMsg').value = ''; };
    brancher(); fil.scrollTop = fil.scrollHeight; rafraichir();
    relever().then(() => { if ($('filMsgs')) rafraichir(); if (corbeau.ok === false && $('etatMsg')) $('etatMsg').textContent = '⚠️ Le script de sauvegarde doit être mis à jour (version 9) pour la messagerie.'; });
    clearInterval(corbeau.minuterie);
    corbeau.minuterie = setInterval(async () => {
      if (!$('modale').classList.contains('visible') || !$('filMsgs')) { clearInterval(corbeau.minuterie); return; }
      if (await relever()) rafraichir();
    }, 10000);
  }
  if ($('btnCorbeau')) $('btnCorbeau').onclick = () => { SON.jouer('page'); ouvrirCorbeau(); };
  setInterval(() => { if (document.visibilityState === 'visible' && !partie) relever(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') relever(); });

  // ---------- Onglet Trésors ----------
  function ouvrirTresors() {
    ecran('tresors');
    $('agora').innerHTML = agoraHtml(); brancherAgora($('agora'));
    afficherOffrande();
    const ch = P.choixEnAttente(profil);
    $('choixAttente').style.display = ch ? 'flex' : 'none';
    if (ch) $('choixAttente').innerHTML = `<div class="amph">✨</div><div class="txt"><b>Un choix t'attend</b><span>${ch.type === 'voie' ? 'Choisis la Voie de l\'Errant' : ch.type === 'voie2' ? 'Choisis une Voie secondaire' : 'Prête un Serment (niveau ' + ch.niveau + ')'}</span></div><div class="ouvrir">Choisir</div>`;
    $('filsTresors').textContent = profil.filsReserve ? '🧵 Fils de réserve : ' + profil.filsReserve : '';
    // Route de la Tapisserie : tous les paliers du Chant
    const LIB = { carte: ['🆕', 'Une carte inédite'], fil: ['🧵', 'Un Fil de réserve'], amphore: ['🏆', 'Une amphore dorée'] };
    const n = profil.rangs.filter(r => !r.echo).length, pal = P.prochainPalier(profil);
    $('routeTresors').innerHTML = '<h3>Route de la Tapisserie</h3>' + (profil.joursJoues < 1 ? '<div class="info">Ta première épreuve tissera le premier rang.</div>' : '') +
      Object.keys(P.ROUTE).map(Number).sort((x, y) => x - y).map(r => { const t = LIB[P.ROUTE[r].type || P.ROUTE[r]] || ['🎁', 'Une récompense'];
        const etat = profil.route && profil.route[r] ? 'fait' : pal && pal.rang === r ? 'prochain' : '';
        return `<div class="palier ${etat}"><span class="ic">${etat === 'fait' ? '✅' : t[0]}</span><span>${t[1]}</span><span class="rang">rang ${r}${etat === 'prochain' ? ' · encore ' + (r - n) : ''}</span></div>`; }).join('');
  }

  // ---------- Onglet Tapisserie (et Chronique) ----------
  function ouvrirTapisserie() {
    ecran('tapisserie');
    const r = T.dessiner($('tapisAccueil'), profil.rangs);
    $('tapisCompte').textContent = r.tisses + ' / 30 rangs';
    $('tapisLegende').textContent = !r.tisses ? 'Ta tapisserie est vierge. Chaque épreuve y tisse un rang, de bas en haut.'
      : r.splendide ? '✨ Aucun accroc : ta tapisserie est splendide. Touche un rang pour revoir ta journée.' : 'Touche un rang pour revoir ta journée. Chaque victoire parfaite la rend plus belle.';
  }
  $('btnChroniqueModale').onclick = () => { $('titreModale').textContent = '📜 Chronique du Chant I'; $('onglets').innerHTML = ''; $('lexiqueCorps').innerHTML = chroniqueHtml(); $('modale').classList.add('visible'); };
  $('tapisAccueil').onclick = e => {
    const t = T.rangTouche($('tapisAccueil'), profil.rangs, e);
    if (!t) return;
    const r = t.rang, j = C.JOURS[t.jour], ch = j && j.choix, opt = ch && ch.options.find(o => o.id === profil.histoire.choix['j' + t.jour]);
    $('titreModale').textContent = 'Jour ' + t.jour + (r ? ' · ' + r.titre : '');
    $('onglets').innerHTML = '';
    $('lexiqueCorps').innerHTML = !r ? `<div class="ligne">Ce rang n'est pas encore tissé.${t.jour > profil.joursJoues + 1 ? ' Il le sera dans ' + (t.jour - profil.joursJoues - 1) + ' jour(s).' : ' C\'est celui de ton épreuve du jour.'}</div>`
      : `<div class="ligne" style="font-size:22px">${r.victoire ? '★'.repeat(r.etoiles) + '☆'.repeat(3 - r.etoiles) + ' Victoire' : '✕ Défaite : ce rang est abîmé'}</div>
        ${r.recit ? `<div class="ligne"><i>${r.recit}</i></div>` : ''}<div class="ligne">${r.resume}</div>${opt ? `<div class="ligne">🔀 Ton choix : ${opt.texte}.</div>` : ''}`;
    $('modale').classList.add('visible');
  };
  // Les Réglages s'ouvrent aussi en pleine partie (histoire, combat) : « Retour » ramène à l'écran quitté
  let ecranAvantReglages = null;
  $('btnReglages').onclick = () => {
    if ($('reglages').classList.contains('actif')) return;
    ecranAvantReglages = partie ? (document.querySelector('.ecran.actif') || {}).id : null;
    document.querySelector('.outilsTest').style.display = partie ? 'none' : '';
    $('btnInviter').closest('.carteReglage').style.display = partie ? 'none' : '';
    const r = SON.reglages(); $('reglageSfx').checked = r.sfx !== false; $('reglageAmb').checked = r.amb !== false;
    $('reglagePseudo').value = profil.pseudo || '';
    $('reglageVoix').checked = VOIX.actif(); $('reglageVoix').disabled = !VOIX.disponible();
    const c = S.conf(); $('joueurActuel').textContent = c && c.joueur ? 'Partie de ' + c.joueur.charAt(0).toUpperCase() + c.joueur.slice(1) : '';
    ecran('reglages');
  };
  $('reglagePseudo').onchange = e => { profil.pseudo = e.target.value.trim().slice(0, 20); sauver(); };
  $('reglageSfx').onchange = e => SON.regler('sfx', e.target.checked);
  $('reglageAmb').onchange = e => SON.regler('amb', e.target.checked);
  $('reglageVoix').onchange = e => { VOIX.regler(e.target.checked); if (e.target.checked) VOIX.dire('clotho', 'Je te lirai les paroles de l\'histoire.'); };

  // ---------- Inviter un joueur : une partie séparée, sauvegardée dans le même script Google ----------
  const motsCle = ['olivier', 'lyre', 'amphore', 'trident', 'laurier', 'chouette', 'egide', 'nectar', 'meandre', 'colonne', 'griffon', 'sirene', 'cyprès', 'fuseau', 'navette', 'oracle'];
  const nouvelleCle = () => [0, 1].map(() => motsCle[Math.floor(Math.random() * motsCle.length)].normalize('NFD').replace(/[\u0300-\u036f]/g, '')).join('-') + '-' + (10 + Math.floor(Math.random() * 90));
  $('btnInviter').onclick = () => {
    const c = S.conf();
    $('titreModale').textContent = '👥 Inviter un joueur'; $('onglets').innerHTML = '';
    if (!c || c.joueur) {
      $('lexiqueCorps').innerHTML = '<p>Pour inviter quelqu\'un, la sauvegarde commune doit d\'abord être configurée sur cet appareil avec ton propre script (Réglages, Sauvegarde, Configurer).</p>';
      return $('modale').classList.add('visible');
    }
    $('lexiqueCorps').innerHTML = `<p class="small">Ton invité aura <b>sa propre partie</b>, sauvegardée dans ton script Google mais dans un fichier séparé. Vous jouez chacun à votre rythme, les jours que vous voulez.</p>
      <label class="small">Prénom de l'invité (lettres et chiffres, sans espace)</label><input id="invPrenom" placeholder="julie" maxlength="20">
      <button id="invOk" style="width:100%;margin-top:8px">Préparer l'invitation</button><div id="invEtapes"></div>`;
    $('modale').classList.add('visible');
    $('invOk').onclick = () => {
      const prenom = $('invPrenom').value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      if (!prenom) return;
      const cle = nouvelleCle();
      const jeton = btoa(unescape(encodeURIComponent(JSON.stringify({ u: c.url, j: prenom, c: cle })))).replace(/=+$/, '');
      const lien = location.origin + location.pathname + '#rejoindre=' + jeton;
      $('invEtapes').innerHTML = `<p><b>1.</b> Dans ton script Google : <i>Paramètres du projet</i>, <i>Propriétés du script</i>, <i>Ajouter</i> :<br>nom <b>CLE_${prenom.toUpperCase()}</b>, valeur <b>${cle}</b></p>
        <p class="small">(La toute première fois seulement : remplace aussi le code du script par la dernière version de <i>sauvegarde/Code.gs</i>, puis <i>Déployer</i>, <i>Gérer les déploiements</i>, modifier, <i>Nouvelle version</i>.)</p>
        <p><b>2.</b> Envoie ce lien à ${prenom.charAt(0).toUpperCase() + prenom.slice(1)}. Il lui suffit de l'ouvrir sur chacun de ses appareils :</p>
        <div class="lienInvit">${lien}</div>
        <button id="invPartager" style="width:100%;margin-top:6px">📤 Partager le lien</button>
        <p class="small">Ce lien donne accès à sa partie seulement, jamais à la tienne.</p>`;
      $('invPartager').onclick = async () => {
        try { if (navigator.share) await navigator.share({ title: 'Le Fil des Moires', text: 'Rejoins Le Fil des Moires avec ta propre partie :', url: lien }); else { await navigator.clipboard.writeText(lien); $('invPartager').textContent = '✅ Lien copié'; } } catch (e) { /* partage annulé */ }
      };
    };
  };

  // Ouverture d'un lien d'invitation (#rejoindre=...) : configure la sauvegarde de l'invité sur cet appareil
  function rejoindre() {
    const m = location.hash.match(/rejoindre=([A-Za-z0-9+/=_-]+)/);
    if (!m) return false;
    history.replaceState(null, '', location.pathname);
    let inv; try { inv = JSON.parse(decodeURIComponent(escape(atob(m[1])))); } catch (e) { return false; }
    if (!inv || !inv.u || !inv.j || !inv.c) return false;
    const actuel = S.conf();
    if (actuel && actuel.joueur === inv.j && actuel.url === inv.u) return false; // déjà configuré
    const Prenom = inv.j.charAt(0).toUpperCase() + inv.j.slice(1);
    $('titreModale').textContent = '🧵 Bienvenue, ' + Prenom; $('onglets').innerHTML = '';
    const remplace = profil.joursJoues > 0 && !(actuel && actuel.joueur === inv.j);
    $('lexiqueCorps').innerHTML = `<p>Tu rejoins <b>Le Fil des Moires</b> avec ta propre partie. Elle sera sauvegardée en ligne : ouvre le même lien sur ton téléphone et ton ordinateur pour retrouver ta progression partout.</p>
      ${remplace ? '<p class="small">⚠️ Une autre partie est enregistrée sur cet appareil : elle sera remplacée par la tienne.</p>' : ''}
      <button class="principal" id="rejOk" style="width:100%">Commencer ma partie</button><p class="small" id="rejMsg"></p>`;
    $('modale').classList.add('visible');
    $('rejOk').onclick = async () => {
      $('rejMsg').textContent = 'Connexion à la sauvegarde...';
      const r = await S.tester(inv.u, inv.c, inv.j);
      if (r !== 'ok') { $('rejMsg').textContent = ({
        ancien: '❌ Le script de sauvegarde n\'est pas à jour : la personne qui t\'a invité doit y coller le dernier Code.gs puis, dans Gérer les déploiements, modifier le déploiement existant en « Nouvelle version ».',
        joueur: '❌ Le script ne connaît pas encore « CLE_' + inv.j.toUpperCase() + ' » : la personne qui t\'a invité doit l\'ajouter dans les Propriétés du script.',
        cle: '❌ La clé « CLE_' + inv.j.toUpperCase() + ' » du script ne correspond pas à « ' + inv.c + ' » : vérifie la valeur dans les Propriétés du script.' })[r] || '❌ Pas de connexion : réessaie dans un moment.'; return; }
      S.configurer({ url: inv.u, cle: inv.c, joueur: inv.j });
      if (remplace || (actuel && actuel.joueur !== inv.j)) { profil = migrer(profilVide()); stock.ecrire('profil', profil); }
      if (!profil.pseudo) profil.pseudo = Prenom;
      $('modale').classList.remove('visible');
      await synchroniser(); accueil();
    };
    return true;
  }
  $('versionJeu').textContent = 'Version 1.20.0 · illustrations Fluent Emoji (MIT)';
  $('reglagesOk').onclick = () => { if (partie && ecranAvantReglages) ecran(ecranAvantReglages); else accueil(); };
  $('reglageClotho').onchange = e => { profil.clotho = e.target.value; sauver(); };

  function demarrer(echo) {
    const jour = echo ? Math.max(1, profil.joursJoues) : profil.joursJoues + 1;
    const ep = E.epreuve(jour, aujourdhui(), profil.histoire);
    const graine = echo ? Math.floor(Math.random() * 1e9) : M.graineDuJour(aujourdhui() + '|' + jour);
    const totalEnnemis = ep.rencontres.reduce((n, r) => n + r.ennemis.length, 0);
    partie = { lies: [], echo, jour, ep, rencontre: 0, reprise: null, gloire: ep.gloire ? Math.min(100, P.gloireDepart(profil) + (ep.gloireBonus || 0)) : 0, graine, affUsage: {}, coupMax: null, kos: 0, vaincus: 0, totalEnnemis, dernierEnnemi: null, pvAff: {} };
    $('mode').textContent = echo ? 'Écho' : 'Jour ' + jour;
    majAmbChapitre(ep);
    if (jour === 4 && !echo) clotho('discret');
    const suite = () => { if (jour > 3) ouvrirCollection(true); else presenterEnnemis(); };
    const nouveaux = echo ? [] : Object.keys(ep.equipe).filter(id => !profil.compagnons.includes(id));
    const enchainer = () => { const id = nouveaux.shift(); if (id) presenterCompagnon(id, enchainer); else suite(); };
    if (!echo && ep.scene && ep.scene.length) montrerScene(ep, () => ensuite(enchainer, 0));
    else ensuite(enchainer, 0);
  }

  // ---------- Récit : scènes, choix, Chronique ----------
  function nomChapitre(ep) {
    if (ep.chapitre) return 'Chant ' + ep.chant + ' · Chapitre ' + ep.chapitre.num + ' : ' + ep.chapitre.titre;
    return ep.interlude ? 'Entre deux Chants' : '';
  }
  function repliqueHtml(l) {
    const p = C.PERSOS[l[0]] || C.PERSOS.narrateur;
    const classe = l[0] === 'narrateur' ? 'recit' : l[0] === 'kelos' ? 'muet' : '';
    return `<div class="replique ${classe}"><div class="por">${p.emoji}</div><div class="bul">${p.nom && !classe ? '<b>' + p.nom + '</b>' : ''}${l[1]}</div></div>`;
  }
  // Affiche les répliques une à une. Le bouton révèle tout d'un coup, puis continue.
  function montrerScene(ep, suite) {
    $('sceneChap').textContent = nomChapitre(ep);
    $('sceneTitre').textContent = 'Jour ' + ep.jour + ' · ' + ep.titre.replace(/^Le Prologue : /, '');
    $('sceneLignes').innerHTML = ep.scene.map(repliqueHtml).join('');
    $('sceneChoix').innerHTML = '';
    const lignes = [...$('sceneLignes').children];
    let i = 0, minuteur = null, coupe = false;
    const fin = () => { $('sceneOk').textContent = 'Au combat !'; };
    // Avec les voix : chaque réplique s'affiche puis est lue, la suivante attend la fin de la lecture
    const suivante = () => {
      if (coupe || i >= lignes.length) return;
      const k = i++; lignes[k].classList.add('vue');
      const apres = () => { if (i === lignes.length) fin(); else minuteur = setTimeout(suivante, T_(VOIX.actif() ? 350 : 1300)); };
      // si la voix échoue ou s'arrête trop tôt, on laisse quand même le temps de lire
      const t0 = Date.now(), lecture = T_(Math.min(1300, 25 * ep.scene[k][1].length));
      if (VOIX.actif()) VOIX.dire(ep.scene[k][0], ep.scene[k][1]).then(() => { if (!coupe) setTimeout(apres, Math.max(0, lecture - (Date.now() - t0))); }); else apres();
    };
    $('sceneOk').textContent = 'Passer'; $('sceneOk').style.display = 'block';
    $('sceneOk').onclick = () => {
      if (i < lignes.length) { coupe = true; VOIX.stop(); clearTimeout(minuteur); while (i < lignes.length) lignes[i++].classList.add('vue'); fin(); return; }
      coupe = true; VOIX.stop(); suite();
    };
    ecran('scene');
    minuteur = setTimeout(suivante, T_(250));
  }
  // Choix de fin d'épreuve : enregistré dans profil.histoire, avec son effet
  function montrerChoix(ep, suite) {
    const ch = ep.choix, cle = 'j' + ep.jour;
    $('sceneChap').textContent = nomChapitre(ep);
    $('sceneTitre').textContent = 'Un choix';
    const f = partie.ep.fin && partie.ep.fin[partie.etat.fini === 'victoire' ? 'victoire' : 'defaite'];
    $('sceneLignes').innerHTML = f ? repliqueHtml(f) : '';
    [...$('sceneLignes').children].forEach(e => e.classList.add('vue'));
    $('sceneChoix').innerHTML = `<div class="question">${ch.question}</div>` + ch.options.map((o, k) => `<button class="option" data-k="${k}">${o.texte}</button>`).join('');
    $('sceneOk').style.display = 'none';
    $('sceneChoix').querySelectorAll('.option').forEach(b => b.onclick = () => {
      const o = ch.options[+b.dataset.k];
      const niveaux = P.appliquerChoix(profil, cle, o);
      // Le « Précédemment » et la Chronique racontent la conséquence du choix
      const rang = profil.rangs.filter(r => !r.echo && r.jour === ep.jour).pop();
      if (rang) rang.recit = o.resultat.replace(/\s*\([^)]*\)/g, '');
      sauver();
      $('sceneChoix').innerHTML = '';
      $('sceneLignes').insertAdjacentHTML('beforeend', repliqueHtml(['narrateur', o.resultat]));
      VOIX.dire('narrateur', o.resultat);
      setTimeout(() => $('sceneLignes').lastElementChild.classList.add('vue'), 30);
      $('sceneOk').textContent = 'Continuer'; $('sceneOk').style.display = 'block';
      $('sceneOk').onclick = () => { VOIX.stop(); if (niveaux) clotho('niveau'); suite(); };
    });
    ecran('scene');
  }
  function chroniqueHtml() {
    const h = profil.histoire;
    const rangs = profil.rangs.filter(r => !r.echo);
    const ligneJour = r => {
      const j = C.JOURS[r.jour], ch = j && j.choix, pris = h.choix['j' + r.jour];
      const opt = ch && ch.options.find(o => o.id === pris);
      return `<div class="chroJour"><div class="t">Jour ${r.jour} · ${r.titre} ${r.victoire ? '★'.repeat(r.etoiles) : '✕'}</div>${r.recit || r.resume}${opt ? `<div class="c">🔀 Ton choix : ${opt.texte}.</div>` : ''}</div>`;
    };
    let html = `<div class="bourse" style="margin-top:8px"><span>📜 Chronique du Chant I</span><span>${h.sceaux.includes('maia') ? '✨ Sceau de Maïa : tenu' : '🌑 Sceau de Maïa : menacé'}</span></div>`;
    C.CHAPITRES.forEach(c => {
      const liste = rangs.filter(r => r.jour >= c.debut && r.jour <= c.fin);
      html += `<div class="chroChap">Chapitre ${c.num} : ${c.titre}</div>` + (liste.length ? liste.map(ligneJour).join('') : '<div class="chroVide">Pas encore tissé.</div>');
    });
    const apres = rangs.filter(r => r.jour > C.DERNIER_JOUR);
    if (apres.length) html += '<div class="chroChap">Après le Chant</div>' + apres.map(ligneJour).join('');
    return html;
  }

  // ---------- Présentation des ennemis ----------
  function ficheEnnemi(e) {
    return `<div class="fiche"><div class="e">${e.emoji}</div><div>
      <h4>${e.nom}${e.gardien ? ' · Gardien' : ''}</h4>
      <span class="tag">${aff(e.affinite).icone} ${aff(e.affinite).nom}</span><span class="tag">❤️ ${e.pvMax} PV</span><span class="tag">💨 vitesse ${e.vitesse}</span>
      <p><i>${e.desc || ''}</i></p>
      <p>✅ <b>Faible contre</b> : ${listeAff(faiblesses(e.affinite))}<br>⛔ <b>Résiste à</b> : ${listeAff(forces(e.affinite))}</p>
      <p class="special">★ ${e.special || ''}</p>
      <p>Attaques : ${e.competences.map(c => aff(c.affinite).icone + ' ' + c.nom).join(', ')}</p>
    </div></div>`;
  }
  function presenterEnnemis() {
    const r = partie.ep.rencontres[partie.rencontre];
    $('introTitre').textContent = r.nom + ' · ce qui t\'attend';
    $('introListe').innerHTML = (partie.mode ? partie.ennemis : P.ennemisPourJoueur(r, profil, partie.jour)).map(ficheEnnemi).join('');
    ecran('intro');
  }
  $('btnCombat').onclick = () => { ecran('combat'); lancerRencontre(); };

  function lienDuJour() {
    const b = P.lienBonus(profil);
    if (partie.ep.lienBonus) D.CREATURES.forEach(c => { b[c.id] = (b[c.id] || 0) + partie.ep.lienBonus; });
    return b;
  }
  function lancerRencontre() {
    const r = partie.ep.rencontres[partie.rencontre];
    const copie = x => JSON.parse(JSON.stringify(x));
    partie.etat = M.creerCombat({ graine: partie.graine + partie.rencontre * 101,
      allies: partie.mode ? copie(partie.allies) : A.appliquerTalisman(P.equipeDuJoueur(partie.ep, profil, partie.jour), profil.activites),
      ennemis: partie.mode ? copie(partie.ennemis) : P.ennemisPourJoueur(r, profil, partie.jour), reprise: partie.reprise, gloire: partie.gloire,
      gloireActive: partie.mode ? false : partie.ep.gloire, secondSouffle: partie.mode ? false : P.secondSouffle(profil), lienBonus: partie.mode ? {} : lienDuJour() });
    if (partie.mode) partie.etat.unites.filter(u => u.camp === 'ennemi').forEach(u => { u.liable = false; });
    else partie.etat.unites.filter(u => u.camp === 'ennemi').forEach(u => { u.liable = P.liable(u.id); P.noterCodex(profil, u.id, 'vu'); });
    partie.pvAff = {};
    $('nomRencontre').textContent = r.nom;
    $('journal').innerHTML = '';
    $('blocGloire').style.display = partie.ep.gloire ? 'flex' : 'none';
    $('btnIndice').style.display = guidage() === 'discrete' ? 'inline-block' : 'none';
    afficher();
    if (partie.rencontre === 0) clotho('debut');
    clotho('intention');
    if (partie.etat.unites.some(u => u.gardien)) clotho('gardien');
    if (partie.ep.gloire) clotho('gloireIntro');
    ensuite(boucle, 400);
  }

  // ---------- Boucle de combat ----------
  let toursJoueur = 0;
  function boucle() {
    const etat = partie.etat;
    if (etat.fini) return finRencontre();
    const d = M.debutTour(etat);
    const duree = animer(d.evenements);
    ensuite(() => {
      afficher(d.acteur);
      if (etat.fini || M.verifierFin(etat)) return ensuite(finRencontre, 500);
      if (d.passe) { if (d.acteur) journal(d.acteur.nom + ' ne peut pas agir.'); return ensuite(boucle, 600); }
      if (M.vivants(etat, 'ennemi').some(e => e.intention && e.intention.grand)) clotho('annonce');
      if (d.acteur.camp === 'ennemi') {
        ensuite(() => {
          const ev = M.tourEnnemi(etat, d.acteur);
          const t = animer(ev);
          setTimeout(() => { afficher(); ensuite(boucle, 300); }, t);
        }, 650);
      } else {
        if (partie.mode === 'titan') {
          if (partie.actions >= A.ACTIONS_TITAN) { etat.fini = 'limite'; return ensuite(finRencontre, 300); }
          partie.actions++; $('nomRencontre').textContent = 'Assaut · action ' + partie.actions + ' / ' + A.ACTIONS_TITAN;
        }
        toursJoueur++;
        SON.jouer('tour');
        if (toursJoueur === 1) clotho('energie');
        if (toursJoueur === 3) clotho('poids');
        if (d.acteur.competences.some(c => c.type === 'garde')) clotho('garde');
        const lier = d.acteur.competences.find(c => c.type === 'lier');
        if (lier) clotho('lierCarte');
        if (lier && M.ciblesPossibles(etat, d.acteur, lier).length) clotho('lier');
        occupe = false;
        montrerActions(d.acteur);
      }
    }, duree);
  }

  function finRencontre() {
    if (partie.mode) return terminerActivite();
    const etat = partie.etat;
    if (etat.fini === 'victoire' && partie.rencontre < partie.ep.rencontres.length - 1) {
      partie.reprise = {};
      etat.unites.filter(u => u.camp === 'allie').forEach(u => {
        const pv = u.ko ? Math.round(u.pvMax * 0.25) : Math.min(u.pvMax, u.pv + Math.round(u.pvMax * D.SOIN_ENTRE));
        partie.reprise[u.id] = { pv, energie: u.energie };
      });
      partie.gloire = etat.gloire;
      partie.rencontre++;
      banniere('Victoire !', 'L\'équipe reprend son souffle', '+30 % PV');
      return ensuite(() => { cacherBanniere(); presenterEnnemis(); }, 1500);
    }
    terminerEpreuve();
  }

  // ---------- Fin d'épreuve et tissage ----------
  function terminerEpreuve() {
    const etat = partie.etat;
    const victoire = etat.fini === 'victoire';
    const etoiles = M.etoiles(etat);
    const couleur = Object.keys(partie.affUsage).sort((a, b) => partie.affUsage[b] - partie.affUsage[a])[0] || 'airain';
    const cible = partie.dernierEnnemi || etat.unites.find(u => u.camp === 'ennemi');
    const morceaux = [];
    morceaux.push(victoire ? 'Victoire sur ' + (etat.unites.find(u => u.gardien) || cible).nom : 'Défaite face à ' + cible.nom);
    if (partie.coupMax) morceaux.push('coup le plus fort : ' + partie.coupMax.nom + ' (' + partie.coupMax.degats + ')');
    morceaux.push(partie.kos ? partie.kos + ' chute' + (partie.kos > 1 ? 's' : '') + ' dans l\'équipe' : 'aucun héros tombé');
    const rang = { jour: partie.jour, date: aujourdhui(), titre: partie.ep.titre.replace(/^Le Prologue : /, ''), victoire, etoiles,
      couleur, motif: (etat.unites.find(u => u.gardien) || cible).emoji, resume: morceaux.join(', ') + '.', echo: partie.echo || undefined };
    // Équipe de l'épreuve, pour la carte de joueur du classement
    rang.equipe = etat.unites.filter(u => u.camp === 'allie').map(u => ({ id: u.id, ko: !!u.ko,
      cartes: (u.competences || []).filter(c => c.type !== 'garde' && c.type !== 'lier' && !c.prouesse).map(c => c.id) }));
    const parole = partie.ep.fin && partie.ep.fin[victoire ? 'victoire' : 'defaite'];
    if (parole) rang.recit = parole[1];
    const rangs = profil.rangs.concat([rang]);
    let g = null, niveaux = 0, butin = {}, dons = null, niveauAvant = profil.niveau;
    if (!partie.echo) {
      // Rattrapage : chaque jour manqué donne droit à une épreuve de plus (2 au maximum en réserve)
      const avant = profil.derniereDate, auj = aujourdhui();
      if (avant === auj) { profil.rattrapage = Math.max(0, (profil.rattrapage || 0) - 1); rang.rattrapage = true; }
      else if (avant) profil.rattrapage = Math.min(2, (profil.rattrapage || 0) + Math.max(0, P.ecartJours(avant, auj) - 1));
      profil.rangs = rangs; profil.joursJoues = partie.jour; profil.derniereDate = auj;
      g = P.gains(victoire, etoiles);
      g = P.bonusDuJour(g, partie.ep);
      if (victoire && partie.ep.final && !profil.histoire.sceaux.includes('maia')) profil.histoire.sceaux.push('maia');
      niveaux = P.ajouterXp(profil, g.xp);
      profil.drachmes += g.drachmes;
      if (victoire) { butin = P.butin(profil, partie.graine + 17, etoiles); dons = P.genererDon(profil, partie.graine + 29); }
      partie.route = P.reclamerRoute(profil, partie.graine + 41);
      partie.liens = partie.lies.map(id => { P.noterCodex(profil, id, 'lie'); return P.lierCreature(profil, id); }).filter(Boolean);
      partie.aPresenter = partie.liens.filter(l => l.nouvelle).map(l => l.id);
      sauver();
    }
    ecran('fin');
    document.querySelector('#fin .tapis').style.display = '';
    $('finTitre').textContent = victoire ? 'Le fil tient' : 'Le fil a cédé';
    $('finEtoiles').textContent = victoire ? '★'.repeat(etoiles) + '☆'.repeat(3 - etoiles) : '✕';
    $('finXp').textContent = partie.echo ? 'Écho : rang non tissé' : '';
    afficherGains(g, niveaux, niveauAvant, butin);
    $('finResume').textContent = rang.resume;
    const pers = parole && (C.PERSOS[parole[0]] || C.PERSOS.narrateur);
    $('finQui').textContent = pers ? (pers.emoji + ' ' + (pers.nom || '')).trim() + ' :' : 'Clotho :';
    $('finClotho').textContent = parole ? parole[1] : D.CLOTHO[victoire ? 'victoire' : 'defaite'];
    if (parole && !partie.echo) setTimeout(() => VOIX.dire(parole[0], parole[1]), T_(1800));
    $('btnRetour').disabled = true;
    SON.jouer(victoire ? 'victoire' : 'defaite');
    setTimeout(() => SON.tissage(T_(2400)), 900);
    T.tisser($('tapisFin'), rangs, T_(2400), () => {
      if (!partie.echo) clotho('tapisserie');
      if (dons) proposerDon(dons); else $('btnRetour').disabled = false;
    });
  }

  // ---------- Cartes : tuiles illustrées et barres de doublons ----------
  function nomCarte(id) { const i = P.carteInfo(id); return i ? aff(i.carte.affinite).icone + ' ' + i.carte.nom : id; }
  // Barre de doublons façon Clash Royale. ajout : doublons qui viennent d'arriver (affichés en surbrillance)
  function barreDoublons(id, ajout) {
    const possede = profil.cartes[id];
    if (!possede) return '';
    const cout = P.coutAmelioration(profil, id);
    if (!cout) return '<div class="barreD max"><i style="width:100%"></i><span>Niveau max</span></div>';
    const total = possede.doublons, avant = Math.max(0, total - (ajout || 0));
    const pAvant = Math.min(100, Math.round(100 * avant / cout.doublons)), pApres = Math.min(100, Math.round(100 * total / cout.doublons));
    const prete = total >= cout.doublons;
    return `<div class="barreD ${prete ? 'prete' : ''}" data-avant="${pAvant}" data-apres="${pApres}"><i class="ajout" style="width:${ajout ? pAvant : pApres}%"></i><i style="width:${ajout ? pAvant : pApres}%"></i><span>${prete ? '⬆ ' : ''}${total} / ${cout.doublons}</span></div>`;
  }
  function animerBarres(racine) {
    setTimeout(() => (racine || document).querySelectorAll('.barreD[data-apres]').forEach(b => {
      b.querySelectorAll('i').forEach(i => { i.style.width = b.dataset.apres + '%'; });
    }), 350);
  }
  // Tuile de carte : illustration sur fond d'affinité, rareté en bordure, coût, niveau, héros, barre de doublons
  function tuileCarte(id, opts) {
    opts = opts || {};
    const info = P.carteInfo(id); const c = P.carteEvoluee(profil, info.carte), h = info.heros;
    const r = P.rarete(id), possede = profil.cartes[id];
    const a = aff(c.affinite);
    if (!possede && !opts.reveler) {
      if (c.voie) { const v = D.VOIES[c.voie]; return `<div class="tuile inconnue" style="--r:${P.COULEURS_RARETE[r]}" data-id="${id}"><div class="art" style="--a:#3a2a1e"><span>${v.icone}</span></div><div class="nom">${c.nom}</div><div class="sous">${v.nom}</div></div>`; }
      return `<div class="tuile inconnue" style="--r:${P.COULEURS_RARETE[r]}" data-id="${id}"><div class="art" style="--a:#3a2a1e"><span>❔</span></div><div class="nom">À découvrir</div><div class="sous">${P.NOMS_RARETE[r]}</div></div>`;
    }
    const niveau = possede ? possede.niveau : 1;
    const equipee = (profil.equipement[h.id] || []).includes(id);
    return `<div class="tuile ${opts.grande ? 'grande' : ''} ${c.evoluee ? 'evoluee' : ''} ${equipee && opts.montrerEquipe ? 'equipee' : ''}" style="--r:${P.COULEURS_RARETE[r]}" data-id="${id}">
      ${c.cout ? `<div class="cout">🔹${c.cout}</div>` : ''}
      <div class="art" style="--a:${a.couleur}"><span>${c.art || a.icone}</span><div class="affb" title="${a.nom}">${a.icone}</div><div class="nv">${c.evoluee ? '✦ ' : ''}Nv ${niveau}</div></div>
      <div class="nom">${c.nom}</div>
      <div class="sous">${h.emoji} ${h.nom}</div>
      ${possede ? barreDoublons(id, opts.ajout) : ''}
      ${equipee && opts.montrerEquipe ? '<div class="coche">✓</div>' : ''}</div>`;
  }
  function nbAmeliorables() { return Object.keys(profil.cartes).filter(id => P.peutAmeliorer(profil, id) || P.peutEvoluer(profil, id)).length; }

  // ---------- Offrande du jour ----------
  function afficherOffrande() {
    const dispo = P.offrandeDisponible(profil, aujourdhui()) && profil.joursJoues >= 1;
    const serie = profil.serie ? profil.serie.jours : 0;
    const prochaine = P.qualiteSerie(dispo ? serie + 1 : serie);
    const q = P.QUALITES[prochaine];
    const fils = profil.filsReserve ? ' · 🧵×' + profil.filsReserve : '';
    $('offrande').className = 'offrande' + (dispo ? ' dispo' : '');
    $('offrande').innerHTML = profil.joursJoues < 1 ? '' : dispo
      ? `<div class="amph">${q.icone}</div><div class="txt"><b>Offrande du jour</b><span>${q.nom} · série ${serie} jour${serie > 1 ? 's' : ''}${fils}</span></div><div class="ouvrir">Ouvrir</div>`
      : `<div class="amph eteinte">🏺</div><div class="txt"><b>Offrande ouverte</b><span>Reviens demain · série ${serie} jour${serie > 1 ? 's' : ''}${fils}</span></div><button class="lien" id="btnTaux">Taux</button>`;
    $('offrande').style.display = profil.joursJoues < 1 ? 'none' : 'flex';
    $('offrande').onclick = e => { if (e.target.id === 'btnTaux') return montrerTaux(); if (dispo) ouvrirAmphore(); };
  }
  function montrerTaux() {
    $('titreModale').textContent = '🏺 Offrande du jour';
    $('onglets').innerHTML = '';
    $('lexiqueCorps').innerHTML = `<p class="small">Une amphore gratuite par jour. Plus ta série est longue, plus elle est belle. Un jour manqué ne remet pas la série à zéro : elle recule d'un palier. Tous les 7 jours, tu gagnes un 🧵 Fil de réserve qui protège ta série d'un jour d'absence (2 au maximum).</p>` +
      Object.keys(P.QUALITES).map(k => { const q = P.QUALITES[k]; const seuil = { argile: '1 à 2 jours', bronze: '3 à 6 jours', argent: '7 à 13 jours', doree: '14 jours et plus' }[k];
        return `<div class="ligne">${q.icone} <b>${q.nom}</b> (série de ${seuil}) : ${q.objets} objets · ${q.drachmes[0]} à ${q.drachmes[1]} 🪙 · doublons de tes cartes équipées · ${Math.round(q.inedite * 100)} % de chance par objet d'une carte inédite</div>`; }).join('');
    $('modale').classList.add('visible');
  }
  function ouvrirAmphore() {
    const r = P.ouvrirOffrande(profil, aujourdhui(), M.graineDuJour(aujourdhui() + '|offrande'));
    if (!r) return;
    sauver();
    const q = P.QUALITES[r.qualite];
    const notes = [r.protege ? '🧵 Ton Fil de réserve a protégé ta série.' : '', r.recul ? 'Un jour manqué : ta série a reculé d\'un palier, sans repartir à zéro.' : '', r.filGagne ? '🧵 7 jours de suite : tu gagnes un Fil de réserve !' : ''].filter(Boolean).join('<br>');
    const ids = {}; r.objets.filter(o => o.type === 'doublons').forEach(o => { ids[o.id] = (ids[o.id] || 0) + o.nombre; });
    const cartes = r.objets.filter(o => o.type === 'carte').map(o => tuileCarte(o.id, { grande: false }).replace('<div class="art"', '<div class="neuf">NOUVELLE</div><div class="art"')).join('');
    const doublons = Object.keys(ids).map(id => tuileCarte(id, { ajout: ids[id] }).replace('</div></div>', `</div><div class="gain">+${ids[id]}</div></div>`)).join('');
    const bourse = r.objets.filter(o => o.type === 'drachmes').reduce((n, o) => n + o.nombre, 0);
    $('donCorps').innerHTML = `<div class="titreDon">${q.nom}</div><div class="amphGrande secoue">${q.icone}</div><div class="consigne">Touche l'amphore pour l'ouvrir</div>`;
    $('donVoile').classList.add('visible');
    document.querySelector('.amphGrande').onclick = () => {
      SON.jouer('amphore');
      $('donCorps').innerHTML = `<div class="titreDon">${q.nom}</div><div class="consigne">Série : ${r.serie} jour${r.serie > 1 ? 's' : ''}</div>
        <div class="bourse" style="justify-content:center"><span>🪙 +${bourse} drachmes</span></div>
        <div class="grille">${cartes}${doublons}</div>${notes ? `<div class="consigne">${notes}</div>` : ''}
        <button class="principal" id="donFin">Continuer</button>`;
      animerBarres($('donCorps'));
      particules(document.querySelector('.donCorps'), '✨', 10);
      $('donFin').onclick = () => { $('donVoile').classList.remove('visible'); ouvrirTresors(); };
    };
  }

  // ---------- Gains de fin d'épreuve ----------
  function afficherGains(g, niveaux, niveauAvant, butin) {
    if (!g) { $('finGains').innerHTML = partie && partie.echo ? '<div class="bourse"><span>Mode Écho : ce rang n\'est pas tissé dans ta Tapisserie (il apparaît en fantôme).</span></div>' : ''; return; }
    const pct = Math.round(100 * profil.xp / P.xpPourNiveau(profil.niveau));
    const ids = Object.keys(butin);
    $('finGains').innerHTML = `<div class="bourse"><span>Niveau <b>${profil.niveau}</b></span><div class="xpbarre"><i id="xpFin" style="width:0%"></i></div><span>+${g.xp} XP</span></div>
      <div class="bourse"><span>🪙 +${g.drachmes} drachmes (total <b>${profil.drachmes}</b>)</span></div>
      ${ids.length ? `<div class="sousTitre">🃏 Butin : des doublons pour tes cartes</div><div class="grille">${ids.map(id => tuileCarte(id, { ajout: butin[id] }).replace('</div></div>', `</div><div class="gain">+${butin[id]}</div></div>`)).join('')}</div>` : ''}
      ${(partie.liens || []).map(l => { const c = D.CREATURES.find(x => x.id === l.id); return `<div class="niveauPlus">🧵 ${c.emoji} ${c.nom} ${l.nouvelle ? 'est liée à toi : nouvelle créature !' : 'déjà liée : son fil se renforce (+1 exemplaire de chaque carte)'}</div>`; }).join('')}
      ${partie.route ? `<div class="niveauPlus">🧵 Route de la Tapisserie, rang ${partie.route.rang} : ${partie.route.type === 'carte' ? 'nouvelle carte ' + nomCarte(partie.route.id) : partie.route.type === 'fil' ? 'un Fil de réserve' : partie.route.type === 'amphore' ? 'une amphore dorée, déjà ouverte pour toi' : '100 drachmes'}</div>` : ''}
      ${niveaux ? `<div class="niveauPlus">✨ Niveau ${niveauAvant} → ${profil.niveau} : +4 % PV et attaque par niveau</div>` : ''}`;
    setTimeout(() => { const x = $('xpFin'); if (x) x.style.width = pct + '%'; }, 100);
    animerBarres($('finGains'));
    if (niveaux) { clotho('niveau'); setTimeout(() => SON.jouer('niveau'), 600); }
  }

  // ---------- Don des Moires (plein écran) ----------
  function proposerDon(options) {
    let choix = null;
    const tuileDon = (o, i) => {
      if (o.type === 'drachmes') return `<div class="optDon" data-i="${i}"><div class="tuile bourseT" style="--r:#e0b04f"><div class="art" style="--a:#a8742a"><span>🪙</span></div><div class="nom">${o.nombre} drachmes</div><div class="sous">Pour toute l'équipe</div></div>
        <div class="txtDon"><b>Une bourse</b>Pour payer les améliorations de tes cartes.</div></div>`;
      const info = P.carteInfo(o.id);
      const qui = `<span class="pour">Pour ${info.heros.emoji} ${info.heros.nom}</span>`;
      if (o.type === 'carte') return `<div class="optDon" data-i="${i}">${tuileCarte(o.id, { reveler: true }).replace('<div class="art"', '<div class="neuf">NOUVELLE</div><div class="art"')}
        <div class="txtDon"><b>Nouvelle carte</b>${qui}${info.carte.desc}</div></div>`;
      const cout = P.coutAmelioration(profil, o.id);
      const apres = profil.cartes[o.id].doublons + o.nombre;
      const fera = cout && apres >= cout.doublons ? '<span class="prete">Assez pour monter de niveau !</span>' : '';
      return `<div class="optDon" data-i="${i}">${tuileCarte(o.id).replace('</div></div>', `</div><div class="gain">+${o.nombre}</div></div>`)}
        <div class="txtDon"><b>+${o.nombre} exemplaires</b>${qui}${info.carte.desc}${fera}</div></div>`;
    };
    $('donCorps').innerHTML = `<div class="titreDon">🎁 Le Don des Moires</div>
      <div class="consigne">Touche <b>une</b> récompense, puis confirme.</div>
      <div class="optionsDon">${options.map(tuileDon).join('')}</div>
      <button class="principal" id="donOk" disabled>Choisis un don</button>
      <button class="lien" id="donPasser">Passer et prendre 25 🪙</button>`;
    $('donVoile').classList.add('visible');
    $('donCorps').querySelectorAll('.optDon').forEach(el => el.onclick = () => {
      $('donCorps').querySelectorAll('.optDon').forEach(x => x.classList.toggle('choisi', x === el));
      choix = +el.dataset.i;
      $('donOk').disabled = false; $('donOk').textContent = 'Prendre ce don';
    });
    const conclure = i => {
      const o = i >= 0 ? options[i] : null;
      P.appliquerDon(profil, o);
      sauver();
      let h = '';
      if (!o) h = '<div class="titreDon">Tu passes : +25 🪙</div>';
      else if (o.type === 'drachmes') h = `<div class="titreDon">+${o.nombre} 🪙</div><div class="consigne">Total : ${profil.drachmes} drachmes.</div>`;
      else if (o.type === 'carte') h = `<div class="titreDon">Nouvelle carte !</div><div class="grille un">${tuileCarte(o.id, { grande: true })}</div><div class="consigne">${(profil.equipement[P.carteInfo(o.id).heros.id] || []).includes(o.id) ? 'Elle est déjà équipée.' : 'Équipe-la depuis la Collection.'}</div>`;
      else {
        const prete = P.peutAmeliorer(profil, o.id) || (P.coutAmelioration(profil, o.id) && profil.cartes[o.id].doublons >= P.coutAmelioration(profil, o.id).doublons);
        h = `<div class="titreDon">+${o.nombre} exemplaires</div><div class="grille un">${tuileCarte(o.id, { grande: true, ajout: o.nombre })}</div><div class="consigne">${prete ? '⬆ Cette carte peut monter de niveau dans la Collection.' : 'La barre se remplit : encore quelques exemplaires pour monter de niveau.'}</div>`;
      }
      $('donCorps').innerHTML = h + '<button class="principal" id="donFin">Continuer</button>';
      animerBarres($('donCorps'));
      $('donFin').onclick = () => { $('donVoile').classList.remove('visible'); $('btnRetour').disabled = false; clotho('collection'); };
    };
    $('donOk').onclick = () => { if (choix != null) conclure(choix); };
    $('donPasser').onclick = () => conclure(-1);
    clotho('don');
  }

  // ---------- Collection et Préparation (grille) ----------
  let modePreparation = false;
  function ouvrirCollection(preparation) {
    modePreparation = !!preparation;
    if (Object.values(profil.cartes).some(c => c.niveau >= P.NIVEAU_MAX_CARTE)) clotho('evolution');
    $('colTitre').textContent = preparation ? '⚔️ Préparation : ta créature et 4 cartes par héros' : '📜 Collection';
    $('drachmesCol').textContent = profil.drachmes;
    $('btnColOk').textContent = 'Partir';
    $('btnColOk').style.display = preparation ? 'block' : 'none';
    if (preparation) {
      const noms = [...new Set(partie.ep.rencontres.flatMap(r => r.ennemis))].map(id => { const e = D.ENNEMIS[id]; return e.emoji + ' ' + e.nom + ' (' + aff(e.affinite).icone + ', faible contre ' + listeAff(faiblesses(e.affinite)) + ')'; });
      $('colMenace').textContent = 'Ce qui t\'attend : ' + noms.join(' · ') + '. Touche une carte pour voir ce qu\'elle fait, puis l\'équiper ou la retirer.';
    } else $('colMenace').textContent = 'Touche une carte pour voir son détail, l\'améliorer ou l\'équiper. ✓ = équipée.';
    const heros = P.herosDisponibles(profil);
    const creaturesDispo = ['griffon'].concat(profil.creatures).filter(id => heros.includes(id));
    if (preparation && creaturesDispo.length > 1) clotho('choixCrea');
    const blocCreature = (preparation && creaturesDispo.length > 1) ? `<h3>🐾 Créature de l'équipe</h3><div class="grille">${creaturesDispo.map(id => { const c = D.HEROS.concat(D.CREATURES).find(x => x.id === id);
      return `<div class="tuile choixCrea ${profil.creature === id ? 'equipee' : ''}" data-crea="${id}" style="--r:${aff(c.affinite).couleur}"><div class="art" style="--a:${aff(c.affinite).couleur}"><span>${c.emoji}</span><div class="affb">${aff(c.affinite).icone}</div></div><div class="nom">${c.nom}</div><div class="sous">${aff(c.affinite).nom}</div>${profil.creature === id ? '<div class="coche">✓</div>' : ''}</div>`; }).join('')}</div>` : '';
    const groupes = D.HEROS.filter(h => heros.includes(h.id)).concat(D.CREATURES.filter(c => profil.creatures.includes(c.id)));
    $('colListe').innerHTML = blocCreature + groupes.map(h => {
      const ids = h.competences.filter(c => c.type !== 'garde').map(c => c.id);
      const eq = profil.equipement[h.id] || [];
      return `<h3>${h.emoji} ${h.nom} <span class="small">${eq.length}/${P.SLOTS} équipées</span></h3><div class="grille">` + ids.map(id => tuileCarte(id, { montrerEquipe: true })).join('') + '</div>';
    }).join('');
    $('colListe').querySelectorAll('.choixCrea').forEach(t => t.onclick = () => { profil.creature = t.dataset.crea; sauver(); ouvrirCollection(true); });
    $('colListe').querySelectorAll('.tuile:not(.choixCrea)').forEach(t => t.onclick = () => {
      const id = t.dataset.id;
      if (!profil.cartes[id]) return;
      ouvrirFiche(id);
    });
    ecran('collection');
  }
  // Fiche détaillée d'une carte
  function ouvrirFiche(id) {
    const info = P.carteInfo(id); const c = P.carteEvoluee(profil, info.carte), h = info.heros;
    const possede = profil.cartes[id], cout = P.coutAmelioration(profil, id);
    const evo = D.EVOLUTIONS[id];
    const a = aff(c.affinite);
    const fort = (M.FORT_CONTRE[c.affinite] || []).map(x => aff(x).icone + ' ' + aff(x).nom).join(', ');
    const p = n => c.puissance ? Math.round(c.puissance * P.multiplicateurCarte(n)) : null;
    const equipee = (profil.equipement[h.id] || []).includes(id);
    $('titreModale').textContent = c.nom;
    $('onglets').innerHTML = '';
    $('lexiqueCorps').innerHTML = `<div class="grille un">${tuileCarte(id, { grande: true })}</div>
      <div class="ligne"><b>${P.NOMS_RARETE[P.rarete(id)]}</b> · carte de ${h.emoji} ${h.nom} · niveau ${possede.niveau}/${P.NIVEAU_MAX_CARTE}</div>
      <div class="ligne">${a.icone} <b>${a.nom}</b>${fort ? ' · fort contre ' + fort : ' · neutre'}</div>
      <div class="ligne">${c.desc}</div>
      <div class="ligne">${c.cout ? '🔹 ' + c.cout + ' Énergie' : 'Gratuite'} · poids ${M.NOM_POIDS[c.poids || 'normal']}${p(possede.niveau) ? ` · Puissance <b>${p(possede.niveau)}</b>${cout ? ' → ' + p(possede.niveau + 1) + ' au niveau suivant' : ''}` : ''}</div>
      ${cout ? `<div class="ligne">Pour le niveau ${possede.niveau + 1} : 🃏 ${possede.doublons}/${cout.doublons} exemplaires et 🪙 ${cout.drachmes} (tu as ${profil.drachmes})</div>` : '<div class="ligne">Niveau maximum atteint.</div>'}
      ${evo && !c.evoluee ? `<div class="ligne evoLigne">✦ <b>Évolution au niveau 5</b> : ${evo.art} ${evo.nom}. ${evo.desc}${possede.niveau >= P.NIVEAU_MAX_CARTE ? ` Coût : 🪙 ${D.COUT_EVOLUTION} (tu as ${profil.drachmes}).` : ''}</div>` : ''}
      ${c.evoluee ? '<div class="ligne evoLigne">✦ <b>Carte évoluée.</b></div>' : ''}
      <div style="display:flex;gap:8px;margin-top:10px">
        ${cout ? `<button class="${P.peutAmeliorer(profil, id) ? 'principal' : ''}" id="ficheAm" style="flex:1" ${P.peutAmeliorer(profil, id) ? '' : 'disabled'}>⬆ Améliorer (🪙${cout.drachmes})</button>` : ''}
        ${!cout && evo && !c.evoluee ? `<button class="${P.peutEvoluer(profil, id) ? 'principal' : ''}" id="ficheEvo" style="flex:1" ${P.peutEvoluer(profil, id) ? '' : 'disabled'}>✦ Faire évoluer (🪙${D.COUT_EVOLUTION})</button>` : ''}
        ${c.prouesse ? '' : `<button id="ficheEq" style="flex:1">${equipee ? 'Retirer' : 'Équiper'}</button>`}
      </div><div class="small" id="ficheMsg"></div>`;
    $('modale').classList.add('visible');
    if ($('ficheAm')) $('ficheAm').onclick = () => { if (P.ameliorer(profil, id)) { sauver(); ouvrirFiche(id); ouvrirCollection(modePreparation); $('modale').classList.add('visible'); rejouer(document.querySelector('#lexiqueCorps .tuile'), 'monte'); SON.jouer('niveau'); } };
    if ($('ficheEvo')) $('ficheEvo').onclick = () => { if (P.evoluer(profil, id)) { sauver(); ouvrirCollection(modePreparation); ouvrirFiche(id); rejouer(document.querySelector('#lexiqueCorps .tuile'), 'evolue'); SON.jouer('evolue'); particules(document.querySelector('#lexiqueCorps .tuile'), '✦', 14); } };
    if ($('ficheEq')) $('ficheEq').onclick = () => { if (!P.basculerEquipement(profil, h.id, id)) { $('ficheMsg').textContent = '4 cartes déjà équipées pour ce héros : retire-en une d\'abord.'; return; } sauver(); ouvrirCollection(modePreparation); ouvrirFiche(id); };
  }

  // ---------- Choix : Voie, Voie secondaire, Serment ----------
  function ouvrirChoix() {
    const ch = P.choixEnAttente(profil);
    if (!ch) return ouvrirTresors();
    let options, titre, intro;
    if (ch.type === 'serment') {
      titre = 'Serment du niveau ' + ch.niveau;
      intro = 'Lachésis te tend deux fils. Tu n\'en garderas qu\'un, pour toujours. Le Serment profite à toute l\'équipe.';
      options = D.SERMENTS[ch.niveau].map(x => ({ id: x.id, icone: x.icone, nom: x.nom, desc: x.desc }));
    } else {
      const sec = ch.type === 'voie2';
      titre = sec ? 'Voie secondaire de l\'Errant' : 'La Voie de l\'Errant';
      intro = sec ? 'Ton fil s\'est épaissi. Choisis une seconde Voie : tu gagnes ses deux cartes (sans son passif).' : 'Ton fil vierge prend une couleur. Choisis la Voie de l\'Errant : elle lui donne un passif et deux cartes exclusives. Ce choix est définitif.';
      options = Object.keys(D.VOIES).filter(v => !sec || v !== profil.voie).map(v => { const x = D.VOIES[v];
        return { id: v, icone: x.icone, nom: x.nom, desc: (sec ? '' : '<span class="passif">Passif : ' + x.passif + '</span>') + '<i>' + x.lore + '</i>', cartes: x.cartes }; });
    }
    let choix = null;
    $('choixCorps').innerHTML = `<div class="titreDon">${titre}</div><div class="consigne">${intro}</div>
      <div class="optionsDon">${options.map((o, i) => `<div class="optDon optChoix" data-i="${i}"><div class="grosIcone">${o.icone}</div><div class="txtDon"><b>${o.nom}</b>${o.desc}${o.cartes ? '<div class="grille mini">' + o.cartes.map(id => tuileCarte(id, { reveler: true })).join('') + '</div>' : ''}</div></div>`).join('')}</div>
      <div class="consigne avert">⚠️ Choix définitif</div>
      <button class="principal" id="choixOk" disabled>Choisis une option</button>
      <button class="lien" id="choixPlusTard">Plus tard</button>`;
    ecran('choix');
    $('choixCorps').querySelectorAll('.optChoix').forEach(el => el.onclick = () => {
      $('choixCorps').querySelectorAll('.optChoix').forEach(x => x.classList.toggle('choisi', x === el));
      choix = options[+el.dataset.i]; $('choixOk').disabled = false; $('choixOk').textContent = 'Je choisis : ' + choix.nom;
    });
    $('choixPlusTard').onclick = accueil;
    $('choixOk').onclick = () => {
      if (!choix) return;
      if (ch.type === 'serment') P.choisirSerment(profil, ch.niveau, choix.id);
      else P.choisirVoie(profil, choix.id, ch.type === 'voie2');
      sauver();
      $('choixCorps').innerHTML = `<div class="compHalo"><div class="compEmoji">${choix.icone}</div></div><div class="compNom">${choix.nom}</div>
        <div class="consigne">${choix.cartes ? 'Deux nouvelles cartes rejoignent la Collection de l\'Errant. Pense à les équiper.' : 'Le Serment est prêté. Il agit dès la prochaine épreuve.'}</div>
        ${choix.cartes ? '<div class="grille">' + choix.cartes.map(id => tuileCarte(id)).join('') + '</div>' : ''}
        <button class="principal" id="choixFin">Continuer</button>`;
      particules(document.querySelector('.compHalo'), '✨', 12);
      $('choixFin').onclick = () => (P.choixEnAttente(profil) ? ouvrirChoix() : ouvrirTresors());
    };
  }
  $('choixAttente').onclick = ouvrirChoix;

  // ---------- Codex ----------
  function ouvrirCodex() {
    clotho('codex');
    const ids = Object.keys(D.ENNEMIS);
    const vus = ids.filter(id => profil.codex[id] && profil.codex[id].vu).length;
    const lies = profil.creatures.length, liables = D.CREATURES.length;
    $('codexCorps').innerHTML = `<div class="bourse"><span>📖 Codex · ${vus}/${ids.length} vus · 🧵 ${lies}/${liables} liées</span></div>
      <div class="menace">Les créatures marquées 🧵 peuvent être liées. Les Gardiens 👑 ne se lient pas (pour l'instant...), ni les mortels 🥷.</div>
      <div class="grille">${ids.map(id => { const e = D.ENNEMIS[id], c = profil.codex[id];
        if (!c || !c.vu) return `<div class="tuile inconnue" style="--r:#4a382b"><div class="art" style="--a:#2a1f18"><span style="filter:brightness(0) opacity(.6)">${e.emoji}</span></div><div class="nom">???</div><div class="sous">Pas encore croisé</div></div>`;
        const statut = c.lie ? '🧵 Liée' : e.gardien ? '👑 Gardien' : e.mortel ? '🥷 Mortel' : P.liable(id) ? '🧵 Liable' : '';
        return `<div class="tuile" data-ennemi="${id}" style="--r:${aff(e.affinite).couleur}"><div class="art" style="--a:${aff(e.affinite).couleur}"><span>${e.emoji}</span><div class="affb">${aff(e.affinite).icone}</div><div class="nv">⚔️ ${c.vaincus}</div></div><div class="nom">${e.nom}</div><div class="sous">${statut}</div>${c.lie ? '<div class="coche">🧵</div>' : ''}</div>`; }).join('')}</div>
`;
    $('codexCorps').querySelectorAll('[data-ennemi]').forEach(t => t.onclick = () => {
      const id = t.dataset.ennemi, c = profil.codex[id];
      $('titreModale').textContent = D.ENNEMIS[id].nom; $('onglets').innerHTML = '';
      $('lexiqueCorps').innerHTML = ficheEnnemi(D.ENNEMIS[id]) + `<div class="ligne">Vaincus : ${c.vaincus}${P.liable(id) ? ' · chance de lien bonus : +' + Math.round(100 * (P.lienBonus(profil)[id] || 0)) + ' %' : ''}${c.lie ? ' · 🧵 liée à toi' : ''}</div>`;
      $('modale').classList.add('visible');
    });
    ecran('codex');
  }

  // ---------- Arrivée d'un compagnon ----------
  function presenterCompagnon(id, suite, creature) {
    const h = D.HEROS.concat(D.CREATURES).find(x => x.id === id);
    const cartes = h.competences.filter(c => c.type !== 'garde' && profil.cartes[c.id] && !c.prouesse);
    $('compCorps').innerHTML = `<div class="compHalo"><div class="compEmoji">${h.emoji}</div></div>
      <div class="compNom">${h.nom}</div><div class="compTitre">${h.titre || h.role}</div>
      <div class="compTags"><span class="tag">${aff(h.affinite).icone} ${aff(h.affinite).nom}</span><span class="tag">${h.role}</span><span class="tag">❤️ ${h.pvMax} PV</span><span class="tag">💨 ${h.vitesse}</span></div>
      <p class="compBio">${h.bio}</p><p class="compApport">${h.apport || ''}</p>
      <div class="sousTitre">Ses cartes</div><div class="grille">${cartes.map(c => tuileCarte(c.id)).join('')}</div>
      ${creature ? '<p class="compApport">Choisis-la dans la Préparation pour l\'emmener à la place de Kelos.</p>' : ''}
      <button class="principal" id="compOk">Accueillir ${h.nom}</button>`;
    ecran('compagnon');
    const halo = document.querySelector('.compHalo');
    for (let i = 0; i < 14; i++) particules(halo, '✨', 1);
    $('compOk').onclick = () => { if (!creature) profil.compagnons.push(id); sauver(); if (creature) clotho('lie'); suite(); };
  }
  $('btnColOk').onclick = () => { if (modePreparation) presenterEnnemis(); else accueil(); };


  // ---------- Conseils ----------
  function conseiller(etat, acteur) {
    const comps = M.competencesDisponibles(etat, acteur).filter(c => c.possible);
    const allies = M.vivants(etat, 'allie'), ennemis = M.vivants(etat, 'ennemi');
    const pro = comps.find(c => c.prouesse); if (pro) return { comp: pro };
    const blesse = allies.slice().sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0];
    const soin = comps.find(c => c.type === 'soin');
    if (soin && blesse.pv / blesse.pvMax < 0.45) return { comp: soin, cible: blesse };
    const hydre = ennemis.find(e => e.mecanique === 'hydre');
    if (hydre && hydre.tetes >= 2 && !hydre.etats.cauterise) { const t = comps.find(c => c.affinite === 'flamme'); if (t) return { comp: t, cible: hydre }; }
    let best = null;
    comps.filter(c => c.type === 'attaque' && !c.zone).forEach(c => ennemis.forEach(e => {
      const est = M.estimer(acteur, e, c);
      let s = (est.min + est.max) / 2 / (c.poids === 'lourd' ? 1.3 : c.poids === 'leger' ? 0.75 : 1);
      if (e.pv <= est.min) s += 30; // achever
      if (!best || s > best.s) best = { comp: c, cible: e, s };
    }));
    return best;
  }
  function montrerConseil() {
    const a = M.acteurSuivant(partie.etat);
    const c = conseiller(partie.etat, a);
    if (!c) return;
    document.querySelectorAll('.btnAction').forEach(b => b.classList.toggle('conseil', b.dataset.id === c.comp.id));
    partie.conseil = c;
  }
  $('btnIndice').onclick = montrerConseil;

  // ---------- Actions du joueur ----------
  function montrerActions(acteur) {
    $('tourDe').textContent = 'À ' + acteur.nom + ' · Énergie 🔹' + acteur.energie + '/' + acteur.energieMax;
    $('btnAnnuler').style.display = 'none';
    $('desc').textContent = 'Choisis une compétence, puis une cible.';
    $('actions').innerHTML = ''; $('actionsUtil').innerHTML = '';
    document.querySelectorAll('.btnProuesse').forEach(x => x.remove());
    partie.conseil = null;
    // Trois places : les 4 cartes équipées, une rangée d'actions de base (Garde, Lier), et la Prouesse sur la jauge de Gloire
    M.competencesDisponibles(partie.etat, acteur).forEach(c => {
      if (c.prouesse && !c.possible) return;
      const b = document.createElement('button');
      b.dataset.id = c.id; b.classList.add('btnAction');
      if (c.prouesse) {
        b.className = 'btnAction btnProuesse'; b.innerHTML = '🏆 ' + c.nom;
        b.onclick = () => choisir(acteur, c, b);
        $('blocGloire').appendChild(b); clotho('prouesseDispo'); return;
      }
      const base = c.type === 'garde' || c.type === 'lier';
      b.innerHTML = base ? `${c.art || aff(c.affinite).icone} ${c.nom}<small>${c.cout ? '🔹' + c.cout : 'Gratuit'}</small>`
        : `${aff(c.affinite).icone} ${c.nom}${c.niveau > 1 ? ' <span style="color:#b07be0">Nv ' + c.niveau + '</span>' : ''}<small>${resume(c)}</small>`;
      if (!c.possible) {
        b.classList.add('manque');
        const manqueEnergie = (c.cout || 0) > acteur.energie;
        b.onclick = () => { $('desc').innerHTML = manqueEnergie
          ? `🔹 Pas assez d'Énergie : ${c.nom} en coûte ${c.cout}, ${acteur.nom} n'en a que ${acteur.energie}. L'Énergie remonte de 1 à chaque tour (5 au maximum) : joue une carte gratuite ou la Garde en attendant.`
          : c.type === 'lier' ? '🧵 Lier : aucune créature n\'est assez affaiblie (moins de 35 % de PV, hors Gardien).' : 'Pas de cible possible pour le moment.'; };
      } else b.onclick = () => choisir(acteur, c, b);
      (base ? $('actionsUtil') : $('actions')).appendChild(b);
    });
    if (guidage() === 'bavarde') montrerConseil();
  }

  function choisir(acteur, comp, bouton) {
    if (occupe) return;
    document.querySelectorAll('.btnAction').forEach(b => b.classList.remove('choisi'));
    bouton.classList.add('choisi');
    $('btnAnnuler').style.display = 'inline';
    nettoyerCibles();
    renderFile({ uid: acteur.uid, poids: comp.poids || 'normal' });
    clotho('fantome');
    if (comp.zone) {
      $('desc').textContent = (comp.desc || '') + ' Touche à nouveau pour lancer.';
      M.vivants(partie.etat, comp.type === 'attaque' ? 'ennemi' : 'allie').forEach(u => apercu(acteur, u, comp));
      bouton.onclick = () => executer(acteur, comp, null);
      return;
    }
    $('desc').textContent = (comp.desc || '') + ' Touche une cible.';
    M.ciblesPossibles(partie.etat, acteur, comp).forEach(u => {
      const el = carteEl(u.uid);
      el.classList.add('ciblable');
      if (partie.conseil && partie.conseil.comp.id === comp.id && partie.conseil.cible && partie.conseil.cible.uid === u.uid) el.classList.add('conseil');
      el.onclick = () => executer(acteur, comp, u.uid);
      apercu(acteur, u, comp);
    });
  }
  function apercu(acteur, u, comp) {
    const el = carteEl(u.uid); if (!el) return;
    const div = document.createElement('div');
    div.className = 'apercu';
    if (comp.type === 'attaque') {
      const est = M.estimer(acteur, u, comp);
      div.textContent = '≈ ' + est.min + '-' + est.max + (est.mult > 1 ? ' · Efficace' : est.mult < 1 ? ' · Peu efficace' : '');
      if (est.mult > 1) div.classList.add('fort'); if (est.mult < 1) div.classList.add('faible');
      const moy = Math.min(u.pv, Math.round((est.min + est.max) / 2));
      const barre = el.querySelector('.barre');
      const perte = document.createElement('i'); perte.className = 'perte';
      perte.style.left = Math.round(100 * (u.pv - moy) / u.pvMax) + '%'; perte.style.width = Math.round(100 * moy / u.pvMax) + '%';
      barre.appendChild(perte);
    } else if (comp.type === 'soin') div.textContent = '+≈ ' + comp.puissance + ' PV';
    else if (comp.type === 'garde') div.textContent = '🛡️ protéger';
    else if (comp.type === 'presage') div.textContent = '⏩ jouera ensuite';
    else if (comp.type === 'lier') div.textContent = '🧵 lien ≈ ' + Math.round(100 * M.chanceLien(partie.etat, u)) + ' %';
    el.appendChild(div);
  }
  function nettoyerCibles() {
    document.querySelectorAll('.unite').forEach(el => { el.classList.remove('ciblable', 'conseil'); el.onclick = null; });
    document.querySelectorAll('.apercu, .barre i.perte').forEach(e => e.remove());
  }
  $('btnAnnuler').onclick = () => { const a = M.acteurSuivant(partie.etat); afficher(a); montrerActions(a); };
  function executer(acteur, comp, cibleUid) {
    if (occupe) return;
    occupe = true;
    $('actions').innerHTML = ''; $('actionsUtil').innerHTML = ''; document.querySelectorAll('.btnProuesse').forEach(x => x.remove());
    $('desc').textContent = ''; $('btnAnnuler').style.display = 'none';
    nettoyerCibles();
    const ev = M.agir(partie.etat, acteur.uid, comp.id, cibleUid);
    const t = animer(ev);
    setTimeout(() => { afficher(); ensuite(boucle, 300); }, t);
  }

  // ---------- Affichage ----------
  function intention(e) {
    if (!e.intention || e.ko) return '';
    const c = e.competences.find(c => c.id === e.intention.competence);
    const etat = partie.etat;
    let cible = e.intention.cible ? M.unite(etat, e.intention.cible) : null;
    if (cible && cible.ko) cible = null;
    const ref = cible || M.vivants(etat, 'allie')[0];
    const est = ref ? M.estimer(e, ref, c) : null;
    const tetes = e.mecanique === 'hydre' && e.tetes > 1 && !c.zone ? ' ×' + e.tetes : '';
    const qui = c.zone ? 'toute l\'équipe' : cible ? cible.emoji + ' ' + cible.nom : '?';
    return `<div class="intention ${e.intention.grand ? 'grand' : ''}">${e.intention.grand ? '⚠️' : '🎯'} ${c.nom} → ${qui}${est ? ' · ≈' + Math.round((est.min + est.max) / 2) + tetes : ''}</div>`;
  }
  function carte(u, acteur) {
    const pct = Math.round(100 * u.pv / u.pvMax);
    const avant = partie.pvAff[u.uid] != null ? partie.pvAff[u.uid] : pct;
    let etats = '';
    if (u.etats.brulure) etats += `<span title="Brûlure">🔥<sub>${u.etats.brulure.tours}</sub></span>`;
    if (u.etats.etourdi) etats += '<span title="Étourdi">💫</span>';
    if (u.etats.bouclier) etats += '<span title="Bouclier">🔰</span>';
    if (u.etats.critique) etats += '<span title="Prochain coup critique">👁️</span>';
    if (u.etats.aveugle) etats += '<span title="Aveuglé">🙈</span>';
    if (u.etats.cauterise) etats += `<span title="Cautérisé">♨️<sub>${u.etats.cauterise}</sub></span>`;
    if (u.gardePar) etats += '<span title="Protégé">🛡️</span>';
    if (u.mecanique === 'hydre') etats += ' ' + '🐍'.repeat(u.tetes);
    const pips = u.camp === 'allie' ? `<div class="pips">${Array.from({ length: u.energieMax }, (_, i) => `<b class="${i < u.energie ? 'on' : ''}"></b>`).join('')}</div>` : '';
    return `<div class="unite ${u.ko ? 'ko' : ''} ${acteur && acteur.uid === u.uid ? 'actif' : ''} ${u.gardien ? 'gardien' : ''}" data-uid="${u.uid}" data-pct="${pct}">
      ${u.camp === 'ennemi' ? intention(u) : ''}
      <div class="e">${u.emoji}</div><div class="nom">${u.nom}</div><div class="aff">${aff(u.affinite).icone} ${aff(u.affinite).nom}</div>
      <div class="barre ${pct < 30 ? 'bas' : ''}"><i class="ghost" style="width:${Math.max(avant, pct)}%"></i><i class="vrai" style="width:${avant}%"></i></div><div class="pvtxt">${u.pv} / ${u.pvMax}</div>
      ${pips}<div class="etats">${etats}</div></div>`;
  }
  function renderFile(fantome) {
    const etat = partie.etat;
    let liste;
    if (fantome) {
      const acteur = M.unite(etat, fantome.uid);
      liste = [{ uid: acteur.uid }].concat(M.prevision(etat, 7, fantome));
    } else liste = M.prevision(etat, 8);
    $('file').innerHTML = '<span class="lbl">File</span>' + liste.map((p, i) => {
      const u = M.unite(etat, p.uid);
      const grand = u.camp === 'ennemi' && u.intention && u.intention.grand && !liste.slice(0, i).some(q => q.uid === p.uid);
      return `<div class="jeton ${u.camp} ${i === 0 ? 'premier' : ''} ${p.fantome ? 'fantome' : ''}">${u.emoji}${grand ? '<span class="alerte">⚠️</span>' : ''}</div>`;
    }).join('');
  }
  function afficher(acteur) {
    const etat = partie.etat;
    acteur = acteur || M.acteurSuivant(etat);
    $('ennemis').innerHTML = etat.unites.filter(u => u.camp === 'ennemi').map(u => carte(u, acteur)).join('');
    $('allies').innerHTML = etat.unites.filter(u => u.camp === 'allie').map(u => carte(u, acteur)).join('');
    // PV fantômes : la barre réelle descend vite, la trace claire suit plus lentement
    requestAnimationFrame(() => document.querySelectorAll('.unite').forEach(el => {
      const pct = el.dataset.pct;
      el.querySelector('i.vrai').style.width = pct + '%';
      el.querySelector('i.ghost').style.width = pct + '%';
      partie.pvAff[el.dataset.uid] = +pct;
    }));
    renderFile();
    $('gloire').style.width = etat.gloire + '%';
    $('gloireTxt').textContent = etat.gloire;
    $('filProgres').style.width = Math.round(100 * partie.vaincus / partie.totalEnnemis) + '%';
    $('tourDe').textContent = acteur ? 'Tour de ' + acteur.nom : '';
    $('actions').innerHTML = ''; $('desc').textContent = ''; $('btnAnnuler').style.display = 'none';
    if (acteur && acteur.camp === 'ennemi') $('desc').textContent = 'L\'ennemi agit...';
  }

  function carteEl(uid) { return document.querySelector(`.unite[data-uid="${uid}"]`); }
  function flotter(elem, texte, classe) {
    if (!elem) return;
    const f = document.createElement('div');
    f.className = 'flottant ' + (classe || '');
    f.textContent = texte;
    f.style.animationDuration = T_(1100) + 'ms';
    elem.appendChild(f);
    setTimeout(() => f.remove(), T_(1100));
  }
  function particules(elem, icone, n) {
    if (!elem) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'particule'; p.textContent = icone;
      const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 40;
      p.style.setProperty('--dx', Math.round(Math.cos(a) * r) + 'px');
      p.style.setProperty('--dy', Math.round(Math.sin(a) * r) + 'px');
      p.style.animationDuration = T_(800) + 'ms';
      elem.appendChild(p);
      setTimeout(() => p.remove(), T_(800));
    }
  }
  function rejouer(elem, classe) { if (!elem) return; elem.classList.remove(classe); void elem.offsetWidth; elem.classList.add(classe); }
  function journal(t) { const j = $('journal'); j.insertAdjacentHTML('afterbegin', '<div>' + t + '</div>'); while (j.children.length > 3) j.lastChild.remove(); }
  function banniere(qui, quoi, eff) { const b = $('banniere'); b.className = ''; b.innerHTML = `<div class="qui">${qui}</div><div class="quoi">${quoi}</div><div class="eff">${eff || ''}</div>`; b.classList.add('visible'); }
  function ajouterEffet(t, fort) { const b = $('banniere'); const e = b.querySelector('.eff'); if (e && !e.textContent.includes(t)) e.textContent += (e.textContent ? ' · ' : '') + t; if (fort) b.classList.add('fort'); }
  function cacherBanniere() { $('banniere').classList.remove('visible', 'fort'); }

  // Joue les événements un par un. Renvoie la durée totale (ms, vitesse incluse).
  function animer(evenements) {
    const etat = partie.etat;
    const N = uid => M.unite(etat, uid).nom;
    let t = 0;
    const plus = (ms, f) => { setTimeout(f, t); t += T_(ms); };
    evenements.forEach(e => {
      switch (e.type) {
        case 'action': {
          const src = M.unite(etat, e.source);
          const comp = src.competences.find(c => c.id === e.competence);
          plus(600, () => {
            banniere(src.emoji + ' ' + src.nom, aff(comp.affinite).icone + ' ' + comp.nom, '');
            SON.jouer('action');
            rejouer(carteEl(e.source), src.camp === 'allie' ? 'elan-haut' : 'elan-bas');
            journal(src.nom + ' : ' + comp.nom);
            partie.actionCourante = comp.nom;
          });
          break;
        }
        case 'degats': {
          const fort = e.critique || e.mult > 1;
          plus(fort ? 700 : 450, () => {
            const c = carteEl(e.cible);
            const src = M.unite(etat, e.source);
            rejouer(c, 'touche');
            SON.coup(e.affinite, fort, e.critique);
            particules(c, aff(e.affinite).icone, fort ? 9 : 5);
            if (e.degats >= 40 || fort) rejouer($('app'), 'tremble');
            flotter(c, '-' + e.degats + (e.critique ? ' !' : ''), e.mult > 1 ? 'fort' : e.mult < 1 ? 'faible' : '');
            if (e.mult > 1) { ajouterEffet('Efficace x1,5', true); if (src.camp === 'allie') clotho('efficace'); }
            if (e.mult < 1) { ajouterEffet('Peu efficace x0,67'); if (src.camp === 'allie') clotho('peuEfficace'); }
            if (e.critique) ajouterEffet('Critique !', true);
            if (src.camp === 'allie') {
              partie.affUsage[e.affinite] = (partie.affUsage[e.affinite] || 0) + e.degats;
              if (!partie.coupMax || e.degats > partie.coupMax.degats) partie.coupMax = { nom: partie.actionCourante || '?', degats: e.degats };
              partie.dernierEnnemi = M.unite(etat, e.cible);
            } else partie.dernierEnnemi = src;
            // la barre de PV descend tout de suite
            if (c) { const u = M.unite(etat, e.cible); c.querySelector('i.vrai').style.width = Math.round(100 * u.pv / u.pvMax) + '%'; }
            journal(N(e.cible) + ' perd ' + e.degats + ' PV' + (e.mult > 1 ? ' (efficace)' : e.mult < 1 ? ' (peu efficace)' : ''));
          });
          break;
        }
        case 'rate': plus(350, () => { SON.jouer('rate'); flotter(carteEl(e.cible), 'Raté', 'faible'); ajouterEffet('Raté'); }); break;
        case 'soin': plus(450, () => { SON.jouer('soin'); const c = carteEl(e.cible); flotter(c, '+' + e.soin, 'soin'); particules(c, '✨', 5); journal(N(e.cible) + ' récupère ' + e.soin + ' PV'); }); break;
        case 'brulure': plus(550, () => { SON.coup('flamme', false); banniere('🔥 Brûlure', N(e.cible), '-' + e.degats + ' PV'); const c = carteEl(e.cible); rejouer(c, 'touche'); particules(c, '🔥', 4); flotter(c, '-' + e.degats); }); break;
        case 'etat': plus(250, () => { if (e.etat === 'etourdi') { flotter(carteEl(e.cible), '💫 Étourdi', 'info'); ajouterEffet('Étourdi !'); } if (e.etat === 'brulure') ajouterEffet('Brûlure 2 tours'); }); break;
        case 'interception': plus(400, () => { SON.jouer('garde'); flotter(carteEl(e.gardien), '🛡️ intercepte', 'info'); ajouterEffet(N(e.gardien) + ' intercepte'); journal(N(e.gardien) + ' intercepte le coup !'); }); break;
        case 'garde': plus(350, () => { SON.jouer('garde'); flotter(carteEl(e.cible), '🛡️ protégé', 'info'); ajouterEffet(N(e.cible) + ' est protégé'); }); break;
        case 'presage': plus(350, () => { flotter(carteEl(e.cible), '⏩ joue ensuite', 'info'); ajouterEffet(N(e.cible) + ' joue juste après'); }); break;
        case 'bouclier': plus(220, () => { SON.jouer('garde'); flotter(carteEl(e.cible), '🔰', 'info'); ajouterEffet('Bouclier levé'); }); break;
        case 'bouclierUse': plus(200, () => { flotter(carteEl(e.cible), '🔰 amorti', 'info'); }); break;
        case 'lie': plus(1300, () => { SON.jouer('lie');
          const u = M.unite(etat, e.cible);
          banniere('🧵 Le nœud tient !', u.emoji + ' ' + u.nom + ' se lie à toi', partie.echo ? 'Écho : le lien ne sera pas gardé' : 'Elle rejoindra ta Collection');
          $('banniere').classList.add('fort');
          particules(carteEl(e.cible), '🧵', 10);
          rejouer(carteEl(e.cible), 'effiloche');
          journal('🧵 ' + u.nom + ' est liée !');
          partie.lies.push(u.id); partie.vaincus++;
          $('filProgres').style.width = Math.round(100 * partie.vaincus / partie.totalEnnemis) + '%';
        }); break;
        case 'lienRate': plus(700, () => { SON.jouer('lienRate'); const u = M.unite(etat, e.cible); banniere('🧵 Le fil glisse...', u.nom + ' résiste', 'Chance : ' + Math.round(100 * e.chance) + ' %'); flotter(carteEl(e.cible), 'Lien raté', 'faible'); journal('Le lien a glissé.'); clotho('lienRate'); }); break;
        case 'releve': plus(900, () => { SON.jouer('niveau'); banniere('💨 Second Souffle', N(e.cible) + ' se relève !', '25 % des PV'); particules(carteEl(e.cible), '✨', 8); journal(N(e.cible) + ' se relève grâce au Second Souffle.'); }); break;
        case 'aveugle': plus(450, () => { flotter(carteEl(e.cible), '🙈 aveuglé', 'info'); ajouterEffet('Le Cyclope est aveuglé', true); journal('Le Cyclope est aveuglé : sa prochaine attaque risque de rater.'); }); break;
        case 'oeil': plus(350, () => { flotter(carteEl(e.cible), '👁️ prochain coup critique', 'info'); ajouterEffet(N(e.cible) + ' : prochain coup critique'); }); break;
        case 'recul': plus(300, () => { flotter(carteEl(e.cible), '⏪ recule', 'info'); ajouterEffet('Recule dans la File'); }); break;
        case 'ko': plus(800, () => {
          const u = M.unite(etat, e.cible);
          rejouer(carteEl(e.cible), 'effiloche'); SON.jouer('ko');
          ajouterEffet(N(e.cible) + ' tombe');
          journal(N(e.cible) + ' tombe.');
          if (u.camp === 'allie') { partie.kos++; clotho('ko'); } else { P.noterCodex(profil, u.id, 'vaincu'); partie.vaincus++; $('filProgres').style.width = Math.round(100 * partie.vaincus / partie.totalEnnemis) + '%'; }
        }); break;
        case 'gloirePleine': plus(300, () => { SON.jouer('gloire'); journal('🏆 La Gloire est pleine !'); clotho('gloire'); }); break;
        case 'cauterise': plus(400, () => { flotter(carteEl(e.cible), '♨️ cautérisé', 'info'); ajouterEffet('Plaie cautérisée'); }); break;
        case 'tete': plus(600, () => { SON.jouer('tete'); flotter(carteEl(e.cible), '🐍 +1 tête', 'faible'); ajouterEffet('Une tête repousse ! (' + e.tetes + ')', true); journal('Une tête repousse (' + e.tetes + ').'); clotho('tete'); }); break;
        case 'teteAttaque': plus(250, () => ajouterEffet('Morsure d\'une autre tête')); break;
        case 'etourdi': plus(650, () => { SON.jouer('etourdi'); banniere('💫 Étourdi', N(e.cible) + ' perd son tour', ''); flotter(carteEl(e.cible), '💫', 'info'); }); break;
      }
    });
    plus(evenements.length ? 450 : 0, () => {});
    setTimeout(cacherBanniere, t);
    return t;
  }

  // ---------- Lexique ----------
  let ongletLexique = 'Combat';
  function ouvrirLexique(onglet) {
    if (onglet) ongletLexique = onglet;
    const onglets = ['Combat', 'Affinités', 'États', 'Cartes', 'Héros', 'Ennemis', 'Épreuve', 'Récit'];
    $('onglets').innerHTML = onglets.map(o => `<button class="${o === ongletLexique ? 'on' : ''}" data-o="${o}">${o}</button>`).join('');
    $('onglets').querySelectorAll('button').forEach(b => b.onclick = () => ouvrirLexique(b.dataset.o));
    let h = '';
    if (ongletLexique === 'Affinités') {
      h = `<div class="cycle">🔥 Flamme ➜ 🌿 Sylve ➜ 🌊 Onde ➜ 🔥</div><div class="cycle">⚡ Foudre ➜ 🌪️ Vent ➜ 🪨 Roc ➜ ⚡</div>
        <div class="cycle">☀️ Lumière ⇄ 🌑 Ombre</div><div class="cycle">🛡️ Airain : neutre</div>
        <p class="small">La flèche veut dire « fort contre » : dégâts x1,5. Dans l'autre sens, c'est peu efficace : x0,67.<br><br>⚡ désigne l'affinité Foudre. L'Énergie, elle, se note 🔹.</p>`;
    } else if (ongletLexique === 'Héros') {
      h = D.HEROS.map(hh => `<div class="ligne"><b>${hh.emoji} ${hh.nom}</b> · ${hh.role} · ${aff(hh.affinite).icone} ${aff(hh.affinite).nom} · ❤️ ${hh.pvMax}<br>` +
        hh.competences.map(c => `${aff(c.affinite).icone} <b>${c.nom}</b> (${resume(c).replace(/<\/?b>/g, '')}) : ${c.desc}`).join('<br>') + '</div>').join('');
    } else if (ongletLexique === 'Ennemis') {
      h = Object.values(D.ENNEMIS).filter(e => profil.codex[e.id] && profil.codex[e.id].vu).map(e => `<div class="ligne"><b>${e.emoji} ${e.nom}</b> · ${aff(e.affinite).icone} ${aff(e.affinite).nom} · ❤️ ${e.pvMax}<br>
        Faible contre : ${listeAff(faiblesses(e.affinite))}. Résiste à : ${listeAff(forces(e.affinite))}.<br><span class="small">${e.special}</span></div>`).join('') + '<p class="small">Les ennemis apparaissent ici une fois croisés.</p>';
    } else {
      h = D.LEXIQUE.filter(l => l.cat === ongletLexique).map(l => `<div class="ligne">${l.icone} <b>${l.terme}</b> : ${l.texte}</div>`).join('');
    }
    $('titreModale').textContent = '📖 Lexique';
    $('lexiqueCorps').innerHTML = h;
    $('modale').classList.add('visible');
  }
  $('modaleOk').onclick = () => { $('modale').classList.remove('visible'); reprendre(); };

  // ---------- Panneau de sauvegarde commune ----------
  function ouvrirSync() {
    const c = S.conf() || { url: '', cle: '' };
    $('titreModale').textContent = '☁️ Sauvegarde commune';
    $('onglets').innerHTML = '';
    let code = '';
    try { code = btoa(unescape(encodeURIComponent(JSON.stringify(profil)))); } catch (e) { code = ''; }
    $('lexiqueCorps').innerHTML = `
      <p class="small">Pour jouer la même partie sur ton téléphone et ton ordinateur. Colle ici l'adresse de ton script Google et ta clé secrète (voir le README du dépôt). À faire une fois sur chaque appareil.</p>
      <label class="small">Adresse du script (se termine par /exec)</label>
      <input id="syncUrl" value="${c.url}" placeholder="https://script.google.com/macros/s/.../exec">
      <label class="small">Clé secrète</label>
      <input id="syncCle" value="${c.cle}" placeholder="ta clé">
      <div style="display:flex;gap:6px;margin-top:8px"><button id="syncOk" style="flex:1">Tester et enregistrer</button><button id="syncOff">Désactiver</button></div>
      <p class="small" id="syncMsg"></p>
      <hr style="border-color:var(--bord)">
      <p class="small"><b>Sans script : transfert manuel.</b> Copie ce code sur l'autre appareil, puis colle-le dans le même cadre et touche « Charger ».</p>
      <textarea id="syncCode" rows="3">${code}</textarea>
      <button id="syncCharger" style="width:100%;margin-top:6px">Charger ce code</button>`;
    $('syncOk').onclick = async () => {
      const url = $('syncUrl').value.trim(), cle = $('syncCle').value.trim();
      $('syncMsg').textContent = 'Test en cours...';
      const r = await S.tester(url, cle);
      if (r === 'ok') { S.configurer({ url, cle }); $('syncMsg').textContent = '✅ Connecté. Ta partie est maintenant commune.'; await synchroniser(); if (!S.conf()) return; S.envoyer(profil, true); }
      else $('syncMsg').textContent = r === 'cle' ? '❌ La clé ne correspond pas à celle du script.' : '❌ Adresse injoignable. Vérifie qu\'elle se termine par /exec et que l\'accès est « Tout le monde ».';
    };
    $('syncOff').onclick = () => { S.configurer(null); $('syncMsg').textContent = 'Sauvegarde commune désactivée sur cet appareil.'; };
    $('syncCharger').onclick = () => {
      try {
        const p = JSON.parse(decodeURIComponent(escape(atob($('syncCode').value.trim()))));
        if (!p || !Array.isArray(p.rangs)) throw new Error('format');
        profil = migrer(Object.assign(profilVide(), p)); sauver(); $('syncMsg').textContent = '✅ Partie chargée.'; accueil();
      } catch (e) { $('syncMsg').textContent = '❌ Ce code n\'est pas valide.'; }
    };
    $('modale').classList.add('visible');
  }

  // ---------- Boutons ----------
  // La toute première fois : la cinématique d'introduction avant l'épreuve
  $('btnJouer').onclick = () => {
    if (!profil.vus.intro && window.Cinematique) return Cinematique.jouer(() => { profil.vus.intro = true; sauver(); demarrer(false); });
    demarrer(false);
  };
  // ---------- Classement des tisserands (tous les joueurs du même script) ----------
  $('btnClassement').onclick = async () => {
    $('titreModale').textContent = '🏆 Les tisserands'; $('onglets').innerHTML = '';
    $('lexiqueCorps').innerHTML = '<p class="small">Chargement...</p>'; $('modale').classList.add('visible');
    const r = await S.classement();
    if (r.erreur) {
      $('lexiqueCorps').innerHTML = '<p>' + ({ local: 'Le classement réunit les joueurs qui sauvegardent sur le même script Google. Configure d\'abord la sauvegarde commune (Réglages, Sauvegarde).',
        script: 'Le script de sauvegarde doit être mis à jour pour afficher le classement : remplace son code par la dernière version de sauvegarde/Code.gs, puis Déployer, Gérer les déploiements, modifier, Nouvelle version.',
        cle: 'La sauvegarde commune refuse la clé de cet appareil.', reseau: 'Pas de connexion : réessaie dans un moment.' })[r.erreur] + '</p>';
      return;
    }
    const moi = profil.pseudo || (S.conf() && S.conf().joueur ? S.conf().joueur.charAt(0).toUpperCase() + S.conf().joueur.slice(1) : 'Joueur principal');
    const liste = r.liste.sort((a, b) => b.etoiles - a.etoiles || b.jour - a.jour);
    const medaille = k => ['🥇', '🥈', '🥉'][k] || (k + 1) + '.';
    $('lexiqueCorps').innerHTML = '<p class="small">Classés par étoiles gagnées. Chacun joue à son rythme : le jour atteint compte moins que la qualité de la tapisserie.</p>' +
      liste.map((j, k) => `<div class="classe ${j.nom === moi ? 'moi' : ''}" data-k="${k}"><div class="rangC">${medaille(k)}</div><canvas width="200" height="250" data-k="${k}"></canvas>
        <div class="infos"><b>${j.nom}</b>Jour ${j.jour} · ★ ${j.etoiles} · ${j.parfaits} parfait${j.parfaits > 1 ? 's' : ''}<br>Niveau ${j.niveau} · 🐾 ${j.creatures} liée${j.creatures > 1 ? 's' : ''}${j.sceaux ? ' · ✨ Sceau de Maïa' : ''}${j.serie > 1 ? ' · série ' + j.serie + ' j' : ''}</div></div>`).join('');
    $('lexiqueCorps').querySelectorAll('canvas').forEach(cv => T.dessiner(cv, liste[+cv.dataset.k].rangs));
    $('lexiqueCorps').insertAdjacentHTML('beforeend', '<p class="small" style="text-align:center">Touche un tisserand pour voir sa carte.</p>');
    $('lexiqueCorps').querySelectorAll('.classe').forEach(el => el.onclick = () => { Son.jouer('page'); ficheJoueur(liste[+el.dataset.k], k => k, medaille(+el.dataset.k)); });
    $('lexiqueCorps').scrollTop = 0;
  };

  // ---------- Carte de joueur (depuis le classement) ----------
  function quandLe(date) {
    if (!date) return '';
    const auj = aujourdhui(), h = new Date(); h.setDate(h.getDate() - 1);
    const hier = h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
    if (date === auj) return 'Aujourd\'hui';
    if (date === hier) return 'Hier';
    const [a, m, j] = date.split('-'); return 'Le ' + j + '/' + m;
  }
  function ficheJoueur(j, _, medaille) {
    const f = j.fiche;
    const etoilesTxt = r => r.victoire ? '★'.repeat(r.etoiles || 0) + '☆'.repeat(3 - (r.etoiles || 0)) : '✕';
    let h = `<button id="retourClassement" class="lien">← Classement</button>
      <div class="ficheJ"><canvas width="200" height="250" id="ficheTapis"></canvas><div>
        <div class="ficheNom">${medaille} ${j.nom}</div>
        <div class="ficheStats"><span><b>${j.jour}</b>jour</span><span><b>★ ${j.etoiles}</b>étoiles</span><span><b>${j.niveau}</b>niveau</span>
        <span><b>${j.parfaits}</b>parfait${j.parfaits > 1 ? 's' : ''}</span><span><b>🐾 ${j.creatures}</b>liée${j.creatures > 1 ? 's' : ''}</span><span><b>${j.serie || 0}</b>série</span></div>
        ${j.sceaux ? '<div class="small">✨ Sceau de Maïa obtenu</div>' : ''}</div></div>`;
    if (!f) {
      h += '<p class="small">Pour voir sa dernière épreuve et son équipe, le script de sauvegarde doit être mis à jour (dernier Code.gs, puis Gérer les déploiements, modifier, Nouvelle version).</p>';
    } else {
      const r = f.recents[f.recents.length - 1];
      if (r) {
        h += `<h3 class="ficheT">${quandLe(r.date)} · Jour ${r.jour}</h3>
          <div class="ficheEp ${r.victoire ? 'gagne' : 'perdu'}"><div class="ficheMotif">${r.motif || '🧵'}</div><div>
            <b>${r.titre || 'Épreuve'}</b><div class="ficheEt">${etoilesTxt(r)}</div><div class="small">${r.resume || ''}</div></div></div>`;
      } else h += '<p class="small">Pas encore d\'épreuve jouée.</p>';
      // Équipe : celle de la dernière épreuve si elle est connue, sinon l'équipe actuelle
      let equipe = r && r.equipe, actuelle = false;
      if (!equipe) {
        actuelle = true;
        // seulement les compagnons déjà rencontrés : au jour 1, l'Errant est seul
        const ids = ['errant'].concat(f.compagnons.includes('phaena') ? ['phaena'] : [],
          f.creature && f.creature !== 'griffon' && f.creatures.includes(f.creature) ? [f.creature] : f.compagnons.includes('griffon') ? ['griffon'] : []);
        equipe = ids.map(id => ({ id, cartes: (f.equipement[id] || []).filter(c => f.cartes[c]) }));
      }
      h += `<h3 class="ficheT">${actuelle ? 'Son équipe' : 'Son équipe ce jour-là'}</h3>` + equipe.map(m => {
        const modele = D.HEROS.concat(D.CREATURES).find(x => x.id === m.id); if (!modele) return '';
        const cartes = m.cartes.map(id => { const i = P.carteInfo(id); if (!i) return ''; const c = f.cartes[id] || {};
          const ev = c.evoluee && D.EVOLUTIONS[id];
          return `<span class="puce">${(ev && ev.art) || i.carte.art || '✦'} ${ev ? ev.nom || i.carte.nom : i.carte.nom}${c.niveau ? ' <i>niv. ' + c.niveau + '</i>' : ''}${c.evoluee ? ' 🌟' : ''}</span>`; }).join('');
        return `<div class="ficheHeros${m.ko ? ' ko' : ''}"><div class="ficheEmo">${modele.emoji}</div><div><b>${modele.nom}</b>${m.ko ? ' <span class="small">· tombé</span>' : ''}<div>${cartes || '<span class="small">aucune carte équipée</span>'}</div></div></div>`;
      }).join('');
      if (f.recents.length > 1) h += '<h3 class="ficheT">Ses derniers jours</h3><div class="ficheJours">' + f.recents.slice().reverse().map(x =>
        `<div class="${x.victoire ? 'gagne' : 'perdu'}"><span>${x.motif || '🧵'}</span><b>J${x.jour}</b><i>${etoilesTxt(x)}</i></div>`).join('') + '</div>';
    }
    $('titreModale').textContent = '🧵 ' + j.nom;
    $('lexiqueCorps').innerHTML = h; $('lexiqueCorps').scrollTop = 0;
    T.dessiner($('ficheTapis'), j.rangs);
    $('retourClassement').onclick = () => $('btnClassement').onclick();
  }

  // ---------- Rappel du matin : une notification ntfy avec la quête du jour (envoyée par le robot « Rappel ») ----------
  $('btnRappel').onclick = () => {
    $('titreModale').textContent = '🔔 Rappel du matin'; $('onglets').innerHTML = '';
    if (!S.conf()) { $('lexiqueCorps').innerHTML = '<p>Le rappel lit ta progression dans la sauvegarde en ligne : configure d\'abord la sauvegarde commune (Réglages, Sauvegarde), ou rejoins le jeu par un lien d\'invitation.</p>'; return $('modale').classList.add('visible'); }
    const afficher = () => {
      const t = profil.ntfy;
      $('lexiqueCorps').innerHTML = t ? `<p>Chaque matin vers 8 h, tu reçois le titre et le Présage de ta prochaine épreuve (sauf si tu as déjà joué).</p>
        <p><b>1.</b> Installe l'appli gratuite <b>ntfy</b> (Play Store ou App Store).</p>
        <p><b>2.</b> Dans ntfy, touche <b>+</b> et abonne-toi au sujet :</p><div class="lienInvit">${t}</div>
        <a href="ntfy://ntfy.sh/${t}" style="display:block;margin-top:6px"><button style="width:100%">📲 Ouvrir dans l'appli ntfy</button></a>
        <p class="small">Sans l'appli, tu peux aussi ouvrir <a href="https://ntfy.sh/${t}" target="_blank" style="color:var(--or)">ntfy.sh/${t}</a> et autoriser les notifications du navigateur.</p>
        <label class="ligneCoche"><input type="checkbox" id="rappelAutres" ${profil.ntfyAutres === false ? '' : 'checked'}> Me prévenir aussi quand un autre tisserand termine son épreuve</label>
        <label class="ligneCoche"><input type="checkbox" id="rappelMsgs" ${profil.ntfyMessages === false ? '' : 'checked'}> Me prévenir des messages du Corbeau d'Hermès 🐦‍⬛</label>
        <button id="rappelTest" style="width:100%;margin-top:6px">🔔 Envoyer une notification de test</button><p class="small" id="rappelTestMsg"></p>
        <button id="rappelOff" style="width:100%;margin-top:6px">Désactiver le rappel</button>`
        : `<p>Reçois chaque matin le titre et le Présage de ta quête du jour, comme une notification d'appli.</p><button class="principal" id="rappelOn" style="width:100%">Activer le rappel</button>`;
      if ($('rappelOn')) $('rappelOn').onclick = () => { profil.ntfy = 'fdm-' + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8); sauver(); afficher(); };
      if ($('rappelAutres')) $('rappelAutres').onchange = e => { profil.ntfyAutres = e.target.checked; sauver(); };
      if ($('rappelMsgs')) $('rappelMsgs').onchange = e => { profil.ntfyMessages = e.target.checked; sauver(); };
      if ($('rappelTest')) $('rappelTest').onclick = async () => {
        const m = $('rappelTestMsg'); m.textContent = 'Envoi…';
        try {
          const r = await fetch('https://ntfy.sh/', { method: 'POST', body: JSON.stringify({ topic: profil.ntfy, title: '🧵 Le Fil des Moires', message: 'Test réussi : tu recevras ici ta quête chaque matin.', click: location.href.split('#')[0], tags: ['crossed_swords'] }) });
          m.textContent = r.ok ? '✅ Envoyée : elle doit arriver sur ton téléphone dans quelques secondes. Sinon, vérifie que tu es bien abonné au sujet ci-dessus dans ntfy.' : '❌ ntfy a refusé l\'envoi (' + r.status + ') : réessaie dans un moment.';
        } catch (e) { m.textContent = '❌ Pas de connexion : réessaie dans un moment.'; }
      };
      if ($('rappelOff')) $('rappelOff').onclick = () => { delete profil.ntfy; sauver(); afficher(); };
    };
    afficher(); $('modale').classList.add('visible');
  };

  const revoirIntro = () => window.Cinematique && Cinematique.jouer(() => { profil.vus.intro = true; sauver(); });
  $('btnIntro').onclick = revoirIntro;
  $('btnTapisInfo').onclick = revoirIntro;
  $('btnEcho').onclick = () => demarrer(true);
  $('btnRetour').onclick = () => {
    VOIX.stop();
    if (partie && partie.mode) { partie = null; return ouvrirTresors(); }
    const suivante = () => { const id = partie && partie.aPresenter && partie.aPresenter.shift(); if (id) presenterCompagnon(id, suivante, true); else accueil(); };
    const ch = partie && !partie.echo && partie.ep.choix, cle = partie && 'j' + partie.ep.jour;
    if (ch && !profil.histoire.choix[cle]) {
      if (partie.etat.fini === 'victoire' || !ch.seulementVictoire) return montrerChoix(partie.ep, suivante);
      profil.histoire.choix[cle] = ch.defaut; sauver();
    }
    suivante();
  };
  $('btnLexique').onclick = () => ouvrirLexique();
  $('btnSync').onclick = ouvrirSync;
  $('btnVitesse').onclick = () => { vitesse = vitesse === 1 ? 0.5 : 1; $('btnVitesse').textContent = 'Vitesse x' + (vitesse === 1 ? 1 : 2); };
  $('btnReset').onclick = () => { profil = migrer(profilVide()); sauver(); toursJoueur = 0; accueil(); };

  if ('serviceWorker' in navigator && location.protocol === 'https:' && !location.hostname.includes('claude')) {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* rien */ }
  }
  accueil();
  $('etatSync').textContent = LIBELLES_SYNC[S.conf() ? 'envoi' : 'local'];
  if (recalee) { recalee = false; sauver(); }
  if (!rejoindre()) { synchroniser(); setTimeout(annoncerNouveautes, 1200); }
  majPastilleCorbeau(); setTimeout(relever, 2500);
})();
