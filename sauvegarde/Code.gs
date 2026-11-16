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
  return reponse({ ok: true, donnees: lire(joueur) });
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
