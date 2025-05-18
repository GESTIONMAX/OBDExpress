'use strict';

/**
 * Contrôleur personnalisé pour les interventions
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::intervention.intervention', ({ strapi }) => ({
  // Conserver les méthodes CRUD standards
  async find(ctx) {
    // Appel à la méthode par défaut
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  // Méthode pour créer une intervention avec génération de référence
  async create(ctx) {
    // Récupération des données de la requête
    const { rendezVous: rendezVousId } = ctx.request.body.data;

    try {
      // Générer une référence unique
      const reference = `INT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Compléter les données de l'intervention
      ctx.request.body.data.reference = reference;
      
      // Ajouter le statut par défaut si non fourni
      if (!ctx.request.body.data.statut) {
        ctx.request.body.data.statut = 'en_cours';
      }

      // Si c'est créé à partir d'un rendez-vous, on récupère les informations
      if (rendezVousId) {
        const rdv = await strapi.db.query('api::rendez-vous.rendez-vous').findOne({
          where: { id: rendezVousId },
          populate: ['service', 'technicien', 'voiture'],
        });

        if (rdv) {
          ctx.request.body.data.service = rdv.service?.id;
          ctx.request.body.data.technicien = rdv.technicien?.id;
          ctx.request.body.data.voiture = rdv.voiture?.id;
          ctx.request.body.data.dateDebut = rdv.date;
          
          // Calculer une date de fin basée sur la durée du service
          const duration = rdv.service?.duree || 60;
          const endDate = new Date(new Date(rdv.date).getTime() + duration * 60 * 1000);
          ctx.request.body.data.dateFin = endDate;
        }
      }

      // Appel à la méthode de création par défaut
      const response = await super.create(ctx);

      // Retourner la réponse avec les données créées
      return response;
    } catch (error) {
      return ctx.badRequest('Une erreur est survenue lors de la création de l\'intervention', { error: error.message });
    }
  },

  // Méthode pour générer un rapport d'intervention au format PDF
  async generatePdfReport(ctx) {
    const { id } = ctx.params;
    
    try {
      // Récupérer l'intervention avec toutes les relations
      const intervention = await strapi.db.query('api::intervention.intervention').findOne({
        where: { id },
        populate: ['service', 'technicien', 'voiture', 'voiture.client', 'rendezVous'],
      });
      
      if (!intervention) {
        return ctx.notFound('Intervention non trouvée');
      }

      // Données à inclure dans le PDF
      const reportData = {
        intervention: {
          reference: intervention.reference,
          dateDebut: new Date(intervention.dateDebut).toLocaleString('fr-FR'),
          dateFin: new Date(intervention.dateFin).toLocaleString('fr-FR'),
          rapport: intervention.rapport,
          codesDiagnostic: intervention.codesDiagnostic || [],
          recommendations: intervention.recommandations || 'Aucune recommandation spécifique',
          statut: intervention.statut,
        },
        service: intervention.service ? {
          nom: intervention.service.nom,
          description: intervention.service.description,
          prix: `${intervention.service.prix}€`,
        } : null,
        technicien: intervention.technicien ? {
          nom: `${intervention.technicien.prenom} ${intervention.technicien.nom}`,
          contact: intervention.technicien.telephone,
        } : null,
        voiture: intervention.voiture ? {
          marque: intervention.voiture.marque,
          modele: intervention.voiture.modele,
          annee: intervention.voiture.annee,
          immatriculation: intervention.voiture.immatriculation,
          kilometrage: intervention.voiture.kilometrage ? `${intervention.voiture.kilometrage} km` : 'Non spécifié',
          motorisation: intervention.voiture.motorisation,
        } : null,
        client: intervention.voiture?.client ? {
          nom: `${intervention.voiture.client.prenom} ${intervention.voiture.client.nom}`,
          contact: intervention.voiture.client.telephone,
          email: intervention.voiture.client.email,
          adresse: intervention.voiture.client.adresse,
        } : null,
      };

      // Dans un environnement réel, nous utiliserions une bibliothèque comme PDFKit
      // Pour l'exemple, nous renvoyons simplement les données qui seraient utilisées pour générer le PDF
      return {
        data: {
          id: intervention.id,
          attributes: {
            reference: intervention.reference,
            reportData: reportData,
            // Dans un cas réel, nous renverrions l'URL du fichier PDF généré
            pdfUrl: `/reports/intervention-${intervention.reference}.pdf`,
          },
        },
      };
      
      /*
      // Implementation avec PDFKit (à implémenter avec les dépendances requises)
      const PDFDocument = require('pdfkit');
      const fs = require('fs');
      
      // Création du PDF
      const doc = new PDFDocument();
      
      // Nom du fichier
      const fileName = `intervention-${intervention.reference}.pdf`;
      const filePath = `./public/reports/${fileName}`;
      
      // Vérifier que le dossier existe
      if (!fs.existsSync('./public/reports')) {
        fs.mkdirSync('./public/reports', { recursive: true });
      }
      
      // Flux de sortie
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Contenu du PDF
      doc.fontSize(25).text('Rapport d\'intervention', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(16).text(`Référence: ${intervention.reference}`);
      doc.moveDown();
      
      doc.fontSize(12).text(`Date: ${new Date(intervention.dateDebut).toLocaleString('fr-FR')} - ${new Date(intervention.dateFin).toLocaleString('fr-FR')}`);
      doc.moveDown();
      
      // ... Ajouter le reste des données ...
      
      // Finaliser le PDF
      doc.end();
      
      // Attendre que le flux soit terminé
      await new Promise((resolve) => {
        stream.on('finish', resolve);
      });
      
      // Renvoyer l'URL du PDF
      return {
        data: {
          id: intervention.id,
          attributes: {
            reference: intervention.reference,
            pdfUrl: `/reports/${fileName}`,
          },
        },
      };
      */
    } catch (error) {
      return ctx.badRequest('Erreur lors de la génération du rapport PDF', { error: error.message });
    }
  },
}));
