import React, { useEffect, useContext, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import ThemeSwitcher from "./ThemeSwitcher.jsx";
import { useTheme } from ".././ThemeContext.jsx";
import { BasketContext } from "../App.jsx"; // Import BasketContext
import { motion } from "framer-motion";
import Login from "./Login.jsx";
import { BsBasket, BsHeart, BsCreditCard } from "react-icons/bs";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserLoginContext } from "../App.jsx";
import { API_URL } from "../settings";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useContext(UserLoginContext); // Ensure setUser is defined
  const { theme } = useTheme();
  const { isBasket, setIsBasket } = useContext(BasketContext); // Use BasketContext
  const [num, setNum] = useState(0);
  const [favourites, setFavourites] = useState([]);
  const navigate = useNavigate();

  const handleBasket = (e) => {
    e.preventDefault();
    navigate("/basket");
  };

  const handleHome = (e) => {
    e.preventDefault();

    navigate("/");
  };

  const handlePayment = (e) => {
    e.preventDefault();

    navigate("/payment");
  };

  const handleFavourites = (e) => {
    e.preventDefault();
    navigate("/favourites");
  };

  useEffect(() => {
    if (isBasket) {
      setNum((prevNum) => prevNum + 1);
      setIsBasket(false);
    }
  }, [isBasket]);
  axios.defaults.withCredentials = true;

  useEffect(() => {
    if (user) {
      axios
        .get(`${API_URL}/basketItems`)
        .then((result) => {
          console.log(result.data[0]);
          setNum(result.data.length);
        })
        .catch((err) => {
          console.log("Error:", err);
        });
    }
  }, [user]);

  return (
    <div className="sticky top-4 z-10 bg-gray-100/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl">
      <header className="header">
        <nav
          aria-label="Global"
          className="mx-auto flex items-center justify-between p-6 lg:px-8 "
        >
          <div className="flex lg:flex-1 ">
            <span className="sr-only">Your Company</span>
            <img
              alt=""
              src="https://tailwindui.com/plus/img/logos/mark.svg?color=violet&shade=500 dark:https://tailwindui.com/plus/img/logos/mark.svg?color=violet&shade=600"
              className="h-8 w-auto"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={(e) => handleHome(e)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 cursor-pointer"
            >
              <span className="font-abeezee font-semibold dark:text-white">
                WebShop
              </span>
            </button>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 cursor-pointer"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>

          <div className="hidden lg:flex lg:flex-1 lg:justify-end pr-8">
            <Login />
          </div>
          <div className="hidden lg:flex lg:justify-end pr-8">
            <ThemeSwitcher />
          </div>
          <div className="hidden lg:flex  lg:justify-end pr-8 ">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFavourites}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-200 dark:text-white dark:hover:bg-zinc-800 font-abeezee "
            >
              <div className="flex flex-row items-center">
                <span className="pr-4">Favourites </span>
                <BsHeart className="text-xl text-red-500" />
                {favourites.length > 0 && (
                  <p className="pl-2">({favourites.length})</p>
                )}
              </div>
              {favourites.length > 0 && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </motion.button>
          </div>
          <div className="hidden lg:flex  lg:justify-end pr-8 ">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={handlePayment}
              className="block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-200 dark:text-white dark:hover:bg-zinc-800 font-abeezee "
            >
              <div className="flex flex-row items-center">
                <span className="pr-4">Payment </span>
                <BsCreditCard className="text-xl " />
              </div>
            </motion.button>
          </div>
          <div className="hidden lg:flex lg:justify-end ">
            <motion.button
              onClick={(e) => handleBasket(e)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="-mx-3 relative block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-200 dark:text-white dark:hover:bg-zinc-800 font-abeezee "
            >
              <div className="flex flex-row items-center  ">
                <span className="pr-4  ">Basket </span>
                <BsBasket className="text-xl   " />
                {num != 0 && <p className="pl-2">({num})</p>}
              </div>
              {/* Ping Dot */}
              {num != 0 && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </motion.button>
          </div>
        </nav>
        <Dialog
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
          className="lg:hidden"
        >
          <div className="fixed inset-0 z-10" />
          <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white dark:bg-zinc-900  px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex  justify-end">
              <motion.button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="m-2 rounded-md p-2 text-gray-700 dark:text-white"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </motion.button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-8 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6 px-6">
                  <Login />

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleFavourites}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-200 dark:text-white dark:hover:bg-zinc-800 font-abeezee "
                  >
                    <div className="flex flex-row items-center">
                      <span className="pr-4">Favourites </span>
                      <BsHeart className="text-xl text-red-500" />
                      {favourites.length > 0 && (
                        <p className="pl-2">({favourites.length})</p>
                      )}
                    </div>
                    {favourites.length > 0 && (
                      <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    onClick={handlePayment}
                    className="block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-200 dark:text-white dark:hover:bg-zinc-800 font-abeezee "
                  >
                    <div className="flex flex-row items-center">
                      <span className="pr-4">Payment </span>
                      <BsCreditCard className="text-xl " />
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={(e) => handleBasket(e)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className=" relative block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-200 dark:text-white dark:hover:bg-zinc-800 font-abeezee "
                  >
                    <div className="flex flex-row items-center  ">
                      <span className="pr-4  ">Basket </span>
                      <BsBasket className="text-xl   " />
                      {num != 0 && <p className="pl-2">({num})</p>}
                    </div>
                    {/* Ping Dot */}
                    {num != 0 && (
                      <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </motion.button>
                  <hr></hr>
                  <div className="py-6 px-6">
                    <ThemeSwitcher />
                  </div>
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>
    </div>
  );
}

export default Navbar;
