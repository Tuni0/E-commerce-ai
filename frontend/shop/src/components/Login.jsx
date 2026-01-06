import { useContext } from "react";
import { BsPersonFill } from "react-icons/bs";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

import { UserLoginContext } from "../App.jsx";

function Login() {
  const { user } = useContext(UserLoginContext); // Ensure setUser is defined

  const handleLogIn = (e) => {
    e.preventDefault();
    window.location.pathname = "/signin";
  };

  const handleRegister = (e) => {
    e.preventDefault();
    window.location.pathname = "/signup";
  };

  const handleLogOut = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location.pathname = "/";
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton className="rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-200 dark:text-white dark:hover:bg-zinc-800 font-abeezee flex flex-row">
          {user ? "Logged In" : "Account"}
          <BsPersonFill aria-hidden="true" className="size-6 ml-4" />
          <ChevronDownIcon
            aria-hidden="true"
            className="-mr-1 size-5 text-gray-400"
          />
        </MenuButton>
      </div>
      <MenuItems
        transition
        className="lg:absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-neutral-800 shadow-lg  ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="py-1">
          {!user && (
            <>
              <MenuItem>
                <a
                  onClick={(e) => handleLogIn(e)}
                  className="cursor-pointer block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none dark:text-white dark:hover:bg-zinc-800"
                >
                  Log in
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  onClick={(e) => handleRegister(e)}
                  className="cursor-pointer block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none dark:text-white dark:hover:bg-zinc-800"
                >
                  Register
                </a>
              </MenuItem>
            </>
          )}
          {user && (
            <MenuItem>
              <a
                onClick={(e) => handleLogOut(e)}
                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
              >
                Log out
              </a>
            </MenuItem>
          )}
        </div>
      </MenuItems>
    </Menu>
  );
}

export default Login;
