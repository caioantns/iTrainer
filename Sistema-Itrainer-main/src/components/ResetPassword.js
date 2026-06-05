import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../contexts/ToastContext';
import './Login.css';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) { showToast('Token ausente na URL.', 'error'); return; }
    if (senha.length < 8) { showToast('Senha deve ter no mínimo 8 caracteres.', 'error'); return; }
    if (senha !== confirma) { showToast('Confirmação não confere.', 'error'); return; }
    setSending(true);
    try {
      await api.post('/reset-password', { token, senha });
      showToast('Senha redefinida! Faça login.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Token inválido ou expirado.';
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
              <h2>Nova senha</h2>
              <p>Defina sua nova senha.</p>
            </div>
            <form className="login-form" onSubmit={submit}>
              <label>Nova senha (min 8)</label>
              <input
                type="password" value={senha} required minLength={8}
                onChange={(e) => setSenha(e.target.value)}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }}
              />
              <label>Confirmar senha</label>
              <input
                type="password" value={confirma} required minLength={8}
                onChange={(e) => setConfirma(e.target.value)}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 16 }}
              />
              <button type="submit" className="btn btn-primary" disabled={sending || !token}>
                {sending ? 'Salvando...' : 'Redefinir senha'}
              </button>
              <p className="form-footer">
                <Link to="/login">Voltar ao login</Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;
