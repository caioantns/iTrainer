import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';
import CadastroCliente from './components/CadastroCliente';
import CadastroProfissional from './components/CadastroProfissional';
import Contato from './components/Contato';
import Sobre from './components/Sobre';
import PerfilCliente from './components/PerfilCliente';
import PainelProfissional from './components/PainelProfissional';
import Profissionais from './components/Profissionais';
import PerfilProfissional from './components/PerfilProfissional';
import Planos from './components/Planos';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ScrollToTop from './components/ScrollToTop';
import Breadcrumbs from './components/Breadcrumbs';
import PageTransition from './components/PageTransition';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

const AppRoutes = () => {
  const location = useLocation();
  return (
    <PageTransition>
      <Breadcrumbs />
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/cadastro-cliente" element={<CadastroCliente />} />
        <Route path="/cadastro-profissional" element={<CadastroProfissional />} />
        <Route path="/planos" element={<Planos />} />
        <Route path="/profissionais" element={<Profissionais />} />
        <Route path="/profissional/:id" element={<PerfilProfissional />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route
          path="/perfil-cliente"
          element={
            <ProtectedRoute roles={['cliente']}>
              <PerfilCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/painel-profissional"
          element={
            <ProtectedRoute roles={['profissional']}>
              <PainelProfissional />
            </ProtectedRoute>
          }
        />
      </Routes>
    </PageTransition>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Header />
              <AppRoutes />
              <Footer />
              <ScrollToTop />
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
