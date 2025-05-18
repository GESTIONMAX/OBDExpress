'use strict';

/**
 * Service de génération de PDF pour les rapports d'intervention
 */

const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  /**
   * Génère un rapport d'intervention au format PDF
   * 
   * @param {Object} intervention - Les données de l'intervention
   * @param {Object} options - Options de génération du PDF
   * @returns {Promise<string>} - Le chemin du fichier PDF généré
   */
  async generateInterventionReport(intervention, options = {}) {
    // Configuration par défaut
    const config = {
      outputDir: options.outputDir || './public/reports',
      fileName: options.fileName || `intervention-${intervention.reference}.pdf`,
      fontFamily: options.fontFamily || 'Helvetica',
      logo: options.logo || './public/images/logo.png',
      footerText: options.footerText || 'OBDExpress - Rapport d\'intervention'
    };

    try {
      // S'assurer que le répertoire de sortie existe
      await fs.ensureDir(config.outputDir);

      // Créer le document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Rapport d'intervention ${intervention.reference}`,
          Author: 'OBDExpress',
          Subject: 'Diagnostic automobile',
          Keywords: 'diagnostic, obd, automobile',
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

      doc.font(`${config.fontFamily}-Bold`).fontSize(20).text('RAPPORT D\'INTERVENTION', { align: 'center' });
      doc.moveDown();

      // Informations de référence
      doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Référence:', 50, 150);
      doc.font(config.fontFamily).fontSize(12).text(intervention.reference, 150, 150);

      doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Date début:', 50, 170);
      doc.font(config.fontFamily).fontSize(12).text(
        new Date(intervention.dateDebut).toLocaleString('fr-FR'), 
        150, 
        170
      );

      doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Date fin:', 50, 190);
      doc.font(config.fontFamily).fontSize(12).text(
        new Date(intervention.dateFin).toLocaleString('fr-FR'), 
        150, 
        190
      );

      doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Statut:', 50, 210);
      doc.font(config.fontFamily).fontSize(12).text(intervention.statut, 150, 210);
      
      // Information sur le véhicule si disponible
      if (intervention.voiture) {
        doc.font(`${config.fontFamily}-Bold`).fontSize(16).text('Véhicule', 50, 240);
        doc.moveTo(50, 260).lineTo(550, 260).stroke();
        
        doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Marque / Modèle:', 50, 270);
        doc.font(config.fontFamily).fontSize(12).text(
          `${intervention.voiture.marque} ${intervention.voiture.modele}`, 
          170, 
          270
        );
        
        doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Immatriculation:', 50, 290);
        doc.font(config.fontFamily).fontSize(12).text(intervention.voiture.immatriculation, 170, 290);
        
        doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Année:', 50, 310);
        doc.font(config.fontFamily).fontSize(12).text(intervention.voiture.annee.toString(), 170, 310);
        
        if (intervention.voiture.kilometrage) {
          doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Kilométrage:', 50, 330);
          doc.font(config.fontFamily).fontSize(12).text(
            `${intervention.voiture.kilometrage} km`, 
            170, 
            330
          );
        }
      }
      
      // Rapport d'intervention
      const yPosition = intervention.voiture ? 370 : 240;
      doc.font(`${config.fontFamily}-Bold`).fontSize(16).text('Rapport', 50, yPosition);
      doc.moveTo(50, yPosition + 20).lineTo(550, yPosition + 20).stroke();
      
      // Ajouter le texte du rapport avec formatage basique
      doc.font(config.fontFamily).fontSize(12);
      const rapportText = intervention.rapport || 'Aucun rapport disponible';
      doc.text(rapportText, 50, yPosition + 30, {
        width: 500,
        align: 'justify'
      });
      
      // Codes de diagnostic si disponibles
      if (intervention.codesDiagnostic && intervention.codesDiagnostic.length > 0) {
        doc.addPage();
        doc.font(`${config.fontFamily}-Bold`).fontSize(16).text('Codes de diagnostic', 50, 50);
        doc.moveTo(50, 70).lineTo(550, 70).stroke();
        
        let yPos = 90;
        intervention.codesDiagnostic.forEach((code, index) => {
          doc.font(`${config.fontFamily}-Bold`).fontSize(12).text(`Code ${index + 1}:`, 50, yPos);
          doc.font(config.fontFamily).fontSize(12).text(code.code, 120, yPos);
          
          if (code.description) {
            doc.font(`${config.fontFamily}-Bold`).fontSize(12).text('Description:', 50, yPos + 20);
            doc.font(config.fontFamily).fontSize(12).text(code.description, 120, yPos + 20, { width: 430 });
            yPos += 40 + doc.heightOfString(code.description, { width: 430 });
          } else {
            yPos += 30;
          }
        });
      }
      
      // Recommandations si disponibles
      if (intervention.recommandations) {
        if (!intervention.codesDiagnostic || intervention.codesDiagnostic.length === 0) {
          doc.addPage();
        }
        doc.font(`${config.fontFamily}-Bold`).fontSize(16).text('Recommandations', 50, 50);
        doc.moveTo(50, 70).lineTo(550, 70).stroke();
        
        doc.font(config.fontFamily).fontSize(12).text(intervention.recommandations, 50, 90, {
          width: 500,
          align: 'justify'
        });
      }
      
      // Pied de page sur chaque page
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        const pageHeight = doc.page.height;
        doc.font(config.fontFamily).fontSize(10).text(
          `${config.footerText} - Page ${i + 1}/${totalPages}`,
          50,
          pageHeight - 50,
          { align: 'center', width: 500 }
        );
      }
      
      // Finaliser le document
      doc.end();
      
      // Attendre que le fichier soit écrit
      return new Promise((resolve, reject) => {
        fileStream.on('finish', () => {
          resolve({
            filePath,
            fileName: config.fileName,
            url: `/reports/${config.fileName}`
          });
        });
        
        fileStream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Erreur lors de la génération du rapport PDF:', error);
      throw error;
    }
  },
};
