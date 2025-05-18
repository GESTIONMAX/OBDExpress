'use strict';

/**
 * Contrôleur personnalisé pour les paiements
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::paiement.paiement', ({ strapi }) => ({
  // Conserver les méthodes CRUD standards
  async find(ctx) {
    // Appel à la méthode par défaut
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  // Méthode pour créer un paiement avec génération de référence
  async create(ctx) {
    // Récupération des données de la requête
    const { rendezVous: rendezVousId, methodePaiement } = ctx.request.body.data;

    try {
      // Générer une référence unique
      const reference = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Compléter les données du paiement
      ctx.request.body.data.reference = reference;
      
      // Ajouter le statut par défaut si non fourni
      if (!ctx.request.body.data.statut) {
        ctx.request.body.data.statut = 'en_attente';
      }

      // Si c'est lié à un rendez-vous, on récupère les informations
      if (rendezVousId) {
        const rdv = await strapi.db.query('api::rendez-vous.rendez-vous').findOne({
          where: { id: rendezVousId },
          populate: ['service', 'client'],
        });

        if (rdv) {
          // Définir le montant selon le service
          if (rdv.service && !ctx.request.body.data.montant) {
            ctx.request.body.data.montant = rdv.service.prix;
          }
          
          // Lier au client
          if (rdv.client) {
            ctx.request.body.data.client = rdv.client.id;
          }
        }
      }

      // Appel à la méthode de création par défaut
      const response = await super.create(ctx);

      // Retourner la réponse avec les données créées
      return response;
    } catch (error) {
      return ctx.badRequest('Une erreur est survenue lors de la création du paiement', { error: error.message });
    }
  },

  // Méthode pour traiter un paiement via Stripe
  async processStripePayment(ctx) {
    const { id } = ctx.params;
    const { paymentMethodId, paymentIntentId } = ctx.request.body;
    
    try {
      // Récupérer le paiement
      const paiement = await strapi.db.query('api::paiement.paiement').findOne({
        where: { id },
        populate: ['rendezVous', 'rendezVous.service', 'client'],
      });
      
      if (!paiement) {
        return ctx.notFound('Paiement non trouvé');
      }
      
      if (paiement.statut === 'complete') {
        return ctx.badRequest('Ce paiement a déjà été traité');
      }
      
      // Vérifier que la méthode est bien Stripe
      if (paiement.methodePaiement !== 'stripe') {
        return ctx.badRequest('Ce paiement n\'utilise pas la méthode Stripe');
      }

      // Dans un environnement réel, nous utiliserions l'API Stripe
      // Pour l'exemple, nous simulons une réponse
      /*
      // Exemple d'intégration Stripe (à implémenter avec le package stripe)
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      let paymentIntent;
      
      if (paymentIntentId) {
        // Continuer un paiement existant
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } else {
        // Créer un nouveau paiement
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(paiement.montant * 100), // Conversion en centimes
          currency: 'eur',
          payment_method: paymentMethodId,
          confirmation_method: 'manual',
          confirm: true,
          description: `Paiement pour ${paiement.rendezVous?.service?.nom || 'service OBDExpress'}`,
          receipt_email: paiement.client?.email,
        });
      }
      
      // Traitement du résultat
      if (
        paymentIntent.status === 'succeeded' ||
        paymentIntent.status === 'processing'
      ) {
        // Mise à jour du paiement
        await strapi.db.query('api::paiement.paiement').update({
          where: { id },
          data: {
            statut: 'complete',
            referencePaiementExterne: paymentIntent.id,
            details: {
              stripeStatus: paymentIntent.status,
              stripePaymentMethod: paymentIntent.payment_method_types[0],
              stripeChargeId: paymentIntent.latest_charge,
            },
          },
        });
        
        // Générer une facture PDF
        await this.generateInvoice(ctx);
        
        return {
          data: {
            id: paiement.id,
            attributes: {
              statut: 'complete',
              reference: paiement.reference,
              stripePaymentIntent: paymentIntent,
            },
          },
        };
      } else {
        // Échec du paiement
        await strapi.db.query('api::paiement.paiement').update({
          where: { id },
          data: {
            statut: 'echoue',
            referencePaiementExterne: paymentIntent.id,
            details: {
              stripeStatus: paymentIntent.status,
              stripeError: paymentIntent.last_payment_error,
            },
          },
        });
        
        return ctx.badRequest('Paiement échoué', {
          error: paymentIntent.last_payment_error?.message || 'Erreur de paiement Stripe',
          paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
          },
        });
      }
      */
      
      // Pour l'exemple, nous simulons un succès
      const mockPaymentIntentId = `pi_${Math.random().toString(36).substring(2, 10)}`;
      
      await strapi.db.query('api::paiement.paiement').update({
        where: { id },
        data: {
          statut: 'complete',
          referencePaiementExterne: mockPaymentIntentId,
          details: {
            stripeStatus: 'succeeded',
            stripePaymentMethod: 'card',
            stripeChargeId: `ch_${Math.random().toString(36).substring(2, 10)}`,
          },
        },
      });
      
      // Appeler la méthode de génération de facture
      const invoiceResult = await this.generateInvoice({ params: { id } });
      
      return {
        data: {
          id: paiement.id,
          attributes: {
            statut: 'complete',
            reference: paiement.reference,
            stripePaymentIntent: {
              id: mockPaymentIntentId,
              status: 'succeeded',
            },
            invoiceUrl: invoiceResult.data?.attributes?.invoiceUrl,
          },
        },
      };
    } catch (error) {
      return ctx.badRequest('Erreur lors du traitement du paiement Stripe', { error: error.message });
    }
  },

  // Méthode pour générer une facture au format PDF
  async generateInvoice(ctx) {
    const { id } = ctx.params;
    
    try {
      // Récupérer le paiement avec toutes les relations
      const paiement = await strapi.db.query('api::paiement.paiement').findOne({
        where: { id },
        populate: ['client', 'rendezVous', 'rendezVous.service', 'rendezVous.voiture'],
      });
      
      if (!paiement) {
        return ctx.notFound('Paiement non trouvé');
      }

      // Données à inclure dans la facture
      const invoiceData = {
        facture: {
          reference: `FACT-${paiement.reference}`,
          date: new Date().toLocaleDateString('fr-FR'),
          montant: `${paiement.montant}€`,
          methodePaiement: paiement.methodePaiement,
          statut: paiement.statut,
        },
        service: paiement.rendezVous?.service ? {
          nom: paiement.rendezVous.service.nom,
          description: paiement.rendezVous.service.description,
          prix: `${paiement.rendezVous.service.prix}€`,
        } : null,
        client: paiement.client ? {
          nom: `${paiement.client.prenom} ${paiement.client.nom}`,
          adresse: paiement.client.adresse,
          ville: `${paiement.client.codePostal} ${paiement.client.ville}`,
          email: paiement.client.email,
          telephone: paiement.client.telephone,
        } : null,
        voiture: paiement.rendezVous?.voiture ? {
          marque: paiement.rendezVous.voiture.marque,
          modele: paiement.rendezVous.voiture.modele,
          immatriculation: paiement.rendezVous.voiture.immatriculation,
        } : null,
        entreprise: {
          nom: 'OBDExpress',
          adresse: '123 Avenue de la Côte d\'Azur',
          ville: '06000 Nice',
          telephone: '04 92 XX XX XX',
          email: 'contact@obdexpress.fr',
          siren: '123456789',
          tva: 'FR12345678900',
        },
      };

      // Dans un environnement réel, nous utiliserions une bibliothèque comme PDFKit
      // Pour l'exemple, nous générons simplement une URL fictive
      const invoiceFileName = `facture-${paiement.reference}.pdf`;
      const invoiceUrl = `/factures/${invoiceFileName}`;
      
      // Mettre à jour le paiement avec l'URL de la facture
      await strapi.db.query('api::paiement.paiement').update({
        where: { id },
        data: {
          factureUrl: invoiceUrl,
        },
      });
      
      /*
      // Implementation avec PDFKit (à implémenter avec les dépendances requises)
      const PDFDocument = require('pdfkit');
      const fs = require('fs');
      
      // Création du PDF
      const doc = new PDFDocument();
      
      // Vérifier que le dossier existe
      if (!fs.existsSync('./public/factures')) {
        fs.mkdirSync('./public/factures', { recursive: true });
      }
      
      // Flux de sortie
      const filePath = `./public/factures/${invoiceFileName}`;
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Contenu du PDF
      doc.fontSize(25).text('Facture', { align: 'center' });
      doc.moveDown();
      
      // ... Ajouter le reste des données ...
      
      // Finaliser le PDF
      doc.end();
      
      // Attendre que le flux soit terminé
      await new Promise((resolve) => {
        stream.on('finish', resolve);
      });
      */
      
      return {
        data: {
          id: paiement.id,
          attributes: {
            reference: paiement.reference,
            invoiceData: invoiceData,
            invoiceUrl: invoiceUrl,
          },
        },
      };
    } catch (error) {
      return ctx.badRequest('Erreur lors de la génération de la facture', { error: error.message });
    }
  },

  // Méthode pour créer une session de paiement Stripe
  async creerSessionPaiement(ctx) {
    try {
      const { montant, client_email, booking_id, service_id, description } = ctx.request.body;
      
      // Vérification des données requises
      if (!montant || !client_email || !booking_id) {
        return ctx.badRequest('Données manquantes pour créer une session de paiement', { 
          message: 'Les champs montant, client_email et booking_id sont requis' 
        });
      }

      // Récupérer des informations sur la réservation si disponible
      let reservationDetails = {};
      let service = null;
      
      // Vérifier si la réservation existe
      const reservation = await strapi.db.query('api::rendez-vous.rendez-vous').findOne({
        where: { id: booking_id },
        populate: ['service', 'client', 'voiture'],
      });

      if (reservation) {
        reservationDetails = {
          reference: reservation.reference || `RDV-${booking_id.substring(0, 8)}`,
          date: reservation.date,
          adresse: reservation.adresse,
          ville: reservation.ville,
          codePostal: reservation.codePostal,
        };
        
        if (reservation.service) {
          service = reservation.service;
        }
      }
      
      // Si un service_id est fourni, on récupère les informations du service
      if (service_id && !service) {
        service = await strapi.db.query('api::service.service').findOne({
          where: { id: service_id },
        });
      }

      // Utiliser le service Stripe pour créer une session de paiement
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      // Créer une référence unique pour ce paiement
      const paymentReference = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Créer d'abord l'entrée de paiement dans la base de données
      const paiementEntity = await strapi.db.query('api::paiement.paiement').create({
        data: {
          montant: parseFloat(montant),
          methodePaiement: 'stripe',
          statut: 'en_attente',
          reference: paymentReference,
          datePaiement: new Date(),
          rendezVous: booking_id,
          service: service?.id,
          details: {
            clientEmail: client_email,
            description: description || (service ? `Réservation ${service.nom}` : 'Réservation OBDExpress'),
            reservationData: reservationDetails
          }
        },
      });

      // Créer la session de paiement Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: service ? service.nom : 'Service de diagnostic OBDExpress',
                description: description || (service ? service.description : 'Réservation de service de diagnostic automobile'),
              },
              unit_amount: Math.round(montant * 100), // Stripe utilise les centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}&payment_id=${paiementEntity.id}`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/payment/cancel?payment_id=${paiementEntity.id}`,
        customer_email: client_email,
        client_reference_id: booking_id,
        metadata: {
          payment_id: paiementEntity.id,
          booking_id: booking_id,
          reference: paymentReference
        },
      });

      // Mettre à jour le paiement avec la référence de session Stripe
      await strapi.db.query('api::paiement.paiement').update({
        where: { id: paiementEntity.id },
        data: {
          referencePaiementExterne: session.id,
          details: {
            ...paiementEntity.details,
            stripeSessionId: session.id,
            stripePaymentStatus: 'created'
          }
        },
      });

      // Retourner les informations de la session
      return {
        success: true,
        data: {
          sessionId: session.id,
          paymentId: paiementEntity.id,
          url: session.url,
          reference: paymentReference,
          amount: montant,
          currency: 'eur',
          status: 'created',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Expire dans 30 minutes
        }
      };
    } catch (error) {
      console.error('Erreur lors de la création de la session de paiement:', error);
      return ctx.badRequest('Erreur lors de la création de la session de paiement', { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },
}));
