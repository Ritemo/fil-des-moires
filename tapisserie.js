/* Le Fil des Moires : dessin de la Tapisserie (provisoire, à embellir en phase visuelle). */
(function (racine) {
  'use strict';
  const COULEURS = {
    or: ['#e0a93a', '#f6d27a'], gris: ['#77736b', '#9d988d'],
    flamme: ['#c4492a', '#e8774f'], sylve: ['#4b8a3a', '#79b862'], onde: ['#2c6fb3', '#5b9be0'],
    foudre: ['#c9a417', '#ecd04f'], vent: ['#3f9c8c', '#7fd0c0'], roc: ['#8a6446', '#b38a68'],
    lumiere: ['#d8c58a', '#f3e6b8'], ombre: ['#5b4380', '#8a6fb3'], airain: ['#8f7a55', '#b9a37a']
  };
  const RANGS_VISIBLES = 6;

  function couleurs(rang) {
    if (!rang.victoire) return COULEURS.gris;
    if (rang.etoiles === 3) return COULEURS.or;
    return COULEURS[rang.couleur] || COULEURS.airain;
  }

  // Dessine la tapisserie. progression (0 à 1) anime le dernier rang.
  function dessiner(canvas, rangs, progression) {
    const x = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const marge = 14, haut = 14, hRang = (H - 2 * haut) / RANGS_VISIBLES;
    const debut = Math.max(0, rangs.length - RANGS_VISIBLES);
    const visibles = rangs.slice(debut);
    // Fond : chaîne de lin
    x.fillStyle = '#3a2418'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#5a3a26'; x.lineWidth = 1;
    for (let i = marge; i < W - marge; i += 6) { x.beginPath(); x.moveTo(i + .5, 0); x.lineTo(i + .5, H); x.stroke(); }
    // Bordures grecques en haut et en bas
    [2, H - haut + 2].forEach(y => {
      x.fillStyle = '#7a5230'; x.fillRect(0, y, W, haut - 4);
      x.strokeStyle = '#e0b04f'; x.lineWidth = 1.5;
      for (let i = 6; i < W - 10; i += 14) {
        x.beginPath(); x.moveTo(i, y + haut - 6); x.lineTo(i, y + 2); x.lineTo(i + 8, y + 2); x.lineTo(i + 8, y + 7); x.lineTo(i + 4, y + 7); x.stroke();
      }
    });
    // Rangs tissés
    visibles.forEach((r, k) => {
      const y = haut + k * hRang + 2;
      const anime = progression != null && k === visibles.length - 1;
      const p = anime ? progression : 1;
      const [c1, c2] = couleurs(r);
      x.globalAlpha = r.echo ? 0.4 : 1;
      const largeur = (W - 2 * marge) * p;
      const pas = 6;
      for (let i = 0; i * pas < largeur; i++) {
        for (let j = 0; j < 3; j++) {
          x.fillStyle = (i + j) % 2 ? c1 : c2;
          x.fillRect(marge + i * pas, y + j * (hRang - 4) / 3, pas, (hRang - 4) / 3 + .5);
        }
      }
      if (r.victoire && r.etoiles === 3 && p >= 1) {
        x.fillStyle = 'rgba(255,255,220,.8)';
        for (let i = 0; i < 10; i++) x.fillRect(marge + ((i * 37 + k * 13) % (W - 2 * marge)), y + ((i * 7) % (hRang - 6)), 2, 2);
      }
      if (p >= 1) {
        x.font = Math.round(hRang * .62) + 'px serif'; x.textBaseline = 'middle'; x.textAlign = 'left';
        x.fillText(r.motif || '•', marge + 6, y + (hRang - 4) / 2 + 1);
        x.font = 'bold ' + Math.round(hRang * .36) + 'px Georgia, serif';
        const texte = 'Jour ' + r.jour + ' · ' + (r.titre || '');
        const lt = x.measureText(texte).width;
        x.fillStyle = 'rgba(30,18,10,.72)';
        x.fillRect(marge + hRang + 3, y + 3, lt + 10, hRang - 10);
        x.fillStyle = '#f6ead2';
        x.fillText(texte, marge + hRang + 8, y + (hRang - 4) / 2 + 1);
        if (r.echo) { x.textAlign = 'right'; x.fillStyle = '#f6ead2'; x.fillText('ÉCHO · non tissé', W - marge - 6, y + (hRang - 4) / 2 + 1); x.textAlign = 'left'; }
        x.fillStyle = 'rgba(30,18,10,.85)';
        if (r.victoire && !r.echo) { x.textAlign = 'right'; x.fillText('★'.repeat(r.etoiles), W - marge - 6, y + (hRang - 4) / 2 + 1); }
      } else {
        // la navette
        x.fillStyle = '#f3e9dc';
        x.beginPath(); x.ellipse(marge + largeur + 8, y + (hRang - 4) / 2, 10, 4, 0, 0, 7); x.fill();
        x.strokeStyle = c2; x.lineWidth = 2; x.beginPath(); x.moveTo(marge + largeur, y + (hRang - 4) / 2); x.lineTo(marge + largeur + 8, y + (hRang - 4) / 2); x.stroke();
      }
    });
    x.globalAlpha = 1;
    // Rangs à venir
    for (let k = visibles.length; k < RANGS_VISIBLES; k++) {
      const y = haut + k * hRang + 2;
      x.setLineDash([3, 4]); x.strokeStyle = '#6b4a30'; x.strokeRect(marge, y, W - 2 * marge, hRang - 4); x.setLineDash([]);
    }
    return { debut, hRang, haut };
  }

  // Renvoie le rang touché (ou null)
  function rangTouche(canvas, rangs, evenement) {
    const r = canvas.getBoundingClientRect();
    const y = (evenement.clientY - r.top) * canvas.height / r.height;
    const haut = 14, hRang = (canvas.height - 2 * haut) / RANGS_VISIBLES;
    const k = Math.floor((y - haut) / hRang);
    const debut = Math.max(0, rangs.length - RANGS_VISIBLES);
    return rangs[debut + k] || null;
  }

  // Anime le tissage du dernier rang
  function tisser(canvas, rangs, duree, fin) {
    const t0 = performance.now();
    function etape(t) {
      const p = Math.min(1, (t - t0) / duree);
      dessiner(canvas, rangs, p);
      if (p < 1) requestAnimationFrame(etape); else if (fin) fin();
    }
    requestAnimationFrame(etape);
  }

  racine.Tapisserie = { dessiner, rangTouche, tisser };
})(window);
