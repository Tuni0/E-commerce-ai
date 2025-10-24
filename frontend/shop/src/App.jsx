import React, { useState, useEffect, createContext } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import SignInForm from "./components/SignInForm.jsx";
import SignUpForm from "./components/SignUpForm.jsx";
import Skills from "./components/Products.jsx";
import "./App.css";
import axios from "axios";
import RouteGuard from "./components/RouteGuard.jsx";
import Products from "./components/Products.jsx";
import Contact from "./components/Contact.jsx";
import ItemPage from "./components/ItemPage.jsx";
import Basket from "./components/Basket.jsx";
import Payment from "./components/Payment.jsx";
import { API_URL } from "./settings";
import PaymentCancel from "./components/PaymentCancel.jsx";
import Favourites from "./components/Favourites.jsx";
import { ThemeProvider } from "./ThemeContext"; // corrected import path

export const UserLoginContext = createContext({
  user: null,
  setUser: () => {},
});
export const BasketContext = createContext();

axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [isBasket, setIsBasket] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/verify`, {
          withCredentials: true,
        });

        if (res.data.validUser) {
          setUser(res.data.username);
          console.log("✅ Sesja aktywna dla:", res.data.username);
        } else {
          setUser(null);
          console.log("❌ Brak aktywnej sesji");
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    };

    checkSession();
  }, []);

  return (
    <ThemeProvider>
      <UserLoginContext.Provider value={{ user, setUser }}>
        <BasketContext.Provider value={{ isBasket, setIsBasket }}>
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
                path="/products/*"
                exact
                element={
                  <>
                    <Navbar />
                    <ItemPage />
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
                path="/payment"
                exact
                element={
                  <>
                    <Navbar />
                    <Payment />
                  </>
                }
              />

              <Route
                path="/"
                exact
                element={
                  <>
                    <Navbar />
                    <RouteGuard user={user}>
                      <Skills />
                    </RouteGuard>

                    <Products />

                    <Contact />
                  </>
                }
              />
              <Route path="/payment-cancel" element={<PaymentCancel />} />
              <Route
                path="/favourites"
                element={
                  <>
                    <Navbar />
                    <Favourites />
                  </>
                }
              />
            </Routes>
            {/*  <SwaggerDocs /> */}
          </div>
        </BasketContext.Provider>
      </UserLoginContext.Provider>
    </ThemeProvider>
  );
}

export default App;
