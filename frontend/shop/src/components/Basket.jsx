import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { UserLoginContext, BasketContext } from "../App";
import { API_URL, STRIPE_PUBLIC_KEY } from "../settings";
import { loadStripe } from "@stripe/stripe-js";

function Basket() {
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);

  const { user } = useContext(UserLoginContext);
  const { setIsBasket } = useContext(BasketContext);

  // ===== FETCH BASKET =====
  const fetchBasket = async () => {
    try {
      const result = await axios.get(`${API_URL}/basketItems`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setItems(result.data);
      calculateSubtotal(result.data);
    } catch (err) {
      console.log("Error fetching basket:", err);
    }
  };

  useEffect(() => {
    fetchBasket();
  }, []);

  // ===== SUBTOTAL =====
  const calculateSubtotal = (arr) => {
    const sub = arr.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
    setSubtotal(sub);
  };

  // ===== QUANTITY CONTROLS =====
  const increase = async (basketId) => {
    await axios.put(
      `${API_URL}/basket/increase`,
      { basketId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    setIsBasket(true);
    fetchBasket();
  };

  const decrease = async (basketId) => {
    await axios.put(
      `${API_URL}/basket/decrease`,
      { basketId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    setIsBasket(true);
    fetchBasket();
  };

  const removeItem = async (basketId) => {
    await axios.delete(`${API_URL}/basket/remove`, {
      data: { basketId },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setIsBasket(true);
    fetchBasket();
  };

  // ===== CHECKOUT =====
  // ===== CHECKOUT =====
  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Musisz być zalogowany");
        return;
      }

      const res = await axios.post(
        `${API_URL}/create-checkout-session`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const stripe = await loadStripe(STRIPE_PUBLIC_KEY);

      await stripe.redirectToCheckout({
        sessionId: res.data.checkoutSessionId,
      });
    } catch (err) {
      console.error("❌ Checkout error:", err);

      alert(
        err.response?.data?.error || "Błąd podczas przechodzenia do płatności"
      );
    }
  };

  const isEmpty = items.length === 0;

  return (
    <div className="bg-gray-50 dark:bg-neutral-900 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEWA — ITEMS */}
          <div className="lg:col-span-8 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow">
            {isEmpty ? (
              <div className="text-center py-8">
                <p className="mb-4 text-lg text-gray-700 dark:text-gray-200">
                  Twój koszyk jest pusty.
                </p>
                <a
                  href="/"
                  className="inline-block bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-500"
                >
                  Dodaj produkty →
                </a>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-4 border-b border-gray-300 dark:border-neutral-700"
                >
                  <img
                    src={item.product.imgSrc}
                    className="w-20 h-20 rounded"
                    alt=""
                  />

                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.color}, {item.size}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      ${item.product.price}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decrease(item.id)}
                      className="px-3 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-white rounded"
                    >
                      -
                    </button>

                    <span className="text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => increase(item.id)}
                      className="px-3 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-white rounded"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 font-bold"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          {/* PRAWA — ADDRESS + COSTS */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* PODSUMOWANIE */}
            {!isEmpty && (
              <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                  Submit
                </h2>

                <div className="flex justify-between text-sm mb-2 text-gray-800 dark:text-gray-200">
                  <p>Subtotal</p>
                  <p>${subtotal.toFixed(2)}</p>
                </div>

                <button
                  onClick={handleCheckout}
                  className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-500"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Basket;
