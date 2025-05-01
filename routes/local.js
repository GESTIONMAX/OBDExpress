// routes/local.js
const express = require('express');
const router = express.Router();
const localController = require('../controllers/localController');

// Page listant toutes les villes desservies
router.get('/zones-intervention', (req, res) => {
  const cities = localController.getAllCities();
  res.render('zones', { 
    title: 'Zones d\'intervention | OBDExpress',
    cities: cities
  });
});

// Pages spécifiques à chaque ville
router.get('/diagnostic-auto/:cityId', (req, res) => {
  const cityId = req.params.cityId;
  const city = localController.getCityById(cityId);
  
  if (!city) {
    return res.status(404).render('404', { 
      title: 'Page non trouvée | OBDExpress'
    });
  }
  
  res.render('villes', { 
    title: city.title,
    city: city,
    metaDescription: city.description,
    req: req
  });
});

// Sitemap XML pour le SEO
router.get('/sitemap.xml', (req, res) => {
  const urls = localController.generateSitemap(req);
  
  res.header('Content-Type', 'application/xml');
  res.render('sitemap', { urls: urls });
});

// Page de la carte
router.get('/carte', (req, res) => {
  res.render('carte', { 
    title: 'Carte des zones d\'intervention | OBDExpress'
  });
});

// API pour récupérer les données des villes avec coordonnées
router.get('/api/cities', (req, res) => {
  const citiesForMap = localController.getCitiesForMap();
  res.json(citiesForMap);
});

module.exports = router;