import React, { useState, FormEvent } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './App.css';

const stripePromise = loadStripe('pk_test_51OFMUuKrQQFwO9FlUeGpw74QBeOCJlFxuLQ7GfsC12DvfJ2e4hPBxTY2eivXZOW9ipQQgBLi0zjVhsO1As9jhNVB008sfwM0Mg');

interface UserInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

const PaymentForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });
  const [amount, setAmount] = useState<string>("10");
  const [customAmount, setCustomAmount] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserInfo(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    if (value === "custom") {
      setCustomAmount("");
    }
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setAmount("custom");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      return;
    }

    const finalAmount = amount === "custom" ? customAmount : amount;

    const response = await fetch('http://localhost:8000/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: finalAmount, currency: 'usd', userInfo: userInfo }),
    });

    const { clientSecret }: { clientSecret: string } = await response.json();

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
        billing_details: {
          name: userInfo.name,
          address: {
            line1: userInfo.address,
            city: userInfo.city,
            state: userInfo.state,
            postal_code: userInfo.zip,
          },
        },
      },
    });

    setProcessing(false);

    if (result.error) {
      setError(result.error.message || 'An error occurred');
    } else {
      if (result.paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded!');
      }
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="payment-form">
        <h2 className="form-title">Buy me a coffee!</h2>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={userInfo.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={userInfo.address}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={userInfo.city}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="state">State</label>
            <input
              type="text"
              id="state"
              name="state"
              value={userInfo.state}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="zip">ZIP Code</label>
            <input
              type="text"
              id="zip"
              name="zip"
              value={userInfo.zip}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Amount</label>
          <div className="amount-options">
            {["5", "10", "15", "custom"].map((value) => (
              <label key={value} className="amount-option">
                <input
                  type="radio"
                  name="amount"
                  value={value}
                  checked={amount === value}
                  onChange={handleAmountChange}
                />
                {value === "custom" ? "Custom" : `$${value}`}
              </label>
            ))}
          </div>
          {amount === "custom" && (
            <input
              type="number"
              value={customAmount}
              onChange={handleCustomAmountChange}
              placeholder="Enter custom amount"
              className="custom-amount-input"
              required
            />
          )}
        </div>
        <div className="form-group">
          <label htmlFor="card-element">Credit or debit card</label>
          <div className="card-element">
            <CardElement />
          </div>
        </div>
        <button className="submit-button" disabled={!stripe || processing}>
          {processing ? 'Processing...' : `Pay $${amount === "custom" ? customAmount || "0" : amount}`}
        </button>
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
};

export default App;