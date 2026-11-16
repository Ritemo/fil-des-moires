/**
 * Le Fil des Moires : sauvegarde commune (téléphone + ordinateur).
 * À coller dans un projet Google Apps Script, puis déployer en « Application Web ».
 * La sauvegarde est un fichier JSON dans ton Google Drive : fil-des-moires-sauvegarde.json
 * Protection : une clé secrète (propriété du script CLE) que le jeu doit envoyer.
 */
const NOM_FICHIER = 'fil-des-moires-sauvegarde.json';

function doGet(e) {
  if (!cleValide(e.parameter.cle)) return reponse({ ok: false, erreur: 'cle' });
  return reponse({ ok: true, donnees: lire() });
}

function doPost(e) {
  const corps = JSON.parse(e.postData.contents);
  if (!cleValide(corps.cle)) return reponse({ ok: false, erreur: 'cle' });
  const actuel = lire();
  const recu = corps.profil;
  // On garde toujours la version la plus récente (champ maj, en millisecondes)
  if (!actuel || !actuel.maj || (recu && recu.maj >= actuel.maj)) {
    ecrire(recu);
    return reponse({ ok: true, donnees: recu, ecrit: true });
  }
  return reponse({ ok: true, donnees: actuel, ecrit: false });
}

function cleValide(cle) {
  const attendue = PropertiesService.getScriptProperties().getProperty('CLE');
  return attendue && cle === attendue;
}

function fichier() {
  const liste = DriveApp.getFilesByName(NOM_FICHIER);
  return liste.hasNext() ? liste.next() : DriveApp.createFile(NOM_FICHIER, '{}', 'application/json');
}
function lire() {
  try { const d = JSON.parse(fichier().getBlob().getDataAsString()); return d && d.maj ? d : null; } catch (err) { return null; }
}
function ecrire(profil) { fichier().setContent(JSON.stringify(profil)); }

function reponse(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON);
}
