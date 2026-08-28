import React, { useEffect, useState } from 'react';
import './ProductList.css';
import { useCart } from './CartContext';
import CartControls from './CartControls.jsx';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  // const [showPopup, setShowPopup] = useState(true);
  const { cartItems, addToCart } = useCart();

  useEffect(() => {
    // Fetch from our backend API
    const API_URL = process.env.REACT_APP_API_URL || 'https://api.advaytraders.in';
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        // Filter only active products and map to the format expected by the component
        const productList = data
          .filter(product => product.isActive)
          .map(product => ({
            id: product._id,
            'Product Name': product.name,
            Category: product.category?.name || 'Uncategorized',
            img: product.image ? `${process.env.REACT_APP_API_URL || 'https://api.advaytraders.in'}/${product.image}` : `${process.env.REACT_APP_API_URL || 'https://api.advaytraders.in'}/uploads/AD-preview.png`,
            'Original Price': product.originalPrice,
            'Discount Price': product.offerPrice,
            Unit: '1 Pkt' // Default unit, can be added to backend model if needed
          }));
        setProducts(productList);
      })
      .catch((err) => console.error('Failed to load products:', err));
  }, []);

  const groupedProducts = Array.isArray(products)
    ? products.reduce((acc, product) => {
      const category = product.Category?.trim() || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {})
    : {};

  const categoryOrder = [
    'SINGLE SOUND CRACKERS',
    'FLOWERPOTS',
    'GROUND CHAKKAR',
    'TWINKLING STAR',
    'BOMBS',
    'PAPER BOMBS',
    'SOUND WAR',
    'ROCKETS',
    'LOOSE CRACKERS',
    'PEACOCK VARIETIE',
    'VANITHA BRAND - SPECIAL',
    'MOTHERS BRAND FOUTAIN',
    'COLOUR FOUNTAIN (1 PC )',
    'COLOUR FOUTAIN (2 PCS)',
    'DOUBLE STEP FOUTAIN ( 2 IN 1 )',
    'GRANT SUPER FOUTAIN',
    'ANANDAs SPECIAL COLLECTION',
    'NOVELTIES CRACKERS',
    'KIDS VARIETIE',
    'SPARKLERS',
    'MINI FANCY',
    'AERIAL FANCY SHOT',
    'MULTIPLE AERIAL SHOTS (SOUND & COLOURFUL)',
    'COLOUR MATCHES',
    'COMBO PACK',
    'CLASSIC SOUND CRACKERS',
    'GIFT BOXES',
  ];

  // Get all categories from products and add any that aren't in the predefined list
  const allCategories = Object.keys(groupedProducts);
  const categoriesToDisplay = [
    ...categoryOrder.filter(cat => groupedProducts[cat]), // Predefined categories that have products
    ...allCategories.filter(cat => !categoryOrder.includes(cat)) // New categories not in the predefined list
  ];

  let serialNumber = 1;

  return (
    <div>
      {/* Popup with Close Button */}

      <div className="product-table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Image</th>
              <th>Product</th>
              <th>Pack</th>
              <th>Price</th>
              <th>Cart</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {categoriesToDisplay.map((category) => {
              const items = groupedProducts[category];
              if (!items) return null;

              return (
                <React.Fragment key={category}>
                  <tr>
                    <td colSpan="7" className="category-row">
                      {category}
                    </td>
                  </tr>
                  {items.map((p) => {
                    const cartItem = cartItems.find((i) => i._id === p.id);
                    const productName = p['Product Name'] || 'Unnamed Product';
                    const productImage =
                      p.img || `${process.env.REACT_APP_API_URL || 'https://api.advaytraders.in'}/uploads/AD-preview.png`;
                    const productPrice = parseFloat(
                      p['Discount Price'] || p['Original Price'] || 0
                    );

                    return (
                      <tr key={p.id}>
                        <td>{serialNumber++}</td>
                        <td>
                          <a
                            href={productImage}
                            data-fancybox="gallery"
                            data-caption={productName}
                          >
                            <img
                              src={productImage}
                              alt={productName}
                              className="product-img"
                            />
                          </a>
                        </td>
                        <td>{productName}</td>
                        <td>{p.Unit || '1 Pkt'}</td>
                        <td>
                          {p['Original Price'] && p['Discount Price'] && (
                            <span className="original-price">
                              ₹{parseFloat(p['Original Price']).toFixed(2)}
                            </span>
                          )}
                          <span className="discounted-price">
                            ₹
                            {parseFloat(
                              p['Discount Price'] ||
                              p['Original Price'] ||
                              0
                            ).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          {cartItem ? (
                            <CartControls item={cartItem} />
                          ) : (
                            <button
                              className="add-btn"
                              onClick={() =>
                                addToCart({
                                  ...p,
                                  _id: p.id,
                                  name: p['Product Name'],
                                  price: parseFloat(p['Original Price'] || 0),
                                  discountPrice: parseFloat(p['Discount Price'] || 0),
                                })
                              }
                            >
                              Add
                            </button>
                          )}
                        </td>
                        <td>{cartItem?.quantity || 0}</td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
