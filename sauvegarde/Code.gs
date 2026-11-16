/**
 * Le Fil des Moires : sauvegarde commune (téléphone + ordinateur), pour un ou plusieurs joueurs.
 * À coller dans un projet Google Apps Script, puis déployer en « Application Web ».
 *
 * Joueur principal : propriété du script CLE, fichier fil-des-moires-sauvegarde.json
 * Autres joueurs   : propriété CLE_PRENOM (ex. CLE_JULIE), fichier fil-des-moires-julie.json
 * Chaque joueur a sa propre clé et son propre fichier : les parties sont séparées et indépendantes.
 */
const NOM_FICHIER = 'fil-des-moires-sauvegarde.json';

const VERSION_SCRIPT = 5;
const ADRESSE_JEU = 'https://ritemo.github.io/fil-des-moires/';

function doGet(e) {
  // Vérification sans clé : ouvrir <adresse>/exec?version=1 doit afficher la version du script
  if (e.parameter.version) return reponse({ ok: true, version: VERSION_SCRIPT, joueurs: PropertiesService.getScriptProperties().getKeys().filter(function (k) { return k.indexOf('CLE_') === 0; }).map(function (k) { return k.slice(4); }) });
  const joueur = nettoyer(e.parameter.joueur);
  if (joueur && !PropertiesService.getScriptProperties().getProperty('CLE_' + joueur.toUpperCase())) return reponse({ ok: false, erreur: 'joueur', version: VERSION_SCRIPT });
  if (joueur === false || !cleValide(joueur, e.parameter.cle)) return reponse({ ok: false, erreur: 'cle', version: VERSION_SCRIPT });
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
      rangs: rangs.map(function (r) { return { jour: r.jour, victoire: r.victoire, etoiles: r.etoiles }; }),
      // Carte de joueur : les 7 derniers rangs en détail et l'équipe actuelle (le jeu met en forme)
      fiche: {
        recents: rangs.slice(-7),
        equipement: p.equipement || {}, creature: p.creature || null, compagnons: p.compagnons || [],
        cartes: p.cartes || {}, creatures: p.creatures || [], drachmes: p.drachmes || 0
      }
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
    try { annoncerExploit(joueur, actuel, recu); } catch (err) { console.log('Annonce impossible : ' + err); }
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

// ---------- Annonce aux autres joueurs : « Marion a tissé le jour 4 » (notification ntfy) ----------
function rangsTisses(p) { return ((p && p.rangs) || []).filter(function (r) { return !r.echo; }); }
function nomDe(joueur, p) { return (p && p.pseudo) || (joueur ? joueur.charAt(0).toUpperCase() + joueur.slice(1) : 'Joueur principal'); }

function annoncerExploit(joueur, avant, apres) {
  if (!avant || !apres) return;                        // première sauvegarde d'un joueur : rien à annoncer
  const r0 = rangsTisses(avant), r1 = rangsTisses(apres);
  if (r1.length <= r0.length) return;                  // pas de nouvelle épreuve tissée
  const r = r1[r1.length - 1];
  const nom = nomDe(joueur, apres);
  const resultat = r.victoire ? '★'.repeat(r.etoiles || 0) + '☆'.repeat(3 - (r.etoiles || 0)) : 'le fil a cédé';
  const titre = '🧵 ' + nom + ' a tissé le jour ' + r.jour;
  const message = (r.titre ? r.titre + ' · ' : '') + resultat + (r.resume ? '\n' + r.resume : '');
  PropertiesService.getScriptProperties().getKeys()
    .filter(function (k) { return k === 'CLE' || k.indexOf('CLE_') === 0; })
    .map(function (k) { return k === 'CLE' ? '' : k.slice(4).toLowerCase(); })
    .filter(function (j) { return j !== joueur; })
    .forEach(function (j) {
      const p = lire(j);
      if (!p || !p.ntfy || p.ntfyAutres === false) return;
      envoyerNtfy(p.ntfy, titre, message);
    });
}

function envoyerNtfy(sujet, titre, message) {
  UrlFetchApp.fetch('https://ntfy.sh/', { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ topic: sujet, title: titre, message: message, click: ADRESSE_JEU, tags: ['crossed_swords'] }) });
}

// À lancer une fois depuis l'éditeur (bouton Exécuter) : autorise l'envoi de notifications et t'envoie un test
function testerNotification() {
  const p = lire('');
  if (!p || !p.ntfy) throw new Error('Active d\'abord le Rappel du matin dans les Réglages du jeu (joueur principal).');
  envoyerNtfy(p.ntfy, '🧵 Le Fil des Moires', 'Le script de sauvegarde peut t\'envoyer des notifications.');
}
