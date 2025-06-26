# OBDExpress - Site Vitrine

Un site vitrine moderne pour OBDExpress, service de diagnostic automobile professionnel sur la Côte d'Azur.

## Fonctionnalités

- Site responsive avec design moderne utilisant Tailwind CSS
- Gestion de contenu via Strapi CMS (v5.13)
- Pages statiques avec moteur de templates EJS
- Formulaire de contact fonctionnel
- Architecture MVC légère
- Base de données PostgreSQL pour la gestion des données
- Système de paiement intégré avec Stripe et PayPal
- Gestion complète des réservations et paiements

## Prérequis

- Node.js (v16 ou supérieur)
- npm ou yarn
- PostgreSQL (v12 ou supérieur)
- Strapi (v5.13)

## Installation

1. Cloner le dépôt
```bash
git clone <url-du-depot>
cd obd-express
```

2. Installer les dépendances
```bash
npm install
# ou
yarn install
```

3. Configuration de l'environnement
```bash
# Copier le fichier d'exemple
cp .env.example .env
# Éditer le fichier .env avec vos propres paramètres
```

4. Configuration de la base de données PostgreSQL
```bash
# Créer la base de données et l'utilisateur selon les paramètres suivants:
# DATABASE_CLIENT=postgres
# DATABASE_HOST=127.0.0.1
# DATABASE_PORT=5432
# DATABASE_NAME=obdexpress_db
# DATABASE_USERNAME=obd_user
# DATABASE_PASSWORD=Joagvxcu9z
```

5. Initialiser la base de données
```bash
npm run db:migrate
# ou
yarn db:migrate
```

## Lancement de l'application

### Application principale (Express)
```bash
# Mode développement
npm run dev
# ou
yarn dev

# Mode production
npm run start
# ou
yarn start
```

L'application sera accessible à l'adresse `http://localhost:3000` (ou le port configuré dans le fichier .env).

### Strapi CMS
```bash
# Mode développement
npm run develop
# ou
yarn develop

# Construire Strapi pour la production
npm run build
# ou 
yarn build
```

Le panneau d'administration Strapi sera accessible à l'adresse `http://localhost:1337/admin`.

## Structure du projet

```
obd-express/
├── api/             # API Strapi (Types de contenu, routes, etc.)
├── config/          # Configuration de l'application et Strapi
├── controllers/     # Contrôleurs MVC
├── database/        # Configuration de la base de données
├── models/          # Modèles de données
├── public/          # Fichiers statiques (CSS, JS, images)
├── routes/          # Routes de l'application
├── src/             # Sources Strapi (Extensions, plugins personnalisés)
├── views/           # Templates EJS
├── .env             # Variables d'environnement (à créer)
├── app.js           # Point d'entrée Express
└── strapi.js        # Point d'entrée Strapi
```

## Système de Paiement

L'application OBDExpress intègre un système de paiement complet pour les services de diagnostic automobile.

### Passerelles de Paiement Supportées

- **Stripe**: Intégration complète avec Checkout Sessions
- **PayPal**: Intégration pour les paiements alternatifs

### Configuration du Système de Paiement

1. Configurer les variables d'environnement:
   ```
   STRIPE_PUBLIC_KEY=pk_test_votre_clé_publique
   STRIPE_SECRET_KEY=sk_test_votre_clé_secrète
   PAYPAL_CLIENT_ID=votre_client_id_paypal
   PAYPAL_CLIENT_SECRET=votre_secret_paypal
   ```

2. Les routes de paiement sont déjà configurées dans `/routes/payment.js`

### Flux de Paiement

1. L'utilisateur crée une réservation via le formulaire de réservation
2. Une page de confirmation de réservation s'affiche avec un bouton "Payer maintenant"
3. L'utilisateur est redirigé vers la page de paiement qui affiche:
   - Détails de la réservation
   - Récapitulatif du service sélectionné
   - Options de paiement (Carte bancaire via Stripe ou PayPal)
4. Après le paiement réussi, l'utilisateur est redirigé vers une page de confirmation

### API de Paiement

L'API pour les paiements est accessible via les endpoints suivants:

- `POST /paiements/creer-session`: Crée une session de paiement Stripe
- `GET /payment/checkout`: Affiche la page de paiement
- `GET /payment/paiement-reservation/:bookingId`: Charge les détails d'une réservation pour le paiement

### Interface de Paiement

L'interface de paiement est entièrement stylisée avec Tailwind CSS et inclut:

- Une présentation claire du service réservé
- Un système d'onglets pour basculer entre les méthodes de paiement
- Des formulaires optimisés pour une expérience utilisateur fluide
- Une gestion visuelle des états de chargement et des erreurs

## Maintenance

Pour mettre à jour les dépendances:
```bash
npm update
# ou
yarn upgrade
```

## Déploiement

Instructions pour le déploiement en production:

1. Configurer les variables d'environnement pour la production
2. Construire les assets pour la production
   ```bash
   # Construire Strapi
   npm run build
   # ou
   yarn build
   ```
3. Démarrer l'application avec un gestionnaire de processus comme PM2
   ```bash
   npm install -g pm2
   # Démarrer l'application Express
   pm2 start app.js --name obd-express-front
   # Démarrer Strapi
   pm2 start strapi.js --name obd-express-cms
   ```

## Contribuer

Pour contribuer au projet, veuillez créer une branche à partir de `main`, apporter vos modifications, et soumettre une pull request.

Dernière mise à jour: 18 Mai 2025# OBDExpress
