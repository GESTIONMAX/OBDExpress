import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialiser Stripe avec la clé publique
const stripePromise = loadStripe('pk_test_51RQ9LV2fZjr1ESJo2TNIx6Bt1Sx2vTeN0MVmQo39Ruxgzi2Z1OJSU48v14C5RbBQ1YbH7ixBAcvSE5khcKq46upV00FpLpRxs8');

// Styles pour les éléments de carte
const cardElementStyle = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

// Composant de formulaire de paiement
const PaymentForm = ({ amount, onPaymentSuccess, onPaymentError, serviceId, clientId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);

  // Récupérer l'intention de paiement depuis le serveur
  useEffect(() => {
    // Créer un nouvel objet de paiement dans l'API
    fetch('/api/paiements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          montant: amount,
          methodePaiement: 'stripe',
          statut: 'en_attente',
          service: serviceId,
          client: clientId,
        }
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Une fois le paiement créé, on utilise l'API pour initialiser le paiement Stripe
        return fetch(`/api/paiements/${data.data.id}/process-stripe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      })
      .then((res) => res.json())
      .then((data) => {
        // Récupérer le client_secret pour confirmer le paiement plus tard
        setClientSecret(data.client_secret);
      })
      .catch((err) => {
        setError('Une erreur est survenue lors de la préparation du paiement.');
        console.error('Erreur lors de la création du paiement:', err);
      });
  }, [amount, serviceId, clientId]);

  const handleCardChange = (event) => {
    setError(event.error ? event.error.message : '');
    setCardComplete(event.complete);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe n'est pas encore chargé, on ne peut pas traiter le paiement
      return;
    }

    if (!cardComplete) {
      setError('Veuillez remplir tous les champs de la carte.');
      return;
    }

    setProcessing(true);

    try {
      // Confirmer le paiement avec les éléments de carte
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: document.getElementById('cardholderName').value,
          },
        },
      });

      setProcessing(false);

      if (result.error) {
        // Afficher l'erreur à l'utilisateur
        setError(result.error.message);
        if (onPaymentError) onPaymentError(result.error);
      } else if (result.paymentIntent.status === 'succeeded') {
        // Le paiement a réussi
        setPaymentMethod(result.paymentIntent);
        if (onPaymentSuccess) onPaymentSuccess(result.paymentIntent);
      }
    } catch (err) {
      setProcessing(false);
      setError('Une erreur inattendue s\'est produite.');
      console.error('Erreur de paiement:', err);
      if (onPaymentError) onPaymentError(err);
    }
  };

  return (
    <form className="payment-form" onSubmit={handleSubmit}>
      <div className="form-row mb-4">
        <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-1">
          Nom du titulaire de la carte
        </label>
        <input
          id="cardholderName"
          type="text"
          required
          className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2"
          placeholder="Jean Dupont"
        />
      </div>

      <div className="form-row mb-4">
        <label htmlFor="cardElement" className="block text-sm font-medium text-gray-700 mb-1">
          Informations de carte
        </label>
        <div id="cardElement" className="border border-gray-300 rounded-md p-3">
          <CardElement options={cardElementStyle} onChange={handleCardChange} />
        </div>
      </div>

      {error && (
        <div className="error-message text-red-600 mb-4">
          <svg className="inline-block w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing || !cardComplete}
        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          (!stripe || processing || !cardComplete) ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Traitement en cours...
          </span>
        ) : (
          `Payer ${amount} €`
        )}
      </button>

      {paymentMethod && (
        <div className="payment-success bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4">
          <strong className="font-bold">Paiement réussi!</strong>
          <p className="block sm:inline">Votre paiement a été traité avec succès.</p>
        </div>
      )}
    </form>
  );
};

// Wrapper avec Elements pour que les composants Stripe fonctionnent
const StripePaymentForm = (props) => (
  <Elements stripe={stripePromise}>
    <PaymentForm {...props} />
  </Elements>
);

export default StripePaymentForm;
