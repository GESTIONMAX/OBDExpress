// controllers/localController.js
const fs = require('fs');
const path = require('path');

// Charger les données des villes
const villesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/villes.json'), 'utf8')
);

// Obtenir toutes les villes
exports.getAllCities = () => {
  return villesData;
};

// Obtenir une ville par son ID
exports.getCityById = (cityId) => {
  return villesData.find(city => city.id === cityId);
};

// Générer le sitemap pour les villes
exports.generateSitemap = (req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const urls = villesData.map(city => ({
    url: `${baseUrl}/diagnostic-auto/${city.id}`,
    lastmod: new Date().toISOString().split('T')[0],
    priority: city.isMainArea ? '0.9' : '0.8',
    changefreq: 'weekly'
  }));
  
  return urls;
};

// Obtenir les villes avec leurs coordonnées pour la carte
exports.getCitiesForMap = () => {
  return villesData;
};