import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumbs.css';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    const getBreadcrumbName = (path) => {
        const names = {
            'profissionais': 'Profissionais',
            'profissional': 'Profissional',
            'contato': 'Contato',
            'sobre': 'Sobre',
            'login': 'Login',
            'cadastro-cliente': 'Cadastro Cliente',
            'cadastro-profissional': 'Cadastro Profissional',
            'perfil-cliente': 'Meu Perfil',
            'painel-profissional': 'Painel Profissional',
            'planos': 'Planos'
        };
        return names[path] || path.charAt(0).toUpperCase() + path.slice(1);
    };

    if (pathnames.length === 0) {
        return null;
    }

    return (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
                <li className="breadcrumb-item">
                    <Link to="/">Início</Link>
                </li>
                {pathnames.map((name, index) => {
                    const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    return (
                        <li key={routeTo} className="breadcrumb-item">
                            <span className="breadcrumb-separator">
                                <i className="fas fa-chevron-right"></i>
                            </span>
                            {isLast ? (
                                <span className="breadcrumb-current">{getBreadcrumbName(name)}</span>
                            ) : (
                                <Link to={routeTo}>{getBreadcrumbName(name)}</Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;



