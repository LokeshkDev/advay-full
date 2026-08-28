import './Footer.css';
import logo from '../assets/images/Advay-Traders-Logo.png';

const Footer = () => {
  return (
    <>
      <footer id="footer" className="footer bg-overlay">
        <div className="footer-main">
          <div className="container">
            <div className="row justify-content-between">
              <div className="col-lg-3 col-md-6 footer-widget footer-about">
                <h3 className="widget-title">About Us</h3>
                <div className="align-items-center d-flex">
                  <img loading="lazy" className="footer-logo" src={logo} alt="Advay Traders Fotoer Logo" />
                </div>

                <p>we're passionate about delivering more than just crackers.</p>
                <div className="footer-social">
                  <ul>
                    <li><a href="tel:9688117904" aria-label="Phone"></a>+91 96881 17904</li>
                    <li><a href="mailto:advaytraders@gmail.com" aria-label="Email">advaytraders@gmail.com</a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-lg-3 col-md-6 mt-5 mt-lg-0 footer-widget">
                <h3 className="widget-title">We Deliver</h3>
                <ul className="list-arrow">
                  <li><a href="/Product-List">Tamil Nadu</a></li>
                  <li><a href="/Product-List">Andhra Pradesh</a></li>
                  <li><a href="/Product-List">Kerala</a></li>
                  <li><a href="/Product-List">Karnataka</a></li>
                  <li><a href="/Product-List">Telangana</a></li>
                  <li><a href="/Product-List">All Over India</a></li>
                </ul>
              </div>

              <div className="col-lg-3 col-md-6 mt-5 mt-lg-0 footer-widget">
                <h3 className="widget-title">Quick Link</h3>
                <ul className="list-arrow">
                  <li><a href="https://advaytraders.in/">Home</a></li>
                  <li><a href="https://advaytraders.in/about">About</a></li>
                  <li><a href="https://advaytraders.in/diwali-fund">Diwali Fund</a></li>
                  <li><a href="https://advaytraders.in/Product-List">Prodcut List</a></li>
                  <li><a href="https://advaytraders.in/contact">Contact</a></li>
                </ul>
              </div>

              <div className="col-lg-3 col-md-6 mt-5 mt-lg-0 footer-widget">
                <h3 className="widget-title">Categories</h3>
                <ul className="list-arrow">
                  <li><a href="/diwali-fund" target="_blank">SINGLE SOUND CRACKERS</a></li>
                  <li><a href="/diwali-fund" target="_blank">FLOWERPOTS</a></li>
                  <li><a href="/diwali-fund" target="_blank">GROUND CHAKKAR</a></li>
                  <li><a href="/diwali-fund" target="_blank">PAPER BOMBS</a></li>
                  <li><a href="/diwali-fund" target="_blank">PEACOCK VARIETIE FOUNTAIN</a></li>
                  <li><a href="/diwali-fund" target="_blank">COLOUR FOUNTAIN</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="copyright">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="copyright-info">
                  <span>Copyright &copy;2026, Advay Traders. All rights reserved </span>
                </div>
              </div>

              <div className="col-md-6">
                <div className="footer-menu text-center text-md-right">
                  <ul className="list-unstyled">
                    <li><a href="https://advaytraders.in/about">FAQ</a></li>
                    <li><a href="https://advaytraders.in/wholesales">Wholesale Deals</a></li>
                    <li><a href="https://advaytraders.in/contact">Contact</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="back-to-top" data-spy="affix" data-offset-top="10" className="back-to-top position-fixed">
              <button className="btn btn-primary" title="Back to Top">
                <i className="fa fa-angle-double-up"></i>
              </button>
            </div>

          </div>
        </div>
      </footer>

    </>
  );
};

export default Footer;
