# Contribuer

Merci de garder les changements ciblés, testables et compatibles avec les données existantes.

## Installation

```bash
npm ci
cp .env.example .env
npm run db:migrate
npm run dev
```

## Avant une proposition

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Ajoutez des tests métier pour les Server Actions et un test E2E lorsqu’un parcours utilisateur critique change. Vérifiez systématiquement qu’un utilisateur ne peut ni lire ni modifier les données d’un autre compte.

## Base de données

- Modifiez `prisma/schema.prisma`.
- Créez une migration avec `npm run db:migrate -- --name description_courte`.
- Versionnez le dossier généré dans `prisma/migrations`.
- N’utilisez pas `db push` pour une évolution destinée à être partagée ou déployée.
- Rendez toute évolution compatible avec une base existante ou documentez clairement la migration requise.

## Messages de commit

Utilisez un message court qui décrit précisément le résultat du changement :

```text
type(périmètre): description en français
```

Le type suit les conventions courantes en anglais. Le périmètre et la description sont rédigés en français.

```text
fix(arbre): préserver l’ordre des couples entre les générations
feat(immich): ajouter la galerie paginée des contacts
test(authentification): couvrir l’autorisation entre utilisateurs
docs(sauvegarde): inclure les médias importés dans la restauration
```

Types recommandés : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf` et `build`.

Évitez les descriptions génériques comme `update`, `first commit`, `fix` seul ou `fix généalogique`.

```bash
git config commit.template .gitmessage
```

## Pull requests

Décrivez le problème résolu, les choix importants, les migrations éventuelles et les vérifications effectuées. N’incluez jamais de base SQLite, de sauvegarde, de clé API ou de fichier `.env`.
