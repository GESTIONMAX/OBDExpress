# Documentation Technique - Système de Paiement OBD Express

Cette documentation détaille l'implémentation technique du système de paiement intégré à l'application OBD Express.

## Architecture du Système

Le système de paiement est architecturé selon le modèle MVC (Modèle-Vue-Contrôleur) :

```
obd-express/
├── api/paiement/            # API pour le traitement des paiements
│   ├── controllers/         # Contrôleurs des paiements
│   └── routes/              # Routes API pour les paiements
├── controllers/             # Contrôleurs MVC pour les réservations
├── models/                  # Modèles de données pour les réservations et paiements
├── routes/                  # Routes Express pour les pages de paiement
└── views/                   # Templates EJS pour les interfaces de paiement
    ├── booking-confirmation.ejs  # Page de confirmation de réservation
    └── checkout.ejs         # Page de paiement
```

## Flux de Données

1. **Création de Réservation**
   - La réservation est initiée via le formulaire sur `/booking/new`
   - Les données sont traitées par `bookingController.createBooking()`
   - Un ID de réservation unique est généré et stocké en BDD

2. **Confirmation de Réservation**
   - L'utilisateur est dirigé vers `/booking/confirmation/:bookingId`
   - `bookingController.showBookingConfirmation()` récupère les détails de la réservation
   - La page affiche un bouton "Payer maintenant" qui redirige vers la page de paiement

3. **Paiement**
   - URL: `/payment/paiement-reservation/:bookingId`
   - La route extrait l'ID de réservation et récupère les détails via `bookingModel.getBookingById()`
   - La page `checkout.ejs` est rendue avec les détails de la réservation et les options de paiement

## Intégration Stripe

### Configuration

La configuration de Stripe nécessite les clés API qui sont stockées dans les variables d'environnement :
- `STRIPE_PUBLIC_KEY`: Clé publique utilisée côté client
- `STRIPE_SECRET_KEY`: Clé secrète utilisée côté serveur (à ne jamais exposer)

### Création de Session de Paiement

La création d'une session de paiement est gérée par `paiement.creerSessionPaiement()` dans le contrôleur `/api/paiement/controllers/paiement.js`.

```javascript
// Exemple de flux de création d'une session de paiement
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      price_data: {
        currency: 'eur',
        product_data: {
          name: serviceDescription,
        },
        unit_amount: Math.round(montant * 100),
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  success_url: `${hostUrl}/booking/payment/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${hostUrl}/booking/payment/cancel`,
  client_reference_id: bookingId,
  customer_email: clientEmail,
});
```

### Front-End Stripe

L'interface cliente utilise les Checkout Sessions de Stripe pour une expérience de paiement sécurisée :

1. Le bouton "Payer" déclenche une requête à l'API `/paiements/creer-session`
2. La réponse contient une URL vers laquelle l'utilisateur est redirigé
3. Stripe gère la collecte des informations de paiement et le traitement
4. L'utilisateur est redirigé vers les URLs de succès ou d'annulation configurées

## Intégration PayPal

### Configuration

La configuration PayPal nécessite :
- `PAYPAL_CLIENT_ID`: ID client pour l'intégration
- `PAYPAL_CLIENT_SECRET`: Secret client pour l'authentification API

### Création de Transaction PayPal

PayPal est intégré via le SDK JavaScript côté client qui permet de :
1. Créer une commande avec les détails du service
2. Gérer l'approbation de l'utilisateur
3. Capturer le paiement
4. Soumettre les données de confirmation au serveur

## Base de données

### Configuration PostgreSQL

La base de données PostgreSQL est configurée avec les paramètres suivants :
```
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=obdexpress_db
DATABASE_USERNAME=obd_user
DATABASE_PASSWORD=Joagvxcu9z
```

### Schéma de données pour les paiements

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_intent_id VARCHAR(255),
  customer_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
```

## Sécurité

Le système implémente plusieurs mesures de sécurité :

1. **Protection des clés API** : Stockage dans des variables d'environnement
2. **Validation des données** : Vérification des montants et détails avant la création de session
3. **Références croisées** : Vérification que l'ID de réservation existe et correspond au service
4. **Gestion des erreurs** : Messages d'erreur appropriés sans exposer d'informations sensibles

## Tests

Pour tester le système de paiement en mode développement :

1. **Cartes de test Stripe** :
   - Carte réussite : `4242 4242 4242 4242`
   - Carte échec : `4000 0000 0000 0002`
   - Date : N'importe quelle date future
   - CVC : N'importe quel nombre à 3 chiffres

2. **Comptes sandbox PayPal** :
   - Créer des comptes de test dans la sandbox PayPal
   - Utiliser ces comptes pour simuler des paiements

## Traitement Post-Paiement

Après un paiement réussi :
1. La réservation est mise à jour avec le statut "payé"
2. Un email de confirmation peut être envoyé au client
3. Des webhooks peuvent être configurés pour gérer les événements asynchrones

## Interface Utilisateur

L'interface de paiement utilise Tailwind CSS pour un design moderne et responsive :
- Design adaptatif pour tous les appareils
- Indication claire des étapes du processus
- Feedback visuel pour les actions utilisateur
- Gestion des erreurs avec messages appropriés

### Éléments UI spécifiques

- **Récapitulatif de réservation** : Présentation claire des détails de la réservation
- **Options de paiement** : Système d'onglets pour choisir entre différentes méthodes de paiement
- **Formulaire de carte** : Interface épurée pour la saisie des informations de carte
- **Boutons d'action** : Boutons bien visibles avec états de chargement
- **Messages d'erreur** : Affichage en rouge sous les champs concernés

---

## Maintenance et Dépannage

### Problèmes Courants

1. **Erreur "Clé API invalide"**
   - Vérifier que les variables d'environnement sont correctement définies
   - S'assurer que les clés API sont valides et actives

2. **Session de paiement non créée**
   - Vérifier les logs pour détecter des erreurs de validation
   - S'assurer que les montants sont positifs et dans une devise supportée

3. **Redirections incorrectes après paiement**
   - Vérifier les URLs de succès/échec dans la configuration de la session

### Extensions Futures

1. **Webhooks pour le traitement asynchrone**
   ```javascript
   // Route à implémenter pour les webhooks Stripe
   app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
     const sig = req.headers['stripe-signature'];
     let event;
     
     try {
       event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
     } catch (err) {
       return res.status(400).send(`Webhook Error: ${err.message}`);
     }
     
     // Traiter l'événement selon son type
     if (event.type === 'checkout.session.completed') {
       const session = event.data.object;
       // Mettre à jour le statut de la réservation
     }
     
     res.status(200).send();
   });
   ```

2. **Factures PDF automatisées**
   - Implémenter la génération de PDF avec une bibliothèque comme PDFKit
   - Envoyer automatiquement les factures par email après paiement réussi

3. **Tableau de bord administrateur**
   - Créer un dashboard pour gérer les réservations et paiements
   - Ajouter des fonctionnalités de reporting et d'analyse
