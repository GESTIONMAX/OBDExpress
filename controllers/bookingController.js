// controllers/bookingController.js
const bookingModel = require('../models/booking');
const localController = require('./localController');
const fs = require('fs');
const path = require('path');

// Créer une nouvelle réservation
exports.createBooking = (req, res) => {
  try {
    const bookingData = {
      customerName: req.body.customerName,
      customerEmail: req.body.customerEmail,
      customerPhone: req.body.customerPhone,
      customerAddress: req.body.customerAddress,
      city: req.body.city,
      vehicleType: req.body.vehicleType,
      vehicleYear: req.body.vehicleYear,
      vehicleMake: req.body.vehicleMake,
      vehicleModel: req.body.vehicleModel,
      problemDescription: req.body.problemDescription,
      preferredDates: req.body.preferredDates, // Format: ["2025-05-15", "2025-05-16", "2025-05-17"]
      preferredTimeSlots: req.body.preferredTimeSlots, // Format: ["morning", "afternoon", "evening"]
      serviceType: req.body.serviceType,
      price: req.body.price,
      deposit: req.body.deposit || false, // Si un acompte a été payé
      paymentMethod: req.body.paymentMethod,
      paymentReference: req.body.paymentReference,
      notes: req.body.notes
    };

    const newBooking = bookingModel.createBooking(bookingData);
    
    // Si la réservation est créée avec succès
    if (newBooking) {
      // Envoi d'un email de confirmation (à implémenter)
      // sendConfirmationEmail(newBooking);
      
      // Format de la réponse en fonction du type de requête
      const isAjaxRequest = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));
      
      if (isAjaxRequest) {
        // Pour les requêtes AJAX, renvoyer du JSON
        return res.status(201).json({
          success: true,
          message: 'Réservation créée avec succès',
          booking: newBooking,
          redirectUrl: `/booking/confirmation/${newBooking.id}`
        });
      } else {
        // Pour les requêtes normales, rediriger vers la page de confirmation
        return res.redirect(`/booking/confirmation/${newBooking.id}`);
      }
    } else {
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de la réservation'
        });
      } else {
        // Rediriger vers une page d'erreur ou le formulaire avec un message
        req.session.bookingError = 'Erreur lors de la création de la réservation';
        return res.redirect('/booking/new');
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la réservation',
        error: error.message
      });
    } else {
      // Rediriger vers une page d'erreur ou le formulaire avec un message
      req.session.bookingError = `Erreur: ${error.message}`;
      return res.redirect('/booking/new');
    }
  }
};

// Obtenir toutes les réservations (pour l'admin)
exports.getAllBookings = (req, res) => {
  try {
    const bookings = bookingModel.getAllBookings();
    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des réservations',
      error: error.message
    });
  }
};

// Obtenir les réservations par statut (pour l'admin)
exports.getBookingsByStatus = (req, res) => {
  try {
    const { status } = req.params;
    const bookings = bookingModel.getBookingsByStatus(status);
    
    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations par statut:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des réservations par statut',
      error: error.message
    });
  }
};

// Obtenir une réservation par son ID
exports.getBookingById = (req, res) => {
  try {
    const { id } = req.params;
    const booking = bookingModel.getBookingById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }
    
    return res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la réservation',
      error: error.message
    });
  }
};

// Confirmer une réservation (par l'admin)
exports.confirmBooking = (req, res) => {
  try {
    const { id } = req.params;
    const confirmationData = {
      date: req.body.date,
      time: req.body.time,
      adminName: req.body.adminName || 'Admin',
      adminNotes: req.body.adminNotes
    };
    
    const updatedBooking = bookingModel.confirmBooking(id, confirmationData);
    
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }
    
    // Envoi d'un email de confirmation (à implémenter)
    // sendBookingConfirmationEmail(updatedBooking);
    
    return res.status(200).json({
      success: true,
      message: 'Réservation confirmée avec succès',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Erreur lors de la confirmation de la réservation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la confirmation de la réservation',
      error: error.message
    });
  }
};

// Annuler une réservation
exports.cancelBooking = (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const updatedBooking = bookingModel.cancelBooking(id, reason);
    
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }
    
    // Envoi d'un email d'annulation (à implémenter)
    // sendCancellationEmail(updatedBooking);
    
    return res.status(200).json({
      success: true,
      message: 'Réservation annulée avec succès',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la réservation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'annulation de la réservation',
      error: error.message
    });
  }
};

// Mettre à jour le statut de paiement
exports.updatePaymentStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentData } = req.body;
    
    const updatedBooking = bookingModel.updatePaymentStatus(id, paymentStatus, paymentData);
    
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Statut de paiement mis à jour avec succès',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de paiement:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du statut de paiement',
      error: error.message
    });
  }
};

// Afficher le formulaire de réservation
exports.showBookingForm = (req, res) => {
  try {
    // Récupérer les paramètres depuis les query params
    const { service, zone, price, ville } = req.query;
    
    // Prix par défaut si aucun prix n'est spécifié
    let prix = price ? parseInt(price) : 99;
    let cityData = null;
    
    // Si une zone est spécifiée, on tente de récupérer ses données
    if (zone) {
      // Essayer de trouver la ville par son nom
      const cities = localController.getAllCities();
      cityData = cities.find(city => city.name.toLowerCase() === zone.toLowerCase());
      
      // Si on ne trouve pas la ville exacte, on utilise les paramètres fournis
      if (!cityData) {
        cityData = {
          name: zone,
          price: prix
        };
      }
    } 
    // Compatibilité avec l'ancien paramètre ville
    else if (ville) {
      cityData = localController.getCityById(ville);
      if (cityData) {
        prix = cityData.price || prix;
      }
    }
    
    // Récupérer toutes les villes pour le formulaire
    const cities = localController.getAllCities();
    
    res.render('booking', {
      title: 'Réservation | OBDExpress',
      service: service || 'Diagnostic automobile',
      ville: zone || ville || 'antibes',
      cityData,
      cities,
      prix
    });
  } catch (error) {
    console.error('Erreur lors de l\'affichage du formulaire de réservation:', error);
    res.status(500).render('error', {
      message: 'Erreur lors du chargement du formulaire de réservation',
      error
    });
  }
};

// Afficher la page de confirmation de réservation
exports.showBookingConfirmation = (req, res) => {
  try {
    const { id } = req.params;
    const booking = bookingModel.getBookingById(id);
    
    if (!booking) {
      return res.status(404).render('error', {
        message: 'Réservation non trouvée'
      });
    }
    
    // Pré-traitement des données pour éviter les erreurs de template
    const processedBooking = { ...booking };
    
    // Gérer les dates préférées
    if (processedBooking.preferredDates) {
      if (typeof processedBooking.preferredDates === 'string') {
        try {
          processedBooking.preferredDates = JSON.parse(processedBooking.preferredDates);
        } catch (e) {
          // Si ce n'est pas un JSON valide, on le traite comme une chaîne unique
          processedBooking.preferredDates = [processedBooking.preferredDates];
        }
      }
      // S'assurer que c'est un tableau
      if (!Array.isArray(processedBooking.preferredDates)) {
        processedBooking.preferredDates = [processedBooking.preferredDates];
      }
    } else {
      processedBooking.preferredDates = [];
    }
    
    // Gérer les créneaux horaires préférés
    if (processedBooking.preferredTimeSlots) {
      if (typeof processedBooking.preferredTimeSlots === 'string') {
        try {
          processedBooking.preferredTimeSlots = JSON.parse(processedBooking.preferredTimeSlots);
        } catch (e) {
          // Si ce n'est pas un JSON valide, on le traite comme une chaîne unique
          processedBooking.preferredTimeSlots = [processedBooking.preferredTimeSlots];
        }
      }
      // S'assurer que c'est un tableau
      if (!Array.isArray(processedBooking.preferredTimeSlots)) {
        processedBooking.preferredTimeSlots = [processedBooking.preferredTimeSlots];
      }
    } else {
      processedBooking.preferredTimeSlots = [];
    }
    
    res.render('booking-confirmation', {
      title: 'Confirmation de réservation | OBDExpress',
      booking: processedBooking
    });
  } catch (error) {
    console.error('Erreur lors de l\'affichage de la confirmation de réservation:', error);
    res.status(500).render('error', {
      message: 'Erreur lors du chargement de la confirmation de réservation',
      error
    });
  }
};
