// routes/booking.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Routes publiques pour les clients
router.get('/new', bookingController.showBookingForm);
router.post('/create', bookingController.createBooking);
// Redirection si quelqu'un accède directement à /booking/create
router.get('/create', (req, res) => {
  res.redirect('/booking/new');
});
router.get('/confirmation/:id', bookingController.showBookingConfirmation);

// Routes protégées pour l'administration (à sécuriser avec middleware d'authentification)
// TODO: Ajouter middleware d'authentification
router.get('/admin/all', bookingController.getAllBookings);
router.get('/admin/status/:status', bookingController.getBookingsByStatus);
router.get('/admin/:id', bookingController.getBookingById);
router.put('/admin/:id/confirm', bookingController.confirmBooking);
router.put('/admin/:id/cancel', bookingController.cancelBooking);
router.put('/admin/:id/payment', bookingController.updatePaymentStatus);

module.exports = router;
