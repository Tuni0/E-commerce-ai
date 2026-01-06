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

  // 🔥 Pełne dane adresowe
  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    country: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
  });

  const tax = 8.32;

  // Naliczanie shippingu tylko, gdy adres jest wypełniony
  const isAddressValid =
    address.firstName &&
    address.lastName &&
    address.country &&
    address.addressLine1 &&
    address.city &&
    address.postalCode;

  const shipping = isAddressValid ? (subtotal > 100 ? 0 : 5) : null;

  const total = isAddressValid ? subtotal + tax + (shipping ?? 0) : null;

  // ====== AUTOUZUPEŁNIANIE ADDRESS LINE 1 ======
  useEffect(() => {
    const input = document.getElementById("address-line1");

    if (!input || !window.google || !window.google.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ["address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place || !place.address_components) return;

      let street = "";
      let city = "";
      let postal = "";
      let countryCode = "";

      place.address_components.forEach((comp) => {
        if (comp.types.includes("route")) street = comp.long_name;
        if (comp.types.includes("street_number"))
          street = comp.long_name + " " + street;
        if (comp.types.includes("locality")) city = comp.long_name;
        if (comp.types.includes("postal_code")) postal = comp.long_name;
        if (comp.types.includes("country")) countryCode = comp.long_name;
      });

      setAddress((prev) => ({
        ...prev,
        addressLine1: street,
        city,
        postalCode: postal,
        country: countryCode || prev.country,
      }));
    });
  }, []);

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
  const handleCheckout = async () => {
    if (!isAddressValid) {
      alert("Uzupełnij pełne dane adresowe.");
      return;
    }

    const res = await axios.post(
      `${API_URL}/create-checkout-session`,
      { address },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
    stripe.redirectToCheckout({ sessionId: res.data.checkoutSessionId });
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
            {/* FORMULARZ */}
            {!isEmpty && (
              <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                  Shipping Address
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  {/* Każdy input ma poprawione kolory */}
                  <input
                    type="text"
                    placeholder="Name"
                    className="p-2 rounded-lg border bg-white border-gray-300 text-gray-900 
                          placeholder-gray-500 
                          dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:placeholder-gray-300"
                    value={address.firstName}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, firstName: e.target.value }))
                    }
                  />

                  <input
                    type="text"
                    placeholder="Surname"
                    className="p-2 rounded-lg border bg-white border-gray-300 text-gray-900 
                          placeholder-gray-500 
                          dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:placeholder-gray-300"
                    value={address.lastName}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, lastName: e.target.value }))
                    }
                  />

                  <input
                    type="text"
                    placeholder="Country"
                    className="p-2 rounded-lg border bg-white border-gray-300 text-gray-900 
                          placeholder-gray-500 
                          dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:placeholder-gray-300"
                    value={address.country}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, country: e.target.value }))
                    }
                  />

                  <input
                    id="address-line1"
                    type="text"
                    placeholder="Address – line 1"
                    className="p-2 rounded-lg border bg-white border-gray-300 text-gray-900 
                          placeholder-gray-500 
                          dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:placeholder-gray-300"
                    value={address.addressLine1}
                    onChange={(e) =>
                      setAddress((p) => ({
                        ...p,
                        addressLine1: e.target.value,
                      }))
                    }
                  />

                  <input
                    type="text"
                    placeholder="Address – line 2 (optional)"
                    className="p-2 rounded-lg border bg-white border-gray-300 text-gray-900 
                          placeholder-gray-500 
                          dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:placeholder-gray-300"
                    value={address.addressLine2}
                    onChange={(e) =>
                      setAddress((p) => ({
                        ...p,
                        addressLine2: e.target.value,
                      }))
                    }
                  />

                  <input
                    type="text"
                    placeholder="City"
                    className="p-2 rounded-lg border bg-white border-gray-300 text-gray-900 
                          placeholder-gray-500 
                          dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:placeholder-gray-300"
                    value={address.city}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, city: e.target.value }))
                    }
                  />

                  <input
                    type="text"
                    placeholder="Postal Code"
                    className="p-2 rounded-lg border bg-white border-gray-300 text-gray-900 
                          placeholder-gray-500 
                          dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:placeholder-gray-300"
                    value={address.postalCode}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, postalCode: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {/* PODSUMOWANIE */}
            {!isEmpty && (
              <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                  Sumbit
                </h2>

                <div className="flex justify-between text-sm mb-2 text-gray-800 dark:text-gray-200">
                  <p>Subtotal</p>
                  <p>${subtotal.toFixed(2)}</p>
                </div>

                {!isAddressValid ? (
                  <p className="text-red-500 text-sm">
                    Fill in the complete address to see shipping and total cost.
                  </p>
                ) : (
                  <>
                    <div className="flex justify-between text-sm mb-2 text-gray-800 dark:text-gray-200">
                      <p>Shipping</p>
                      <p>
                        {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                      </p>
                    </div>

                    <div className="flex justify-between text-sm mb-2 text-gray-800 dark:text-gray-200">
                      <p>Tax</p>
                      <p>${tax.toFixed(2)}</p>
                    </div>

                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                      <p>Total</p>
                      <p>${total.toFixed(2)}</p>
                    </div>

                    <button
                      onClick={handleCheckout}
                      className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-500"
                    >
                      Checkout
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Basket;
