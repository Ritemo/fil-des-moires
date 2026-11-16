/* Le Fil des Moires : interface (phase 0 bis). */
(function () {
  'use strict';
  const M = window.Moteur, D = window.Donnees, T = window.Tapisserie, S = window.Sync, P = window.Progression;
  const $ = id => document.getElementById(id);

  // ---------- Stockage (protégé : peut être indisponible) ----------
  const stock = {
    lire(cle, defaut) { try { const v = localStorage.getItem('fdm_' + cle); return v ? JSON.parse(v) : defaut; } catch (e) { return defaut; } },
    ecrire(cle, v) { try { localStorage.setItem('fdm_' + cle, JSON.stringify(v)); } catch (e) { /* rien */ } }
  };
  const aujourdhui = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const profilVide = () => ({ joursJoues: 0, rangs: [], derniereDate: null, clotho: 'auto', vus: {} });
  let profil = P.initialiser(Object.assign(profilVide(), stock.lire('profil', {})));
  const sauver = () => { profil.maj = Date.now(); stock.ecrire('profil', profil); S.envoyer(profil); };

  // ---------- Sauvegarde commune ----------
  // Au démarrage et quand l'appli revient au premier plan : on prend la version la plus récente.
  async function synchroniser() {
    if (partie) return;
    const distant = await S.telecharger();
    if (distant && distant.maj && distant.maj > (profil.maj || 0)) {
      profil = P.initialiser(Object.assign(profilVide(), distant));
      stock.ecrire('profil', profil);
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
  const NOUVEAUTES = ['debut', 'garde', 'gloire', 'gloireIntro', 'don', 'collection', 'niveau', 'gardien', 'tapisserie', 'discret', 'intention'];
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
  function ecran(id) { document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('actif', e.id === id)); }

  // ---------- Accueil ----------
  function accueil() {
    ecran('accueil');
    partie = null;
    const fait = profil.derniereDate === aujourdhui();
    const jour = fait ? Math.max(1, profil.joursJoues) : profil.joursJoues + 1;
    const ep = D.epreuveDuJour(jour);
    $('mode').textContent = '';
    $('tapisCompte').textContent = profil.rangs.length + ' / 30 rangs';
    T.dessiner($('tapisAccueil'), profil.rangs);
    $('tapisLegende').textContent = profil.rangs.length ? 'Touche un rang pour revoir ta journée.' : 'Ta tapisserie est vierge. Ta première épreuve y tissera un rang.';
    $('titreEpreuve').textContent = 'Jour ' + jour + ' · ' + ep.titre;
    $('dateJour').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    $('presage').textContent = ep.presage;
    $('nouveau').textContent = '✨ ' + ep.nouveau;
    $('nouveau').style.display = fait ? 'none' : 'block';
    $('btnJouer').style.display = fait ? 'none' : 'block';
    $('btnEcho').style.display = fait ? 'block' : 'none';
    const dernier = profil.rangs[profil.rangs.length - 1];
    $('etatJour').textContent = fait && dernier ? 'Épreuve du jour terminée : ' + (dernier.victoire ? 'victoire ' + '★'.repeat(dernier.etoiles) : 'défaite') + '. Nouvelle épreuve demain.' : '';
    $('reglageClotho').value = profil.clotho;
    $('niveauEquipe').textContent = profil.niveau;
    $('xpAccueil').style.width = Math.round(100 * profil.xp / P.xpPourNiveau(profil.niveau)) + '%';
    $('drachmesAccueil').textContent = profil.drachmes;
    $('btnCollection').style.display = profil.joursJoues >= 1 ? 'inline' : 'none';
  }
  $('tapisAccueil').onclick = e => { const r = T.rangTouche($('tapisAccueil'), profil.rangs, e); if (r) $('tapisLegende').textContent = 'Jour ' + r.jour + ' : ' + r.resume; };
  $('reglageClotho').onchange = e => { profil.clotho = e.target.value; sauver(); };

  function demarrer(echo) {
    const jour = echo ? Math.max(1, profil.joursJoues) : profil.joursJoues + 1;
    const ep = D.epreuveDuJour(jour);
    const graine = echo ? Math.floor(Math.random() * 1e9) : M.graineDuJour(aujourdhui() + '|' + jour);
    const totalEnnemis = ep.rencontres.reduce((n, r) => n + r.ennemis.length, 0);
    partie = { echo, jour, ep, rencontre: 0, reprise: null, gloire: 0, graine, affUsage: {}, coupMax: null, kos: 0, vaincus: 0, totalEnnemis, dernierEnnemi: null, pvAff: {} };
    $('mode').textContent = echo ? 'Écho' : 'Jour ' + jour;
    if (jour === 4 && !echo) clotho('discret');
    if (jour > 3) ensuite(() => ouvrirCollection(true), 0);
    else ensuite(presenterEnnemis, 0);
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
    $('introListe').innerHTML = P.ennemisPourJoueur(r, profil, partie.jour).map(ficheEnnemi).join('');
    ecran('intro');
  }
  $('btnCombat').onclick = () => { ecran('combat'); lancerRencontre(); };

  function lancerRencontre() {
    const r = partie.ep.rencontres[partie.rencontre];
    partie.etat = M.creerCombat({ graine: partie.graine + partie.rencontre * 101, allies: P.equipeDuJoueur(partie.ep, profil, partie.jour),
      ennemis: P.ennemisPourJoueur(r, profil, partie.jour), reprise: partie.reprise, gloire: partie.gloire, gloireActive: partie.ep.gloire });
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
        toursJoueur++;
        if (toursJoueur === 1) clotho('energie');
        if (toursJoueur === 3) clotho('poids');
        if (d.acteur.competences.some(c => c.type === 'garde')) clotho('garde');
        occupe = false;
        montrerActions(d.acteur);
      }
    }, duree);
  }

  function finRencontre() {
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
    morceaux.push(partie.kos ? partie.kos + ' héros tombé' + (partie.kos > 1 ? 's' : '') : 'aucun héros tombé');
    const rang = { jour: partie.jour, date: aujourdhui(), titre: partie.ep.titre.replace(/^Le Prologue : /, ''), victoire, etoiles,
      couleur, motif: (etat.unites.find(u => u.gardien) || cible).emoji, resume: morceaux.join(', ') + '.' };
    const rangs = profil.rangs.concat([rang]);
    let g = null, niveaux = 0, butin = {}, dons = null, niveauAvant = profil.niveau;
    if (!partie.echo) {
      profil.rangs = rangs; profil.joursJoues = partie.jour; profil.derniereDate = aujourdhui();
      g = P.gains(victoire, etoiles);
      niveaux = P.ajouterXp(profil, g.xp);
      profil.drachmes += g.drachmes;
      if (victoire) { butin = P.butin(profil, partie.graine + 17, etoiles); dons = P.genererDon(profil, partie.graine + 29); }
      sauver();
    }
    ecran('fin');
    $('finTitre').textContent = victoire ? 'Le fil tient' : 'Le fil a cédé';
    $('finEtoiles').textContent = victoire ? '★'.repeat(etoiles) + '☆'.repeat(3 - etoiles) : '✕';
    $('finXp').textContent = partie.echo ? 'Écho : rang non tissé' : '';
    afficherGains(g, niveaux, niveauAvant, butin);
    $('don').innerHTML = '';
    $('finResume').textContent = rang.resume;
    $('finClotho').textContent = D.CLOTHO[victoire ? 'victoire' : 'defaite'];
    $('btnRetour').disabled = true;
    T.tisser($('tapisFin'), rangs, T_(2400), () => {
      if (!partie.echo) clotho('tapisserie');
      if (dons) proposerDon(dons); else $('btnRetour').disabled = false;
    });
  }

  function nomCarte(id) { const i = P.carteInfo(id); return i ? aff(i.carte.affinite).icone + ' ' + i.carte.nom : id; }
  function afficherGains(g, niveaux, niveauAvant, butin) {
    if (!g) { $('finGains').innerHTML = ''; return; }
    const pct = Math.round(100 * profil.xp / P.xpPourNiveau(profil.niveau));
    const lignes = Object.keys(butin).map(id => nomCarte(id) + ' +' + butin[id]).join(', ');
    $('finGains').innerHTML = `<div class="bourse"><span>Niveau <b>${profil.niveau}</b></span><div class="xpbarre"><i id="xpFin" style="width:0%"></i></div><span>+${g.xp} XP</span></div>
      <div class="bourse"><span>🪙 +${g.drachmes} drachmes (total <b>${profil.drachmes}</b>)</span></div>
      ${lignes ? `<div class="bourse"><span>🃏 Butin : ${lignes}</span></div>` : ''}
      ${niveaux ? `<div class="niveauPlus">✨ Niveau ${niveauAvant} → ${profil.niveau} : +4 % PV et attaque par niveau</div>` : ''}`;
    setTimeout(() => { const x = $('xpFin'); if (x) x.style.width = pct + '%'; }, 100);
    if (niveaux) clotho('niveau');
  }
  function proposerDon(options) {
    const libelle = o => {
      if (o.type === 'carte') { const i = P.carteInfo(o.id); return `🆕 Nouvelle carte : ${nomCarte(o.id)}<small>${P.NOMS_RARETE[P.rarete(o.id)]} · ${i.heros.nom} · ${i.carte.desc}</small>`; }
      if (o.type === 'doublons') return `🃏 ${o.nombre} doublons : ${nomCarte(o.id)}<small>Pour améliorer cette carte (actuellement niveau ${profil.cartes[o.id].niveau}).</small>`;
      return `🪙 Bourse de ${o.nombre} drachmes<small>Pour payer les améliorations.</small>`;
    };
    $('don').innerHTML = '<div class="titreDon">Le Don des Moires : choisis-en un</div>' +
      options.map((o, i) => `<button data-i="${i}">${libelle(o)}</button>`).join('') +
      '<button class="lien" data-i="-1">Passer (+25 🪙)</button>';
    $('don').querySelectorAll('button').forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      P.appliquerDon(profil, i >= 0 ? options[i] : null);
      sauver();
      $('don').innerHTML = '<div class="titreDon">' + (i >= 0 ? 'Don reçu : ' + libelle(options[i]).replace(/<small>.*<\/small>/, '') : 'Tu passes : +25 🪙') + '</div>';
      $('btnRetour').disabled = false;
      clotho('collection');
    });
    clotho('don');
  }

  // ---------- Collection et Préparation ----------
  let modePreparation = false;
  function ouvrirCollection(preparation) {
    modePreparation = !!preparation;
    $('colTitre').textContent = preparation ? '⚔️ Préparation : choisis 4 cartes par héros' : '📜 Collection';
    $('drachmesCol').textContent = profil.drachmes;
    $('btnColOk').textContent = preparation ? 'Partir' : 'Retour';
    if (preparation) {
      const noms = [...new Set(partie.ep.rencontres.flatMap(r => r.ennemis))].map(id => { const e = D.ENNEMIS[id]; return e.emoji + ' ' + e.nom + ' (' + aff(e.affinite).icone + ', faible contre ' + listeAff(faiblesses(e.affinite)) + ')'; });
      $('colMenace').textContent = 'Ce qui t\'attend : ' + noms.join(' · ');
    } else $('colMenace').textContent = 'Améliore tes cartes avec des doublons et des drachmes. Chaque niveau donne +10 % de puissance.';
    const heros = P.herosDisponibles(profil);
    $('colListe').innerHTML = D.HEROS.filter(h => heros.includes(h.id)).map(h => {
      const cartes = h.competences.filter(c => c.type !== 'garde');
      const eq = profil.equipement[h.id] || [];
      return `<h3>${h.emoji} ${h.nom} <span class="small">(${eq.length}/${P.SLOTS} équipées)</span></h3>` + cartes.map(c => {
        const r = P.rarete(c.id), col = P.COULEURS_RARETE[r], possede = profil.cartes[c.id];
        if (!possede) return `<div class="carteC inconnue" style="--r:${col}"><div class="ic">❔</div><div class="mil"><div class="nm">Carte à découvrir <small>${P.NOMS_RARETE[r]}</small></div><div class="sd">Elle viendra d'un Don des Moires.</div></div></div>`;
        const cout = P.coutAmelioration(profil, c.id);
        const prog = cout ? Math.min(100, Math.round(100 * possede.doublons / cout.doublons)) : 100;
        const puiss = c.puissance ? ' · Puiss. ' + Math.round(c.puissance * P.multiplicateurCarte(possede.niveau)) : '';
        const equipee = eq.includes(c.id);
        const btnEq = c.prouesse ? '' : `<button class="${equipee ? 'on' : ''}" data-eq="${h.id}|${c.id}">${equipee ? '✓ Équipée' : 'Équiper'}</button>`;
        const btnAm = cout ? `<button class="${P.peutAmeliorer(profil, c.id) ? 'pret' : ''}" data-am="${c.id}" ${P.peutAmeliorer(profil, c.id) ? '' : 'disabled'}>⬆ 🪙${cout.drachmes}</button>` : '<button disabled>Max</button>';
        return `<div class="carteC" style="--r:${col}"><div class="ic">${aff(c.affinite).icone}</div><div class="mil">
          <div class="nm">${c.nom} <small>${P.NOMS_RARETE[r]} · Nv ${possede.niveau}</small></div>
          <div class="sd">${c.cout ? '🔹' + c.cout : 'Gratuit'}${puiss} · ${c.desc}</div>
          <div class="sd">🃏 ${possede.doublons}${cout ? ' / ' + cout.doublons : ''} doublons</div><div class="prog"><i style="width:${prog}%"></i></div></div>
          <div class="btns">${btnAm}${btnEq}</div></div>`;
      }).join('');
    }).join('');
    $('colListe').querySelectorAll('[data-am]').forEach(b => b.onclick = () => { if (P.ameliorer(profil, b.dataset.am)) { sauver(); ouvrirCollection(modePreparation); } });
    $('colListe').querySelectorAll('[data-eq]').forEach(b => b.onclick = () => {
      const [h, c] = b.dataset.eq.split('|');
      if (!P.basculerEquipement(profil, h, c)) { $('colMenace').textContent = 'Déjà 4 cartes équipées pour ce héros : retire-en une d\'abord.'; return; }
      sauver(); ouvrirCollection(modePreparation);
    });
    ecran('collection');
  }
  $('btnCollection').onclick = () => ouvrirCollection(false);
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
    document.querySelectorAll('#actions button').forEach(b => b.classList.toggle('conseil', b.dataset.id === c.comp.id));
    partie.conseil = c;
  }
  $('btnIndice').onclick = montrerConseil;

  // ---------- Actions du joueur ----------
  function montrerActions(acteur) {
    $('tourDe').textContent = 'À ' + acteur.nom + ' · Énergie 🔹' + acteur.energie + '/' + acteur.energieMax;
    $('btnAnnuler').style.display = 'none';
    $('desc').textContent = 'Choisis une compétence, puis une cible.';
    $('actions').innerHTML = '';
    partie.conseil = null;
    M.competencesDisponibles(partie.etat, acteur).forEach(c => {
      if (c.prouesse && !c.possible) return;
      const b = document.createElement('button');
      b.dataset.id = c.id;
      b.innerHTML = `${aff(c.affinite).icone} ${c.nom}${c.niveau > 1 ? ' <span style="color:#b07be0">Nv ' + c.niveau + '</span>' : ''}<small>${resume(c)}</small>`;
      b.disabled = !c.possible;
      if (c.prouesse) b.classList.add('prouesse');
      b.onclick = () => choisir(acteur, c, b);
      $('actions').appendChild(b);
    });
    if (guidage() === 'bavarde') montrerConseil();
  }

  function choisir(acteur, comp, bouton) {
    if (occupe) return;
    document.querySelectorAll('.actions button').forEach(b => b.classList.remove('choisi'));
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
    $('actions').innerHTML = ''; $('desc').textContent = ''; $('btnAnnuler').style.display = 'none';
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
        case 'rate': plus(350, () => { flotter(carteEl(e.cible), 'Raté', 'faible'); ajouterEffet('Raté'); }); break;
        case 'soin': plus(450, () => { const c = carteEl(e.cible); flotter(c, '+' + e.soin, 'soin'); particules(c, '✨', 5); journal(N(e.cible) + ' récupère ' + e.soin + ' PV'); }); break;
        case 'brulure': plus(550, () => { banniere('🔥 Brûlure', N(e.cible), '-' + e.degats + ' PV'); const c = carteEl(e.cible); rejouer(c, 'touche'); particules(c, '🔥', 4); flotter(c, '-' + e.degats); }); break;
        case 'etat': plus(250, () => { if (e.etat === 'etourdi') { flotter(carteEl(e.cible), '💫 Étourdi', 'info'); ajouterEffet('Étourdi !'); } if (e.etat === 'brulure') ajouterEffet('Brûlure 2 tours'); }); break;
        case 'interception': plus(400, () => { flotter(carteEl(e.gardien), '🛡️ intercepte', 'info'); ajouterEffet(N(e.gardien) + ' intercepte'); journal(N(e.gardien) + ' intercepte le coup !'); }); break;
        case 'garde': plus(350, () => { flotter(carteEl(e.cible), '🛡️ protégé', 'info'); ajouterEffet(N(e.cible) + ' est protégé'); }); break;
        case 'presage': plus(350, () => { flotter(carteEl(e.cible), '⏩ joue ensuite', 'info'); ajouterEffet(N(e.cible) + ' joue juste après'); }); break;
        case 'oeil': plus(350, () => { flotter(carteEl(e.cible), '👁️ prochain coup critique', 'info'); ajouterEffet(N(e.cible) + ' : prochain coup critique'); }); break;
        case 'recul': plus(300, () => { flotter(carteEl(e.cible), '⏪ recule', 'info'); ajouterEffet('Recule dans la File'); }); break;
        case 'ko': plus(800, () => {
          const u = M.unite(etat, e.cible);
          rejouer(carteEl(e.cible), 'effiloche');
          ajouterEffet(N(e.cible) + ' tombe');
          journal(N(e.cible) + ' tombe.');
          if (u.camp === 'allie') { partie.kos++; clotho('ko'); } else { partie.vaincus++; $('filProgres').style.width = Math.round(100 * partie.vaincus / partie.totalEnnemis) + '%'; }
        }); break;
        case 'gloirePleine': plus(300, () => { journal('🏆 La Gloire est pleine !'); clotho('gloire'); }); break;
        case 'cauterise': plus(400, () => { flotter(carteEl(e.cible), '♨️ cautérisé', 'info'); ajouterEffet('Plaie cautérisée'); }); break;
        case 'tete': plus(600, () => { flotter(carteEl(e.cible), '🐍 +1 tête', 'faible'); ajouterEffet('Une tête repousse ! (' + e.tetes + ')', true); journal('Une tête repousse (' + e.tetes + ').'); clotho('tete'); }); break;
        case 'teteAttaque': plus(250, () => ajouterEffet('Morsure d\'une autre tête')); break;
        case 'etourdi': plus(650, () => { banniere('💫 Étourdi', N(e.cible) + ' perd son tour', ''); flotter(carteEl(e.cible), '💫', 'info'); }); break;
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
    const onglets = ['Combat', 'Affinités', 'États', 'Cartes', 'Héros', 'Ennemis', 'Épreuve'];
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
      h = Object.values(D.ENNEMIS).map(e => `<div class="ligne"><b>${e.emoji} ${e.nom}</b> · ${aff(e.affinite).icone} ${aff(e.affinite).nom} · ❤️ ${e.pvMax}<br>
        Faible contre : ${listeAff(faiblesses(e.affinite))}. Résiste à : ${listeAff(forces(e.affinite))}.<br><span class="small">${e.special}</span></div>`).join('');
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
        profil = P.initialiser(Object.assign(profilVide(), p)); sauver(); $('syncMsg').textContent = '✅ Partie chargée.'; accueil();
      } catch (e) { $('syncMsg').textContent = '❌ Ce code n\'est pas valide.'; }
    };
    $('modale').classList.add('visible');
  }

  // ---------- Boutons ----------
  $('btnJouer').onclick = () => demarrer(false);
  $('btnEcho').onclick = () => demarrer(true);
  $('btnRetour').onclick = accueil;
  $('btnLexique').onclick = () => ouvrirLexique();
  $('btnSync').onclick = ouvrirSync;
  $('btnVitesse').onclick = () => { vitesse = vitesse === 1 ? 0.5 : 1; $('btnVitesse').textContent = 'Vitesse x' + (vitesse === 1 ? 1 : 2); };
  $('btnJourSuivant').onclick = () => { profil.derniereDate = null; sauver(); accueil(); };
  $('btnReset').onclick = () => { profil = P.initialiser(profilVide()); sauver(); toursJoueur = 0; accueil(); };

  if ('serviceWorker' in navigator && location.protocol === 'https:' && !location.hostname.includes('claude')) {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* rien */ }
  }
  accueil();
  $('etatSync').textContent = LIBELLES_SYNC[S.conf() ? 'envoi' : 'local'];
  synchroniser();
})();
