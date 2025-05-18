// strapi.js
const strapi = require('@strapi/strapi');
const path = require('path');
require('dotenv').config();

/**
 * Point d'entrée pour l'initialisation et le démarrage de Strapi CMS
 * Utilisé pour gérer le contenu du site OBDExpress
 */

async function startStrapi() {
  try {
    // Configuration des options de démarrage
    const appDir = process.cwd();
    const strapiInstance = strapi({
      appDir,
      distDir: path.resolve(appDir, '.cache/build'),
      autoReload: process.env.NODE_ENV === 'development',
      serveAdmin: true,
    });

    // Initialisation et démarrage de Strapi
    await strapiInstance.load();
    await strapiInstance.start();

    console.log(`✅ Strapi CMS démarré avec succès!`);
    console.log(`🔗 Administration Strapi disponible sur: http://localhost:1337/admin`);
    console.log(`🚀 API Strapi disponible sur: http://localhost:1337/api`);
    
    // Gestion des erreurs après démarrage
    strapiInstance.app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = {
          error: {
            message: err.message || 'Une erreur interne est survenue',
            status: ctx.status
          }
        };
        strapiInstance.log.error(err);
      }
    });

    return strapiInstance;
  } catch (error) {
    console.error('❌ Erreur lors du démarrage de Strapi:', error);
    process.exit(1);
  }
}

// Gestion des signaux pour un arrêt propre
process.on('SIGINT', () => {
  console.log('Arrêt de Strapi...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Arrêt de Strapi...');
  process.exit(0);
});

// Démarrage de Strapi
if (require.main === module) {
  startStrapi();
} else {
  module.exports = { startStrapi };
}
