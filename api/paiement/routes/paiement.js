'use strict';

/**
 * Routes personnalisées pour les paiements
 */

module.exports = {
  routes: [
    // Routes par défaut générées par Strapi
    {
      method: 'GET',
      path: '/paiements',
      handler: 'paiement.find',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'GET',
      path: '/paiements/:id',
      handler: 'paiement.findOne',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'POST',
      path: '/paiements',
      handler: 'paiement.create',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'PUT',
      path: '/paiements/:id',
      handler: 'paiement.update',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'DELETE',
      path: '/paiements/:id',
      handler: 'paiement.delete',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },

    // Routes personnalisées
    {
      method: 'POST',
      path: '/paiements/:id/process-stripe',
      handler: 'paiement.processStripePayment',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'GET',
      path: '/paiements/:id/generate-invoice',
      handler: 'paiement.generateInvoice',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'POST',
      path: '/paiements/creer-session',
      handler: 'paiement.creerSessionPaiement',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
  ],
};
