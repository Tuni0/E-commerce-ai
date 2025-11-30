import React, { useMemo, useEffect, useState, useContext } from "react";
import { useTheme } from ".././ThemeContext.jsx";
import axios from "axios";
import { HeartIcon } from "@heroicons/react/24/outline";
import { BsBasket2 } from "react-icons/bs";
import { API_URL } from "../settings";
import { Link } from "react-router-dom";
import { ProductsContext } from "./ProductsContext.jsx";

const colors = [
  { key: 1, color: "White" },
  { key: 2, color: "Black" },
  { key: 3, color: "Grey" },
  { key: 4, color: "Blue" },
  { key: 5, color: "Green" },
  { key: 6, color: "Red" },
  { key: 7, color: "Yellow" },
  { key: 8, color: "Purple" },
];

const categories = [
  { key: 1, category: "mouse" },
  { key: 2, category: "headphones" },
  { key: 3, category: "keyboards" },
  { key: 4, category: "laptops" },
  { key: 5, category: "accesories" },
  { key: 6, category: "pc components" },
  { key: 7, category: "monitors" },
  { key: 8, category: "lights" },
];

const Products = () => {
  const { theme } = useTheme();
  const { products } = useContext(ProductsContext);

  const ProductSkeleton = () => (
    <div className="group animate-pulse">
      {/* Obrazek */}
      <div className="relative">
        <div className="w-full h-80 rounded-lg bg-gray-300 dark:bg-neutral-700" />

        {/* Ikona serduszka */}
        <div className="absolute top-2 right-16 w-9 h-9 rounded-full bg-gray-400/60 dark:bg-neutral-600" />

        {/* Ikona koszyka */}
        <div className="absolute top-2 right-2 w-9 h-9 rounded-full bg-gray-400/60 dark:bg-neutral-600" />
      </div>

      {/* Nazwa */}
      <div className="mt-4 h-3 w-24 bg-gray-300 dark:bg-neutral-700 rounded" />

      {/* Opis */}
      <div className="mt-2 h-4 w-3/4 bg-gray-300 dark:bg-neutral-700 rounded" />

      {/* Cena */}
      <div className="mt-2 h-5 w-16 bg-gray-300 dark:bg-neutral-700 rounded" />
    </div>
  );

  const skeletons = Array.from({ length: 8 });

  const handleHeartClick = (id) => {
    if (!user) {
      alert("Please log in to add favourites.");
      return;
    }

    axios
      .post(
        `${API_URL}/products/${id}/favourite`,
        {},
        { withCredentials: true }
      )
      .then((res) => {
        console.log("Added to favourites:", res.data);
        // Tu możesz ustawić np. animację, ikonę wypełnioną itp.
      })
      .catch((err) => {
        console.error("Favourite add failed:", err);
        if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
        }
      });
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  return (
    <div
      className={`bg-white dark:bg-neutral-900 ${
        theme === "dark" ? "dark" : ""
      } `}
    >
      <div className="mx-auto px-4 py-16 sm:px-6 sm:py-24  lg:px-8 flex w-full ">
        <h2 className="sr-only">Products</h2>
        <div className="w-1/8 flex-shrink-0">
          <div className="">
            <div className="mt-10 space-y-10">
              <fieldset className=" pr-8">
                <legend className="text-sm font-semibold text-gray-900 dark:text-white text-start">
                  Color
                </legend>
                <div className="mt-6 space-y-2">
                  {colors.map((color) => (
                    <div
                      key={`color-${color.key}`}
                      className="relative flex gap-x-3"
                    >
                      <div className="relative flex gap-x-3 items-center">
                        <input
                          id={`color-${color.key}`}
                          name="color"
                          type="checkbox"
                          className="size-4 rounded border-gray-300 text-violet-600 focus:ring-violet-600"
                          onChange={() => handleColorChange(color.color)}
                        />
                      </div>

                      <div className="text-sm/6 ">
                        <label
                          htmlFor={`color-${color.key}`}
                          className=" text-gray-500 dark:text-gray-200"
                        >
                          {color.color}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
              <hr></hr>
            </div>
          </div>

          <div className="">
            <div className="mt-10 space-y-10">
              <fieldset className=" pr-8">
                <legend className="text-sm font-semibold text-gray-900 text-start dark:text-white">
                  Categories
                </legend>
                <div className="mt-6 space-y-2">
                  {categories.map((category) => (
                    <div
                      key={`category-${category.key}`}
                      className="relative flex gap-x-3 items-center"
                    >
                      <div className="relative flex gap-x-3 ">
                        <input
                          id={`category-${category.key}`}
                          name="category"
                          type="checkbox"
                          className="size-4 rounded border-gray-300 text-violet-600 focus:ring-violet-600"
                          onChange={() =>
                            handleCategoryChange(category.category)
                          }
                        />
                      </div>

                      <div className="text-sm/6 ">
                        <label
                          htmlFor={`category-${category.key}`}
                          className=" text-gray-500 dark:text-gray-200"
                        >
                          {category.category}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
              <hr className="border-t border-gray-300 dark:border-gray-600" />
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8 p-8">
            {!products
              ? skeletons.map((_, i) => <ProductSkeleton key={i} />)
              : products.map((product, index) => (
                  <div
                    key={product.idproducts ?? `fallback-${index}`}
                    className="group"
                  >
                    <div className="relative group">
                      <Link to={`/products/${product.id}`}>
                        <img
                          loading="lazy"
                          alt={product.imgAlt}
                          src={product.imgSrc}
                          className="z-0 relative aspect-square w-full rounded-lg bg-gray-200 object-cover group-hover:opacity-75 xl:aspect-[7/8]"
                        />
                      </Link>

                      <button
                        className="absolute z-2 top-2 right-16 flex items-center justify-center bg-white dark:bg-neutral-800 rounded-full p-1 shadow-md hover:bg-gray-200 dark:hover:bg-neutral-700 "
                        onClick={() => handleHeartClick(product.id)}
                        onMouseEnter={(e) =>
                          e.currentTarget.parentElement.classList.remove(
                            "group-hover:opacity-75"
                          )
                        }
                        onMouseLeave={(e) =>
                          e.currentTarget.parentElement.classList.add(
                            "group-hover:opacity-75"
                          )
                        }
                      >
                        <HeartIcon
                          className="h-6 w-6 text-gray-900 dark:text-white"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        className="absolute z-2 top-2 right-2 flex items-center justify-center bg-white dark:bg-neutral-800 rounded-full p-1 shadow-md hover:bg-gray-200 dark:hover:bg-neutral-700"
                        onClick={(e) => handleBasketClick(e, product.id)}
                        onMouseEnter={(e) =>
                          e.currentTarget.parentElement.classList.remove(
                            "group-hover:opacity-75"
                          )
                        }
                        onMouseLeave={(e) =>
                          e.currentTarget.parentElement.classList.add(
                            "group-hover:opacity-75"
                          )
                        }
                      >
                        <BsBasket2
                          className="h-6 w-6 text-gray-900 dark:text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                    <a href={`products/${product.idproducts}`}>
                      <h3 className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-lg text-gray-900 dark:text-white text-left">
                        {product.description}
                      </p>
                      <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white text-left">
                        {product.price} $
                      </p>
                    </a>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
