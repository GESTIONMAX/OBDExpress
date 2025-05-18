const express = require('express');
const router = express.Router();

// Route pour la page d'accueil
router.get('/', (req, res) => {
  res.render('index', { title: 'Accueil | OBDExpress' });
});

router.get('/services', (req, res) => {
  res.render('services', { title: 'Services | OBDExpress' });
});

router.get('/tarifs', (req, res) => {
  res.render('tarifs', { title: 'Tarifs | OBDExpress' });
});

router.get('/zones', (req, res) => {
  const localController = require('../controllers/localController');
  const cities = localController.getAllCities();
  res.render('zones', { 
    title: 'Zones desservies | OBDExpress',
    cities: cities
  });
});

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact | OBDExpress' });
});

router.get('/cgv', (req, res) => {
  res.render('cgv', { title: 'Conditions générales de vente | OBDExpress' });
});


// Traitement du formulaire de contact (POST uniquement)
router.post('/contact', (req, res) => {
  const { nom, tel, email, message } = req.body;

  console.log('Nouveau message de contact:');
  console.log('Nom:', nom);
  console.log('Téléphone:', tel);
  console.log('Email:', email || 'Non fourni');
  console.log('Message:', message || 'Non fourni');

  res.send(`
    <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="5;url=/" />
        <title>Message envoyé - OBDExpress</title>
        <link rel="stylesheet" href="/css/styles.css">
        <style>
          .success-message {
            max-width: 600px;
            margin: 100px auto;
            padding: 2rem;
            background-color: #d4edda;
            color: #155724;
            border-radius: 4px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="success-message">
          <h1>Message envoyé avec succès!</h1>
          <p>Merci ${nom}, nous avons bien reçu votre message et vous contacterons très rapidement.</p>
          <p>Vous allez être redirigé vers la page d'accueil dans 5 secondes...</p>
          <p><a href="/">Retour immédiat à l'accueil</a></p>
        </div>
      </body>
    </html>
  `);
});

// Mentions légales (à conserver)
router.get('/mentions-legales', (req, res) => {
  res.render('mentions-legales', { title: 'Mentions légales | OBDExpress' });
});

// Politique de confidentialité (à conserver si page présente)
router.get('/politique-confidentialite', (req, res) => {
  res.render('politique-confidentialite', { title: 'Politique de confidentialité | OBDExpress' });
});

module.exports = router;
