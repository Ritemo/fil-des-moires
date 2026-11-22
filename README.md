# 🧵 Le Fil des Moires

Jeu d'aventure au tour par tour avec **une épreuve par jour**, inspiré du *Tiers Âge*, de Pokémon et de la mythologie grecque. Projet personnel, 100 % gratuit.

**Phase actuelle : 1 terminée : cartes, XP, drachmes, Collection, Don des Moires, Offrande du jour, série douce, Route de la Tapisserie, épreuves générées (Hydre, Cyclope, Chimère, Sirène).** Les graphismes sont provisoires (des emojis).

## Comment ça marche

```
data.js     le contenu : héros, ennemis, épreuve, conseils de Clotho
engine.js   les règles du combat (file d'initiative, affinités, Gloire, Hubris...)
app.js      l'interface sur téléphone
index.html  la page, avec son style
sync.js     la sauvegarde commune entre appareils
tapisserie.js le dessin de la Tapisserie
progression.js cartes, niveaux, XP, drachmes, Don des Moires, Offrande, série, Route, Voies, Serments, créatures liées, Codex
chant1.js    le Chant I écrit : 30 jours, scènes, répliques de fin, choix et leurs conséquences
chant2.js    le Chant II écrit : « La Forge sous la Montagne », jours 31 à 60 du récit
epreuves.js  l'épreuve du jour (Chant I, Chant II, puis des épreuves générées en attendant le Chant III)
sauvegarde/ le script Google Apps Script de sauvegarde
voix.js     les voix : fichiers pré-enregistrés (art/voix/), sinon la synthèse vocale de l'appareil
outils/     repliques.js (liste des répliques) et voix.py (enregistrement), utilisés par le robot Voix
son.js      le son : bruitages et ambiances, synthétisés en direct (aucun fichier audio)
emojis.js   remplace les emojis par les images 3D de art/e/ (même rendu sur tous les appareils)
art/e/      les émoticônes 3D Fluent Emoji de Microsoft (licence MIT, voir LICENCE-fluentui-emoji.txt)
sw.js       le cache hors ligne (changer VERSION à chaque modification)
tests/      les tests et la simulation d'équilibrage
```

Le hasard de l'épreuve du jour dépend de la date : recharger la page ne change rien. Une seule tentative compte par jour. Le mode Écho permet ensuite de rejouer sans récompense.

À partir du jour 4, l'Errant peut **Lier** une créature affaiblie (moins de 35 % de PV, hors Gardien). Une créature liée rejoint la Collection et peut remplacer Kelos dans la Préparation. Le **Chant I** (« Les Vals d'Aelwen ») dure 30 jours en quatre chapitres. Chaque jour commence par une courte scène et se termine par une réplique ; certains jours se terminent par un choix définitif qui change la suite. La **Chronique** (sur l'accueil) garde le récit de chaque jour. Si l'Hydre éveillée n'est pas vaincue au jour 30, la finale revient le lendemain.

Une carte au **niveau 5** peut **évoluer** une fois (300 drachmes) : nouveau nom, nouvelle illustration, un effet en plus. Les évolutions sont dans `EVOLUTIONS` (data.js).

L'accueil est organisé en **onglets** en bas de l'écran : Trésors (Offrande, choix en attente, Route), Cartes, Épreuve, Tapisserie (avec la Chronique) et Codex. Les Réglages sont sous l'icône ⚙️ du bandeau.

Le **Codex** liste les créatures croisées, vaincues et liées ; chaque spécimen vaincu rend le lien suivant un peu plus facile.

## Mise en ligne (sans savoir coder)

1. Sur GitHub, créer un dépôt public `fil-des-moires` sur le compte Ritemo.
2. *Add file > Upload files* : déposer tous les fichiers de ce dossier.
3. *Settings > Pages* : source `main`, dossier `/ (root)`, puis *Save*.
4. Le jeu est disponible à l'adresse `https://ritemo.github.io/fil-des-moires/`. Sur le téléphone, menu du navigateur, puis *Ajouter à l'écran d'accueil*.

## Sauvegarde commune (téléphone + ordinateur)

La partie est enregistrée dans un fichier de ton Google Drive (`fil-des-moires-sauvegarde.json`), via un petit script Google gratuit et privé.

1. Ouvrir [script.google.com](https://script.google.com) (connecté à ton compte Google), puis *Nouveau projet*. Le renommer « Fil des Moires sauvegarde ».
2. Effacer le contenu de `Code.gs` et coller celui du fichier `sauvegarde/Code.gs` de ce dépôt. Enregistrer.
3. *Paramètres du projet* (roue dentée) > *Propriétés du script* > *Ajouter* : nom `CLE`, valeur : une clé secrète de ton choix (par exemple trois mots au hasard). Enregistrer.
4. *Déployer* > *Nouveau déploiement* > type *Application Web*. « Exécuter en tant que » : **moi**. « Qui a accès » : **Tout le monde**. Déployer, puis autoriser l'accès à ton Drive.
5. Copier l'**URL de l'application Web** (elle se termine par `/exec`).
6. Dans le jeu, sur chaque appareil : en bas de l'accueil, *Configurer*, coller l'adresse et la clé, puis *Tester et enregistrer*.

Le jeu garde toujours la version la plus récente. Sans réseau, il continue en local et se resynchronise au retour.
Si un jour tu modifies le script, il faut *Déployer* > *Gérer les déploiements* > modifier > *Nouvelle version*, sinon l'ancienne version reste en ligne.

### Inviter un autre joueur (partie séparée)

Chaque invité a sa propre partie, sauvegardée dans le même script mais dans un fichier séparé (`fil-des-moires-<prénom>.json`). Les parties sont indépendantes : chacun joue les jours qu'il veut.

1. (Une seule fois) Mettre à jour le script avec la dernière version de `sauvegarde/Code.gs`, puis *Déployer* > *Gérer les déploiements* > modifier > *Nouvelle version*. L'adresse ne change pas.
2. Dans le jeu : *Réglages* (⚙️) > *Inviter un joueur*, saisir son prénom. Le jeu affiche une clé et un lien.
3. Dans le script : *Propriétés du script* > *Ajouter* `CLE_PRENOM` (ex. `CLE_JULIE`) avec la clé affichée.
4. Envoyer le lien à l'invité : il l'ouvre une fois sur chacun de ses appareils, et sa partie est sauvegardée.

### Classement

Onglet *Tapisserie* > 🏆 : la progression de tous les joueurs du même script (nom, jour, étoiles, victoires parfaites, mini-tapisserie). Chacun choisit son nom dans les *Réglages*. Nécessite la dernière version de `sauvegarde/Code.gs` (Nouvelle version du déploiement).

**Sans script** : la même fenêtre propose un transfert manuel par code à copier-coller.

## Gestes courants

- **Changer l'équilibrage** : modifier les chiffres dans `data.js` (PV, attaque, puissance des compétences), puis lancer `node tests/simulation.js` pour vérifier les taux de victoire.
- **Tester plusieurs fois le même jour** : bouton « Réinitialiser (tests) » en bas de l'accueil.
- **Après une modification** : augmenter `VERSION` dans `sw.js`.

## Illustrations

Les personnages, créatures et cartes utilisent les émoticônes 3D **Fluent Emoji** de Microsoft (licence MIT, libres d'utilisation). Pour ajouter un emoji : déposer son image 3D (256 px, réduite à 160 px) dans `art/e/` sous le nom de son code Unicode (ex. `1f409.png` pour 🐉) et l'ajouter à la table de `emojis.js`. Un emoji sans image reste affiché en texte.

## Voix de l'histoire

Le robot **Voix** (GitHub Actions, `.github/workflows/voix.yml`) enregistre chaque réplique de l'histoire avec une voix neuronale par personnage (service de lecture à voix haute de Microsoft Edge, via `edge-tts`, gratuit et sans clé). Il se lance tout seul quand `chant1.js` ou `chant2.js` change, ou à la main : onglet *Actions* > *Voix* > *Run workflow*. Les fichiers vont dans `art/voix/` ; seules les répliques nouvelles ou modifiées sont enregistrées. Les voix de chaque personnage se règlent dans `outils/voix.py`. Si un fichier manque, le jeu utilise la voix de l'appareil.

## Rattrapage des jours manqués

Une épreuve par jour, mais un oubli ne pénalise pas : chaque jour manqué donne droit à une épreuve de rattrapage (2 au maximum en réserve). La réserve est calculée à la fin de la première épreuve jouée après l'absence ; l'accueil propose alors « Rattraper un jour ».

## Le monde : Moires, penchant, Oracle, fragments, Hermès, fêtes, hauts faits

- **Les trois Moires** se partagent le monde : Clotho (épreuves, liens, expéditions, forge), Lachésis (Oracle, Arène, Titan, hauts faits, penchant), Atropos (libération des créatures, et plus tard la Chimère).
- **Penchant** : les choix du Chant (10 points) et les activités (1 point : assaut sur le Titan ou victoire dans l'Arène pour l'Honneur, expédition pour la Ruse, bonne réponse à l'Oracle pour la Piété) donnent un penchant dominant, avec une faveur (+5 % PV, +5 % critique ou +10 % soins) et des répliques propres au jour 30 (condition `dominante=honneur`).
- **Présage de la Pythie** : une bonne réponse à l'Oracle révèle la faiblesse du gardien de la prochaine épreuve, et toute l'équipe commence cette épreuve avec un coup critique.
- **Fragments de la Tapisserie** : 3 séries de 4 (expéditions 30 %, Titan à 50 et 100 %, Oracle toutes les 7 bonnes réponses, Hermès). Une série complète révèle une page du mythe, dite par une Moire. À lire dans le Codex.
- **Le Marchand Hermès** (Agora) : 4 articles par semaine, renouvelés le lundi, chacun achetable une fois.
- **Fêtes** : tous les 9 jours, 2 jours de fête communs à tous (Panathénées : Arène doublée ; Dionysies : expéditions plus riches ; Nuit de Séléné : Oracle doublé).
- **Hauts faits** : 14 exploits (Codex), avec des titres à afficher dans le classement (script version 11).

## Décors et effets de combat

- **Décors** : peintures du domaine public (Wikimedia Commons) dans `art/decor/`, téléchargées par le robot « Décors » (`outils/decors.py`, lancement manuel) : Chichkine (forêt, chapitre I), Friedrich (abbaye en ruine, chapitre II ; voyageur au-dessus de la mer de nuages, chapitre III et Titan), Böcklin (L'Île des morts, chapitre IV), von Klenze (l'Acropole, Agora et Arène). Pour en changer, modifier la liste dans `outils/decors.py` et relancer le robot.
- **Effets de combat** : projectiles aux couleurs de l'affinité (entaille pour l'airain et la roc), onde de choc, tampon CRITIQUE, éclair d'écran, ralenti sur le coup final. Désactivés si le téléphone demande de réduire les animations.
- **Aujourd'hui** : la ligne de pastilles en haut de l'accueil résume ce qui reste à faire dans la journée.

## L'Enclos de Chiron (créatures liées)

On peut lier plusieurs fois la même espèce. Chaque créature liée a sa fiche dans l'Enclos (onglet Cartes, 10 places) : un surnom modifiable, un trait tiré au hasard (Vif, Robuste, Féroce, Placide, Fidèle) qui la rend un peu différente, sa date de liaison. Une seule créature accompagne l'équipe (choix dans l'Enclos ou pendant la Préparation). On peut libérer une créature. Enclos plein : une nouvelle liaison renforce seulement les cartes de l'espèce.

## L'Agora (activités du jour)

L'onglet Agora (ancien onglet Trésors) réunit, en plus de l'Offrande et de la Route de la Tapisserie, des activités qui s'ouvrent une par une (fichier `activites.js`) :

| Activité | Ouverture | Principe |
|---|---|---|
| 🔮 Oracle de Delphes | après le jour 3 | une énigme mythologique par jour, la même pour tous ; drachmes et éclats d'oracle |
| 🏟️ Arène des ombres | après le jour 4 | un duel par jour contre l'ombre d'un autre joueur (son équipe, pilotée par l'ordinateur) ; trophées et ligues |
| ⚒️ Forge d'Héphaïstos | après le jour 4 | des talismans (3 niveaux) fabriqués avec les matériaux ; le talisman équipé renforce l'équipe partout |
| 🗺️ Expéditions | après le jour 5 | jusqu'à 3 créatures (Kelos et l'Enclos) explorent en même temps pour 2, 4 ou 8 heures ; plus c'est long, plus le butin est riche |
| 🗿 Titan de la semaine | après le jour 6 | un boss commun du lundi au dimanche ; un assaut de 12 actions par jour, les dégâts de tous s'additionnent ; récompenses à 25, 50, 75 et 100 % |
| 🌀 Labyrinthe des Échos | après le jour 7 | descente de salle en salle, PV conservés, un bienfait au choix entre les salles ; rejouable, seule la meilleure profondeur du jour est récompensée |
| 🎲 Astragales d'Hermès | après le jour 4 | jeu d'osselets contre Hermès, mise de 10 drachmes, 10 parties par jour |

L'Arène et le Titan lisent les autres joueurs dans le classement du script de sauvegarde (version 7 ou plus). La version 13 du script ajoute la profondeur du Labyrinthe au classement. Sans sauvegarde commune, on affronte sa propre ombre et on combat le Titan seul.

## Le Corbeau d'Hermès (messagerie)

L'icône 🐦‍⬛ du bandeau ouvre une messagerie entre les joueurs qui partagent la sauvegarde commune : messages libres, présages rapides en un appui, réactions (👏 ⚔️ 🔥 😮) sur les annonces d'épreuves. Les 200 derniers messages sont gardés dans `fil-des-moires-messagerie.json` (Drive). Chaque message prévient les autres joueurs par ntfy (option dans Réglages, Rappel du matin). Nécessite le script en version 9.

## Annonce des exploits

Quand un joueur termine son épreuve, le script de sauvegarde envoie une notification ntfy aux autres joueurs qui ont activé le Rappel du matin (« 🧵 Marion a tissé le jour 4 », avec ses étoiles). Chacun peut la couper dans Réglages, Rappel du matin. Après avoir collé le script, lancer une fois la fonction `testerNotification` depuis l'éditeur Apps Script pour autoriser l'envoi.

## Rappel du matin et robot « Envoi »

Chaque matin vers 8 h (heure de Paris), le script de sauvegarde envoie à chaque joueur qui a activé le rappel le titre et le Présage de sa prochaine épreuve, sauf s'il a déjà joué. Mise en place, une seule fois : dans l'éditeur Apps Script, choisir la fonction `installerRappel` et cliquer sur Exécuter.

ntfy refuse souvent les messages venant de Google (erreur 429 : les serveurs de Google sont partagés par des milliers de scripts). Dans ce cas, le script dépose le message dans une boîte d'envoi et réveille le robot GitHub « Envoi » (`.github/workflows/envoi.yml`), qui l'expédie aussitôt. Pour cela, le script a besoin d'un jeton GitHub :

1. Sur GitHub : photo de profil > Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token.
2. Nom « Fil des Moires », expiration la plus longue possible, Repository access : Only select repositories > fil-des-moires, Permissions : Actions > Read and write. Générer et copier le jeton.
3. Dans Apps Script : Paramètres du projet > Propriétés du script > ajouter `GITHUB_JETON` avec le jeton.
4. Lancer la fonction `testerRobot` depuis l'éditeur : une notification de test doit arriver.

Vérification : `<adresse du script>/exec?version=1` affiche le journal des derniers envois (200 = envoyé directement, « confié au robot » puis « robot réveillé -> 204 » = passé par GitHub). Quand le jeton expire, le journal affiche « robot réveillé -> 401 » : en générer un nouveau.

## Le Chant II : « La Forge sous la Montagne »

Il commence le lendemain de la victoire sur l'Hydre éveillée (le jeu note ce jour dans `histoire.debutChant2` : si la finale a dû être rejouée, le Chant II ne saute aucun jour). Ses jours sont numérotés 31 à 60 dans le récit (`jc`), et ses choix sont gardés sous `j41`, `j48` et `j57`.

- Chapitres : V Les Cendres du Nord, VI Les Forges éteintes, VII Le Labyrinthe de lave, VIII Les Portes du Tartare.
- Gardiens : la Chimère des Forges (jour 37), Argès (44), Lysandre à la lame d'étoile (48), Talos (51), Campé la Geôlière (60, en deux phases : ses Chaînes la protègent, puis elle enrage).
- Nouveaux ennemis : Salamandre, Chien de cendre et Automate de bronze (on peut les lier), Kère (esprit de mort, elle boit la vie), Chaîne du Tartare.
- Nouveau personnage : Cédalion, l'apprenti d'Héphaïstos. Invités de passage selon les choix : Brontès (jours 42 à 44), Ismène, l'ancienne Lysandre (jours 58 et 60).
- Règle d'environnement : la **Chaleur des Forges** (toutes les 9 actions, brûle tout le monde sauf l'Onde et la Flamme), sur six épreuves.
- Une deuxième tapisserie (motif : Campé, fond de lave) ; celle du Chant I reste dans la Chronique. Quatre fragments « Le premier Errant » (disponibles après le Sceau de Maïa) et deux hauts faits.
- Décors : quatre peintures du domaine public téléchargées par le robot Décors (`outils/decors.py`, il les cherche sur Wikimedia Commons).
- Si Campé n'est pas vaincue au jour 60 du récit, la finale revient chaque jour (un peu plus facile à chaque tentative). Ensuite, des épreuves générées avec les ennemis des Forges, en attendant le Chant III.

## Feuille de route (idées pour les saisons suivantes)

- Saison 2 ou 3 : Voie secondaire complète (avec son passif, ou un passif réduit), au lieu des deux seules cartes données au niveau 10.
- Saison 2 ou 3 : avec deux Voies maîtrisées, un emplacement d'attaques porté de 4 à 6 cartes par héros (vérifier l'équilibrage et l'affichage du combat).
- Saison 2 : la Chimère sur mesure. Recueillir du sang de Titan (Titan de la semaine) et, au bout d'un moment, forger sa propre créature à partir des créatures liées : une tête, un corps, des pattes, une queue et un attribut en plus (ailes, cornes...). Chaque morceau apporte une capacité de la créature d'origine (ex. Vol avec les ailes de la chauve-souris, Battement de queue avec la queue du griffon). Les créatures utilisées sont sacrifiées : on perd ces alliés, mais la Chimère reprend leur force : chaque sacrifice lui donne des bonus selon le niveau des cartes de la créature sacrifiée. On peut lier plusieurs exemplaires d'une même créature (plusieurs satyres...), dans la limite de 10 liaisons.
- Saison 3 : combos secrets de la Chimère (ex. tête de manticore + ailes d'aigle = dragon).
- Chant III à écrire avant le jour 60 du récit (le prix caché du chemin d'Hermès, choix `j57=ruse`, y sera révélé).
