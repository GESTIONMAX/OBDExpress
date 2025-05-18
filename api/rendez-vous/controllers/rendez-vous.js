'use strict';

/**
 * Contrôleur personnalisé pour les rendez-vous
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::rendez-vous.rendez-vous', ({ strapi }) => ({
  // Conserver les méthodes CRUD standards
  async find(ctx) {
    // Appel à la méthode par défaut
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  // Méthode pour créer un rendez-vous avec validation de disponibilité
  async create(ctx) {
    // Récupération des données de la requête
    const { date, service: serviceId, adresse, ville, codePostal, voiture: voitureId, client: clientId } = ctx.request.body.data;

    try {
      // Vérifier si la date est dans le futur
      const rdvDate = new Date(date);
      const now = new Date();
      
      if (rdvDate <= now) {
        return ctx.badRequest('La date du rendez-vous doit être dans le futur');
      }

      // Vérifier si le créneau est disponible (pas d'autre RDV à cette date)
      const existingRdv = await strapi.db.query('api::rendez-vous.rendez-vous').findMany({
        where: {
          date: {
            $between: [
              new Date(rdvDate.getTime() - 1 * 60 * 60 * 1000), // 1h avant
              new Date(rdvDate.getTime() + 1 * 60 * 60 * 1000), // 1h après
            ],
          },
          statut: {
            $in: ['demande', 'confirme'],
          },
        },
      });

      if (existingRdv.length > 0) {
        return ctx.badRequest('Ce créneau n\'est pas disponible. Veuillez choisir un autre horaire.');
      }

      // Générer une référence unique
      const reference = `RDV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Créer l'entité avec la méthode par défaut mais en ajoutant la référence
      ctx.request.body.data.reference = reference;
      
      // Ajouter le statut par défaut si non fourni
      if (!ctx.request.body.data.statut) {
        ctx.request.body.data.statut = 'demande';
      }

      // Appel à la méthode de création par défaut
      const response = await super.create(ctx);

      // Retourner la réponse avec les données créées
      return response;
    } catch (error) {
      return ctx.badRequest('Une erreur est survenue lors de la création du rendez-vous', { error: error.message });
    }
  },

  // Méthode personnalisée pour trouver les créneaux disponibles
  async findAvailableSlots(ctx) {
    const { date, serviceId } = ctx.request.query;
    
    try {
      // Convertir la date en objet Date
      const searchDate = new Date(date);
      const year = searchDate.getFullYear();
      const month = searchDate.getMonth();
      const day = searchDate.getDate();

      // Heures de travail (8h à 18h)
      const startHour = 8;
      const endHour = 18;
      
      // Récupérer le service pour déterminer la durée des créneaux
      let duration = 60; // Durée par défaut en minutes
      
      if (serviceId) {
        const service = await strapi.db.query('api::service.service').findOne({
          where: { id: serviceId },
        });
        
        if (service && service.duree) {
          duration = service.duree;
        }
      }
      
      // Récupérer tous les rendez-vous pour cette journée
      const existingRdvs = await strapi.db.query('api::rendez-vous.rendez-vous').findMany({
        where: {
          date: {
            $gte: new Date(year, month, day, 0, 0, 0),
            $lte: new Date(year, month, day, 23, 59, 59),
          },
          statut: {
            $in: ['demande', 'confirme'],
          },
        },
      });
      
      // Créer une liste de tous les créneaux possibles
      const slots = [];
      const slotDurationHours = duration / 60;
      
      for (let hour = startHour; hour < endHour; hour += slotDurationHours) {
        const slotTime = new Date(year, month, day, Math.floor(hour), (hour % 1) * 60);
        
        // Vérifier si le créneau est déjà pris
        const isBooked = existingRdvs.some(rdv => {
          const rdvTime = new Date(rdv.date);
          const rdvEndTime = new Date(rdvTime.getTime() + (rdv.service?.duree || 60) * 60 * 1000);
          
          return (
            (slotTime >= rdvTime && slotTime < rdvEndTime) ||
            (new Date(slotTime.getTime() + duration * 60 * 1000) > rdvTime && slotTime < rdvTime)
          );
        });
        
        if (!isBooked) {
          slots.push({
            startTime: slotTime,
            endTime: new Date(slotTime.getTime() + duration * 60 * 1000),
            available: true,
          });
        }
      }
      
      return { data: slots };
    } catch (error) {
      return ctx.badRequest('Erreur lors de la recherche des créneaux disponibles', { error: error.message });
    }
  },

  // Méthode pour assigner automatiquement un technicien disponible
  async assignTechnician(ctx) {
    const { id } = ctx.params;
    
    try {
      // Vérifier si le RDV existe
      const rdv = await strapi.db.query('api::rendez-vous.rendez-vous').findOne({
        where: { id },
        populate: ['service', 'technicien'],
      });
      
      if (!rdv) {
        return ctx.notFound('Rendez-vous non trouvé');
      }
      
      // Ne rien faire si un technicien est déjà assigné
      if (rdv.technicien) {
        return ctx.badRequest('Un technicien est déjà assigné à ce rendez-vous');
      }
      
      // Récupérer la date du RDV
      const rdvDate = new Date(rdv.date);
      const rdvYear = rdvDate.getFullYear();
      const rdvMonth = rdvDate.getMonth();
      const rdvDay = rdvDate.getDate();
      const rdvHour = rdvDate.getHours();
      const rdvMinute = rdvDate.getMinutes();
      
      // Déterminer la durée de l'intervention
      const duration = rdv.service?.duree || 60;
      
      // Trouver tous les techniciens disponibles
      const techniciens = await strapi.db.query('api::technicien.technicien').findMany({
        where: {
          disponible: true,
        },
      });
      
      // Récupérer tous les RDV pour la même période
      const conflictingRdvs = await strapi.db.query('api::rendez-vous.rendez-vous').findMany({
        where: {
          date: {
            $gte: new Date(rdvYear, rdvMonth, rdvDay, rdvHour - 2, rdvMinute),
            $lte: new Date(rdvYear, rdvMonth, rdvDay, rdvHour + 2, rdvMinute),
          },
          id: {
            $ne: id,
          },
          statut: {
            $in: ['demande', 'confirme'],
          },
        },
        populate: ['technicien'],
      });
      
      // Filtrer les techniciens déjà occupés
      const busyTechnicianIds = conflictingRdvs
        .filter(r => r.technicien)
        .map(r => r.technicien.id);
      
      const availableTechnicians = techniciens.filter(
        tech => !busyTechnicianIds.includes(tech.id)
      );
      
      if (availableTechnicians.length === 0) {
        return ctx.badRequest('Aucun technicien n\'est disponible pour ce créneau');
      }
      
      // Prendre le premier technicien disponible (on pourrait améliorer avec un algorithme plus avancé)
      const selectedTechnician = availableTechnicians[0];
      
      // Mettre à jour le RDV avec le technicien assigné
      await strapi.db.query('api::rendez-vous.rendez-vous').update({
        where: { id },
        data: {
          technicien: selectedTechnician.id,
          // Mettre à jour le statut du RDV
          statut: 'confirme',
        },
      });
      
      return {
        data: {
          id,
          attributes: {
            technicien: selectedTechnician,
            statut: 'confirme',
          },
        },
      };
    } catch (error) {
      return ctx.badRequest('Erreur lors de l\'assignation du technicien', { error: error.message });
    }
  },
}));
