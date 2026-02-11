import React from "react";
import { Link } from "react-router-dom"; // Use Link instead of <a> for faster navigation
import { useTranslation } from "react-i18next";
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure bootstrap classes work

const Footer = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <>
            {/* Embedded CSS for Footer */}
            <style>
                {`
                .footer-wrapper {
                    borderTop: "1px solid #e5e7eb",
                    background: #ffffff;
                    margin-top: 60px;
                    padding-top: 60px;
                    padding-bottom: 40px;
                    text-align: center;
                }

                .footer-brand {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: #0072ff; /* var(--primary-dark) */
                    letter-spacing: -1px;
                    margin-bottom: 5px;
                    display: inline-block;
                    background: linear-gradient(135deg, #00c6ff, #0072ff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .footer-nav {
                    margin-top: 25px;
                    margin-bottom: 30px;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 30px;
                }

                .footer-link {
                    font-size: 0.95rem;
                    color: #64748b;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    font-weight: 500;
                    position: relative;
                }

                .footer-link:hover {
                    color: #0072ff;
                    transform: translateY(-2px);
                }

                /* Underline animation on hover */
                .footer-link::after {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 2px;
                    bottom: -4px;
                    left: 0;
                    background-color: #0072ff;
                    transition: width 0.3s ease;
                }

                .footer-link:hover::after {
                    width: 100%;
                }

                .copyright-text {
                    color: #94a3b8;
                    font-size: 0.85rem;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 20px;
                    margin-top: 20px;
                    width: 100%;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                }

                @media (max-width: 768px) {
                    .footer-nav {
                        gap: 15px;
                        flex-direction: column;
                    }
                    .footer-wrapper {
                        padding-top: 40px;
                    }
                }
                `}
            </style>

            <footer className="footer-wrapper">
                <div className="container">
                    {/* Brand Section */}
                    <div className="footer-brand">Nalla Angadi</div>
                    <div className="text-muted small">
                        {t("Discover. Connect. Grow.")}
                    </div>

                    {/* Navigation Links */}
                    <div className="footer-nav">
                        <Link to="/contact" className="footer-link">{t("Contact Us")}</Link>
                        <Link to="/shipping" className="footer-link">{t("Shipping Policy")}</Link>
                        <Link to="/privacy" className="footer-link">{t("Privacy Policy")}</Link>
                        <Link to="/terms" className="footer-link">{t("Terms & Conditions")}</Link>
                        <Link to="/refund" className="footer-link">{t("Cancellation & Refund Policy")}</Link>
                    </div>

                    {/* Copyright Section */}
                    <div className="copyright-text">
                        © {currentYear} <span className="fw-bold text-dark mx-1">Chola info technologies</span>
                        <br className="d-block d-sm-none" />
                        All rights reserved.
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;