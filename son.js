/* Le Fil des Moires : le son. Tout est synthétisé en direct (Web Audio) : aucun fichier à télécharger.
   Bruitages (coups selon l'affinité, soins, KO, lien, victoire...) et ambiances par chapitre (forêt, ruines,
   crépuscule des Effilés, étang) ou de combat. Réglages par appareil : bruitages et ambiance, chacun on/off. */
(function (racine) {
  'use strict';
  let ctx = null, maitre, gSfx, gAmb;
  const reglages = (() => { try { return Object.assign({ sfx: true, amb: true }, JSON.parse(localStorage.getItem('fdm_son') || '{}')); } catch (e) { return { sfx: true, amb: true }; } })();
  const sauverReglages = () => { try { localStorage.setItem('fdm_son', JSON.stringify(reglages)); } catch (e) { /* rien */ } };

  // Le navigateur n'autorise le son qu'après un premier geste de l'utilisateur
  function initialiser() {
    if (ctx) return true;
    const AC = racine.AudioContext || racine.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    maitre = ctx.createGain(); maitre.gain.value = 0.8; maitre.connect(ctx.destination);
    gSfx = ctx.createGain(); gSfx.gain.value = reglages.sfx ? 0.55 : 0; gSfx.connect(maitre);
    gAmb = ctx.createGain(); gAmb.gain.value = reglages.amb ? 0.35 : 0; gAmb.connect(maitre);
    return true;
  }
  function debloquer() {
    if (!initialiser()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (ambDemandee && !ambCourante) lancerAmbiance(ambDemandee);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => racine.addEventListener(ev, debloquer, { passive: true }));

  // ---------- Briques de synthèse ----------
  function ton(f, duree, opts) {
    if (!ctx) return; opts = opts || {};
    const t = ctx.currentTime + (opts.delai || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = opts.type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (opts.vers) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.vers), t + duree);
    if (opts.detune) o.detune.value = opts.detune;
    const v = opts.vol == null ? 0.3 : opts.vol, a = opts.attaque || 0.005;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g); g.connect(opts.sortie || gSfx); o.start(t); o.stop(t + duree + 0.05);
  }
  let tamponBruit = null;
  function bruit(duree, opts) {
    if (!ctx) return; opts = opts || {};
    if (!tamponBruit) { tamponBruit = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = tamponBruit.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = ctx.currentTime + (opts.delai || 0);
    const s = ctx.createBufferSource(); s.buffer = tamponBruit; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = opts.filtre || 'bandpass'; f.frequency.setValueAtTime(opts.f || 1000, t); f.Q.value = opts.q || 1;
    if (opts.vers) f.frequency.exponentialRampToValueAtTime(opts.vers, t + duree);
    const g = ctx.createGain(), v = opts.vol == null ? 0.3 : opts.vol;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (opts.attaque || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    s.connect(f); f.connect(g); g.connect(opts.sortie || gSfx); s.start(t, Math.random()); s.stop(t + duree + 0.05);
  }
  const arpege = (notes, pas, opts) => notes.forEach((n, i) => ton(n, (opts && opts.duree) || 0.35, Object.assign({}, opts, { delai: i * pas })));

  // ---------- Bruitages ----------
  // Un coup : un choc sourd + une couleur qui dépend de l'affinité
  function coup(affinite, fort, critique) {
    if (!ctx || !reglages.sfx) return;
    const k = fort ? 1.35 : 1;
    ton(140, 0.18, { vers: 45, vol: 0.45 * k });
    ({
      flamme: () => { bruit(0.35, { filtre: 'highpass', f: 1800, vol: 0.22 * k }); bruit(0.2, { f: 600, vol: 0.2 }); },
      onde: () => bruit(0.45, { filtre: 'lowpass', f: 1400, vers: 300, vol: 0.32 * k }),
      foudre: () => { ton(1800, 0.18, { type: 'sawtooth', vers: 200, vol: 0.12 * k }); bruit(0.12, { filtre: 'highpass', f: 4000, vol: 0.25 }); },
      vent: () => bruit(0.4, { f: 600, vers: 2400, q: 3, vol: 0.3 * k }),
      sylve: () => { bruit(0.15, { f: 1200, q: 4, vol: 0.25 }); ton(300, 0.12, { type: 'triangle', vol: 0.15 }); },
      lumiere: () => { ton(1320, 0.4, { vol: 0.12 * k }); ton(1980, 0.5, { vol: 0.08 * k, delai: 0.04 }); },
      ombre: () => { ton(110, 0.4, { type: 'sawtooth', vol: 0.1 * k, detune: -20 }); ton(116, 0.4, { type: 'sawtooth', vol: 0.08 }); },
      roc: () => bruit(0.3, { filtre: 'lowpass', f: 400, vol: 0.4 * k }),
      airain: () => { ton(620, 0.14, { type: 'square', vol: 0.06 * k }); bruit(0.08, { filtre: 'highpass', f: 3000, vol: 0.2 }); }
    }[affinite] || (() => bruit(0.1, { f: 2000, vol: 0.2 })))();
    if (critique) arpege([1568, 2093], 0.05, { vol: 0.12, duree: 0.25, type: 'triangle' });
  }
  const SONS = {
    clic: () => ton(900, 0.04, { vol: 0.05, type: 'triangle' }),
    action: () => bruit(0.18, { f: 500, vers: 1800, q: 2, vol: 0.08 }),
    tour: () => { ton(784, 0.25, { vol: 0.07 }); ton(1175, 0.3, { vol: 0.05, delai: 0.07 }); },
    soin: () => arpege([523, 659, 784, 1047], 0.07, { vol: 0.12, duree: 0.4 }),
    garde: () => { ton(880, 0.5, { type: 'triangle', vol: 0.12 }); ton(1320, 0.35, { vol: 0.07 }); },
    rate: () => bruit(0.3, { f: 2000, vers: 400, q: 2, vol: 0.12 }),
    etourdi: () => { for (let i = 0; i < 3; i++) ton(700 + i * 150, 0.18, { vol: 0.06, delai: i * 0.1, type: 'triangle' }); },
    ko: () => { ton(320, 0.7, { type: 'sawtooth', vers: 60, vol: 0.12 }); bruit(0.6, { filtre: 'lowpass', f: 900, vers: 150, vol: 0.15 }); },
    tete: () => { ton(70, 0.6, { type: 'sawtooth', vol: 0.14 }); bruit(0.5, { filtre: 'lowpass', f: 500, vol: 0.18 }); },
    lie: () => { arpege([523, 587, 659, 784, 880, 1047, 1175, 1319], 0.06, { vol: 0.1, duree: 0.6, type: 'triangle' }); arpege([2093, 2637], 0.15, { vol: 0.05, duree: 0.6 }); },
    lienRate: () => { ton(660, 0.3, { type: 'triangle', vers: 330, vol: 0.12 }); },
    victoire: () => { arpege([523, 659, 784], 0.12, { type: 'triangle', vol: 0.16, duree: 0.3 }); ton(1047, 0.9, { type: 'triangle', vol: 0.18, delai: 0.38 }); ton(784, 0.9, { vol: 0.08, delai: 0.38 }); },
    defaite: () => arpege([440, 392, 349, 294], 0.22, { type: 'triangle', vol: 0.12, duree: 0.5 }),
    niveau: () => { arpege([392, 523, 659, 784, 1047], 0.08, { type: 'triangle', vol: 0.14, duree: 0.45 }); },
    gloire: () => { arpege([659, 880, 1319], 0.08, { vol: 0.1, duree: 0.5 }); },
    amphore: () => { bruit(0.12, { filtre: 'highpass', f: 2500, vol: 0.2 }); for (let i = 0; i < 8; i++) ton(1500 + Math.random() * 1800, 0.3, { vol: 0.05, delai: 0.1 + i * 0.06 }); },
    evolue: () => { ton(220, 1.2, { type: 'sawtooth', vers: 880, vol: 0.06 }); arpege([1047, 1319, 1568, 2093], 0.12, { vol: 0.1, duree: 0.6, delai: 0 }); },
    page: () => bruit(0.25, { f: 3000, vers: 1200, q: 0.8, vol: 0.06 })
  };
  function jouer(nom) { if (!ctx || !reglages.sfx || !SONS[nom]) return; SONS[nom](); }
  // Le tissage : la navette va et vient pendant la durée de l'animation
  function tissage(duree) {
    if (!ctx || !reglages.sfx) return;
    const n = Math.max(3, Math.round(duree / 280));
    for (let i = 0; i < n; i++) bruit(0.16, { f: 1400 + (i % 2) * 500, q: 2, vol: 0.07, delai: i * duree / n / 1000 });
  }

  // ---------- Ambiances ----------
  let ambDemandee = null, ambCourante = null, noeuds = [], minuteurs = [];
  function arreterAmbiance() {
    if (!ctx) return;
    const t = ctx.currentTime;
    noeuds.forEach(n => { try { if (n.gain) { n.gain.cancelScheduledValues(t); n.gain.setValueAtTime(n.gain.value, t); n.gain.linearRampToValueAtTime(0, t + 1.2); } if (n.stop) n.stop(t + 1.3); } catch (e) { /* rien */ } });
    minuteurs.forEach(clearInterval);
    noeuds = []; minuteurs = []; ambCourante = null;
  }
  function nappe(freqs, vol, type) { // un accord tenu, doux, qui respire
    const g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 3);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.connect(g); g.connect(gAmb);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 350; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    freqs.forEach((fr, i) => { const o = ctx.createOscillator(); o.type = type || 'triangle'; o.frequency.value = fr; o.detune.value = i % 2 ? 6 : -6; o.connect(f); o.start(); noeuds.push(o); });
    noeuds.push(g, lfo);
  }
  function vent(vol, freq) {
    if (!tamponBruit) bruit(0.01, { vol: 0.0001 });
    const s = ctx.createBufferSource(); s.buffer = tamponBruit; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 500; f.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 3);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.11; lg.gain.value = vol * 0.6; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    s.connect(f); f.connect(g); g.connect(gAmb); s.start(); noeuds.push(s, g, lfo);
  }
  const auHasard = (min, max, f) => { const id = setInterval(() => { if (Math.random() < 0.5) f(); }, min + Math.random() * (max - min)); minuteurs.push(id); };
  const AMBIANCES = {
    foret: () => { nappe([110, 165, 220], 0.05); vent(0.06, 450); auHasard(1800, 3500, () => { const b = 2200 + Math.random() * 1500; ton(b, 0.12, { vers: b * 1.3, vol: 0.04, sortie: gAmb }); ton(b * 1.1, 0.1, { vers: b * 1.4, vol: 0.03, delai: 0.15, sortie: gAmb }); }); },
    ruines: () => { nappe([98, 147, 196], 0.05); vent(0.08, 700); auHasard(4000, 7000, () => ton(659 + Math.random() * 200, 2.5, { vol: 0.03, sortie: gAmb })); },
    fils: () => { nappe([92.5, 138.6, 185], 0.06, 'sawtooth'); vent(0.04, 300); auHasard(2500, 5000, () => ton(1760 + Math.random() * 600, 1.5, { vol: 0.02, sortie: gAmb })); },
    etang: () => { nappe([82.4, 123.5, 164.8], 0.05); vent(0.07, 250); auHasard(1200, 2600, () => { const g = 900 + Math.random() * 700; ton(g, 0.09, { vers: g * 0.5, vol: 0.05, sortie: gAmb }); }); },
    combat: () => {
      nappe([73.4, 110, 146.8], 0.05, 'sawtooth');
      let i = 0; const id = setInterval(() => { // un tambour sourd, 84 battements par minute
        if (!ctx) return; const fort = i % 4 === 0; i++;
        ton(fort ? 95 : 75, 0.25, { vers: 45, vol: fort ? 0.12 : 0.07, sortie: gAmb });
      }, 714); minuteurs.push(id);
    }
  };
  function lancerAmbiance(nom) {
    if (!ctx || ctx.state !== 'running') return;
    arreterAmbiance();
    if (!reglages.amb || !AMBIANCES[nom]) return;
    ambCourante = nom; AMBIANCES[nom]();
  }
  function ambiance(nom) {
    if (nom === ambDemandee && ambCourante) return;
    ambDemandee = nom;
    if (ctx && ctx.state === 'running') lancerAmbiance(nom);
  }
  // Coupe le son quand l'appli passe en arrière-plan
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });

  function regler(cle, valeur) {
    reglages[cle] = valeur; sauverReglages();
    if (!ctx) return;
    if (cle === 'sfx') gSfx.gain.value = valeur ? 0.55 : 0;
    if (cle === 'amb') { gAmb.gain.value = valeur ? 0.35 : 0; if (valeur && ambDemandee) lancerAmbiance(ambDemandee); if (!valeur) arreterAmbiance(); }
  }

  racine.Son = { coup, jouer, tissage, ambiance, regler, reglages: () => Object.assign({}, reglages) };
})(window);
