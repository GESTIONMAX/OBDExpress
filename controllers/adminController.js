// controllers/adminController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configuration admin
const ADMIN_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'adminpassword';

// Afficher la page de connexion
exports.showLoginForm = (req, res) => {
  console.log('Affichage du formulaire de connexion');
  res.render('admin/login', {
    title: 'Administration | OBDExpress',
    error: req.query.error ? 'Identifiants incorrects' : null
  });
};

// Traiter la connexion
exports.processLogin = (req, res) => {
  console.log('Tentative de connexion avec:', req.body.username);
  const { username, password } = req.body;
  
  console.log('Nom d\'utilisateur attendu:', ADMIN_USERNAME);
  console.log('Nom d\'utilisateur fourni:', username);
  console.log('Mot de passe fourni:', password);
  console.log('Mot de passe attendu:', DEFAULT_PASSWORD);
  
  // Vérification simple pour le débogage
  if (username === ADMIN_USERNAME && password === DEFAULT_PASSWORD) {
    console.log('Authentification réussie');
    
    // Créer une session
    req.session.adminAuthenticated = true;
    req.session.adminUsername = username;
    
    // Redirection vers le tableau de bord
    return res.redirect('/admin');
  } else {
    console.log('Authentification échouée');
    return res.redirect('/admin/login?error=1');
  }
};

// Déconnexion
exports.logout = (req, res) => {
  req.session.destroy();
  res.clearCookie('adminToken');
  res.redirect('/admin/login');
};

// Afficher le tableau de bord
exports.showDashboard = (req, res) => {
  try {
    console.log('Affichage du tableau de bord');
    
    // Pour le moment, utilisons des données fictives pour le tableau de bord
    const stats = {
      totalReservations: 12,
      pendingReservations: 5,
      confirmedReservations: 7,
      revenue: 1250.50
    };
    
    const recentReservations = [
      {
        id: 1,
        customerName: 'Jean Dupont',
        customerEmail: 'jean@example.com',
        serviceType: 'Diagnostic complet',
        city: 'Paris',
        createdAt: new Date(),
        status: 'confirmed',
        price: 89.99
      },
      {
        id: 2,
        customerName: 'Marie Martin',
        customerEmail: 'marie@example.com',
        serviceType: 'Diagnostic simple',
        city: 'Lyon',
        createdAt: new Date(),
        status: 'pending',
        price: 49.99
      }
    ];
    
    res.render('admin/dashboard', {
      title: 'Tableau de bord | OBDExpress',
      admin: req.session.adminUsername,
      stats,
      recentReservations
    });
  } catch (error) {
    console.error('Erreur lors de l\'affichage du tableau de bord:', error);
    res.status(500).send('Erreur serveur');
  }
};

// Fonctions de base pour les autres routes
exports.getAllReservations = (req, res) => {
  res.send('Liste des réservations');
};

exports.getReservationDetails = (req, res) => {
  res.send(`Détails de la réservation ${req.params.id}`);
};

exports.updateReservationStatus = (req, res) => {
  res.json({ success: true, message: 'Statut mis à jour' });
};

exports.updatePaymentStatus = (req, res) => {
  res.json({ success: true, message: 'Statut de paiement mis à jour' });
};

exports.deleteReservation = (req, res) => {
  res.json({ success: true, message: 'Réservation supprimée' });
};

exports.showCalendar = (req, res) => {
  res.send('Calendrier');
};

exports.updateAvailability = (req, res) => {
  res.json({ success: true, message: 'Disponibilité mise à jour' });
};

exports.getAllClients = (req, res) => {
  res.send('Liste des clients');
};

exports.getClientDetails = (req, res) => {
  res.send(`Détails du client ${req.params.id}`);
};

exports.addClientNote = (req, res) => {
  res.json({ success: true, message: 'Note ajoutée' });
};

exports.showAnalytics = (req, res) => {
  res.send('Analytiques');
};

exports.getAnalyticsData = (req, res) => {
  res.json({ 
    success: true, 
    data: {
      bookingsByDate: [
        { date: '2025-05-01', count: 3 },
        { date: '2025-05-02', count: 2 },
        { date: '2025-05-03', count: 5 }
      ],
      revenueByDate: [
        { date: '2025-05-01', amount: 150 },
        { date: '2025-05-02', amount: 100 },
        { date: '2025-05-03', amount: 250 }
      ]
    }
  });
};

exports.showSettings = (req, res) => {
  res.send('Paramètres');
};

exports.updateSettings = (req, res) => {
  res.json({ success: true, message: 'Paramètres mis à jour' });
};

exports.updatePassword = (req, res) => {
  res.json({ success: true, message: 'Mot de passe mis à jour' });
};
