import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../contexts/ToastContext';
import './Login.css';

const ForgotPassword = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Email inválido.', 'error');
      return;
    }
    setSending(true);
    try {
      await api.post('/forgot-password', { email });
      setSent(true);
      showToast('Se o email existir, enviaremos instruções.', 'success');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Erro ao solicitar.';
      showToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <section className="login-section">
        <div className="container">
          <div className="login-container">
            <div className="login-header">
              <h2>Esqueci minha senha</h2>
              <p>Informe seu email cadastrado.</p>
            </div>
            {sent ? (
              <div className="tab-content" style={{ textAlign: 'center' }}>
                <p>Verifique sua caixa de entrada (e spam).</p>
                <p>O link expira em 30 minutos.</p>
                <Link className="btn btn-primary" to="/login">Voltar ao login</Link>
              </div>
            ) : (
              <form className="login-form" onSubmit={submit}>
                <label style={{ display: 'block', marginBottom: 8 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 16 }}
                />
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Enviando...' : 'Enviar link'}
                </button>
                <p className="form-footer">
                  <Link to="/login">Voltar ao login</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;
