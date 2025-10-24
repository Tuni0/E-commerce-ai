import React, { useMemo, useEffect, useState, useContext } from "react";
import { useTheme } from ".././ThemeContext.jsx";
import { UserLoginContext, BasketContext } from "../App.jsx";
import axios from "axios";
import { HeartIcon } from "@heroicons/react/24/outline";
import { BsBasket2 } from "react-icons/bs";
import { API_URL } from "../settings";
import { Link } from "react-router-dom";

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

const sizes = [
  { key: 1, size: "xxs" },
  { key: 2, size: "xs" },
  { key: 3, size: "s" },
  { key: 4, size: "m" },
  { key: 5, size: "l" },
  { key: 6, size: "xl" },
  { key: 7, size: "xxl" },
  { key: 8, size: "xxxl" },
];

const Products = () => {
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const { user } = useContext(UserLoginContext);
  const { setIsBasket } = useContext(BasketContext); // Use BasketContext

  const [selectedColor, setSelectedColor] = useState("white");
  const [selectedSize, setSelectedSize] = useState("m");

  axios.defaults.withCredentials = true;

  useEffect(() => {
    let isMounted = true; // flag to track if the component is mounted

    const fetchProducts = async () => {
      try {
        const result = await axios.get(`${API_URL}/products`);
        console.log("Fetched products:", result.data); // 👈 dodaj to

        if (isMounted) {
          setProducts(result.data);
        }
      } catch (err) {
        console.log("Error:", err);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false; // cleanup function to set the flag to false
    };
  }, []); // Fetch products once on mount

  const memoizedProducts = useMemo(() => products, [products]);

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

  const handleBasketClick = (e, id) => {
    e.preventDefault();

    if (!user) {
      alert("Please log in to add items to the basket!");
      return;
    }

    axios
      .post(
        `${API_URL}/products/${id}/basket`,
        {
          color: selectedColor,
          size: selectedSize,
        },
        {
          withCredentials: true, // ⬅️ WAŻNE dla sesji Springa
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        console.log("Added to basket:", res.data);
        setIsBasket(true);
      })
      .catch((err) => {
        console.error("Basket add failed:", err);
        if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
        }
      });
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
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
                  Size
                </legend>
                <div className="mt-6 space-y-2">
                  {sizes.map((size) => (
                    <div
                      key={`size-${size.key}`}
                      className="relative flex gap-x-3 items-center"
                    >
                      <div className="relative flex gap-x-3 ">
                        <input
                          id={`size-${size.key}`}
                          name="size"
                          type="checkbox"
                          className="size-4 rounded border-gray-300 text-violet-600 focus:ring-violet-600"
                          onChange={() => handleSizeChange(size.size)}
                        />
                      </div>

                      <div className="text-sm/6 ">
                        <label
                          htmlFor={`size-${size.key}`}
                          className=" text-gray-500 dark:text-gray-200"
                        >
                          {size.size}
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
            {memoizedProducts.map((product, index) => (
              <div
                key={product.idproducts ?? `fallback-${index}`}
                className="group"
              >
                <div className="relative group">
                  <Link to={`/products/${product.id}`}>
                    <img
                      alt={product.imgAlt}
                      src={
                        product.imgSrc?.includes("github.com")
                          ? product.imgSrc
                              .replace(
                                "https://github.com/",
                                "https://raw.githubusercontent.com/"
                              )
                              .replace("/blob/", "/")
                              .split("?")[0] // usuwa ?raw=true
                          : product.imgSrc
                      }
                      className="z-0 relative aspect-square w-full rounded-lg bg-gray-200 object-cover group-hover:opacity-75 xl:aspect-[7/8]"
                    />
                  </Link>

                  <button
                    className="absolute z-1 top-2 right-16 flex items-center justify-center bg-white dark:bg-neutral-800 rounded-full p-1 shadow-md hover:bg-gray-200 dark:hover:bg-neutral-700 "
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
                    className="absolute z-1 top-2 right-2 flex items-center justify-center bg-white dark:bg-neutral-800 rounded-full p-1 shadow-md hover:bg-gray-200 dark:hover:bg-neutral-700"
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
