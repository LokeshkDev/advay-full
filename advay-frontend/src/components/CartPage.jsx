import React, { useState } from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

const CartPage = () => {
  const { cartItems, addToCart, removeFromCart, setCartItems } = useCart();
  const navigate = useNavigate();
  const [showPaymentPopup, setShowPaymentPopup] = useState(false); 

  const items = cartItems || [];
  const totalPrice = items.reduce(
    (sum, item) => sum + (parseFloat(item.discountPrice) || 0) * item.quantity,
    0
  );

  const handleEmptyCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart'); 
  };

  // ➕ Redirect to home
  const handleAddMore = () => {
    navigate('/');
  };

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>

      {items.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Adjust</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item._id || index}>
                  <td>
                    <img src={item.imageUrl} alt={item.name} className="cart-img" />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>
                    ₹{((parseFloat(item.discountPrice) || 0) * item.quantity).toFixed(2)}
                  </td>
                  <td>
                    <button onClick={() => removeFromCart(item._id)}>-</button>
                    <button onClick={() => addToCart(item)}>+</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-summary">
            <div className="cart-summary-row">
              <p className="total-price">
                <strong>Total Price:</strong> ₹{totalPrice.toFixed(2)}
              </p>
              <div className="button-column">
                <button className="empty-cart-btn proceed-btn" onClick={handleEmptyCart}>
              🗑 Empty Cart
            </button>
            <button className="add-more-btn proceed-btn" onClick={handleAddMore}>
              ➕ Add More
            </button>
            <button
                  className="proceed-btn"
                  disabled={totalPrice < 1999}
                  onClick={() => setShowPaymentPopup(true)}
                >
                  Proceed to Payment
                </button>
              </div>
            </div>

            {totalPrice < 1999 && (
              <p className="warning-text">
                Minimum order value is ₹1999 to proceed.
              </p>
            )}
          </div>
        </>
      )}
      {showPaymentPopup && (
        <div className="payment-popup">
          <div className="popup-content">
            <h3>Confirm Payment</h3>
            <p>Your total is ₹{totalPrice.toFixed(2)}</p>
            <button onClick={() => alert('🟢 Payment process started')}>Pay Now</button>
            <button onClick={() => setShowPaymentPopup(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
