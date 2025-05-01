const express = require('express');
const router = express.Router();

// Route pour la page d'accueil
router.get('/', (req, res) => {
  res.render('index', { title: 'OBDExpress - Diagnostic auto à domicile' });
});

// Route pour traiter le formulaire de contact
router.post('/contact', (req, res) => {
  const { nom, tel, email, message } = req.body;
  
  // Affichage des données du formulaire dans la console (pour test)
  console.log('Nouveau message de contact:');
  console.log('Nom:', nom);
  console.log('Téléphone:', tel);
  console.log('Email:', email || 'Non fourni');
  console.log('Message:', message || 'Non fourni');
  
  // Dans une version future, vous pourriez envoyer un email ou enregistrer en base de données
  
  // Redirection vers la page d'accueil avec un message de succès
  // Note: Dans une version plus avancée, vous pourriez utiliser des flash messages
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

module.exports = router;