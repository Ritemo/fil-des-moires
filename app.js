/* Le Fil des Moires : interface de la phase 0. */
(function () {
  'use strict';
  const M = window.Moteur, D = window.Donnees;
  const $ = id => document.getElementById(id);

  // ---------- Stockage (protégé : peut être indisponible) ----------
  const stock = {
    lire(cle, defaut) { try { const v = localStorage.getItem('fdm_' + cle); return v ? JSON.parse(v) : defaut; } catch (e) { return defaut; } },
    ecrire(cle, v) { try { localStorage.setItem('fdm_' + cle, JSON.stringify(v)); } catch (e) { /* rien */ } }
  };
  const aujourdhui = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  let vus = stock.lire('vus', {});
  let partie = null; // { echo, rencontre, etat, reprise, gloire, graine }
  let selection = null; // compétence choisie
  let enAttente = null; // suite à exécuter après fermeture de Clotho
  let occupe = false;

  // ---------- Clotho ----------
  const fileClotho = [];
  function clotho(cle, forcer) {
    if (!forcer && vus[cle]) return;
    vus[cle] = true; stock.ecrire('vus', vus);
    fileClotho.push(D.CLOTHO[cle]);
    if (!$('clotho').classList.contains('visible')) montrerClotho();
  }
  function montrerClotho() {
    const t = fileClotho.shift();
    if (!t) { $('clotho').classList.remove('visible'); $('voile').classList.remove('visible');
      if (enAttente) { const f = enAttente; enAttente = null; f(); } return; }
    $('clothoTexte').textContent = t;
    $('clotho').classList.add('visible'); $('voile').classList.add('visible');
  }
  $('clothoOk').onclick = montrerClotho;
  function ensuite(f, ms) {
    setTimeout(() => { if ($('clotho').classList.contains('visible')) enAttente = f; else f(); }, ms || 0);
  }

  // ---------- Écrans ----------
  function ecran(id) { document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('actif', e.id === id)); }

  function accueil() {
    ecran('accueil');
    const jour = stock.lire('jour', null);
    const fait = jour && jour.date === aujourdhui();
    $('mode').textContent = '';
    $('titreEpreuve').textContent = D.EPREUVE.titre;
    $('dateJour').textContent = 'Épreuve du ' + new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    $('presage').textContent = D.EPREUVE.presage;
    $('equipe').innerHTML = D.HEROS.map(h => `<div><div class="e">${h.emoji}</div><b>${h.nom}</b><br>${h.role}<br>${M.AFFINITES[h.affinite].icone} ${M.AFFINITES[h.affinite].nom}</div>`).join('');
    $('btnJouer').style.display = fait ? 'none' : 'block';
    $('btnEcho').style.display = fait ? 'block' : 'none';
    $('etatJour').textContent = fait ? 'Épreuve du jour terminée : ' + (jour.victoire ? 'victoire ' + '★'.repeat(jour.etoiles) : 'défaite') + '. Nouvelle épreuve demain.' : '';
  }

  function demarrer(echo) {
    const graine = echo ? Math.floor(Math.random() * 1e9) : M.graineDuJour(aujourdhui());
    partie = { echo, rencontre: 0, reprise: null, gloire: 0, graine, xp: 0 };
    $('mode').textContent = echo ? 'Mode Écho (sans récompense)' : 'Épreuve du jour';
    ecran('combat');
    lancerRencontre();
  }

  function lancerRencontre() {
    const r = D.EPREUVE.rencontres[partie.rencontre];
    partie.etat = M.creerCombat({ graine: partie.graine + partie.rencontre * 101, allies: D.HEROS,
      ennemis: r.ennemis.map(id => D.ENNEMIS[id]), reprise: partie.reprise, gloire: partie.gloire, premieresFois: vus });
    $('nomRencontre').textContent = r.nom;
    $('journal').innerHTML = '';
    afficher();
    if (partie.rencontre === 0) clotho('debut');
    if (partie.etat.unites.some(u => u.gardien)) clotho('gardien');
    ensuite(boucle, 500);
  }

  // ---------- Boucle de combat ----------
  let toursJoueur = 0;
  function boucle() {
    const etat = partie.etat;
    if (etat.fini) return finRencontre();
    const d = M.debutTour(etat);
    animer(d.evenements);
    afficher(d.acteur);
    if (etat.fini || M.verifierFin(etat)) return ensuite(finRencontre, 700);
    if (d.passe) { if (d.acteur) journal(nom(d.acteur) + ' passe son tour.'); return ensuite(boucle, 800); }
    if (M.prevision(etat, 8).some(p => p.annonce)) clotho('annonce');
    if (d.acteur.camp === 'ennemi') {
      ensuite(() => {
        const ev = M.tourEnnemi(etat, d.acteur);
        animer(ev); afficher();
        ensuite(boucle, 900);
      }, 700);
    } else {
      toursJoueur++;
      if (toursJoueur === 2) clotho('poids');
      occupe = false;
      montrerActions(d.acteur);
    }
  }

  function finRencontre() {
    const etat = partie.etat;
    if (etat.fini === 'victoire' && partie.rencontre < D.EPREUVE.rencontres.length - 1) {
      // Report entre deux rencontres : petit soin, les KO reviennent à 25 %
      partie.reprise = {};
      etat.unites.filter(u => u.camp === 'allie').forEach(u => {
        const pv = u.ko ? Math.round(u.pvMax * 0.25) : Math.min(u.pvMax, u.pv + Math.round(u.pvMax * D.EPREUVE.soinEntre));
        partie.reprise[u.id] = { pv, energie: u.energie, hubris: u.hubris };
      });
      partie.gloire = etat.gloire;
      partie.rencontre++;
      journal('Victoire ! L\'équipe reprend son souffle (+30 % PV).');
      return ensuite(lancerRencontre, 1200);
    }
    const victoire = etat.fini === 'victoire';
    const etoiles = M.etoiles(etat);
    const xp = victoire ? 120 + 40 * etoiles : 60;
    if (!partie.echo) stock.ecrire('jour', { date: aujourdhui(), victoire, etoiles });
    ecran('fin');
    $('finTitre').textContent = victoire ? 'Le fil tient' : 'Le fil a cédé';
    $('finEtoiles').textContent = victoire ? '★'.repeat(etoiles) + '☆'.repeat(3 - etoiles) : '✕';
    $('finXp').textContent = partie.echo ? 'Mode Écho : aucune récompense.' : '+' + xp + ' XP (la progression arrive en phase 1)';
    $('finClotho').textContent = D.CLOTHO[victoire ? 'victoire' : 'defaite'];
    $('finEcho').textContent = partie.echo ? '' : 'Tu peux rejouer cette épreuve en mode Écho pour t\'entraîner.';
  }

  // ---------- Actions du joueur ----------
  function montrerActions(acteur) {
    selection = null;
    $('tourDe').textContent = 'À ' + acteur.nom + ' (' + acteur.role + ') · ⚡ ' + acteur.energie + '/' + acteur.energieMax;
    $('btnAnnuler').style.display = 'none';
    $('desc').textContent = 'Choisis une compétence.';
    const comps = M.competencesDisponibles(partie.etat, acteur);
    $('actions').innerHTML = '';
    comps.forEach(c => {
      if (c.prouesse && !c.possible) return;
      const b = document.createElement('button');
      const aff = M.AFFINITES[c.affinite];
      b.innerHTML = `${aff.icone} ${c.nom}<small>${c.cout ? '⚡'.repeat(c.cout) : 'Gratuit'} · ${M.NOM_POIDS[c.poids || 'normal']}${c.hubris ? ' · +' + c.hubris + ' Hubris' : ''}</small>`;
      b.disabled = !c.possible;
      if (c.prouesse) b.classList.add('prouesse');
      b.onclick = () => choisir(acteur, c, b);
      $('actions').appendChild(b);
    });
  }

  function choisir(acteur, comp, bouton) {
    if (occupe) return;
    document.querySelectorAll('.actions button').forEach(b => b.classList.remove('choisi'));
    bouton.classList.add('choisi');
    selection = comp;
    $('desc').textContent = comp.desc || '';
    $('btnAnnuler').style.display = 'inline';
    if (comp.zone) {
      $('desc').textContent = (comp.desc || '') + ' Touche à nouveau pour lancer.';
      bouton.onclick = () => executer(acteur, comp, null);
      return;
    }
    const cibles = M.ciblesPossibles(partie.etat, acteur, comp).map(u => u.uid);
    document.querySelectorAll('.unite').forEach(el => {
      el.classList.toggle('ciblable', cibles.includes(el.dataset.uid));
      el.onclick = cibles.includes(el.dataset.uid) ? () => executer(acteur, comp, el.dataset.uid) : null;
    });
    // indication d'efficacité sur les cibles ennemies
    document.querySelectorAll('.unite.ciblable').forEach(el => {
      const u = M.unite(partie.etat, el.dataset.uid);
      if (comp.type !== 'attaque' || u.camp !== 'ennemi') return;
      const m = M.multiplicateur(comp.affinite, u.affinite);
      if (m !== 1) flotter(el, m > 1 ? 'Efficace' : 'Peu efficace', 'info');
    });
  }
  $('btnAnnuler').onclick = () => { const a = M.acteurSuivant(partie.etat); afficher(a); montrerActions(a); };

  function executer(acteur, comp, cibleUid) {
    if (occupe) return;
    occupe = true;
    $('actions').innerHTML = ''; $('desc').textContent = ''; $('btnAnnuler').style.display = 'none';
    const ev = M.agir(partie.etat, acteur.uid, comp.id, cibleUid);
    animer(ev); afficher();
    ensuite(boucle, 900);
  }

  // ---------- Affichage ----------
  const nom = u => u.nom;
  function carte(u, acteur) {
    const pct = Math.round(100 * u.pv / u.pvMax);
    const aff = M.AFFINITES[u.affinite];
    let etats = '';
    if (u.etats.brulure) etats += '🔥';
    if (u.etats.etourdi) etats += '💫';
    if (u.etats.cauterise) etats += '♨️';
    if (u.gardePar) etats += '🛡️';
    if (u.mecanique === 'hydre') etats += ' ' + '🐍'.repeat(u.tetes);
    const pips = u.camp === 'allie' ? `<div class="pips">${Array.from({ length: u.energieMax }, (_, i) => `<b class="${i < u.energie ? 'on' : ''}"></b>`).join('')}</div>
      <div class="hub" title="Hubris"><i style="width:${u.hubris}%"></i></div>` : '';
    return `<div class="unite ${u.ko ? 'ko' : ''} ${acteur && acteur.uid === u.uid ? 'actif' : ''} ${u.gardien ? 'gardien' : ''}" data-uid="${u.uid}">
      <div class="e">${u.emoji}</div><div class="nom">${u.nom}</div><div class="aff">${aff.icone} ${aff.nom}</div>
      <div class="barre ${pct < 30 ? 'bas' : ''}"><i style="width:${pct}%"></i></div><div class="pvtxt">${u.pv} / ${u.pvMax}</div>
      ${pips}<div class="etats">${etats}</div></div>`;
  }

  function afficher(acteur) {
    const etat = partie.etat;
    acteur = acteur || M.acteurSuivant(etat);
    $('ennemis').innerHTML = etat.unites.filter(u => u.camp === 'ennemi').map(u => carte(u, acteur)).join('');
    $('allies').innerHTML = etat.unites.filter(u => u.camp === 'allie').map(u => carte(u, acteur)).join('');
    const prev = M.prevision(etat, 8);
    $('file').innerHTML = '<span class="lbl">File</span>' + prev.map((p, i) => {
      const u = M.unite(etat, p.uid);
      return `<div class="jeton ${u.camp} ${i === 0 ? 'premier' : ''}">${u.emoji}${p.annonce ? '<span class="alerte">⚠️</span>' : ''}</div>`;
    }).join('') + '<button class="aide" id="btnInfo">ⓘ</button>';
    $('btnInfo').onclick = () => $('modale').classList.add('visible');
    $('gloire').style.width = etat.gloire + '%';
    $('gloireTxt').textContent = etat.gloire;
    // Le panneau d'actions est rempli ensuite par montrerActions, si c'est au joueur
    $('tourDe').textContent = acteur ? 'Tour de ' + acteur.nom : '';
    $('actions').innerHTML = ''; $('desc').textContent = ''; $('btnAnnuler').style.display = 'none';
    if (acteur && acteur.camp === 'ennemi') {
      if (acteur.intention && acteur.intention.annonce) {
        const c = acteur.competences.find(c => c.id === acteur.intention.competence);
        $('desc').textContent = '⚠️ Prépare : ' + c.nom;
      }
    }
  }

  function el(uid) { return document.querySelector(`.unite[data-uid="${uid}"]`); }
  function flotter(elem, texte, classe) {
    if (!elem) return;
    const f = document.createElement('div');
    f.className = 'flottant ' + (classe || '');
    f.textContent = texte;
    elem.appendChild(f);
    setTimeout(() => f.remove(), 1000);
  }
  function journal(t) {
    const j = $('journal');
    j.insertAdjacentHTML('afterbegin', '<div>' + t + '</div>');
    while (j.children.length > 3) j.lastChild.remove();
  }

  function animer(evenements) {
    const etat = partie.etat;
    const N = uid => nom(M.unite(etat, uid));
    // On affiche d'abord, puis on ajoute les nombres flottants après le rendu
    setTimeout(() => {
      evenements.forEach(e => {
        switch (e.type) {
          case 'action': journal(N(e.source) + ' : ' + e.nom); break;
          case 'degats': {
            const c = el(e.cible); if (c) { c.classList.add('touche'); }
            flotter(c, '-' + e.degats + (e.critique ? ' !' : ''), e.mult > 1 ? 'fort' : e.mult < 1 ? 'faible' : '');
            const src = M.unite(etat, e.source);
            if (src.camp === 'allie' && e.mult > 1) { journal('C\'est efficace !'); clotho('efficace'); }
            if (src.camp === 'allie' && e.mult < 1) { journal('Peu efficace...'); clotho('peuEfficace'); }
            if (e.critique) journal('Coup critique !');
            break;
          }
          case 'rate': flotter(el(e.cible), 'Raté', 'faible'); break;
          case 'soin': flotter(el(e.cible), '+' + e.soin, 'soin'); break;
          case 'brulure': flotter(el(e.cible), '🔥 -' + e.degats); break;
          case 'etat': if (e.etat === 'etourdi') flotter(el(e.cible), 'Étourdi', 'info'); break;
          case 'interception': journal(N(e.gardien) + ' intercepte le coup !'); flotter(el(e.gardien), '🛡️', 'info'); break;
          case 'garde': journal(N(e.source) + ' protège ' + N(e.cible) + '.'); break;
          case 'presage': journal(N(e.cible) + ' jouera juste après.'); flotter(el(e.cible), '⏩', 'info'); break;
          case 'recul': flotter(el(e.cible), '⏪ recule', 'info'); break;
          case 'ko': journal(N(e.cible) + ' tombe.'); if (M.unite(etat, e.cible).camp === 'allie') clotho('ko'); break;
          case 'gloirePleine': journal('La Gloire est pleine !'); clotho('gloire'); break;
          case 'hubris': if (e.valeur >= 50) clotho('hubris'); break;
          case 'nemesis': journal('Némésis frappe ' + N(e.cible) + ' (-' + e.degats + ' PV, tour perdu).'); flotter(el(e.cible), 'Némésis', 'faible'); clotho('nemesis'); break;
          case 'cauterise': journal('La plaie est cautérisée.'); flotter(el(e.cible), '♨️ cautérisé', 'info'); break;
          case 'tete': journal('Une tête repousse ! (' + e.tetes + ')'); flotter(el(e.cible), '+1 tête', 'faible'); clotho('tete'); break;
          case 'etourdi': flotter(el(e.cible), '💫', 'info'); break;
        }
      });
    }, 30);
  }

  // ---------- Boutons ----------
  $('btnJouer').onclick = () => demarrer(false);
  $('btnEcho').onclick = () => demarrer(true);
  $('btnRetour').onclick = accueil;
  $('btnAide').onclick = () => $('modale').classList.add('visible');
  $('modaleOk').onclick = () => $('modale').classList.remove('visible');
  $('btnReset').onclick = () => { stock.ecrire('jour', null); stock.ecrire('vus', {}); vus = {}; toursJoueur = 0; accueil(); };

  if ('serviceWorker' in navigator && location.protocol === 'https:' && !location.hostname.includes('claude')) {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* rien */ }
  }
  accueil();
})();
