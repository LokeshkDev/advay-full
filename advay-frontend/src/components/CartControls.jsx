import React from 'react';
import { useCart } from './CartContext';
import './CartControl.css';


const CartControls = ({ item }) => {
  const { addToCart, removeFromCart } = useCart();

  return (
    <div className="cart-controls">
      <button onClick={() => removeFromCart(item._id)} className="dec">-</button>
      <span>{item.quantity}</span>
      <button onClick={() => addToCart(item)}>+</button>
    </div>
  );
};

export default CartControls;
