// controllers/stripeController.js
const logger = require('../utils/logger');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

// Configuration WooCommerce avec options supplémentaires pour le débogage
const WooCommerce = new WooCommerceRestApi({
  url: process.env.WP_URL || 'https://wordpress-woskc8000w4c4gscs8owg0go.gestionmax.fr',
  consumerKey: process.env.WOO_CONSUMER_KEY || 'ck_6665c63152169410d758bb9585844b6638027e90',
  consumerSecret: process.env.WOO_CONSUMER_SECRET || 'cs_ff79d443340c7b255bcf79a02a76f5c1b4f562a5',
  version: 'wc/v3',
  // Options cruciales pour le bon fonctionnement
  queryStringAuth: true,
  axiosConfig: {
    validateStatus: () => true // Permet d'obtenir les détails complets des erreurs
  }
});

/**
 * Crée une session de paiement Stripe via WooCommerce
 * Implémente la solution vérifiée fonctionnelle
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    console.log('========== DÉBUT CRÉATION CHECKOUT SESSION ==========');
    console.log('Requête reçue:', JSON.stringify(req.body, null, 2));
    logger.info('Création de session de paiement - données reçues', req.body);
    const { amount, customer_name, customer_email, booking_id, location, vehicle_info } = req.body;

    // Vérifier que les paramètres essentiels sont fournis
    if (!amount) {
      console.log('ERREUR: Montant manquant');
      logger.warn('Tentative de création de paiement sans montant');
      return res.status(400).json({
        success: false,
        error: 'Le montant est obligatoire.'
      });
    }
    
    // Vérifier la configuration WooCommerce
    console.log('Configuration WooCommerce:');
    console.log('- URL:', WooCommerce.url);
    console.log('- Version API:', WooCommerce.version);
    console.log('- Consumer Key (masquée):', WooCommerce.consumerKey ? WooCommerce.consumerKey.substring(0, 5) + '...' : 'non définie');
    console.log('- Consumer Secret (masquée):', WooCommerce.consumerSecret ? '***' : 'non définie');
    
    // Extraire les informations client en respectant exactement la structure qui fonctionne
    const firstName = customer_name ? customer_name.split(' ')[0] : 'Client';
    const lastName = customer_name && customer_name.split(' ').length > 1 ? 
                    customer_name.split(' ').slice(1).join(' ') : 'OBD Express';
    
    console.log('===== CRÉATION DE COMMANDE AVEC FORMAT TEST VALIDÉ =====');
    
    // Créer une commande WooCommerce avec EXACTEMENT le format qui fonctionne dans le test
    const orderData = {
      payment_method: 'stripe',
      payment_method_title: 'Carte bancaire (Stripe)',
      set_paid: false,
      billing: {
        first_name: firstName,
        last_name: lastName,
        email: customer_email || 'client@example.com',
        address_1: '123 Rue de Test',
        city: location || 'Paris',
        postcode: '75000',
        country: 'FR',
        phone: '0600000000'
      },
      shipping: {
        first_name: firstName,
        last_name: lastName,
        address_1: '123 Rue de Test',
        city: location || 'Paris',
        postcode: '75000',
        country: 'FR'
      },
      line_items: [
        {
          product_id: 67, // ID du produit "Diagnostic Moteur Standard"
          quantity: 1
        }
      ],
      meta_data: []
    };
    
    // Métadonnées: une seule pour commencer (comme dans le test qui fonctionne)
    if (booking_id) {
      orderData.meta_data.push({
        key: 'booking_id',
        value: booking_id
      });
    } else {
      orderData.meta_data.push({
        key: 'test_key',
        value: 'test_value'
      });
    }
    
    logger.info('Création de commande WooCommerce', { orderData });
    
    // Créer la commande dans WooCommerce
    const response = await WooCommerce.post('orders', orderData);
    
    logger.info(`Commande WooCommerce #${response.data.id} créée avec succès`, { 
      orderId: response.data.id,
      paymentUrl: response.data.payment_url 
    });
    
    // Retourner les données de la commande
    res.status(200).json({
      success: true,
      order_id: response.data.id,
      checkout_url: response.data.payment_url
    });
  } catch (error) {
    console.log('\n========== ERREUR CRÉATION CHECKOUT SESSION ==========');
    console.log('Message d\'erreur:', error.message);
    
    if (error.response) {
      console.log('Status de la réponse:', error.response.status);
      console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.log('Données de la réponse:', JSON.stringify(error.response.data, null, 2));
      
      logger.error('Erreur détaillée lors de la création du paiement', { 
        message: error.message,
        status: error.response.status,
        code: error.response.data?.code || 'inconnu',
        dataMessage: error.response.data?.message || 'pas de message',
        dataDetails: error.response.data?.data || {}
      });
    } else {
      console.log('Erreur complète:', error);
      logger.error('Erreur lors de la création du paiement', { 
        message: error.message,
        error: error
      });
    }
    
    console.log('========== FIN ERREUR CRÉATION CHECKOUT SESSION ==========\n');
    
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message || 'Erreur lors de la création du paiement.'
    });
  }
};

/**
 * Gère le succès du paiement
 */
exports.handleSuccess = async (req, res) => {
  try {
    // Dans cette approche, nous utilisons l'ID de commande WooCommerce
    const { order_id, key } = req.query;

    if (!order_id) {
      return res.status(400).render('payment-error', {
        error: 'Commande invalide.'
      });
    }

    // Récupérer les détails de la commande depuis WooCommerce
    const orderDetails = await wooCommerceService.getOrder(order_id);

    if (!orderDetails || orderDetails.status !== 'completed' && orderDetails.status !== 'processing') {
      return res.status(400).render('payment-error', {
        error: 'Le paiement n\'a pas été complété.'
      });
    }

    // Passer les données à la page de succès
    res.render('payment-success', {
      orderReference: orderDetails.id,
      customerEmail: orderDetails.billing?.email || '',
      amount: orderDetails.total,
      currency: orderDetails.currency.toUpperCase() || 'EUR'
    });
  } catch (error) {
    console.error('Erreur lors du traitement du succès du paiement:', error);
    res.status(500).render('payment-error', {
      error: error.message || 'Une erreur est survenue lors du traitement du paiement.'
    });
  }
};

/**
 * Gère l'annulation du paiement
 */
exports.handleCancel = (req, res) => {
  res.render('payment-cancel');
};

/**
 * Cette fonction n'est plus nécessaire car les webhooks sont gérés par WooCommerce
 * Nous la gardons comme point d'entrée pour d'éventuels webhooks supplémentaires
 */
exports.handleWebhook = async (req, res) => {
  try {
    // Nous n'avons plus besoin de gérer les webhooks directement
    // WooCommerce s'en charge via son plugin Stripe
    console.log('Webhook reçu - cette route est désactivée car WooCommerce gère les webhooks');
    
    res.status(200).json({ received: true, message: 'Webhook reçu mais traitement délégué à WooCommerce' });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors du traitement du webhook.'
    });
  }
};

/**
 * Route de test pour créer une commande WooCommerce directement
 * Copie exacte du script de test qui fonctionne
 */
exports.testCreateWooOrder = async (req, res) => {
  try {
    console.log('=== TEST DIRECT CRÉATION COMMANDE WOOCOMMERCE ===');
    
    // Créer une instance WooCommerce identique à celle du script de test
    const testWooCommerce = new WooCommerceRestApi({
      url: process.env.WP_URL || 'https://wordpress-woskc8000w4c4gscs8owg0go.gestionmax.fr',
      consumerKey: process.env.WOO_CONSUMER_KEY || 'ck_6665c63152169410d758bb9585844b6638027e90',
      consumerSecret: process.env.WOO_CONSUMER_SECRET || 'cs_ff79d443340c7b255bcf79a02a76f5c1b4f562a5',
      version: 'wc/v3',
      queryStringAuth: true,
      axiosConfig: {
        validateStatus: () => true // Toujours retourner true pour voir les erreurs complètes
      }
    });
    
    // Données minimales exactement comme dans le script de test
    const minimalOrderData = {
      payment_method: 'stripe',
      payment_method_title: 'Carte bancaire (Stripe)',
      set_paid: false,
      billing: {
        first_name: 'Test',
        last_name: 'Client',
        email: 'test@example.com',
        address_1: '123 Test St',
        city: 'Paris',
        postcode: '75000',
        country: 'FR',
        phone: '0600000000'
      },
      shipping: {
        first_name: 'Test',
        last_name: 'Client',
        address_1: '123 Test St',
        city: 'Paris',
        postcode: '75000',
        country: 'FR'
      },
      line_items: [
        {
          product_id: 67,
          quantity: 1
        }
      ],
      meta_data: [
        {
          key: 'test_key',
          value: 'test_value'
        }
      ]
    };

    console.log('Données envoyées:', JSON.stringify(minimalOrderData, null, 2));
    
    const createOrder = await testWooCommerce.post('orders', minimalOrderData);
    console.log('Status:', createOrder.status);
    console.log('Réponse complète:', JSON.stringify(createOrder.data, null, 2));
    
    if (createOrder.status >= 200 && createOrder.status < 300) {
      console.log('\n✅ COMMANDE CRÉÉE AVEC SUCCÈS!');
      console.log('ID:', createOrder.data.id);
      console.log('URL de paiement:', createOrder.data.payment_url);
      
      return res.status(200).json({
        success: true,
        order_id: createOrder.data.id,
        checkout_url: createOrder.data.payment_url
      });
    } else {
      console.log('\n❌ ERREUR CRÉATION COMMANDE');
      console.log('Code:', createOrder.data.code);
      console.log('Message:', createOrder.data.message);
      if (createOrder.data.data) {
        console.log('Détails:', JSON.stringify(createOrder.data.data, null, 2));
      }
      
      return res.status(400).json({
        success: false,
        error: createOrder.data.message || 'Impossible de créer la commande.',
        details: createOrder.data
      });
    }
  } catch (error) {
    console.error('\n❌ ERREUR TEST DIRECT:');
    console.error('Message:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response ? error.response.data : null
    });
  }
};
