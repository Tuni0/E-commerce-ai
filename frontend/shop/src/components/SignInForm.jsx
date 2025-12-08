import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { API_URL } from "../settings";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  axios.defaults.withCredentials = true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    axios
      .post(
        `${API_URL}/login`,
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // jeśli backend używa sesji/cookies
        }
      )

      .then((result) => {
        console.log(result.data);
        if (result.data === "Incorrect password") {
          alert("Incorrect password or email");
        } else if (result.data.Login === true) {
          localStorage.setItem("user", JSON.stringify(result.data.username));
          window.location.pathname = "/";
        } else {
          alert("Login failed! Please contact support.");
        }
      })
      .catch((err) => {
        console.log("Error:", err);
      });
  };

  return (
    <div className="sign-in-form">
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            alt="Your Company"
            src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600"
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm ">
          <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="text-sm/6 font-medium text-gray-900 dark:text-white flex justify-start"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:bg-neutral-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                >
                  Password
                </label>
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-semibold text-indigo-600 hover:text-indigo-500 "
                  >
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:bg-neutral-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Sign in
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm/6 text-gray-500">
            Not a member?{" "}
            <Link
              to="/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignInForm;
