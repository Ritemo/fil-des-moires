/* Le Fil des Moires : les voix.
   1. En priorité, des fichiers audio pré-enregistrés avec des voix neuronales, une par personnage
      (art/voix/<id>.mp3, fabriqués par le robot GitHub Actions « Voix » ; liste dans art/voix/index.json).
   2. À défaut, la synthèse vocale de l'appareil (Web Speech API), avec une hauteur et un débit par personnage.
   L'identifiant d'une réplique (cleVoix) est calculé de la même façon ici et dans outils/repliques.js. */
(function (racine) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  // Texte lu : sans emojis, sans indications entre parenthèses, sans guillemets
  const nettoyer = t => t.replace(/\([^)]*\)/g, '').replace(/[«»"]/g, '').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\uFE0F\u200D]/gu, '').replace(/\s+/g, ' ').trim();
  // Identifiant stable d'une réplique : FNV-1a 32 bits du texte UTF-8 « qui|texte nettoyé »
  function cleVoix(qui, texte) {
    const octets = new TextEncoder().encode((qui === 'kelos' ? 'narrateur' : qui) + '|' + nettoyer(texte));
    let h = 0x811c9dc5;
    for (const o of octets) { h ^= o; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }
  if (node) { module.exports = { cleVoix, nettoyer }; return; }
  const synth = racine.speechSynthesis;
  // Liste des répliques enregistrées
  let enregistrees = {};
  fetch('art/voix/index.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : []).then(l => { l.forEach(id => { enregistrees[id] = true; }); }).catch(() => {});
  let audioCourant = null;
  const cle = 'fdm_voix';
  let actif = (() => { try { return localStorage.getItem(cle) !== 'non'; } catch (e) { return true; } })();
  // Timbre de chaque personnage : hauteur (pitch), débit (rate), et préférence de voix féminine ou masculine
  const TIMBRES = {
    narrateur: { pitch: 0.95, rate: 0.95, genre: 'h' },
    clotho: { pitch: 1.15, rate: 0.95, genre: 'f' },
    phaena: { pitch: 1.3, rate: 1.0, genre: 'f' },
    nikias: { pitch: 0.8, rate: 0.95, genre: 'h' },
    aelis: { pitch: 1.05, rate: 0.85, genre: 'f' },
    hermes: { pitch: 1.2, rate: 1.15, genre: 'h' },
    dionysos: { pitch: 0.9, rate: 1.1, genre: 'h' },
    artemis: { pitch: 1.1, rate: 0.95, genre: 'f' },
    soeurs: { pitch: 0.6, rate: 0.85, genre: 'f' },
    lysandre: { pitch: 0.9, rate: 0.85, genre: 'f' },
    lachesis: { pitch: 1.0, rate: 0.9, genre: 'f' },
    atropos: { pitch: 0.75, rate: 0.85, genre: 'f' },
    kelos: { pitch: 0.95, rate: 0.95, genre: 'h' }
  };
  const FEMININ = /(denise|eloise|vivienne|coralie|jacqueline|yvette|josephine|amelie|amélie|audrey|aurelie|aurélie|celine|céline|denise|eloise|élise|julie|lea|léa|marie|virginie|hortense|brigitte|vivienne|female|femme|google français)/i;
  const NATUREL = /(natural|neural|online|premium|enhanced|wavenet|naturelle)/i;
  const MASCULIN = /(henri|remy|alain|jerome|maurice|yves|thomas|nicolas|paul|henri|claude|guillaume|jean|remy|rémy|male|homme|antoine|yves|mathieu)/i;
  let voixFr = [];
  function chargerVoix() {
    if (!synth) return;
    voixFr = synth.getVoices().filter(v => /^fr(-|_|$)/i.test(v.lang));
  }
  if (synth) { chargerVoix(); synth.addEventListener && synth.addEventListener('voiceschanged', chargerVoix); }
  function voixPour(qui) {
    if (!voixFr.length) return null;
    const t = TIMBRES[qui] || TIMBRES.narrateur;
    const f = voixFr.filter(v => FEMININ.test(v.name)), h = voixFr.filter(v => MASCULIN.test(v.name));
    let liste = (t.genre === 'f' ? f : h).length ? (t.genre === 'f' ? f : h) : voixFr;
    // les voix « naturelles » (neuronales, en ligne) passent en premier quand l'appareil en propose
    const naturelles = liste.filter(v => NATUREL.test(v.name));
    if (naturelles.length) liste = naturelles;
    // la même voix pour un même personnage, réparties si plusieurs sont disponibles
    const n = Object.keys(TIMBRES).indexOf(qui);
    return liste[Math.max(0, n) % liste.length];
  }

  // Lit une réplique. Renvoie une promesse résolue à la fin de la lecture (ou tout de suite si les voix sont coupées).
  function dire(qui, texte) {
    const id = texte ? cleVoix(qui, texte) : null;
    if (actif && id && enregistrees[id]) return new Promise(fin => {
      stop();
      const a = new Audio('art/voix/' + id + '.mp3'); audioCourant = a;
      let fait = false; const terminer = () => { if (!fait) { fait = true; fin(); } };
      a.onended = terminer;
      a.onerror = () => { fait = true; direSynthese(qui, texte).then(fin); }; // fichier absent : voix de l'appareil
      a.play().catch(() => { if (!fait) { fait = true; direSynthese(qui, texte).then(fin); } });
    });
    return direSynthese(qui, texte);
  }
  function direSynthese(qui, texte) {
    return new Promise(fin => {
      if (!synth || !actif || !texte) return fin();
      const u = new SpeechSynthesisUtterance(nettoyer(texte));
      const t = TIMBRES[qui] || TIMBRES.narrateur;
      u.lang = 'fr-FR'; u.pitch = t.pitch; u.rate = t.rate; u.volume = 1;
      const v = voixPour(qui); if (v) u.voice = v;
      let fait = false; const terminer = () => { if (!fait) { fait = true; fin(); } };
      u.onend = terminer; u.onerror = terminer;
      // sécurité : certains navigateurs n'envoient jamais la fin
      setTimeout(terminer, 1500 + nettoyer(texte).length * 110);
      synth.speak(u);
    });
  }
  function stop() { if (synth) synth.cancel(); if (audioCourant) { audioCourant.pause(); audioCourant = null; } }
  function regler(v) { actif = v; try { localStorage.setItem(cle, v ? 'oui' : 'non'); } catch (e) { /* rien */ } if (!v) stop(); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  racine.Voix = { dire, stop, regler, cleVoix, actif: () => actif, disponible: () => true };
})(typeof window !== 'undefined' ? window : this);
