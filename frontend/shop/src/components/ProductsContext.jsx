import { createContext, useState, useEffect } from "react";
import axios from "axios";

import { API_URL } from "../settings";

export const ProductsContext = createContext();

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState(null); // null = nie pobrano jeszcze

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await axios.get(`${API_URL}/products`);
        setProducts(result.data); // zapis do context
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, setProducts }}>
      {children}
    </ProductsContext.Provider>
  );
};
