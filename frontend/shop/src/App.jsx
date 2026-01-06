import { useState, useEffect, createContext } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";

import Navbar from "./components/Navbar.jsx";
import ItemPage from "./components/ItemPage.jsx";
import "./App.css";
import Products from "./components/Products.jsx";
import Contact from "./components/Contact.jsx";
import { ThemeProvider } from "./ThemeContext"; // corrected import path
import { ProductsProvider } from "./components/ProductsContext.jsx";
import SignInForm from "./components/SignInForm.jsx";
import SignUpForm from "./components/SignUpForm.jsx";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
import Basket from "./components/Basket.jsx";

export const UserLoginContext = createContext({
  user: null,
  setUser: () => {},
});
export const BasketContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [isBasket, setIsBasket] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(res.data.user); // { userId, name }
      } catch (err) {
        console.log("❌ Token invalid or expired");
        localStorage.removeItem("token");
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  return (
    <ThemeProvider>
      <UserLoginContext.Provider value={{ user, setUser }}>
        <BasketContext.Provider value={{ isBasket, setIsBasket }}>
          <ProductsProvider>
            <div className="w-full mx-0 px-0">
              <Routes>
                <Route
                  path="/signin"
                  exact
                  element={
                    <>
                      <Navbar />
                      <SignInForm />
                    </>
                  }
                />
                <Route
                  path="/signup"
                  exact
                  element={
                    <>
                      <Navbar />
                      <SignUpForm />
                    </>
                  }
                />
                <Route
                  path="/basket"
                  exact
                  element={
                    <>
                      <Navbar />
                      <Basket />
                    </>
                  }
                />
                <Route
                  path="/"
                  exact
                  element={
                    <>
                      <Navbar />

                      <Products />
                      <Contact />
                    </>
                  }
                />
                <Route
                  path="/products/*"
                  exact
                  element={
                    <>
                      <Navbar />
                      <ItemPage />
                    </>
                  }
                />
              </Routes>
            </div>
          </ProductsProvider>
        </BasketContext.Provider>
      </UserLoginContext.Provider>
    </ThemeProvider>
  );
}

export default App;
