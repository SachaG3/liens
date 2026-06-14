# Liens

CRM relationnel personnel et professionnel, conçu pour être auto-hébergé sur CasaOS, ZimaOS ou tout serveur Docker.

## Démarrage avec Docker

```bash
docker compose up -d --build
```

Ouvrir `http://adresse-du-serveur:3000`, puis créer le premier compte.

Les données sont stockées dans le volume Docker `liens_data`. Pour changer le port :

```bash
APP_PORT=8080 docker compose up -d
```

Les données de démonstration sont désactivées par défaut. Pour une instance locale jetable uniquement, elles peuvent être activées explicitement avec `SEED_DEMO_DATA=true`.

`SESSION_COOKIE_SECURE=auto` autorise la connexion en HTTP sur le réseau local et active automatiquement les cookies sécurisés derrière un reverse proxy HTTPS. Utilisez `SESSION_COOKIE_SECURE=true` uniquement si l'application est toujours accessible en HTTPS.

Les inscriptions sont ouvertes par défaut. Configurez `REGISTRATION_OPEN=false` après avoir créé les comptes autorisés pour fermer les nouvelles inscriptions.

## Galerie Immich

Créez dans Immich une clé API limitée aux permissions `person.read` et `asset.read`, puis configurez :

```bash
IMMICH_URL=http://adresse-immich:2283/api
IMMICH_API_KEY=votre-cle-api
```

Sur une fiche personne, utilisez **Lier à Immich** dans la section **Photos Immich**. La clé reste côté serveur et les images sont servies par un proxy authentifié.

## Sauvegarde et restauration

Créer une sauvegarde complète de la base SQLite et des photos importées sans arrêter l'application :

```bash
./scripts/backup.sh
```

Restaurer une sauvegarde :

```bash
docker compose stop liens
docker compose run --rm --no-deps -v "$PWD:/backup" liens sh -c 'rm -rf /app/prisma/data && tar -xzf /backup/liens-data-backup.tar.gz -C /app/prisma'
docker compose up -d liens
```

L’archive contient les comptes, contacts, cercles, interactions, rappels et médias importés. Conservez-la dans un emplacement privé.

## Développement

```bash
npm install
npm run db:push
npm run dev
```

Avant de proposer un changement :

```bash
npm run lint
npm test
npm run build
```

Consultez `CONTRIBUTING.md` pour les conventions de messages de commit.

## Fonctionnalités

- Authentification locale multi-utilisateur
- Cercles personnalisés
- Contacts personnels et professionnels
- Fiches détaillées avec notes privées
- Santé relationnelle selon la fréquence souhaitée
- Historique des échanges
- Rappels
- Assistant d’import multi-fichiers vCard/CSV Apple et Google avec aperçu, détection des doublons, fusion et affectation aux cercles
- Journal relationnel, dates importantes, sujets à reprendre et préparation avant rencontre
- Relations explicites entre personnes et carte relationnelle
- Champs personnalisés et contenus sensibles masqués
- Statistiques relationnelles, sauvegarde JSON et export vCard
