const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

// Routes d'authentification (non protégées)
router.get('/login', adminController.showLoginForm);
router.post('/login', adminController.processLogin);
router.get('/logout', adminController.logout);

// Middleware d'authentification pour toutes les autres routes admin
router.use(authMiddleware.requireAuth);

// Routes du tableau de bord
router.get('/', adminController.showDashboard);

// Gestion des réservations
router.get('/reservations', adminController.getAllReservations);
router.get('/reservations/:id', adminController.getReservationDetails);
router.post('/reservations/:id/status', adminController.updateReservationStatus);
router.post('/reservations/:id/payment', adminController.updatePaymentStatus);
router.delete('/reservations/:id', adminController.deleteReservation);

// Gestion du calendrier
router.get('/calendar', adminController.showCalendar);
router.post('/calendar/availability', adminController.updateAvailability);

// Gestion des clients
router.get('/clients', adminController.getAllClients);
router.get('/clients/:id', adminController.getClientDetails);
router.post('/clients/:id/note', adminController.addClientNote);

// Statistiques et analytiques
router.get('/analytics', adminController.showAnalytics);
router.get('/analytics/data', adminController.getAnalyticsData);

// Paramètres
router.get('/settings', adminController.showSettings);
router.post('/settings', adminController.updateSettings);
router.post('/settings/password', adminController.updatePassword);

module.exports = router;
