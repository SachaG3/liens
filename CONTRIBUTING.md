# Contribuer

## Messages de commit

Utilisez un message court qui décrit précisément le résultat du changement.

Format recommandé :

```text
type(périmètre): description
```

Le type utilise les conventions courantes en anglais. Le périmètre et la description sont rédigés en français.

Exemples :

```text
fix(arbre): préserver l’ordre des couples entre les générations
feat(immich): ajouter la galerie paginée des contacts
test(authentification): couvrir l’autorisation entre utilisateurs
docs(sauvegarde): inclure les médias importés dans la restauration
```

Types recommandés : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf` et `build`.

Évitez les descriptions génériques comme `update`, `first commit`, `fix` seul ou `fix généalogique`.

Pour utiliser le modèle fourni dans ce dépôt :

```bash
git config commit.template .gitmessage
```
