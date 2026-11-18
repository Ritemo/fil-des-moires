/* Le Fil des Moires : émoticônes 3D (Fluent Emoji de Microsoft, licence MIT, https://github.com/microsoft/fluentui-emoji).
   Chaque emoji connu est remplacé à l'affichage par son image 3D (art/e/<code>.png), à la taille du texte.
   Ainsi le jeu a le même rendu sur téléphone et sur ordinateur. Les emojis absents restent en texte. */
(function (racine) {
  'use strict';
  const NOMS = {"📏": "1f4cf", "⏩": "23e9", "⏳": "23f3", "☀️": "2600", "☁️": "2601", "♨️": "2668", "⚔": "2694", "⚔️": "2694", "⚕️": "2695", "⚙️": "2699", "⚠️": "26a0", "⚡": "26a1", "⛔": "26d4", "✂️": "2702", "✅": "2705", "✨": "2728", "❌": "274c", "❔": "2754", "❤️": "2764", "⬆": "2b06", "⭐": "2b50", "🃏": "1f0cf", "🆕": "1f195", "🌀": "1f300", "🌅": "1f305", "🌊": "1f30a", "🌋": "1f30b", "🌑": "1f311", "🌞": "1f31e", "🌧️": "1f327", "🌩️": "1f329", "🌪️": "1f32a", "🌲": "1f332", "🌳": "1f333", "🌵": "1f335", "🌹": "1f339", "🌿": "1f33f", "🍇": "1f347", "🍯": "1f36f", "🍷": "1f377", "🎁": "1f381", "🎯": "1f3af", "🎵": "1f3b5", "🎶": "1f3b6", "🎺": "1f3ba", "🏆": "1f3c6", "🏛️": "1f3db", "🏹": "1f3f9", "🏺": "1f3fa", "🐂": "1f402", "🐉": "1f409", "🐍": "1f40d", "🐐": "1f410", "🐗": "1f417", "🐚": "1f41a", "🐲": "1f432", "🐾": "1f43e", "👁️": "1f441", "👑": "1f451", "👹": "1f479", "💡": "1f4a1", "💥": "1f4a5", "💨": "1f4a8", "💫": "1f4ab", "💾": "1f4be", "📅": "1f4c5", "📖": "1f4d6", "📜": "1f4dc", "📢": "1f4e2", "📣": "1f4e3", "📯": "1f4ef", "🔀": "1f500", "🔁": "1f501", "🔥": "1f525", "🔨": "1f528", "🔮": "1f52e", "🔰": "1f530", "🔹": "1f539", "🕊️": "1f54a", "🗡️": "1f5e1", "😱": "1f631", "🙈": "1f648", "🛡️": "1f6e1", "🛤️": "1f6e4", "🥀": "1f940", "🥷": "1f977", "🦁": "1f981", "🦅": "1f985", "🦇": "1f987", "🦉": "1f989", "🧑‍🌾": "1f9d1-200d-1f33e", "🧔🏻": "1f9d4-1f3fb", "🧚‍♀️": "1f9da-200d-2640", "🧜‍♀️": "1f9dc-200d-2640", "🧝🏻": "1f9dd-1f3fb", "🧝🏻‍♀️": "1f9dd-1f3fb-200d-2640", "🧭": "1f9ed", "🧵": "1f9f5", "🧶": "1f9f6", "🩸": "1fa78", "🪈": "1fa88", "🪖": "1fa96", "🪙": "1fa99", "🪨": "1faa8", "🪶": "1fab6", "🪽": "1fabd", "🫧": "1fae7", "🗿": "1f5ff", "🔱": "1f531", "🧿": "1f9ff", "📿": "1f4ff", "⚒️": "2692", "🏟️": "1f3df", "🗺️": "1f5fa", "🐙": "1f419", "⚖️": "2696", "🪔": "1fa94", "🍄": "1f344", "💎": "1f48e", "🪵": "1fab5", "🫒": "1fad2", "🥇": "1f947", "🥈": "1f948", "🥉": "1f949", "🌙": "1f319", "🔑": "1f511", "⛰️": "26f0", "🎖️": "1f396", "⚱️": "26b1", "🪬": "1faac", "🐺": "1f43a", "🦂": "1f982", "🕯️": "1f56f", "🔒": "1f512", "🌾": "1f33e"};
  const sansVS = s => s.replace(/\uFE0F/g, '');
  const TABLE = {};
  Object.keys(NOMS).forEach(e => { TABLE[e] = NOMS[e]; TABLE[sansVS(e)] = NOMS[e]; });
  const cles = Object.keys(TABLE).sort((a, b) => b.length - a.length).map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const motif = new RegExp('(' + cles.join('|') + ')\uFE0F?', 'gu');
  const src = e => { const n = TABLE[e] || TABLE[sansVS(e)]; return n ? 'art/e/' + n + '.png' : null; };

  // Remplace les emojis d'un nœud texte par des images
  function noeudTexte(t) {
    const p = t.parentNode;
    if (!p || p.namespaceURI === 'http://www.w3.org/2000/svg' || /^(SCRIPT|STYLE|OPTION|TEXTAREA|TITLE)$/.test(p.nodeName)) return;
    const s = t.nodeValue; motif.lastIndex = 0;
    if (!motif.test(s)) return;
    motif.lastIndex = 0;
    const frag = document.createDocumentFragment(); let i = 0, m;
    while ((m = motif.exec(s))) {
      if (m.index > i) frag.appendChild(document.createTextNode(s.slice(i, m.index)));
      const img = document.createElement('img'); img.className = 'emo'; img.alt = m[0]; img.draggable = false; img.src = src(m[1]);
      frag.appendChild(img); i = m.index + m[0].length;
    }
    if (i < s.length) frag.appendChild(document.createTextNode(s.slice(i)));
    p.replaceChild(frag, t);
  }
  function parcourir(n) {
    if (n.nodeType === 3) return noeudTexte(n);
    if (n.nodeType !== 1 || n.namespaceURI === 'http://www.w3.org/2000/svg') return;
    const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); const l = [];
    while (w.nextNode()) l.push(w.currentNode);
    l.forEach(noeudTexte);
  }
  function activer(racineDom) {
    parcourir(racineDom);
    new MutationObserver(ms => ms.forEach(m => {
      if (m.type === 'characterData') noeudTexte(m.target);
      else m.addedNodes.forEach(parcourir);
    })).observe(racineDom, { childList: true, subtree: true, characterData: true });
  }
  // Images préchargées (pour le canvas de la tapisserie)
  const cache = {};
  function image(e, surCharge) {
    const s = src(e); if (!s) return null;
    if (!cache[s]) { cache[s] = new Image(); cache[s].src = s; }
    if (!cache[s].complete && surCharge) cache[s].addEventListener('load', surCharge, { once: true });
    return cache[s];
  }
  racine.Emojis = { src, activer, image, NOMS };
})(window);
