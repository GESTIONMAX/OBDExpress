// routes/stripe.js
const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');

// Middleware pour capturer le corps brut pour les webhooks
const rawBodyMiddleware = (req, res, next) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });

  req.on('end', () => {
    req.rawBody = data;
    next();
  });
};

// Créer une session de paiement
router.post('/create-checkout-session', stripeController.createCheckoutSession);

// Gérer le succès du paiement
router.get('/success', stripeController.handleSuccess);

// Gérer l'annulation du paiement
router.get('/cancel', stripeController.handleCancel);

// Gérer les webhooks Stripe - utilise le middleware rawBody
router.post('/webhook', rawBodyMiddleware, stripeController.handleWebhook);

// Route de test qui utilise exactement le même code que notre script de test
router.post('/test-create-order', stripeController.testCreateWooOrder);

module.exports = router;
