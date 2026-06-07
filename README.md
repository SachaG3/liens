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

## Sauvegarde et restauration

Créer une sauvegarde de la base SQLite sans arrêter l'application :

```bash
docker compose exec liens cp /app/prisma/data/family.db /tmp/family.db
docker compose cp liens:/tmp/family.db ./family-backup.db
```

Restaurer une sauvegarde :

```bash
docker compose stop liens
docker compose cp ./family-backup.db liens:/app/prisma/data/family.db
docker compose start liens
```

Le fichier de sauvegarde contient les comptes, contacts, cercles, interactions et rappels. Conservez-le dans un emplacement privé.

## Développement

```bash
npm install
npm run db:push
npm run dev
```

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
