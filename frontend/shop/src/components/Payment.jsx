import { CheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import { STRIPE_PUBLIC_KEY, API_URL } from "../settings";
import React from "react";
import axios from "axios";

// Based on https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=embedded-components&server-lang=java&client=react#create-checkout-session
// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

const fetchClientSecret = async () => {
  axios.defaults.withCredentials = true;
  const { data } = await axios.post(`${API_URL}/create-checkout-session`);

  return data.checkoutSessionId;
};

export default function Payment() {
  return (
    <CheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
      <CheckoutForm />
    </CheckoutProvider>
  );
}
