/* Le Fil des Moires : la cinématique d'introduction (« vidéo » animée en SVG, lue par les voix).
   Elle explique le Grand Métier, les trois Moires, l'Effilochage, le fil de l'Errant et la tapisserie.
   Montrée avant la toute première épreuve, et rejouable depuis les Réglages ou l'onglet Tapisserie. */
(function (racine) {
  'use strict';
  const C = racine.Chant1, V = racine.Voix, E = racine.Emojis;
  const img = (e, x, y, t, cls) => { const s = E && E.src(e);
    return s ? `<image class="${cls || ''}" href="${s}" x="${x - t / 2}" y="${y - t / 2}" width="${t}" height="${t}"/>` : `<text class="${cls || ''}" x="${x}" y="${y + t * 0.35}" font-size="${t}" text-anchor="middle">${e}</text>`; };
  const h = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
  const etoiles = n => Array.from({ length: n }, (_, i) => `<circle class="scint" style="animation-delay:${(h(i, 1) * 3).toFixed(1)}s" cx="${h(i, 2) * 360}" cy="${h(i, 3) * 300}" r="${0.6 + h(i, 4)}" fill="#fff6d8"/>`).join('');
  const COUL = ['#c4492a', '#4b8a3a', '#2c6fb3', '#c9a417', '#3f9c8c', '#8a6446', '#d8c58a', '#5b4380'];
  // Le métier à tisser : deux montants, deux ensouples, et les fils de chaîne qui descendent
  const metier = (avecChaine) => `<rect x="40" y="40" width="10" height="240" fill="#6a4426"/><rect x="310" y="40" width="10" height="240" fill="#6a4426"/>
    <rect x="30" y="34" width="300" height="14" rx="4" fill="#7a5230"/><rect x="30" y="266" width="300" height="14" rx="4" fill="#7a5230"/>
    ${avecChaine ? Array.from({ length: 24 }, (_, i) => `<line class="chaine" style="animation-delay:${(i * 0.06).toFixed(2)}s" x1="${60 + i * 10.4}" y1="48" x2="${60 + i * 10.4}" y2="266" stroke="#c9b48a" stroke-width="1" opacity=".7"/>`).join('') : ''}`;
  const rang = (y, coul, delai, abime) => Array.from({ length: 24 }, (_, i) => abime && h(i, y) < 0.25 ? '' :
    `<rect class="trame" style="animation-delay:${(delai + i * 0.04).toFixed(2)}s" x="${56 + i * 10.4}" y="${y}" width="9.4" height="9" fill="${abime ? '#6b5a4a' : coul}"/>`).join('');

  const PLANS = {
    metier: () => `${etoiles(40)}${metier(true)}`,
    fils: () => `${etoiles(20)}${metier(true)}${[0, 1, 2, 3, 4, 5, 6, 7].map(k => rang(240 - k * 12, COUL[k], 0.3 + k * 0.5)).join('')}`,
    soeurs: () => `${etoiles(25)}${[['🧶', 'Clotho', 'file'], ['📏', 'Lachésis', 'mesure'], ['✂️', 'Atropos', 'coupe']].map(([e, n, r], i) => `
      <g class="apparait" style="animation-delay:${0.4 + i * 1.6}s"><circle cx="${70 + i * 110}" cy="130" r="44" fill="rgba(224,176,79,.15)" stroke="#e0b04f" stroke-width="1.5"/>
      ${img(e, 70 + i * 110, 130, 54)}<text x="${70 + i * 110}" y="200" text-anchor="middle" fill="#e0b04f" font-size="18" font-family="Georgia" font-variant="small-caps">${n}</text>
      <text x="${70 + i * 110}" y="222" text-anchor="middle" fill="#b9a58f" font-size="14" font-family="Georgia" font-style="italic">${r}</text></g>`).join('')}`,
    effilochage: () => `${etoiles(20)}${metier(true)}${[0, 1, 2, 3, 4, 5].map(k => rang(240 - k * 12, COUL[k], 0, true)).join('')}
      ${Array.from({ length: 10 }, (_, i) => `<line class="tombe" style="animation-delay:${(h(i, 9) * 3).toFixed(1)}s" x1="${70 + i * 24}" y1="170" x2="${74 + i * 24}" y2="200" stroke="${COUL[i % 8]}" stroke-width="2"/>`).join('')}
      ${[90, 170, 250].map((x, i) => `<line class="filor" style="animation-delay:${i * 0.5}s" x1="${x}" y1="0" x2="${x + 4}" y2="${70 + i * 15}" stroke="#f2c96a" stroke-width="2"/>`).join('')}
      ${img('✂️', 300, 30, 40, 'ciseaux')}`,
    errant: () => `${etoiles(50)}<line class="filDescend" x1="180" y1="0" x2="180" y2="170" stroke="#f6d27a" stroke-width="3" stroke-linecap="round"/>
      <circle class="halo" cx="180" cy="210" r="56" fill="url(#haloCine)"/>${img('🧔🏻', 180, 210, 80, 'apparait tard')}`,
    tissage: () => `${metier(true)}${rang(240, '#e0a93a', 0.4)}${rang(228, '#2c6fb3', 1.6)}${rang(216, '#4b8a3a', 2.8)}${rang(204, '#c4492a', 4.0)}`,
    qualite: () => `${metier(true)}
      ${rang(200, '#f0c050', 0.3)}<text class="apparait" style="animation-delay:1.2s" x="180" y="195" text-anchor="middle" fill="#f6d27a" font-size="13" font-family="Georgia">★★★ victoire parfaite : fil d'or</text>
      ${Array.from({ length: 8 }, (_, i) => `<circle class="scint" style="animation-delay:${(i * 0.3).toFixed(1)}s" cx="${70 + i * 30}" cy="204" r="1.8" fill="#fff6d0"/>`).join('')}
      ${rang(150, '#4b8a3a', 2.4)}<text class="apparait" style="animation-delay:3s" x="180" y="145" text-anchor="middle" fill="#cfe8c0" font-size="13" font-family="Georgia">★ victoire : couleurs plus ternes</text>
      ${rang(100, '#6b5a4a', 4.4, true)}<text class="apparait" style="animation-delay:5s" x="180" y="95" text-anchor="middle" fill="#d0b8a8" font-size="13" font-family="Georgia">✕ défaite : rang abîmé</text>
      ${Array.from({ length: 4 }, (_, i) => `<path class="apparait" style="animation-delay:5.4s" d="M${90 + i * 55} 109 q3 10 -1 22" stroke="#a89888" fill="none"/>`).join('')}`,
    chant: () => `<foreignObject x="80" y="10" width="200" height="280"><canvas xmlns="http://www.w3.org/1999/xhtml" id="cineTapis" width="440" height="560" style="width:200px;height:auto"></canvas></foreignObject>`
  };

  let actif = null;
  function jouer(fin) {
    const ecran = document.getElementById('cine');
    const scene = document.getElementById('cineScene'), texte = document.getElementById('cineTexte'), bouton = document.getElementById('cinePasser');
    let i = -1, minuteur = null, jeton = 0;
    const terminer = () => { clearTimeout(minuteur); jeton++; V && V.stop(); ecran.classList.remove('visible'); actif = null; if (fin) fin(); };
    const suivant = () => {
      clearTimeout(minuteur); V && V.stop();
      i++; const t = ++jeton;
      if (i >= C.INTRO.length) { bouton.textContent = 'Commencer'; bouton.onclick = terminer; return; }
      const p = C.INTRO[i];
      scene.innerHTML = `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="haloCine"><stop offset="0" stop-color="#f6d27a" stop-opacity=".7"/><stop offset="1" stop-color="#f6d27a" stop-opacity="0"/></radialGradient></defs>${PLANS[p.plan]()}</svg>`;
      texte.classList.remove('vu'); void texte.offsetWidth; texte.textContent = p.texte; texte.classList.add('vu');
      document.getElementById('cinePoints').innerHTML = C.INTRO.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
      if (p.plan === 'chant' && racine.Tapisserie) { // une tapisserie complète et parfaite : le motif apparaît
        const cv = document.getElementById('cineTapis');
        const rangs = Array.from({ length: 30 }, (_, k) => ({ jour: k + 1, victoire: true, etoiles: 3 }));
        let n = 0; const tisse = () => { if (t !== jeton) return; n++; racine.Tapisserie.dessiner(cv, rangs.slice(0, n)); if (n < 30) setTimeout(tisse, 140); }; tisse();
      }
      const min = Math.max(4500, p.texte.length * 55);
      const t0 = Date.now();
      const apres = () => { if (t !== jeton) return; minuteur = setTimeout(suivant, Math.max(900, min - (Date.now() - t0))); };
      if (V && V.actif()) V.dire(p.qui, p.texte).then(apres); else apres();
    };
    bouton.textContent = 'Passer'; bouton.onclick = terminer;
    scene.onclick = suivant; texte.onclick = suivant;
    ecran.classList.add('visible');
    actif = true;
    suivant();
  }
  racine.Cinematique = { jouer, enCours: () => !!actif };
})(window);
