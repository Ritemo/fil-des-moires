# 🧵 Le Fil des Moires

Jeu d'aventure au tour par tour avec **une épreuve par jour**, inspiré du *Tiers Âge*, de Pokémon et de la mythologie grecque. Projet personnel, 100 % gratuit.

**Phase actuelle : 0, le prototype de combat.** Les graphismes sont provisoires (des emojis).

## Comment ça marche

```
data.js     le contenu : héros, ennemis, épreuve, conseils de Clotho
engine.js   les règles du combat (file d'initiative, affinités, Gloire, Hubris...)
app.js      l'interface sur téléphone
index.html  la page, avec son style
sw.js       le cache hors ligne (changer VERSION à chaque modification)
tests/      les tests et la simulation d'équilibrage
```

Le hasard de l'épreuve du jour dépend de la date : recharger la page ne change rien. Une seule tentative compte par jour. Le mode Écho permet ensuite de rejouer sans récompense.

## Mise en ligne (sans savoir coder)

1. Sur GitHub, créer un dépôt public `fil-des-moires` sur le compte Ritemo.
2. *Add file > Upload files* : déposer tous les fichiers de ce dossier.
3. *Settings > Pages* : source `main`, dossier `/ (root)`, puis *Save*.
4. Le jeu est disponible à l'adresse `https://ritemo.github.io/fil-des-moires/`. Sur le téléphone, menu du navigateur, puis *Ajouter à l'écran d'accueil*.

## Gestes courants

- **Changer l'équilibrage** : modifier les chiffres dans `data.js` (PV, attaque, puissance des compétences), puis lancer `node tests/simulation.js` pour vérifier les taux de victoire.
- **Tester plusieurs fois le même jour** : bouton « Réinitialiser (tests) » en bas de l'accueil.
- **Après une modification** : augmenter `VERSION` dans `sw.js`.
