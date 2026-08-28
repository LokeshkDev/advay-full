import React, { useState, useMemo } from "react";
import { useCart } from "./CartContext";
import "./CartPopup.css";

const CartPopup = () => {
  const { cartItems, clearCart } = useCart();

  const [showModal, setShowModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    pincode: "",
    agentId: "",
  });

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const totalPrice = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum + (item.discountPrice || item.price || 0) * item.quantity,
        0
      ),
    [cartItems]
  );

  if (cartItems.length === 0 && !sendSuccess) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    ["name", "phone", "email", "address", "pincode"].forEach((f) => {
      if (!formData[f].trim()) newErrors[f] = "Required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async () => {
    if (totalPrice < 1999) {
      setErrors({ form: "Minimum order ₹1999 required" });
      return;
    }

    if (!validateForm()) return;

    setIsSending(true);
    setErrors({});

    const API_URL = process.env.REACT_APP_API_URL || "https://api.advaytraders.in";

    try {
      const payload = {
        customer: formData,
        cart: cartItems,
        totalItems,
        totalPrice,
      };

      const res = await fetch(`${API_URL}/api/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      setSendSuccess(true);
      clearCart();
      localStorage.removeItem("cart");
    } catch (err) {
      console.error("Failed to save enquiry:", err);
      setErrors({ form: err.message || "Failed to send enquiry. Please try again." });
    } finally {
      setIsSending(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSendSuccess(false);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      pincode: "",
      agentId: "",
    });
  };

  const MIN_ORDER = 1999;
  const isMinMet = totalPrice >= MIN_ORDER;

  return (
    <>
      {/* Sticky Cart Bar */}
      <div className={`cart-bar ${!isMinMet ? "min-warning" : ""}`}>
        <div className="cart-info">
          🛒 <strong>{totalItems}</strong> items |{" "}
          <strong>₹{totalPrice}</strong>

          {!isMinMet && (
            <span className="min-text">
              Minimum order ₹{MIN_ORDER}
            </span>
          )}
        </div>

        <button
          disabled={!isMinMet}
          onClick={() => setShowModal(true)}
        >
          Send Enquiry
        </button>
      </div>


      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card wide">
            <div className="modal-header">
              <h3>{sendSuccess ? "Success" : "Checkout"}</h3>
              <button onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body two-column">
              {sendSuccess ? (
                <div className="success-ui full">
                  <div className="check">✔</div>
                  <h2>Enquiry Sent</h2>
                  <p>We will contact you shortly.</p>
                </div>
              ) : (
                <>
                  {/* LEFT – CART ITEMS */}
                  <div className="cart-column">
                    <h4>Cart Summary</h4>

                    <div className="cart-items">
                      {cartItems.map((item, i) => (
                        <div key={i} className="cart-row">
                          <div className="item-info">
                            <strong>{item.name}</strong>
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <div className="item-price">
                            ₹
                            {(item.discountPrice || item.price) *
                              item.quantity}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="cart-total">
                      <span>Total</span>
                      <strong>₹{totalPrice}</strong>
                    </div>
                  </div>

                  {/* RIGHT – FORM */}
                  <div className="form-column">
                    {errors.form && (
                      <p className="error-msg">{errors.form}</p>
                    )}

                    <input
                      name="name"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                    <input
                      name="phone"
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    <input
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <input
                      name="pincode"
                      placeholder="Pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                    />
<textarea
                       name="address"
                       placeholder="Delivery Address"
                       value={formData.address}
                       onChange={handleChange}
                     />
                     <input
                       name="agentId"
                       placeholder="Agent ID (Optional)"
                       value={formData.agentId}
                       onChange={handleChange}
                     />
                   </div>
                </>
              )}
            </div>

            {!sendSuccess && (
              <div className="modal-footer">
                <button
                  className="primary"
                  onClick={handleSend}
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "Submit Enquiry"}
                </button>
                <button className="secondary" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CartPopup;
