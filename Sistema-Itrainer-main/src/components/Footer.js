import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer>
            <div className="container">
                <div className="footer-content">
                    <div className="footer-logo">
                        <Link to="/" className="footer-logo-link">
                            <div className="footer-logo-container">
                                <i className="fas fa-dumbbell"></i>
                                <span className="footer-logo-text">iTrainer</span>
                            </div>
                        </Link>
                        <p>Cuidando da sua saúde desde 2025</p>
                    </div>
                    <div className="footer-links">
                        <h3>Links Rápidos</h3>
                        <ul>
                            <li><Link to="/">Inicio</Link></li>
                            <li><Link to="/profissionais">Profissionais</Link></li>
                            <li><Link to="/contato">Contato</Link></li>
                            <li><Link to="/sobre">Sobre</Link></li>
                        </ul>
                    </div>
                    <div className="footer-contact">
                        <h3>Contato</h3>
                        <p><i className="fas fa-map-marker-alt"></i> Av. Principal, 123 - Centro</p>
                        <p><i className="fas fa-phone"></i> (21) 1234-5678</p>
                        <p><i className="fas fa-envelope"></i> contato@iTrainer.com</p>
                    </div>
                    <div className="footer-social">
                        <h3>Redes Sociais</h3>
                        <div className="social-icons">
                            <a href="https://facebook.com" className="social-icon" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook"></i></a>
                            <a href="https://instagram.com" className="social-icon" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
                            <a href="https://twitter.com" className="social-icon" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a>
                            <a href="https://linkedin.com" className="social-icon" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin"></i></a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2025 iTrainer. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 