// Intégration du composant de paiement Stripe dans l'application
document.addEventListener('DOMContentLoaded', function() {
  // Vérifier si nous sommes sur une page de paiement
  const paymentContainer = document.getElementById('stripe-payment-container');
  if (!paymentContainer) return;
  
  // Récupérer les données nécessaires au paiement depuis les attributs data
  const amount = parseFloat(paymentContainer.dataset.amount || '0');
  const serviceId = paymentContainer.dataset.serviceId;
  const clientId = paymentContainer.dataset.clientId;
  
  // S'assurer que les montants et IDs sont valides
  if (isNaN(amount) || amount <= 0 || !serviceId || !clientId) {
    console.error('Données de paiement invalides:', { amount, serviceId, clientId });
    paymentContainer.innerHTML = '<div class="alert alert-danger">Données de paiement invalides. Veuillez réessayer.</div>';
    return;
  }
  
  // Charger les bibliothèques React et ReactDOM
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };
  
  // Fonction pour démarrer le rendu du composant React
  const renderPaymentForm = () => {
    // Ici nous utiliserons React.createElement au lieu de JSX puisque nous sommes dans un fichier .js
    const StripePaymentForm = window.StripePaymentForm.default;
    
    ReactDOM.render(
      React.createElement(StripePaymentForm, {
        amount,
        serviceId,
        clientId,
        onPaymentSuccess: (paymentIntent) => {
          console.log('Paiement réussi:', paymentIntent);
          
          // Rediriger vers la page de confirmation ou afficher un message
          if (paymentContainer.dataset.redirectSuccess) {
            window.location.href = paymentContainer.dataset.redirectSuccess;
          } else {
            // Afficher un message de réussite
            const successMessage = document.createElement('div');
            successMessage.className = 'alert alert-success mt-4';
            successMessage.innerHTML = `
              <h4>Paiement accepté!</h4>
              <p>Votre paiement de ${amount} € a été traité avec succès.</p>
              <p>Référence: ${paymentIntent.id}</p>
              <a href="/mes-rdv" class="btn btn-primary mt-2">Voir mes rendez-vous</a>
            `;
            
            // Remplacer le formulaire par le message
            paymentContainer.innerHTML = '';
            paymentContainer.appendChild(successMessage);
          }
        },
        onPaymentError: (error) => {
          console.error('Erreur de paiement:', error);
          
          // Afficher un message d'erreur
          const errorMessage = document.createElement('div');
          errorMessage.className = 'alert alert-danger mt-4';
          errorMessage.textContent = `Erreur de paiement: ${error.message || 'Une erreur est survenue lors du traitement du paiement.'}`;
          
          // Ajouter le message après le formulaire
          paymentContainer.appendChild(errorMessage);
        }
      }),
      paymentContainer
    );
  };
  
  // Charger les scripts nécessaires dans le bon ordre
  Promise.all([
    loadScript('https://unpkg.com/react@17/umd/react.production.min.js'),
    loadScript('https://unpkg.com/react-dom@17/umd/react-dom.production.min.js')
  ])
    .then(() => loadScript('/js/components/payment/StripePaymentForm.bundle.js'))
    .then(() => {
      if (window.StripePaymentForm) {
        renderPaymentForm();
      } else {
        console.error('Le composant StripePaymentForm n\'a pas été chargé correctement.');
        paymentContainer.innerHTML = '<div class="alert alert-danger">Impossible de charger le module de paiement. Veuillez réessayer.</div>';
      }
    })
    .catch(error => {
      console.error('Erreur lors du chargement des scripts:', error);
      paymentContainer.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement du module de paiement. Veuillez réessayer.</div>';
    });
});
