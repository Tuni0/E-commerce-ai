import React, { useEffect, useContext, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import ThemeSwitcher from "./ThemeSwitcher.jsx";
import { motion } from "framer-motion";
import { BsBasket, BsHeart, BsCreditCard } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { UserLoginContext } from "../App.jsx";
import Login from "./Login.jsx";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useContext(UserLoginContext); // Ensure setUser is defined

  const navigate = useNavigate();

  const handleHome = (e) => {
    e.preventDefault();

    navigate("/");
  };

  return (
    <div className="sticky top-4 z-10 w-full bg-gray-100/70 dark:bg-neutral-800/70 backdrop-blur-md rounded-3xl mx-auto w-fit shadow-lg border border-white/20">
      <header>
        <nav
          aria-label="Global"
          className="mx-auto flex items-center justify-between p-4 lg:px-8"
        >
          {/* Logo / Home */}
          <div>
            <button
              type="button"
              onClick={handleHome}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-white cursor-pointer"
            >
              <span className="font-abeezee font-semibold">WebShop</span>
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
          {/* Hamburger icon (mobile) */}
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-white"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>

          {/* Desktop ThemeSwitcher */}
          <div className="hidden lg:flex lg:justify-end pr-4">
            <ThemeSwitcher />
          </div>
        </nav>

        {/* Mobile menu */}
        <Dialog
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
          className="lg:hidden"
        >
          <div className="fixed inset-0 z-10 bg-black/30 backdrop-blur-sm" />
          <DialogPanel className="fixed inset-y-0 right-0 z-20 w-full sm:max-w-sm overflow-y-auto bg-white dark:bg-zinc-900 px-6 py-6 shadow-xl rounded-l-2xl">
            <div className="flex justify-end">
              <motion.button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="m-2 rounded-md p-2 text-gray-700 dark:text-white"
              >
                <XMarkIcon aria-hidden="true" className="size-6" />
              </motion.button>
            </div>

            <hr className="my-4 border-gray-300 dark:border-gray-700" />

            <div className="py-6 px-6">
              <ThemeSwitcher />
            </div>
          </DialogPanel>
        </Dialog>
      </header>
    </div>
  );
}

export default Navbar;
