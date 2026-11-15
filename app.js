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
  let partie = null;
  let enAttente = null;
  let occupe = false;
  let toursJoueur = 0;

  // ---------- Clotho ----------
  const fileClotho = [];
  function clotho(cle) {
    if (vus[cle]) return;
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
  // Exécute f après ms millisecondes, ou après la fermeture de Clotho si elle parle
  function ensuite(f, ms) {
    setTimeout(() => { if ($('clotho').classList.contains('visible') || $('modale').classList.contains('visible')) enAttente = f; else f(); }, ms || 0);
  }

  // ---------- Petites aides ----------
  const aff = id => M.AFFINITES[id];
  const forces = a => (M.FORT_CONTRE[a] || []);
  const faiblesses = a => Object.keys(M.FORT_CONTRE).filter(k => M.FORT_CONTRE[k].includes(a));
  const listeAff = l => l.length ? l.map(a => aff(a).icone + ' ' + aff(a).nom).join(', ') : 'aucune';
  const energie = n => n ? '🔹' + n : 'Gratuit';
  function resume(c) {
    const p = [];
    p.push(c.cout ? '<b>' + energie(c.cout) + '</b>' : 'Gratuit');
    if (c.type === 'attaque') p.push('Puiss. ' + c.puissance + (c.zone ? ' (tous)' : ''));
    if (c.type === 'soin') p.push('Soin ' + c.puissance);
    p.push(M.NOM_POIDS[c.poids || 'normal']);
    if (c.hubris) p.push('+' + c.hubris + ' Hubris');
    return p.join(' · ');
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
    $('equipe').innerHTML = D.HEROS.map(h => `<div><div class="e">${h.emoji}</div><b>${h.nom}</b><br>${h.role}<br>${aff(h.affinite).icone} ${aff(h.affinite).nom}</div>`).join('');
    $('btnJouer').style.display = fait ? 'none' : 'block';
    $('btnEcho').style.display = fait ? 'block' : 'none';
    $('etatJour').textContent = fait ? 'Épreuve du jour terminée : ' + (jour.victoire ? 'victoire ' + '★'.repeat(jour.etoiles) : 'défaite') + '. Nouvelle épreuve demain.' : '';
  }

  function demarrer(echo) {
    const graine = echo ? Math.floor(Math.random() * 1e9) : M.graineDuJour(aujourdhui());
    partie = { echo, rencontre: 0, reprise: null, gloire: 0, graine };
    $('mode').textContent = echo ? 'Écho' : 'Épreuve du jour';
    presenterEnnemis();
  }

  // ---------- Présentation des ennemis avant chaque rencontre ----------
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
    const r = D.EPREUVE.rencontres[partie.rencontre];
    $('introTitre').textContent = r.nom + ' · ce qui t\'attend';
    $('introListe').innerHTML = r.ennemis.map(id => ficheEnnemi(D.ENNEMIS[id])).join('');
    ecran('intro');
  }
  $('btnCombat').onclick = () => { ecran('combat'); lancerRencontre(); };

  function lancerRencontre() {
    const r = D.EPREUVE.rencontres[partie.rencontre];
    partie.etat = M.creerCombat({ graine: partie.graine + partie.rencontre * 101, allies: D.HEROS,
      ennemis: r.ennemis.map(id => D.ENNEMIS[id]), reprise: partie.reprise, gloire: partie.gloire });
    $('nomRencontre').textContent = r.nom;
    $('journal').innerHTML = '';
    afficher();
    if (partie.rencontre === 0) clotho('debut');
    if (partie.etat.unites.some(u => u.gardien)) clotho('gardien');
    ensuite(boucle, 500);
  }

  // ---------- Boucle de combat ----------
  function boucle() {
    const etat = partie.etat;
    if (etat.fini) return finRencontre();
    const d = M.debutTour(etat);
    afficher(d.acteur);
    const duree = animer(d.evenements);
    ensuite(() => {
      afficher(d.acteur);
      if (etat.fini || M.verifierFin(etat)) return ensuite(finRencontre, 500);
      if (d.passe) { if (d.acteur) journal(d.acteur.nom + ' ne peut pas agir.'); return ensuite(boucle, 700); }
      if (M.prevision(etat, 8).some(p => p.annonce)) clotho('annonce');
      if (d.acteur.camp === 'ennemi') {
        ensuite(() => {
          const ev = M.tourEnnemi(etat, d.acteur);
          const t = animer(ev);
          ensuite(() => { afficher(); ensuite(boucle, 350); }, t);
        }, 650);
      } else {
        toursJoueur++;
        if (toursJoueur === 2) clotho('poids');
        occupe = false;
        montrerActions(d.acteur);
      }
    }, duree);
  }

  function finRencontre() {
    const etat = partie.etat;
    if (etat.fini === 'victoire' && partie.rencontre < D.EPREUVE.rencontres.length - 1) {
      partie.reprise = {};
      etat.unites.filter(u => u.camp === 'allie').forEach(u => {
        const pv = u.ko ? Math.round(u.pvMax * 0.25) : Math.min(u.pvMax, u.pv + Math.round(u.pvMax * D.EPREUVE.soinEntre));
        partie.reprise[u.id] = { pv, energie: u.energie, hubris: u.hubris };
      });
      partie.gloire = etat.gloire;
      partie.rencontre++;
      banniere('Victoire !', "L'équipe reprend son souffle", '+30 % PV');
      return ensuite(() => { cacherBanniere(); presenterEnnemis(); }, 1500);
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
    $('tourDe').textContent = 'À ' + acteur.nom + ' (' + acteur.role + ') · Énergie ' + '🔹'.repeat(acteur.energie) + ' ' + acteur.energie + '/' + acteur.energieMax;
    $('btnAnnuler').style.display = 'none';
    $('desc').textContent = 'Choisis une compétence. 🔹 = points d\'Énergie nécessaires.';
    $('actions').innerHTML = '';
    M.competencesDisponibles(partie.etat, acteur).forEach(c => {
      if (c.prouesse && !c.possible) return;
      const b = document.createElement('button');
      b.innerHTML = `${aff(c.affinite).icone} ${c.nom}<small>${resume(c)}</small>`;
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
    $('btnAnnuler').style.display = 'inline';
    document.querySelectorAll('.unite').forEach(el => { el.classList.remove('ciblable'); el.onclick = null; });
    if (comp.zone) {
      $('desc').textContent = (comp.desc || '') + ' Touche à nouveau pour lancer.';
      bouton.onclick = () => executer(acteur, comp, null);
      return;
    }
    $('desc').textContent = (comp.desc || '') + ' Touche une cible.';
    const cibles = M.ciblesPossibles(partie.etat, acteur, comp).map(u => u.uid);
    document.querySelectorAll('.unite').forEach(el => {
      if (!cibles.includes(el.dataset.uid)) return;
      el.classList.add('ciblable');
      el.onclick = () => executer(acteur, comp, el.dataset.uid);
      const u = M.unite(partie.etat, el.dataset.uid);
      if (comp.type === 'attaque' && u.camp === 'ennemi') {
        const m = M.multiplicateur(comp.affinite, u.affinite);
        if (m !== 1) flotter(el, m > 1 ? 'Efficace x1,5' : 'Peu efficace x0,67', 'info', 1400);
      }
    });
  }
  $('btnAnnuler').onclick = () => { const a = M.acteurSuivant(partie.etat); afficher(a); montrerActions(a); };

  function executer(acteur, comp, cibleUid) {
    if (occupe) return;
    occupe = true;
    $('actions').innerHTML = ''; $('desc').textContent = ''; $('btnAnnuler').style.display = 'none';
    document.querySelectorAll('.unite').forEach(el => { el.classList.remove('ciblable'); el.onclick = null; });
    const ev = M.agir(partie.etat, acteur.uid, comp.id, cibleUid);
    const t = animer(ev);
    ensuite(() => { afficher(); ensuite(boucle, 350); }, t);
  }

  // ---------- Affichage ----------
  function carte(u, acteur) {
    const pct = Math.round(100 * u.pv / u.pvMax);
    let etats = '';
    if (u.etats.brulure) etats += '🔥';
    if (u.etats.etourdi) etats += '💫';
    if (u.etats.cauterise) etats += '♨️';
    if (u.gardePar) etats += '🛡️';
    if (u.mecanique === 'hydre') etats += ' ' + '🐍'.repeat(u.tetes);
    const pips = u.camp === 'allie' ? `<div class="pips">${Array.from({ length: u.energieMax }, (_, i) => `<b class="${i < u.energie ? 'on' : ''}"></b>`).join('')}</div>
      <div class="hub" title="Hubris"><i style="width:${u.hubris}%"></i></div>` : '';
    return `<div class="unite ${u.ko ? 'ko' : ''} ${acteur && acteur.uid === u.uid ? 'actif' : ''} ${u.gardien ? 'gardien' : ''}" data-uid="${u.uid}">
      <div class="eclat"></div>
      <div class="e">${u.emoji}</div><div class="nom">${u.nom}</div><div class="aff">${aff(u.affinite).icone} ${aff(u.affinite).nom}</div>
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
    }).join('');
    $('gloire').style.width = etat.gloire + '%';
    $('gloireTxt').textContent = etat.gloire;
    $('tourDe').textContent = acteur ? 'Tour de ' + acteur.nom : '';
    $('actions').innerHTML = ''; $('desc').textContent = ''; $('btnAnnuler').style.display = 'none';
    if (acteur && acteur.camp === 'ennemi' && acteur.intention) {
      const c = acteur.competences.find(c => c.id === acteur.intention.competence);
      $('desc').textContent = acteur.intention.annonce ? '⚠️ Prépare : ' + c.nom + (c.zone ? ' (toute ton équipe)' : '') : 'Réfléchit...';
    }
  }

  function el(uid) { return document.querySelector(`.unite[data-uid="${uid}"]`); }
  function flotter(elem, texte, classe, duree) {
    if (!elem) return;
    const f = document.createElement('div');
    f.className = 'flottant ' + (classe || '');
    f.textContent = texte;
    if (duree) f.style.animationDuration = duree + 'ms';
    elem.appendChild(f);
    setTimeout(() => f.remove(), duree || 1000);
  }
  function rejouer(elem, classe) { if (!elem) return; elem.classList.remove(classe); void elem.offsetWidth; elem.classList.add(classe); }
  function journal(t) {
    const j = $('journal');
    j.insertAdjacentHTML('afterbegin', '<div>' + t + '</div>');
    while (j.children.length > 3) j.lastChild.remove();
  }
  function banniere(qui, quoi, eff) {
    $('banniere').innerHTML = `<div class="qui">${qui}</div><div class="quoi">${quoi}</div><div class="eff">${eff || ''}</div>`;
    $('banniere').classList.add('visible');
  }
  function ajouterEffet(t) { const e = $('banniere').querySelector('.eff'); if (e && !e.textContent.includes(t)) e.textContent += (e.textContent ? ' · ' : '') + t; }
  function cacherBanniere() { $('banniere').classList.remove('visible'); }

  // Joue les événements un par un. Renvoie la durée totale (ms).
  function animer(evenements) {
    const etat = partie.etat;
    const N = uid => M.unite(etat, uid).nom;
    let t = 0;
    const plus = (ms, f) => { setTimeout(f, t); t += ms; };
    evenements.forEach(e => {
      switch (e.type) {
        case 'action': {
          const src = M.unite(etat, e.source);
          const comp = src.competences.find(c => c.id === e.competence);
          plus(550, () => {
            banniere(src.emoji + ' ' + src.nom, aff(comp.affinite).icone + ' ' + comp.nom, '');
            rejouer(el(e.source), src.camp === 'allie' ? 'elan-haut' : 'elan-bas');
            journal(src.nom + ' : ' + comp.nom);
          });
          break;
        }
        case 'degats': plus(420, () => {
          const c = el(e.cible);
          rejouer(c, 'touche');
          const ec = c && c.querySelector('.eclat');
          if (ec) { ec.style.background = aff(e.affinite).couleur; rejouer(ec, 'on'); }
          flotter(c, '-' + e.degats + (e.critique ? ' !' : ''), e.mult > 1 ? 'fort' : e.mult < 1 ? 'faible' : '');
          const src = M.unite(etat, e.source);
          if (e.mult > 1) { ajouterEffet('Efficace x1,5'); if (src.camp === 'allie') clotho('efficace'); }
          if (e.mult < 1) { ajouterEffet('Peu efficace x0,67'); if (src.camp === 'allie') clotho('peuEfficace'); }
          if (e.critique) ajouterEffet('Critique !');
          journal(N(e.cible) + ' perd ' + e.degats + ' PV' + (e.mult > 1 ? ' (efficace)' : e.mult < 1 ? ' (peu efficace)' : ''));
        }); break;
        case 'rate': plus(350, () => { flotter(el(e.cible), 'Raté', 'faible'); ajouterEffet('Raté'); }); break;
        case 'soin': plus(400, () => { const c = el(e.cible); flotter(c, '+' + e.soin, 'soin'); if (c) { c.classList.add('soigne'); setTimeout(() => c.classList.remove('soigne'), 600); } journal(N(e.cible) + ' récupère ' + e.soin + ' PV'); }); break;
        case 'brulure': plus(500, () => { banniere('🔥 Brûlure', N(e.cible), '-' + e.degats + ' PV'); rejouer(el(e.cible), 'touche'); flotter(el(e.cible), '🔥 -' + e.degats); }); break;
        case 'etat': plus(250, () => { if (e.etat === 'etourdi') { flotter(el(e.cible), '💫 Étourdi', 'info'); ajouterEffet('Étourdi !'); } if (e.etat === 'brulure') ajouterEffet('Brûlure'); }); break;
        case 'interception': plus(350, () => { flotter(el(e.gardien), '🛡️ intercepte', 'info'); ajouterEffet(N(e.gardien) + ' intercepte'); journal(N(e.gardien) + ' intercepte le coup !'); }); break;
        case 'garde': plus(300, () => { flotter(el(e.cible), '🛡️ protégé', 'info'); ajouterEffet(N(e.cible) + ' est protégé'); }); break;
        case 'presage': plus(300, () => { flotter(el(e.cible), '⏩ joue ensuite', 'info'); ajouterEffet(N(e.cible) + ' joue juste après'); }); break;
        case 'recul': plus(250, () => { flotter(el(e.cible), '⏪ recule', 'info'); ajouterEffet('Recule dans la File'); }); break;
        case 'ko': plus(500, () => { const c = el(e.cible); if (c) c.classList.add('ko'); journal(N(e.cible) + ' tombe.'); ajouterEffet(N(e.cible) + ' tombe'); if (M.unite(etat, e.cible).camp === 'allie') clotho('ko'); }); break;
        case 'gloirePleine': plus(300, () => { journal('🏆 La Gloire est pleine !'); clotho('gloire'); }); break;
        case 'hubris': plus(100, () => { if (e.valeur >= 50) clotho('hubris'); }); break;
        case 'nemesis': plus(700, () => { banniere('⚖️ Némésis', 'L\'orgueil de ' + N(e.cible) + ' est puni', '-' + e.degats + ' PV, tour perdu'); flotter(el(e.cible), 'Némésis', 'faible'); journal('Némésis frappe ' + N(e.cible) + '.'); clotho('nemesis'); }); break;
        case 'cauterise': plus(350, () => { flotter(el(e.cible), '♨️ cautérisé', 'info'); ajouterEffet('Plaie cautérisée'); }); break;
        case 'tete': plus(500, () => { flotter(el(e.cible), '🐍 +1 tête', 'faible'); ajouterEffet('Une tête repousse ! (' + e.tetes + ')'); journal('Une tête repousse (' + e.tetes + ').'); clotho('tete'); }); break;
        case 'teteAttaque': plus(250, () => ajouterEffet('Morsure d\'une autre tête')); break;
        case 'etourdi': plus(600, () => { banniere('💫 Étourdi', N(e.cible) + ' perd son tour', ''); flotter(el(e.cible), '💫', 'info'); }); break;
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
    const onglets = ['Combat', 'Affinités', 'États', 'Héros', 'Ennemis', 'Épreuve'];
    $('onglets').innerHTML = onglets.map(o => `<button class="${o === ongletLexique ? 'on' : ''}" data-o="${o}">${o}</button>`).join('');
    $('onglets').querySelectorAll('button').forEach(b => b.onclick = () => ouvrirLexique(b.dataset.o));
    let h = '';
    if (ongletLexique === 'Affinités') {
      h = `<div class="cycle">🔥 Flamme ➜ 🌿 Sylve ➜ 🌊 Onde ➜ 🔥</div>
        <div class="cycle">⚡ Foudre ➜ 🌪️ Vent ➜ 🪨 Roc ➜ ⚡</div>
        <div class="cycle">☀️ Lumière ⇄ 🌑 Ombre</div><div class="cycle">🛡️ Airain : neutre</div>
        <p class="small">La flèche veut dire « fort contre » : dégâts x1,5. Dans l'autre sens, c'est peu efficace : x0,67. Lumière et Ombre sont fortes l'une contre l'autre.<br><br>
        Attention : ⚡ désigne l'affinité Foudre. L'Énergie, elle, se note 🔹.</p>`;
    } else if (ongletLexique === 'Héros') {
      h = D.HEROS.map(hh => `<div class="ligne"><b>${hh.emoji} ${hh.nom}</b> · ${hh.role} · ${aff(hh.affinite).icone} ${aff(hh.affinite).nom} · ❤️ ${hh.pvMax}<br>` +
        hh.competences.map(c => `${aff(c.affinite).icone} <b>${c.nom}</b> (${resume(c).replace(/<\/?b>/g, '')}) : ${c.desc}`).join('<br>') + '</div>').join('');
    } else if (ongletLexique === 'Ennemis') {
      h = Object.values(D.ENNEMIS).map(e => `<div class="ligne"><b>${e.emoji} ${e.nom}</b> · ${aff(e.affinite).icone} ${aff(e.affinite).nom} · ❤️ ${e.pvMax}<br>
        Faible contre : ${listeAff(faiblesses(e.affinite))}. Résiste à : ${listeAff(forces(e.affinite))}.<br><span class="small">${e.special}</span></div>`).join('');
    } else {
      h = D.LEXIQUE.filter(l => l.cat === ongletLexique).map(l => `<div class="ligne">${l.icone} <b>${l.terme}</b> : ${l.texte}</div>`).join('');
    }
    $('lexiqueCorps').innerHTML = h;
    $('modale').classList.add('visible');
  }
  function fermerLexique() {
    $('modale').classList.remove('visible');
    if (enAttente && !$('clotho').classList.contains('visible')) { const f = enAttente; enAttente = null; f(); }
  }

  // ---------- Boutons ----------
  $('btnJouer').onclick = () => demarrer(false);
  $('btnEcho').onclick = () => demarrer(true);
  $('btnRetour').onclick = accueil;
  $('btnAide').onclick = () => ouvrirLexique();
  $('btnLexique').onclick = () => ouvrirLexique();
  $('modaleOk').onclick = fermerLexique;
  $('btnReset').onclick = () => { stock.ecrire('jour', null); stock.ecrire('vus', {}); vus = {}; toursJoueur = 0; accueil(); };

  if ('serviceWorker' in navigator && location.protocol === 'https:' && !location.hostname.includes('claude')) {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* rien */ }
  }
  accueil();
})();
