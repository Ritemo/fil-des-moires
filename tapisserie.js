/* Le Fil des Moires : la Tapisserie du Chant.
   Une vraie tapisserie de 30 rangs (un par jour), tissée de bas en haut. Son motif est le Gardien final du Chant
   (pour le Chant I : l'Hydre). Un jour parfait (3 étoiles) donne un rang éclatant, rehaussé d'or ; une victoire
   moins nette, un rang plus terne ; une défaite, un rang abîmé (fils ternes, trous, fils qui pendent).
   Les rangs pas encore tissés montrent la chaîne nue et, en transparence, le motif à venir. */
(function (racine) {
  'use strict';
  const COLS = 36, JOURS = 30, CADRE = 16, RATIO = 1.75; // ratio hauteur / largeur d'un point

  // ---------- Petits outils de couleur ----------
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const mel = (c, d, t) => [c[0] + (d[0] - c[0]) * t, c[1] + (d[1] - c[1]) * t, c[2] + (d[2] - c[2]) * t];
  const fois = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const css = c => 'rgb(' + c.map(v => Math.max(0, Math.min(255, Math.round(v)))).join(',') + ')';
  const gris = c => { const l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]; return [l, l, l]; };

  // ---------- Le motif : fond de nuit et d'eau, étoiles, et le Gardien du Chant ----------
  const motifs = {};
  function motif(emoji, forge) {
    const cle = emoji + (forge ? '|forge' : '');
    if (motifs[cle]) return motifs[cle];
    const g = []; let pret = true;
    for (let k = 0; k < JOURS; k++) {
      const ligne = [];
      for (let c = 0; c < COLS; c++) {
        const t = k / (JOURS - 1);
        let col = forge ? mel([30, 18, 22], [70, 34, 24], t) : mel([24, 30, 58], [40, 56, 84], t);
        if (forge && k >= JOURS - 7) { // la lave
          const coulee = Math.sin(c * 0.5 + k * 1.7) > 0.45;
          col = coulee ? [214, 96, 34] : [92, 30, 18];
        } else if (forge) { if (k < 16 && hash(k, c) < 0.06) col = [255, 160, 70]; } // braises
        else if (k >= JOURS - 7) { // l'étang
          const vague = Math.sin(c * 0.7 + k * 1.3) > 0.55;
          col = vague ? [58, 104, 120] : [22, 52, 70];
        } else if (k < 14 && hash(k, c) < 0.05) col = [232, 197, 106]; // étoiles
        if (c === 0 || c === COLS - 1) col = (k % 2) ? [138, 90, 42] : [190, 140, 60]; // lisières
        ligne.push(col);
      }
      g.push(ligne);
    }
    // Le Gardien, dessiné puis échantillonné point par point
    if (typeof document !== 'undefined') {
      const SH = Math.round(4 * RATIO); // le motif est échantillonné avec les proportions réelles des points
      const cv = document.createElement('canvas'); cv.width = COLS * 4; cv.height = JOURS * SH;
      const x = cv.getContext('2d');
      // L'image 3D du Gardien si elle est chargée ; sinon l'emoji en texte, et on redessinera une fois l'image arrivée
      const img = racine.Emojis && racine.Emojis.image(emoji, () => { delete motifs[cle]; redessinerTout(); });
      const t = Math.min(cv.width, cv.height) * 0.86;
      if (img && img.complete && img.naturalWidth) x.drawImage(img, (cv.width - t) / 2, (cv.height - t) / 2, t, t);
      else { x.font = Math.round(t) + 'px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(emoji, cv.width / 2, cv.height * 0.52); }
      pret = !img || (img.complete && img.naturalWidth > 0);
      let d;
      try { d = x.getImageData(0, 0, cv.width, cv.height).data; }
      catch (e) { // image d'une autre origine (ouverture en fichier local) : on retombe sur l'emoji en texte
        x.clearRect(0, 0, cv.width, cv.height); x.font = Math.round(t) + 'px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(emoji, cv.width / 2, cv.height * 0.52); d = x.getImageData(0, 0, cv.width, cv.height).data; }
      for (let k = 0; k < JOURS; k++) for (let c = 1; c < COLS - 1; c++) {
        let r = 0, v = 0, b = 0, a = 0;
        for (let i = 0; i < SH; i++) for (let j = 0; j < 4; j++) {
          const p = ((k * SH + i) * cv.width + c * 4 + j) * 4;
          const al = d[p + 3] / 255; r += d[p] * al; v += d[p + 1] * al; b += d[p + 2] * al; a += al;
        }
        if (a > SH * 2) { // point couvert par le Gardien : on renforce un peu les couleurs
          const col = [r / a, v / a, b / a], l = gris(col)[0];
          g[k][c] = mel(col, [l, l, l], -0.25);
        }
      }
    }
    if (pret) motifs[cle] = g; // pas de mise en cache tant que l'image 3D n'est pas chargée
    return g;
  }

  // ---------- Les rangs d'un Chant (le Chant II compte ses jours de 31 à 60 : on les ramène à 1..30) ----------
  const chantDe = rangs => ((rangs || []).some(r => r.chant === 'II' && !r.echo) ? 'II' : 'I');
  function duChant(rangs, chant) {
    return chant === 'II' ? rangs.filter(r => r.chant === 'II').map(r => Object.assign({}, r, { jour: r.jc - 30 })) : rangs.filter(r => r.chant !== 'II');
  }
  const MOTIFS = { I: { emoji: '🐲', forge: false }, II: { emoji: '🦂', forge: true } };

  // ---------- Le meilleur rang de chaque jour (les Échos ne tissent pas ; la finale rejouée répare le dernier rang) ----------
  function rangsParJour(rangs) {
    const m = {};
    rangs.filter(r => !r.echo).forEach(r => {
      const j = Math.min(r.jour, JOURS);
      if (!m[j] || r.victoire || !m[j].victoire) m[j] = r;
    });
    return m;
  }
  function qualite(r) {
    if (!r) return 'vide';
    if (!r.victoire) return 'echec';
    return r.etoiles >= 3 ? 'parfait' : r.etoiles === 2 ? 'bien' : 'juste';
  }

  function dimensions(canvas) {
    const W = canvas.width, w = (W - 2 * CADRE) / COLS, h = w * RATIO;
    const H = Math.round(2 * CADRE + JOURS * h);
    if (canvas.height !== H) canvas.height = H;
    return { W, H, w, h };
  }

  // Dessine la tapisserie. progression (0 à 1) anime le rang du dernier jour joué.
  // Toutes les tapisseries dessinées (accueil, classement, fiche d'un joueur...) : quand l'image 3D du Gardien arrive,
  // on les redessine toutes, pour que le motif soit partout le même (et pas l'emoji du téléphone sur certaines)
  const dessins = new Map();
  let attente = null;
  function redessinerTout() {
    clearTimeout(attente);
    attente = setTimeout(() => dessins.forEach((args, cv) => { if (cv.isConnected) dessiner.apply(null, args); else dessins.delete(cv); }), 30);
  }
  function dessiner(canvas, rangs, progression, opts) {
    opts = opts || {};
    if (progression == null) dessins.set(canvas, [canvas, rangs, null, opts]);
    const chant = opts.chant || chantDe(rangs);
    rangs = duChant(rangs, chant);
    const { W, H, w, h } = dimensions(canvas);
    const x = canvas.getContext('2d');
    const g = motif(opts.motif || MOTIFS[chant].emoji, MOTIFS[chant].forge);
    const parJour = rangsParJour(rangs);
    const dernier = rangs.filter(r => !r.echo).slice(-1)[0];
    const jourAnime = progression != null && dernier ? Math.min(dernier.jour, JOURS) : null;
    // Beauté d'ensemble : aucun échec et que des rangs à 2 ou 3 étoiles → lisière dorée
    const joues = Object.values(parJour);
    const splendide = joues.length >= 3 && joues.every(r => r.victoire && r.etoiles >= 2);

    // Fond : la chaîne nue
    x.fillStyle = '#2e1c12'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#4e3322'; x.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) { const xx = CADRE + c * w + w / 2; x.beginPath(); x.moveTo(xx, CADRE); x.lineTo(xx, H - CADRE); x.stroke(); }

    for (let k = 0; k < JOURS; k++) {
      const jour = JOURS - k; // on tisse de bas en haut : le jour 1 est en bas
      const r = parJour[jour], q = qualite(r);
      const y = CADRE + k * h;
      let limite = COLS;
      if (jour === jourAnime) limite = Math.floor(COLS * progression);
      for (let c = 0; c < COLS; c++) {
        const xx = CADRE + c * w;
        let col = g[k][c];
        if (q === 'vide' || c >= limite) { // motif à venir, en transparence
          x.globalAlpha = 0.13; x.fillStyle = css(col); x.fillRect(xx + 1, y + 1, w - 2, h - 2); x.globalAlpha = 1;
          continue;
        }
        const z = hash(jour * 7 + 3, c);
        if (q === 'echec' && z < 0.18) continue; // trou dans la trame
        if (q === 'bien') col = mel(col, gris(col), 0.18);
        if (q === 'juste') col = fois(mel(col, gris(col), 0.35), 0.9);
        if (q === 'echec') col = fois(mel(col, [107, 90, 74], 0.6), 0.8);
        // un point de tissage : deux demi-mailles et une ombre
        x.fillStyle = css(fois(col, 0.9)); x.fillRect(xx, y, w / 2, h);
        x.fillStyle = css(fois(col, 1.08)); x.fillRect(xx + w / 2, y, w / 2, h);
        x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(xx, y + h - 1.2, w, 1.2);
        if (q === 'parfait' && z > 0.93) { x.fillStyle = 'rgba(255,236,170,.95)'; x.fillRect(xx + w / 2 - 1, y + h / 2 - 1, 2.4, 2.4); }
      }
      // fils qui pendent sous un rang raté
      if (q === 'echec') {
        x.strokeStyle = 'rgba(150,130,110,.8)'; x.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const xx = CADRE + hash(jour, i + 50) * (W - 2 * CADRE), lg = h * (0.6 + hash(jour, i + 90) * 1.2);
          x.beginPath(); x.moveTo(xx, y + h); x.quadraticCurveTo(xx + 3, y + h + lg / 2, xx - 1, y + h + lg); x.stroke();
        }
      }
      // la navette pendant le tissage
      if (jour === jourAnime && progression < 1) {
        const xx = CADRE + limite * w;
        x.fillStyle = '#f3e9dc'; x.beginPath(); x.ellipse(xx + 9, y + h / 2, 11, 4, 0, 0, 7); x.fill();
      }
    }

    // Le métier : ensouples haut et bas, frise grecque, lisière dorée si la tapisserie est splendide
    [0, H - CADRE].forEach(y => {
      x.fillStyle = '#6a4426'; x.fillRect(0, y, W, CADRE);
      x.strokeStyle = '#e0b04f'; x.lineWidth = 1.5;
      for (let i = 6; i < W - 10; i += 14) { x.beginPath(); x.moveTo(i, y + CADRE - 4); x.lineTo(i, y + 3); x.lineTo(i + 8, y + 3); x.lineTo(i + 8, y + 8); x.lineTo(i + 4, y + 8); x.stroke(); }
    });
    x.strokeStyle = splendide ? '#f6d27a' : '#5a3a26'; x.lineWidth = splendide ? 3 : 2;
    x.strokeRect(CADRE - 2, CADRE - 1, W - 2 * CADRE + 4, H - 2 * CADRE + 2);
    return { splendide, tisses: joues.length, chant };
  }

  // Renvoie le jour touché : { jour, rang } (rang absent si le jour n'est pas encore tissé)
  function rangTouche(canvas, rangs, evenement, chant) {
    chant = chant || chantDe(rangs);
    const decal = chant === 'II' ? 30 : 0;
    rangs = duChant(rangs, chant);
    const b = canvas.getBoundingClientRect();
    const y = (evenement.clientY - b.top) * canvas.height / b.height;
    const { h } = dimensions(canvas);
    const k = Math.floor((y - CADRE) / h);
    if (k < 0 || k >= JOURS) return null;
    const jour = JOURS - k;
    const r = rangsParJour(rangs)[jour] || null;
    return { jour: jour + decal, chant, rang: r ? Object.assign({}, r, { jour: r.jour + decal }) : null };
  }

  // Anime le tissage du rang du jour
  function tisser(canvas, rangs, duree, fin, opts) {
    const t0 = performance.now();
    function etape(t) {
      const p = Math.min(1, (t - t0) / duree);
      dessiner(canvas, rangs, p, opts);
      if (p < 1) requestAnimationFrame(etape); else if (fin) fin();
    }
    requestAnimationFrame(etape);
  }

  // Précharge les images des Gardiens dès que les emojis 3D sont disponibles
  if (typeof window !== 'undefined') window.addEventListener('DOMContentLoaded', () => {
    if (racine.Emojis) Object.values(MOTIFS).forEach(m => racine.Emojis.image(m.emoji, () => { Object.keys(motifs).forEach(k => delete motifs[k]); redessinerTout(); }));
  });
  racine.Tapisserie = { dessiner, rangTouche, tisser, chantDe, JOURS };
})(window);
