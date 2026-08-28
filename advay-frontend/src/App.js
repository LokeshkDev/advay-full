import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProductList from './components/ProductList';
import CartPage from './components/CartPage';
import Header from './components/Header';
import Footer from './components/Footer';
import CartPopup from './components/CartPopup';

// jQuery and plugin imports
import $ from 'jquery';
import 'jquery';
import 'popper.js';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/theme.css';
import './assets/js/theme.js';

// CSS imports
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import 'animate.css/animate.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fancyapps/fancybox/dist/jquery.fancybox.min.css';

// JS plugins
import 'slick-carousel';
import '@fancyapps/fancybox';
import Shuffle from 'shufflejs';

window.$ = $;
window.jQuery = $;

const App = () => {
  return (
    <Router basename={"/Product-List"}>
      <Header />
      <CartPopup />
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
