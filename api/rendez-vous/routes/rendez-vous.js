'use strict';

/**
 * Routes personnalisées pour les rendez-vous
 */

module.exports = {
  routes: [
    // Routes par défaut générées par Strapi
    {
      method: 'GET',
      path: '/rendez-vous',
      handler: 'rendez-vous.find',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'GET',
      path: '/rendez-vous/:id',
      handler: 'rendez-vous.findOne',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'POST',
      path: '/rendez-vous',
      handler: 'rendez-vous.create',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'PUT',
      path: '/rendez-vous/:id',
      handler: 'rendez-vous.update',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'DELETE',
      path: '/rendez-vous/:id',
      handler: 'rendez-vous.delete',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },

    // Routes personnalisées
    {
      method: 'GET',
      path: '/rendez-vous-disponibles',
      handler: 'rendez-vous.findAvailableSlots',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
    {
      method: 'POST',
      path: '/rendez-vous/:id/assign-technician',
      handler: 'rendez-vous.assignTechnician',
      config: {
        auth: false, // à modifier selon les besoins d'authentification
      }
    },
  ],
};
