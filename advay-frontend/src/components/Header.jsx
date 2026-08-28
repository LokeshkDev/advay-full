import React from 'react';
import './Header.css';
import logo from '../assets/images/Advay-Traders-Logo.png';
import flower from '../assets/images/header-flower-pot.png';

const Header = () => {
  return (
    <>
      <div id="top-bar" className="top-bar">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 col-md-8">
              <marquee>
                <img src={flower} width="30" alt="flower" loading="lazy" /> Welcome to Advay Traders, We trust only on Quality, Safety & Happiness. Happiness that is 80% Discount on all products{" "}
                <img src={flower} width="30" alt="flower" loading="lazy" />
              </marquee>
            </div>

            <div className="col-lg-4 col-md-4 top-social text-center text-md-right">
              <ul className="list-unstyled">
                <li>
                  <a title="Youtube" target="_blank" rel="noopener noreferrer" href="https://youtube.com/@AdvayTradersSivakasi">
                    <span className="social-icon"><i className="fab fa-youtube"></i></span>
                  </a>
                  <a title="Instagram" target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/advaytraders_sivakasi?igsh=cHQ1OHo0eWhmM2o0">
                    <span className="social-icon"><i className="fab fa-instagram"></i></span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <header id="header" className="header-one">
        <div className="bg-white">
          <div className="container">
            <div className="logo-area">
              <div className="row align-items-center">
                <div className="logo col-lg-3 text-center text-lg-left mb-3 mb-md-5 mb-lg-0">
                  <a className="align-items-center d-block d-flex justify-content-center" href="/">
                    <img loading="lazy" src={logo} alt="Advay Traders Logo" />
                  </a>
                </div>

                <div className="col-lg-9 header-right">
                  <ul className="top-info-box">
                    <li>
                      <div className="info-box">
                        <div className="info-box-content">
                          <p className="info-box-title">Call Us</p>
                          <p className="info-box-subtitle">(+91) 96881 17904</p>
                          <p className="info-box-subtitle">(+91) 82483 61625</p>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="info-box">
                        <div className="info-box-content">
                          <p className="info-box-title">Email Us</p>
                          <p className="info-box-subtitle">advaytraders@gmail.com</p>
                        </div>
                      </div>
                    </li>
                    <li className="header-get-a-quote">
                      <a className="btn btn-primary" href="/Product-List">Order Online</a>
                    </li>
                    <li className="header-get-a-quote">
                      <a className="btn btn-primary" href="Price Table Advay Traders.pdf" target="_blank" rel="noopener noreferrer" download>
                        Download Product List
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="site-navigation">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <nav className="navbar navbar-expand-lg navbar-dark p-0">
                  <button className="navbar-toggler" type="button" data-toggle="collapse" data-target=".navbar-collapse" aria-controls="navbar-collapse" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                  </button>

                  <div id="navbar-collapse" className="collapse navbar-collapse">
                    <ul className="nav navbar-nav mr-auto">
                      <li className="nav-item">
                        <a href="/" className="nav-link">Home</a>
                      </li>
                      <li className="nav-item">
                        <a href="https://advaytraders.in/about" className="nav-link">About Us</a>
                      </li>
                      <li className="nav-item active">
                        <a href="/Product-List" className="nav-link">Product List</a>
                      </li>
                      <li className="nav-item">
                        <a href="https://advaytraders.in/diwali-fund" className="nav-link">Diwali Fund</a>
                      </li>
                      <li className="nav-item">
                        <a href="https://advaytraders.in/wholesales" className="nav-link">Wholesale Deals</a>
                      </li>
                      <li className="nav-item">
                        <a href="https://advaytraders.in/contact" className="nav-link">Contact</a>
                      </li>
                    </ul>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
