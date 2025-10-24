// src/components/Favourites.jsx
import React, { useState, useEffect, useContext } from "react";
import { UserLoginContext } from "../App.jsx";
import axios from "axios";
import { HeartIcon } from "@heroicons/react/24/solid"; // pełne serce
import { API_URL } from "../settings.js";

const Favourites = () => {
  const [items, setItems] = useState([]);
  const { user } = useContext(UserLoginContext);

  useEffect(() => {
    if (user) {
      axios
        .get(`${API_URL}/favourites`, { withCredentials: true })
        .then((res) => setItems(res.data))
        .catch((err) => console.error("Failed to load favourites:", err));
    }
  }, [user]);

  return (
    <div className="bg-white dark:bg-neutral-900 min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Favourites
      </h1>
      {items.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-300">No favourites yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4"
            >
              <img
                src={item.product.imgSrc}
                alt={item.product.name}
                className="w-full h-40 object-cover rounded"
              />
              <h2 className="mt-2 font-semibold text-gray-900 dark:text-white">
                {item.product.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {item.product.description}
              </p>
              <HeartIcon className="w-6 h-6 text-red-500 mt-2" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favourites;
