import React, { useContext, useCallback } from "react";
import axios from "axios";
import { HeartIcon } from "@heroicons/react/24/outline";
import { BsBasket2 } from "react-icons/bs";
import { Link } from "react-router-dom";
import { API_URL } from "../settings";
import { useTheme } from "../ThemeContext";
import { ProductsContext } from "./ProductsContext";
import { UserLoginContext } from "../App";
import { BasketContext } from "../App";

/* ----------------------- SKELETON (przeniesiony wyżej) ----------------------- */
export const ProductSkeleton = () => (
  <div className="group animate-pulse">
    <div className="relative">
      <div className="w-full h-80 rounded-lg bg-gray-300 dark:bg-neutral-700" />
      <div className="absolute top-2 right-16 w-9 h-9 rounded-full bg-gray-400/60 dark:bg-neutral-600" />
      <div className="absolute top-2 right-2 w-9 h-9 rounded-full bg-gray-400/60 dark:bg-neutral-600" />
    </div>

    <div className="mt-4 h-3 w-24 bg-gray-300 dark:bg-neutral-700 rounded" />
    <div className="mt-2 h-4 w-3/4 bg-gray-300 dark:bg-neutral-700 rounded" />
    <div className="mt-2 h-5 w-16 bg-gray-300 dark:bg-neutral-700 rounded" />
  </div>
);

/* ----------------------- PRODUCT CARD (React.memo) ----------------------- */
export const ProductCard = React.memo(function ProductCard({
  product,
  onHeartClick,
  onBasketClick,
}) {
  return (
    <div className="group">
      <div className="relative group">
        <Link to={`/products/${product.id}`}>
          <div className="relative w-full rounded-lg overflow-hidden bg-gray-200">
            {/* kwadrat przez padding-top 100% */}
            <div className="pt-[100%]" />
            <img
              loading="lazy"
              alt={product.imgAlt}
              src={`${product.imgSrc}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </Link>

        {/* HEART BTN */}
        <button
          className="absolute top-2 right-16 bg-white dark:bg-neutral-800 rounded-full p-1 shadow-md hover:bg-gray-200 dark:hover:bg-neutral-700"
          onClick={() => onHeartClick(product.id)}
        >
          <HeartIcon className="h-6 w-6 text-gray-900 dark:text-white" />
        </button>

        {/* BASKET BTN */}
        <button
          className="absolute top-2 right-2 bg-white dark:bg-neutral-800 rounded-full p-1 shadow-md hover:bg-gray-200 dark:hover:bg-neutral-700"
          onClick={(e) => onBasketClick(e, product.id)}
        >
          <BsBasket2 className="h-6 w-6 text-gray-900 dark:text-white" />
        </button>
      </div>

      <Link to={`/products/${product.id}`}>
        <h3 className="mt-4 text-sm text-gray-700 dark:text-gray-300">
          {product.name}
        </h3>
        <p className="mt-1 text-lg text-gray-900 dark:text-white line-clamp-2">
          {product.description}
        </p>
        <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
          {product.price} $
        </p>
      </Link>
    </div>
  );
});

/* ----------------------- GŁÓWNY KOMPONENT - MOŻE BYĆ W JEDNYM PLIKU ----------------------- */
const Products = () => {
  const { user } = useContext(UserLoginContext);
  const { theme } = useTheme();
  const { products } = useContext(ProductsContext);
  const { setIsBasket } = useContext(BasketContext);

  /* ----------------------- MEMOIZED HANDLERS ----------------------- */
  const handleHeartClick = useCallback(
    async (id) => {
      if (!user) return alert("Please log in first.");

      try {
        await axios.post(
          `${API_URL}/products/${id}/favourite`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } catch (err) {
        console.error(err);
      }
    },
    [user]
  );

  const handleBasketClick = useCallback(
    async (id) => {
      if (!user) return alert("Please log in first.");
      try {
        await axios.post(
          `${API_URL}/products/${id}/basket`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setIsBasket(true);

        console.log("Add to basket:", id);
      } catch (err) {
        console.error(err);
      }
    },
    [user]
  );

  const skeletons = Array.from({ length: 8 });

  return (
    <div
      className={`bg-white dark:bg-neutral-900 ${theme === "dark" ? "dark" : ""}`}
    >
      <div className="mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8 flex w-full">
        {/* ----------------------- SIDEBAR ----------------------- */}
        <div className="w-1/8 flex-shrink-0">
          {/* ...tu zostawiasz swoje filtry bez zmian... */}
        </div>

        {/* ----------------------- GRID ----------------------- */}
        <div className="flex-1">
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8 p-8">
            {!products
              ? skeletons.map((_, i) => <ProductSkeleton key={i} />)
              : products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onHeartClick={handleHeartClick}
                    onBasketClick={() => handleBasketClick(p.id)}
                  />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
