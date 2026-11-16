/**
 * Le Fil des Moires : sauvegarde commune (téléphone + ordinateur), pour un ou plusieurs joueurs.
 * À coller dans un projet Google Apps Script, puis déployer en « Application Web ».
 *
 * Joueur principal : propriété du script CLE, fichier fil-des-moires-sauvegarde.json
 * Autres joueurs   : propriété CLE_PRENOM (ex. CLE_JULIE), fichier fil-des-moires-julie.json
 * Chaque joueur a sa propre clé et son propre fichier : les parties sont séparées et indépendantes.
 */
const NOM_FICHIER = 'fil-des-moires-sauvegarde.json';

function doGet(e) {
  const joueur = nettoyer(e.parameter.joueur);
  if (joueur === false || !cleValide(joueur, e.parameter.cle)) return reponse({ ok: false, erreur: 'cle' });
  if (e.parameter.classement) return reponse({ ok: true, classement: classement() });
  if (e.parameter.rappels && !joueur) return reponse({ ok: true, rappels: rappels() }); // réservé au joueur principal (robot de rappel)
  return reponse({ ok: true, donnees: lire(joueur) });
}

// Rappels quotidiens : pour chaque joueur qui les a activés, de quoi annoncer sa prochaine épreuve
function rappels() {
  return PropertiesService.getScriptProperties().getKeys()
    .filter(function (k) { return k === 'CLE' || k.indexOf('CLE_') === 0; })
    .map(function (k) { const j = k === 'CLE' ? '' : k.slice(4).toLowerCase(); const p = lire(j);
      if (!p || !p.ntfy) return null;
      return { nom: p.pseudo || j || 'Joueur principal', ntfy: p.ntfy, jour: p.joursJoues || 0, derniereDate: p.derniereDate || null,
        choix: (p.histoire || {}).choix || {}, sceaux: (p.histoire || {}).sceaux || [] }; })
    .filter(function (x) { return x; });
}

// Classement : un résumé de la progression de chaque joueur (jamais les clés ni les sauvegardes complètes)
function classement() {
  const props = PropertiesService.getScriptProperties().getKeys();
  const joueurs = props.filter(function (k) { return k === 'CLE' || k.indexOf('CLE_') === 0; })
    .map(function (k) { return k === 'CLE' ? '' : k.slice(4).toLowerCase(); });
  return joueurs.map(function (j) {
    const p = lire(j);
    if (!p) return null;
    const rangs = (p.rangs || []).filter(function (r) { return !r.echo; });
    return {
      nom: p.pseudo || (j ? j.charAt(0).toUpperCase() + j.slice(1) : 'Joueur principal'),
      jour: p.joursJoues || 0, niveau: p.niveau || 1,
      etoiles: rangs.reduce(function (n, r) { return n + (r.victoire ? r.etoiles || 0 : 0); }, 0),
      victoires: rangs.filter(function (r) { return r.victoire; }).length,
      parfaits: rangs.filter(function (r) { return r.victoire && r.etoiles === 3; }).length,
      creatures: (p.creatures || []).length,
      sceaux: ((p.histoire || {}).sceaux || []).length,
      serie: (p.serie || {}).jours || 0,
      derniereDate: p.derniereDate || null,
      rangs: rangs.map(function (r) { return { jour: r.jour, victoire: r.victoire, etoiles: r.etoiles }; })
    };
  }).filter(function (x) { return x; });
}

function doPost(e) {
  const corps = JSON.parse(e.postData.contents);
  const joueur = nettoyer(corps.joueur);
  if (joueur === false || !cleValide(joueur, corps.cle)) return reponse({ ok: false, erreur: 'cle' });
  const actuel = lire(joueur);
  const recu = corps.profil;
  // On garde toujours la version la plus récente (champ maj, en millisecondes)
  if (!actuel || !actuel.maj || (recu && recu.maj >= actuel.maj)) {
    ecrire(joueur, recu);
    return reponse({ ok: true, donnees: recu, ecrit: true });
  }
  return reponse({ ok: true, donnees: actuel, ecrit: false });
}

// Prénom du joueur : lettres et chiffres seulement. Vide = joueur principal. false = invalide.
function nettoyer(joueur) {
  if (!joueur) return '';
  return /^[a-z0-9]{1,20}$/i.test(joueur) ? joueur.toLowerCase() : false;
}
function cleValide(joueur, cle) {
  const attendue = PropertiesService.getScriptProperties().getProperty(joueur ? 'CLE_' + joueur.toUpperCase() : 'CLE');
  return attendue && cle === attendue;
}

function fichier(joueur) {
  const nom = joueur ? 'fil-des-moires-' + joueur + '.json' : NOM_FICHIER;
  const liste = DriveApp.getFilesByName(nom);
  return liste.hasNext() ? liste.next() : DriveApp.createFile(nom, '{}', 'application/json');
}
function lire(joueur) {
  try { const d = JSON.parse(fichier(joueur).getBlob().getDataAsString()); return d && d.maj ? d : null; } catch (err) { return null; }
}
function ecrire(joueur, profil) { fichier(joueur).setContent(JSON.stringify(profil)); }

function reponse(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON);
}
