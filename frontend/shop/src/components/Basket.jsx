import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { UserLoginContext } from "../App";
import { API_URL, STRIPE_PUBLIC_KEY } from "../settings";
import { loadStripe } from "@stripe/stripe-js";
import { useTheme } from ".././ThemeContext.jsx";

function Basket() {
  const { theme } = useTheme();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const { user } = useContext(UserLoginContext);
  const shipping = 5.0;
  const tax = 8.32;
  const total = subtotal + shipping + tax;
  axios.defaults.withCredentials = true;

  useEffect(() => {
    axios
      .get(`${API_URL}/basketItems`)
      .then((result) => {
        console.log(result.data);
        setItems(result.data);
        calculateSubtotal(result.data);
      })
      .catch((err) => {
        console.log("Error:", err);
      });
  }, []);

  const calculateSubtotal = (items) => {
    if (!user || !Array.isArray(items)) return;
    const subtotal = items.reduce(
      (total, item) =>
        total + (item.product?.price ?? 0) * (item.quantity ?? 1),
      0
    );
    setSubtotal(subtotal);
  };

  const handleOnChange = (e, itemId) => {
    const newQuantity = parseInt(e.target.value);
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setItems(updatedItems);
    calculateSubtotal(updatedItems);
  };

  const handleCheckout = async () => {
    try {
      const res = await axios.post(`${API_URL}/create-checkout-session`);
      const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
      await stripe.redirectToCheckout({
        sessionId: res.data.checkoutSessionId,
      });
    } catch (err) {
      console.error("Stripe error", err);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-neutral-900 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow">
            {!user && <p>Please log in and add items to basket to see</p>}
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-4"
              >
                <div className="flex items-center">
                  <img
                    src={item.product?.imgSrc}
                    alt={item.product?.name}
                    className="w-20 h-20 rounded-lg object-cover border"
                  />
                  <div className="ml-4">
                    <h2 className="font-medium">{item.product?.description}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-left">
                      {item.color}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-left">
                      {item.size}
                    </p>
                    <p className="text-sm mt-1 text-green-500">In stock</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <p className="font-medium mr-4">${item.quantity}</p>
                  <select
                    className="border-gray-300 dark:border-gray-700 dark:bg-neutral-900 rounded p-1"
                    value={item.quantity ?? 1}
                    onChange={(e) => handleOnChange(e, item.id)}
                  >
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <p className="ml-4 font-medium">
                    $
                    {item.product?.price
                      ? (item.product.price * (item.quantity ?? 1)).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow h-fit">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>
            {user ? (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <p>Subtotal</p>
                  <p>${subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <p>Shipping estimate</p>
                  <p>${shipping.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <p>Tax estimate</p>
                  <p>${tax.toFixed(2)}</p>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <p>Order total</p>
                  <p>${total.toFixed(2)}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <p>Subtotal</p>
                  <p>$0</p>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <p>Shipping estimate</p>
                  <p>$0</p>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <p>Tax estimate</p>
                  <p>$0</p>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <p>Order total</p>
                  <p>$0</p>
                </div>
              </>
            )}
            <button
              onClick={handleCheckout}
              className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-500"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Basket;
