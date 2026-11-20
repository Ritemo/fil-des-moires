/**
 * Le Fil des Moires : sauvegarde commune (téléphone + ordinateur), pour un ou plusieurs joueurs.
 * À coller dans un projet Google Apps Script, puis déployer en « Application Web ».
 *
 * Joueur principal : propriété du script CLE, fichier fil-des-moires-sauvegarde.json
 * Autres joueurs   : propriété CLE_PRENOM (ex. CLE_JULIE), fichier fil-des-moires-julie.json
 * Chaque joueur a sa propre clé et son propre fichier : les parties sont séparées et indépendantes.
 */
const NOM_FICHIER = 'fil-des-moires-sauvegarde.json';

const VERSION_SCRIPT = 10;
const NOM_MESSAGES = 'fil-des-moires-messagerie.json';
const DEPOT = 'Ritemo/fil-des-moires';
const ADRESSE_JEU = 'https://ritemo.github.io/fil-des-moires/';

function doGet(e) {
  // Vérification sans clé : ouvrir <adresse>/exec?version=1 doit afficher la version du script
  if (e.parameter.version) return reponse({ ok: true, version: VERSION_SCRIPT,
    joueurs: PropertiesService.getScriptProperties().getKeys().filter(function (k) { return k.indexOf('CLE_') === 0; }).map(function (k) { return k.slice(4); }),
    rappelInstalle: ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'rappelDuMatin'; }),
    journal: JSON.parse(PropertiesService.getScriptProperties().getProperty('JOURNAL') || '[]') });
  const joueur = nettoyer(e.parameter.joueur);
  if (joueur && !PropertiesService.getScriptProperties().getProperty('CLE_' + joueur.toUpperCase())) return reponse({ ok: false, erreur: 'joueur', version: VERSION_SCRIPT });
  if (joueur === false || !cleValide(joueur, e.parameter.cle)) return reponse({ ok: false, erreur: 'cle', version: VERSION_SCRIPT });
  if (e.parameter.classement) return reponse({ ok: true, classement: classement() });
  if (e.parameter.messages) { const depuis = +e.parameter.depuis || 0; return reponse({ ok: true, messages: lireMessages().filter(function (m) { return m.t > depuis; }) }); }
  if (e.parameter.rappels && !joueur) return reponse({ ok: true, rappels: rappels() }); // réservé au joueur principal (robot de rappel)
  if (e.parameter.boite && !joueur) return reponse({ ok: true, messages: viderBoite() });   // réservé au robot « Envoi » (GitHub)
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
      joueur: j,
      nom: p.pseudo || (j ? j.charAt(0).toUpperCase() + j.slice(1) : 'Joueur principal'),
      // Agora : trophées de l'Arène, dégâts sur le Titan de la semaine, talisman (pour son ombre dans l'Arène)
      act: p.activites ? { trophees: (p.activites.arene || {}).trophees || 0, titan: p.activites.titan || null,
        talisman: p.activites.talisman || null, talismans: p.activites.talismans || {} } : null,
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
        voie: p.voie || null, serments: p.serments || {},
        cartes: p.cartes || {}, creatures: p.creatures || [], drachmes: p.drachmes || 0
      }
    };
  }).filter(function (x) { return x; });
}

function doPost(e) {
  const corps = JSON.parse(e.postData.contents);
  const joueur = nettoyer(corps.joueur);
  if (joueur === false || !cleValide(joueur, corps.cle)) return reponse({ ok: false, erreur: 'cle' });
  if (corps.message) return reponse(posterMessage(joueur, corps.message));
  const recu = corps.profil;
  if (!recu || !recu.maj) return reponse({ ok: false, erreur: 'profil' });
  // Verrou : deux sauvegardes simultanées ne doivent pas lire la même version (sinon l'annonce part deux fois)
  const verrou = LockService.getScriptLock(); verrou.waitLock(20000);
  let actuel, ecrit = false;
  try {
    actuel = lire(joueur);
    // On garde toujours la version la plus récente (champ maj, en millisecondes)
    if (!actuel || !actuel.maj || recu.maj >= actuel.maj) { ecrire(joueur, recu); ecrit = true; }
  } finally { verrou.releaseLock(); }
  if (!ecrit) return reponse({ ok: true, donnees: actuel, ecrit: false });
  try { annoncerExploit(joueur, actuel, recu); } catch (err) { noter('annonce impossible : ' + err); }
  return reponse({ ok: true, donnees: recu, ecrit: true });
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
  try { ajouterMessage({ type: 'annonce', de: joueur, nom: nom, texte: 'a tissé le jour ' + r.jour + (r.titre ? ' · ' + r.titre : '') + ' · ' + resultat }); } catch (err) { noter('messagerie : ' + err); }
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

// ntfy limite les envois par adresse IP, et Google partage ses adresses entre des milliers de scripts :
// l'envoi direct est souvent refusé (429). Dans ce cas, le message est mis dans une boîte d'envoi
// et le robot GitHub « Envoi » est réveillé pour l'expédier depuis ses propres serveurs.
function envoyerNtfy(sujet, titre, message, sansReveil) {
  const corps = { topic: sujet, title: titre, message: message, click: ADRESSE_JEU, tags: ['crossed_swords'] };
  let code = 0;
  try { code = UrlFetchApp.fetch('https://ntfy.sh/', { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(corps) }).getResponseCode(); }
  catch (err) { code = 'erreur'; }
  if (code === 200) { noter(titre + ' -> 200'); return true; }
  deposer(corps);
  noter(titre + ' -> ' + code + ', confié au robot');
  if (!sansReveil) reveillerRobot();
  return false;
}

function deposer(corps) {
  const verrou = LockService.getScriptLock(); verrou.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties(), b = JSON.parse(props.getProperty('BOITE') || '[]');
    b.push(corps); props.setProperty('BOITE', JSON.stringify(b.slice(-30)));
  } finally { verrou.releaseLock(); }
}
function viderBoite() {
  const verrou = LockService.getScriptLock(); verrou.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties(), b = JSON.parse(props.getProperty('BOITE') || '[]');
    props.setProperty('BOITE', '[]'); return b;
  } finally { verrou.releaseLock(); }
}
// Lance le robot GitHub « Envoi » (propriété GITHUB_JETON : jeton GitHub avec le droit Actions en écriture sur le dépôt)
function reveillerRobot() {
  const jeton = PropertiesService.getScriptProperties().getProperty('GITHUB_JETON');
  if (!jeton) { noter('robot non réveillé : propriété GITHUB_JETON absente'); return; }
  const r = UrlFetchApp.fetch('https://api.github.com/repos/' + DEPOT + '/actions/workflows/envoi.yml/dispatches', { method: 'post', muteHttpExceptions: true,
    contentType: 'application/json', headers: { Authorization: 'Bearer ' + jeton, Accept: 'application/vnd.github+json' }, payload: JSON.stringify({ ref: 'main' }) });
  noter('robot réveillé -> ' + r.getResponseCode() + (r.getResponseCode() === 204 ? ' (ok)' : ''));
}

// À lancer depuis l'éditeur pour tout vérifier : envoie une notification de test au joueur principal en passant par le robot
function testerRobot() {
  const p = lire('');
  if (!p || !p.ntfy) throw new Error('Active d\'abord le Rappel du matin dans les Réglages du jeu (joueur principal).');
  deposer({ topic: p.ntfy, title: '🧵 Le Fil des Moires', message: 'Le robot d\'envoi fonctionne : tes rappels arriveront même quand ntfy refuse Google.', click: ADRESSE_JEU, tags: ['crossed_swords'] });
  reveillerRobot();
}

// Journal des 15 derniers envois (visible avec <adresse>/exec?version=1, sans clé)
function noter(texte) {
  const props = PropertiesService.getScriptProperties();
  const j = JSON.parse(props.getProperty('JOURNAL') || '[]');
  j.unshift(Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM HH:mm') + ' · ' + texte);
  props.setProperty('JOURNAL', JSON.stringify(j.slice(0, 15)));
}

// ---------- Rappel du matin, envoyé par Google chaque jour vers 8 h (plus fiable que le robot GitHub) ----------
function rappelDuMatin() {
  let aConfier = false;
  const auj = Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd');
  PropertiesService.getScriptProperties().getKeys()
    .filter(function (k) { return k === 'CLE' || k.indexOf('CLE_') === 0; })
    .forEach(function (k) {
      const j = k === 'CLE' ? '' : k.slice(4).toLowerCase(), p = lire(j);
      if (!p || !p.ntfy) return;
      if (p.derniereDate === auj) { noter(nomDe(j, p) + ' a déjà joué : pas de rappel'); return; }
      const pr = p.prochaine || { jour: (p.joursJoues || 0) + 1, titre: 'ta quête t\'attend', presage: '' };
      if (!envoyerNtfy(p.ntfy, '🧵 Jour ' + pr.jour + ' : ' + pr.titre, (pr.presage || 'Le fil t\'attend.') + (pr.nouveau ? '\n' + pr.nouveau : ''), true)) aConfier = true;
    });
  if (aConfier) reveillerRobot();
}

// À lancer une fois depuis l'éditeur (bouton Exécuter) : programme le rappel chaque jour vers 8 h, heure de Paris
function installerRappel() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'rappelDuMatin') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('rappelDuMatin').timeBased().atHour(8).everyDays(1).inTimezone('Europe/Paris').create();
  noter('rappel du matin programmé');
}

// À lancer une fois depuis l'éditeur (bouton Exécuter) : autorise l'envoi de notifications et t'envoie un test
function testerNotification() {
  const p = lire('');
  if (!p || !p.ntfy) throw new Error('Active d\'abord le Rappel du matin dans les Réglages du jeu (joueur principal).');
  envoyerNtfy(p.ntfy, '🧵 Le Fil des Moires', 'Le script de sauvegarde peut t\'envoyer des notifications.');
}

// ---------- Messagerie « Le Corbeau d'Hermès » : messages entre joueurs (200 derniers gardés) ----------
function fichierMessages() {
  const l = DriveApp.getFilesByName(NOM_MESSAGES);
  return l.hasNext() ? l.next() : DriveApp.createFile(NOM_MESSAGES, '[]', 'application/json');
}
function lireMessages() { try { return JSON.parse(fichierMessages().getBlob().getDataAsString()) || []; } catch (err) { return []; } }
function ajouterMessage(m) {
  const verrou = LockService.getScriptLock(); verrou.waitLock(10000);
  try {
    const liste = lireMessages();
    m.t = Date.now(); m.id = m.t.toString(36) + Math.random().toString(36).slice(2, 6);
    liste.push(m);
    fichierMessages().setContent(JSON.stringify(liste.slice(-200)));
    return m;
  } finally { verrou.releaseLock(); }
}
function posterMessage(joueur, msg) {
  const p = lire(joueur), nom = nomDe(joueur, p);
  let m;
  if (msg.reaction) {
    const emoji = String(msg.reaction).slice(0, 8), cible = String(msg.cible || '');
    const visee = lireMessages().filter(function (x) { return x.id === cible; })[0];
    if (!visee) return { ok: false, erreur: 'cible' };
    m = ajouterMessage({ type: 'reaction', de: joueur, nom: nom, texte: emoji, cible: cible });
    if (visee.de !== joueur) prevenir([visee.de], '🐦‍⬛ ' + nom + ' a réagi ' + emoji, visee.type === 'annonce' ? nomDe(visee.de, null) + ' ' + visee.texte : visee.texte);
  } else {
    const texte = String(msg.texte || '').trim().slice(0, 500);
    if (!texte) return { ok: false, erreur: 'vide' };
    m = ajouterMessage({ type: 'msg', de: joueur, nom: nom, texte: texte });
    prevenir(tousLesJoueurs().filter(function (j) { return j !== joueur; }), '🐦‍⬛ ' + nom, texte);
  }
  return { ok: true, message: m };
}
function tousLesJoueurs() {
  return PropertiesService.getScriptProperties().getKeys()
    .filter(function (k) { return k === 'CLE' || k.indexOf('CLE_') === 0; })
    .map(function (k) { return k === 'CLE' ? '' : k.slice(4).toLowerCase(); });
}
function prevenir(joueurs, titre, texte) {
  let confie = false;
  joueurs.forEach(function (j) {
    const p = lire(j);
    if (!p || !p.ntfy || p.ntfyMessages === false) return;
    if (!envoyerNtfy(p.ntfy, titre, texte, true)) confie = true;
  });
  if (confie) reveillerRobot();
}
