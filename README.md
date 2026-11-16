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
epreuves.js  l'épreuve du jour (le Chant I, puis des épreuves générées en attendant le Chant II)
sauvegarde/ le script Google Apps Script de sauvegarde
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

**Sans script** : la même fenêtre propose un transfert manuel par code à copier-coller.

## Gestes courants

- **Changer l'équilibrage** : modifier les chiffres dans `data.js` (PV, attaque, puissance des compétences), puis lancer `node tests/simulation.js` pour vérifier les taux de victoire.
- **Tester plusieurs fois le même jour** : bouton « Réinitialiser (tests) » en bas de l'accueil.
- **Après une modification** : augmenter `VERSION` dans `sw.js`.

## Illustrations

Les personnages, créatures et cartes utilisent les émoticônes 3D **Fluent Emoji** de Microsoft (licence MIT, libres d'utilisation). Pour ajouter un emoji : déposer son image 3D (256 px, réduite à 160 px) dans `art/e/` sous le nom de son code Unicode (ex. `1f409.png` pour 🐉) et l'ajouter à la table de `emojis.js`. Un emoji sans image reste affiché en texte.
