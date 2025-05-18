// routes/payment.js
const express = require('express');
const router = express.Router();

// Initialisation conditionnelle de Stripe et PayPal (pour permettre le développement sans clés API)
let stripe;
try {
  stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
} catch (error) {
  console.warn('Stripe non initialisé : clé API manquante');
  stripe = null;
}

let paypal = require('paypal-rest-sdk');

// Configuration conditionnelle de PayPal
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  paypal.configure({
    'mode': process.env.PAYPAL_MODE || 'sandbox',
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET
  });
} else {
  console.warn('PayPal non configuré : clés API manquantes');
}

// Page de checkout
router.get('/checkout', (req, res) => {
  // Récupérer le service et la ville depuis les query params
  const { service, ville } = req.query;
  
  // Prix par défaut si aucune ville n'est spécifiée
  let prix = 99;
  
  // Si une ville est spécifiée, on récupère son prix depuis le contrôleur local
  if (ville) {
    const localController = require('../controllers/localController');
    const cityData = localController.getCityById(ville);
    if (cityData) {
      prix = cityData.price;
    }
  }
  
  res.render('checkout', {
    title: 'Paiement | OBDExpress',
    service: service || 'Diagnostic automobile',
    ville: ville || 'Côte d\'Azur',
    prix: prix,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_dummy',
    clientEmail: req.query.email || '',
    bookingId: req.query.bookingId || ''
  });
});

// Paiement pour une réservation spécifique
router.get('/paiement-reservation/:bookingId', (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    
    // Utiliser le modèle bookingModel pour récupérer les informations
    const bookingModel = require('../models/booking');
    const booking = bookingModel.getBookingById(bookingId);
    
    if (!booking) {
      return res.status(404).render('error', {
        message: 'Réservation non trouvée',
        error: { status: 404, stack: '' }
      });
    }
    
    // Préparer les données pour la page de paiement
    // Utiliser directement les informations de la réservation
    const montant = booking.price || 99;
    const nomService = booking.serviceType || 'Diagnostic automobile';
    const clientEmail = booking.customerEmail || req.query.email || '';
    
    // Pré-traitement des données
    // Gérer les dates préférées et créneaux pour éviter les erreurs
    const processedBooking = { ...booking };
    
    res.render('checkout', {
      title: 'Paiement de réservation | OBDExpress',
      service: nomService,
      prix: montant,
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_dummy',
      clientEmail: clientEmail,
      bookingId: bookingId
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de réservation:', error);
    res.status(500).render('error', {
      message: 'Erreur lors de la récupération des détails de paiement',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
    });
  }
});

// Traitement du paiement Stripe
router.post('/process-stripe', async (req, res) => {
  if (!stripe) {
    console.warn('Tentative de paiement Stripe sans configuration API');
    req.session.paymentError = "Le paiement Stripe n'est pas configuré. Cette fonctionnalité sera disponible prochainement.";
    return res.redirect('/payment/error');
  }
  
  try {
    const { token, amount, service, ville } = req.body;
    
    // Création de la charge Stripe
    const charge = await stripe.charges.create({
      amount: amount * 100, // Stripe utilise les centimes
      currency: 'eur',
      description: `Diagnostic automobile à ${ville || 'domicile'} - ${service || 'Standard'}`,
      source: token
    });
    
    // Enregistrement de la session pour la confirmation
    req.session.paymentInfo = {
      service: service || 'Diagnostic automobile',
      ville: ville || 'Côte d\'Azur',
      montant: amount,
      date: new Date().toLocaleDateString('fr-FR'),
      reference: charge.id
    };
    
    res.redirect('/payment/success');
  } catch (error) {
    console.error('Erreur de paiement Stripe:', error);
    req.session.paymentError = error.message;
    res.redirect('/payment/error');
  }
});

// Initialisation du paiement PayPal
router.post('/process-paypal', (req, res) => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    console.warn('Tentative de paiement PayPal sans configuration API');
    req.session.paymentError = "Le paiement PayPal n'est pas configuré. Cette fonctionnalité sera disponible prochainement.";
    return res.redirect('/payment/error');
  }
  
  const { amount, service, ville } = req.body;
  
  const create_payment_json = {
    "intent": "sale",
    "payer": {
      "payment_method": "paypal"
    },
    "redirect_urls": {
      "return_url": `${req.protocol}://${req.get('host')}/payment/paypal-success`,
      "cancel_url": `${req.protocol}://${req.get('host')}/payment/cancel`
    },
    "transactions": [{
      "item_list": {
        "items": [{
          "name": `Diagnostic automobile à ${ville || 'domicile'}`,
          "sku": "OBD-DIAG-1",
          "price": amount,
          "currency": "EUR",
          "quantity": 1
        }]
      },
      "amount": {
        "currency": "EUR",
        "total": amount
      },
      "description": `Diagnostic automobile à ${ville || 'domicile'} - ${service || 'Standard'}`
    }]
  };
  
  paypal.payment.create(create_payment_json, (error, payment) => {
    if (error) {
      console.error('Erreur de paiement PayPal:', error);
      req.session.paymentError = error.message;
      return res.redirect('/payment/error');
    }
    
    // Stockage des informations de service pour la confirmation
    req.session.paymentInfo = {
      service: service || 'Diagnostic automobile',
      ville: ville || 'Côte d\'Azur',
      montant: amount,
      date: new Date().toLocaleDateString('fr-FR')
    };
    
    // Redirection vers PayPal
    for (let i = 0; i < payment.links.length; i++) {
      if (payment.links[i].rel === 'approval_url') {
        return res.redirect(payment.links[i].href);
      }
    }
    
    req.session.paymentError = "Impossible de rediriger vers PayPal";
    res.redirect('/payment/error');
  });
});

// Confirmation du paiement PayPal
router.get('/paypal-success', (req, res) => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    console.warn('Tentative de confirmation PayPal sans configuration API');
    req.session.paymentError = "Le paiement PayPal n'est pas configuré. Cette fonctionnalité sera disponible prochainement.";
    return res.redirect('/payment/error');
  }
  
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const amount = req.session.paymentInfo?.montant || 99;
  
  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "EUR",
        "total": amount
      }
    }]
  };
  
  paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
    if (error) {
      console.error('Erreur lors de l\'exécution du paiement PayPal:', error);
      req.session.paymentError = error.message;
      return res.redirect('/payment/error');
    }
    
    // Mise à jour de la référence de paiement
    if (req.session.paymentInfo) {
      req.session.paymentInfo.reference = payment.id;
    }
    
    res.redirect('/payment/success');
  });
});

// Page de succès du paiement
router.get('/success', (req, res) => {
  const paymentInfo = req.session.paymentInfo || {
    service: 'Diagnostic automobile',
    ville: 'Côte d\'Azur',
    montant: 99,
    date: new Date().toLocaleDateString('fr-FR'),
    reference: 'N/A'
  };
  
  res.render('payment-success', {
    title: 'Paiement confirmé | OBDExpress',
    paymentInfo
  });
});

// Page d'erreur de paiement
router.get('/error', (req, res) => {
  const errorMessage = req.session.paymentError || 'Une erreur est survenue lors du traitement de votre paiement.';
  // Effacer l'erreur de la session
  req.session.paymentError = null;
  
  res.render('payment-error', {
    title: 'Erreur de paiement | OBDExpress',
    errorMessage
  });
});

// Page d'annulation de paiement
router.get('/cancel', (req, res) => {
  res.render('payment-cancel', {
    title: 'Paiement annulé | OBDExpress'
  });
});

module.exports = router;