'use strict';

/**
 * Routes personnalisées pour les interventions
 */

module.exports = {
  routes: [
    // Routes par défaut générées par Strapi
    {
      method: 'GET',
      path: '/interventions',
      handler: 'intervention.find',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'GET',
      path: '/interventions/:id',
      handler: 'intervention.findOne',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'POST',
      path: '/interventions',
      handler: 'intervention.create',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'PUT',
      path: '/interventions/:id',
      handler: 'intervention.update',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'DELETE',
      path: '/interventions/:id',
      handler: 'intervention.delete',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },

    // Routes personnalisées
    {
      method: 'GET',
      path: '/interventions/:id/generate-pdf-report',
      handler: 'intervention.generatePdfReport',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
  ],
};
