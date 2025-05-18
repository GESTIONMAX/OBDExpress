// models/booking.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Chemin vers le fichier JSON qui stockera les réservations
const BOOKINGS_FILE = path.join(__dirname, '../data/bookings.json');

// Initialiser le fichier s'il n'existe pas
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2));
}

// Statuts possibles pour une réservation
const STATUS = {
  PENDING: 'pending',       // En attente de confirmation
  CONFIRMED: 'confirmed',   // Confirmé par l'administrateur
  COMPLETED: 'completed',   // Service effectué
  CANCELLED: 'cancelled'    // Annulé
};

// Charger toutes les réservations
const loadBookings = () => {
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
  } catch (error) {
    console.error('Erreur lors du chargement des réservations:', error);
    return [];
  }
};

// Sauvegarder les réservations
const saveBookings = (bookings) => {
  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des réservations:', error);
    return false;
  }
};

// Créer une nouvelle réservation
exports.createBooking = (bookingData) => {
  const bookings = loadBookings();
  
  const newBooking = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    status: STATUS.PENDING,
    paymentStatus: bookingData.deposit ? 'deposit_paid' : 'unpaid',
    ...bookingData
  };
  
  bookings.push(newBooking);
  saveBookings(bookings);
  
  return newBooking;
};

// Obtenir toutes les réservations
exports.getAllBookings = () => {
  return loadBookings();
};

// Obtenir les réservations par statut
exports.getBookingsByStatus = (status) => {
  const bookings = loadBookings();
  return bookings.filter(booking => booking.status === status);
};

// Obtenir une réservation par son ID
exports.getBookingById = (bookingId) => {
  const bookings = loadBookings();
  return bookings.find(booking => booking.id === bookingId);
};

// Mettre à jour une réservation
exports.updateBooking = (bookingId, updateData) => {
  const bookings = loadBookings();
  const index = bookings.findIndex(booking => booking.id === bookingId);
  
  if (index === -1) return null;
  
  const updatedBooking = {
    ...bookings[index],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  bookings[index] = updatedBooking;
  saveBookings(bookings);
  
  return updatedBooking;
};

// Confirmer une réservation
exports.confirmBooking = (bookingId, confirmationData) => {
  return this.updateBooking(bookingId, {
    status: STATUS.CONFIRMED,
    confirmedDate: confirmationData.date,
    confirmedTime: confirmationData.time,
    confirmedBy: confirmationData.adminName,
    ...confirmationData
  });
};

// Annuler une réservation
exports.cancelBooking = (bookingId, reason) => {
  return this.updateBooking(bookingId, {
    status: STATUS.CANCELLED,
    cancelReason: reason,
    cancelledAt: new Date().toISOString()
  });
};

// Marquer une réservation comme complétée
exports.completeBooking = (bookingId, completionData) => {
  return this.updateBooking(bookingId, {
    status: STATUS.COMPLETED,
    completedAt: new Date().toISOString(),
    ...completionData
  });
};

// Mettre à jour le statut de paiement
exports.updatePaymentStatus = (bookingId, paymentStatus, paymentData = {}) => {
  return this.updateBooking(bookingId, {
    paymentStatus,
    paymentData,
    paymentUpdatedAt: new Date().toISOString()
  });
};

// Exporter les constantes
exports.STATUS = STATUS;
