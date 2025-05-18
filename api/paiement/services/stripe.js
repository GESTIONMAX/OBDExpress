'use strict';

/**
 * Service d'intégration Stripe pour les paiements
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs-extra');
const PDFDocument = require('pdfkit');
const path = require('path');

module.exports = {
  /**
   * Initialise un paiement Stripe
   * 
   * @param {Object} paiement - L'objet paiement de Strapi
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} - Les détails du paiement intent
   */
  async createPaymentIntent(paiement, options = {}) {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Clé Stripe non configurée. Veuillez définir STRIPE_SECRET_KEY dans les variables d\'environnement.');
      }

      if (!paiement || !paiement.montant) {
        throw new Error('Informations de paiement invalides');
      }

      // Convertir le montant en centimes pour Stripe
      const amount = Math.round(paiement.montant * 100);

      // Créer un PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: options.currency || 'eur',
        description: options.description || `Paiement OBDExpress - ${paiement.reference}`,
        metadata: {
          reference: paiement.reference,
          paiementId: paiement.id.toString(),
          service: options.serviceName || 'Diagnostic automobile'
        },
        receipt_email: options.email || null,
        payment_method_types: ['card'],
      });

      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      };
    } catch (error) {
      console.error('Erreur lors de la création du PaymentIntent Stripe:', error);
      throw error;
    }
  },

  /**
   * Vérifie le statut d'un paiement Stripe
   * 
   * @param {string} paymentIntentId - L'ID du PaymentIntent à vérifier
   * @returns {Promise<Object>} - Le statut du paiement
   */
  async checkPaymentStatus(paymentIntentId) {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Clé Stripe non configurée');
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convertir les centimes en euros
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
        metadata: paymentIntent.metadata,
        chargeId: paymentIntent.latest_charge || null
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du paiement Stripe:', error);
      throw error;
    }
  },

  /**
   * Génère une facture PDF pour un paiement
   * 
   * @param {Object} paiement - Les données du paiement
   * @param {Object} clientInfo - Informations sur le client
   * @param {Object} serviceInfo - Informations sur le service
   * @param {Object} options - Options de génération
   * @returns {Promise<Object>} - Informations sur la facture générée
   */
  async generateInvoice(paiement, clientInfo, serviceInfo, options = {}) {
    // Configuration par défaut
    const config = {
      outputDir: options.outputDir || './public/factures',
      fileName: options.fileName || `facture-${paiement.reference}.pdf`,
      fontFamily: options.fontFamily || 'Helvetica',
      logo: options.logo || './public/images/logo.png',
      footerText: options.footerText || 'OBDExpress - Facture',
      companyInfo: options.companyInfo || {
        name: 'OBDExpress',
        address: '123 Avenue de la Côte d\'Azur',
        city: '06000 Nice',
        phone: '04 92 XX XX XX',
        email: 'contact@obdexpress.fr',
        siren: '123456789',
        tva: 'FR12345678900'
      }
    };

    try {
      // S'assurer que le répertoire de sortie existe
      await fs.ensureDir(config.outputDir);

      // Créer le document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Facture ${paiement.reference}`,
          Author: config.companyInfo.name,
          Subject: 'Facture',
          Keywords: 'facture, paiement, diagnostic, automobile',
          CreationDate: new Date(),
        }
      });

      // Chemin complet du fichier PDF
      const filePath = path.join(config.outputDir, config.fileName);
      const fileStream = fs.createWriteStream(filePath);

      // Canaliser la sortie vers le fichier
      doc.pipe(fileStream);

      // En-tête du document
      if (fs.existsSync(config.logo)) {
        doc.image(config.logo, 50, 45, { width: 120 });
      }

      // Titre du document
      doc.font(`${config.fontFamily}-Bold`).fontSize(20).text('FACTURE', { align: 'center' });
      doc.moveDown();
      
      // Informations de l'entreprise
      doc.font(`${config.fontFamily}-Bold`).fontSize(12).text(config.companyInfo.name, 400, 50);
      doc.font(config.fontFamily).fontSize(10)
        .text(config.companyInfo.address, 400, 65)
        .text(config.companyInfo.city, 400, 80)
        .text(`Tél: ${config.companyInfo.phone}`, 400, 95)
        .text(`Email: ${config.companyInfo.email}`, 400, 110)
        .text(`SIREN: ${config.companyInfo.siren}`, 400, 125)
        .text(`TVA: ${config.companyInfo.tva}`, 400, 140);

      // Informations de référence
      doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Facture n°:', 50, 150);
      doc.font(config.fontFamily).fontSize(12).text(paiement.reference, 130, 150);

      doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Date:', 50, 170);
      doc.font(config.fontFamily).fontSize(12).text(
        new Date(paiement.datePaiement).toLocaleDateString('fr-FR'), 
        130, 
        170
      );

      doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Statut:', 50, 190);
      doc.font(config.fontFamily).fontSize(12).text(
        paiement.statut === 'complete' ? 'Payé' : paiement.statut, 
        130, 
        190
      );
      
      // Information sur le client
      if (clientInfo) {
        doc.font(`${config.fontFamily}-Bold`).fontSize(14).text('Client', 50, 220);
        doc.moveTo(50, 235).lineTo(550, 235).stroke();
        
        doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Nom:', 50, 245);
        doc.font(config.fontFamily).fontSize(12).text(clientInfo.nom, 130, 245);
        
        if (clientInfo.adresse) {
          doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Adresse:', 50, 265);
          doc.font(config.fontFamily).fontSize(12).text(clientInfo.adresse, 130, 265);
          
          if (clientInfo.ville) {
            doc.font(config.fontFamily).fontSize(12).text(clientInfo.ville, 130, 280);
          }
        }
        
        if (clientInfo.email) {
          doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Email:', 50, 300);
          doc.font(config.fontFamily).fontSize(12).text(clientInfo.email, 130, 300);
        }
        
        if (clientInfo.telephone) {
          doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Téléphone:', 50, 320);
          doc.font(config.fontFamily).fontSize(12).text(clientInfo.telephone, 130, 320);
        }
      }
      
      // Détails de la facture
      const yPosition = clientInfo ? 360 : 220;
      doc.font(`${config.fontFamily}-Bold`).fontSize(14).text('Détails de la facture', 50, yPosition);
      doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();
      
      // En-tête du tableau
      const tableTop = yPosition + 30;
      doc.font(`${config.fontFamily}-Bold`).fontSize(10)
        .text('Description', 50, tableTop)
        .text('Quantité', 300, tableTop)
        .text('Prix unitaire', 370, tableTop)
        .text('Total', 470, tableTop);
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      
      // Contenu du tableau
      const description = serviceInfo?.nom || 'Service de diagnostic automobile';
      const quantity = 1;
      const unitPrice = paiement.montant;
      const total = paiement.montant;
      
      doc.font(config.fontFamily).fontSize(10)
        .text(description, 50, tableTop + 25)
        .text(quantity.toString(), 300, tableTop + 25)
        .text(`${unitPrice.toFixed(2)} €`, 370, tableTop + 25)
        .text(`${total.toFixed(2)} €`, 470, tableTop + 25);
      
      doc.moveTo(50, tableTop + 40).lineTo(550, tableTop + 40).stroke();
      
      // Total
      doc.font(`${config.fontFamily}-Bold`).fontSize(12)
        .text('Total:', 400, tableTop + 60)
        .text(`${total.toFixed(2)} €`, 470, tableTop + 60);
      
      // Méthode de paiement
      doc.font(`${config.fontFamily}-Bold`).fontSize(10).text('Méthode de paiement:', 50, tableTop + 90);
      
      const methodePaiement = {
        'carte': 'Carte bancaire',
        'stripe': 'Carte bancaire (Stripe)',
        'paypal': 'PayPal',
        'especes': 'Espèces',
        'virement': 'Virement bancaire'
      }[paiement.methodePaiement] || paiement.methodePaiement;
      
      doc.font(config.fontFamily).fontSize(10).text(methodePaiement, 180, tableTop + 90);
      
      // Référence de paiement externe si disponible
      if (paiement.referencePaiementExterne) {
        doc.font(`${config.fontFamily}-Bold`).fontSize(10).text('Réf. transaction:', 50, tableTop + 110);
        doc.font(config.fontFamily).fontSize(10).text(paiement.referencePaiementExterne, 180, tableTop + 110);
      }
      
      // Mentions légales
      const legalText = 'TVA non applicable, article 293 B du CGI. Paiement à réception de facture. En cas de retard de paiement, une pénalité de 3 fois le taux d\'intérêt légal sera appliquée.';
      
      doc.font(config.fontFamily).fontSize(8).text(legalText, 50, 700, {
        width: 500,
        align: 'center'
      });
      
      // Pied de page
      doc.font(config.fontFamily).fontSize(10).text(
        config.footerText,
        50,
        750,
        { align: 'center', width: 500 }
      );
      
      // Finaliser le document
      doc.end();
      
      // Attendre que le fichier soit écrit
      return new Promise((resolve, reject) => {
        fileStream.on('finish', () => {
          resolve({
            filePath,
            fileName: config.fileName,
            url: `/factures/${config.fileName}`
          });
        });
        
        fileStream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Erreur lors de la génération de la facture PDF:', error);
      throw error;
    }
  },

  /**
   * Rembourse un paiement Stripe
   * 
   * @param {string} chargeId - ID de la charge à rembourser
   * @param {number} amount - Montant à rembourser (en euros, sera converti en centimes)
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} - Détails du remboursement
   */
  async refundPayment(chargeId, amount = null, options = {}) {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Clé Stripe non configurée');
      }

      const refundParams = {
        charge: chargeId,
        reason: options.reason || 'requested_by_customer',
        metadata: {
          ...options.metadata,
          initiatedBy: options.initiatedBy || 'admin',
          reason: options.reasonDetails || ''
        }
      };

      // Si un montant spécifique est fourni, l'ajouter aux paramètres
      if (amount !== null) {
        refundParams.amount = Math.round(amount * 100); // Convertir en centimes
      }

      const refund = await stripe.refunds.create(refundParams);

      return {
        id: refund.id,
        amount: refund.amount / 100, // Convertir les centimes en euros
        status: refund.status,
        chargeId: refund.charge
      };
    } catch (error) {
      console.error('Erreur lors du remboursement Stripe:', error);
      throw error;
    }
  }
};
