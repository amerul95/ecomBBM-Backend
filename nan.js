import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:3001/products');
        setAllProducts(response.data);
        setCartItems(getDefaultCart(response.data));
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getDefaultCart = (products) => {
    return products.map(product => ({
      id: product.id,
      quantity: 0,
      color: '',
      size: ''
    }));
  };

  const addToCart = (itemId, quantity = 1, color = '', size = '') => {
    setCartItems((prev) => {
      const existingItemIndex = prev.findIndex(item => item.id === itemId);
      if (existingItemIndex > -1) {
        const updatedItems = [...prev];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          color,
          size,
        };
        return updatedItems;
      } else {
        return [...prev, { id: itemId, quantity, color, size }];
      }
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => {
      const updatedItems = prev.map(item => {
        if (item.id === itemId && item.quantity > 0) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      });
      return updatedItems.filter(item => item.quantity > 0);
    });
  };

  const fullDelete = (itemId) => {
    setCartItems((prev) => prev.filter(item => item.id !== itemId));
  };

  const getTotalCartAmount = () => {
    return cartItems.reduce((totalAmount, item) => {
      if (item.quantity > 0) {
        const itemInfo = allProducts.find(product => product.id === item.id);
        if (itemInfo) {
          return totalAmount + itemInfo.new_price * item.quantity;
        }
      }
      return totalAmount;
    }, 0);
  };

  const getTotalCartItems = () => {
    return cartItems.reduce((totalItems, item) => totalItems + item.quantity, 0);
  };

  const contextValue = {
    allProducts,
    cartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    getTotalCartItems,
    fullDelete,
    loading,
    error,
    getDefaultCart
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;