import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import FloatingLabelInput from './FloatingLabelInput';
import './Login.css';

const isDev = !import.meta.env.PROD;

const validateEmail = (email) => {
    if (!email) return 'Email é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido';
    return true;
};
const validatePassword = (password) => {
    if (!password) return 'Senha é obrigatória';
    if (password.length < 8) return 'Senha deve ter pelo menos 8 caracteres';
    return true;
};

const Login = () => {
    const [activeTab, setActiveTab] = useState('client');
    const [formData, setFormData] = useState({
        client: { email: '', password: '' },
        professional: { email: '', password: '' },
    });
    const [errors, setErrors] = useState({
        client: { email: '', password: '' },
        professional: { email: '', password: '' },
    });
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { login, loading } = useAuth();

    const handleInputChange = (userType, field, value) => {
        setFormData((p) => ({ ...p, [userType]: { ...p[userType], [field]: value } }));
        setErrors((p) => ({ ...p, [userType]: { ...p[userType], [field]: '' } }));
    };

    const handleSubmit = async (e, userType) => {
        e.preventDefault();
        const { email, password } = formData[userType];
        const emailV = validateEmail(email);
        const passV = validatePassword(password);

        if (emailV !== true || passV !== true) {
            setErrors((p) => ({
                ...p,
                [userType]: {
                    email: typeof emailV === 'string' ? emailV : '',
                    password: typeof passV === 'string' ? passV : '',
                },
            }));
            showToast('Corrija os erros do formulário.', 'error');
            return;
        }

        try {
            const kind = userType === 'client' ? 'cliente' : 'profissional';
            await login({ email, password, kind });
            showToast('Login realizado com sucesso!', 'success');
            // Anti open-redirect: aceita so paths relativos comecando com '/' sem '//'.
            const raw = location.state?.from;
            const safeRedirect = (typeof raw === 'string' && /^\/[^/]/.test(raw))
                ? raw
                : (kind === 'cliente' ? '/perfil-cliente' : '/painel-profissional');
            navigate(safeRedirect, { replace: true });
        } catch (err) {
            console.error('[Login]', err);
            const apiMsg = err?.response?.data?.error;
            const isNetwork = !err?.response;
            const msg = apiMsg
                || (isNetwork ? 'Servidor offline. Verifique se o backend está rodando em :3010.' : 'Falha ao conectar à API.');
            showToast(msg, 'error');
        }
    };

    return (
        <main>
            <section className="login-section">
                <div className="container">
                    <div className="login-container">
                        <div className="login-header">
                            <h2>Bem-vindo ao iTrainer!</h2>
                            <p>Escolha como deseja continuar</p>
                            {isDev && (
                                <div className="test-hint">
                                    <span><strong>Cliente (seed):</strong> cliente.teste@example.com / senha12345</span>
                                    <span><strong>Profissional (seed):</strong> profissional.teste@example.com / senha12345</span>
                                </div>
                            )}
                        </div>

                        <div className="login-tabs">
                            <button
                                className={`tab-btn ${activeTab === 'client' ? 'active' : ''}`}
                                onClick={() => setActiveTab('client')}
                            >Cliente</button>
                            <button
                                className={`tab-btn ${activeTab === 'professional' ? 'active' : ''}`}
                                onClick={() => setActiveTab('professional')}
                            >Profissional</button>
                        </div>

                        <div className="tab-content">
                            <div className={`tab-pane ${activeTab === 'client' ? 'active' : ''}`}>
                                <form className="login-form" onSubmit={(e) => handleSubmit(e, 'client')}>
                                    <FloatingLabelInput
                                        type="email" label="Email" name="email"
                                        value={formData.client.email}
                                        onChange={(e) => handleInputChange('client', 'email', e.target.value)}
                                        error={errors.client.email} required validation={validateEmail}
                                    />
                                    <FloatingLabelInput
                                        type="password" label="Senha" name="password"
                                        value={formData.client.password}
                                        onChange={(e) => handleInputChange('client', 'password', e.target.value)}
                                        error={errors.client.password} required validation={validatePassword}
                                    />
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Entrando...' : 'Entrar'}
                                    </button>
                                    <p className="form-footer">
                                        <Link to="/forgot-password">Esqueci minha senha</Link>
                                        {' • '}
                                        Não tem uma conta? <Link to="/cadastro-cliente">Cadastre-se</Link>
                                    </p>
                                </form>
                            </div>

                            <div className={`tab-pane ${activeTab === 'professional' ? 'active' : ''}`}>
                                <form className="login-form" onSubmit={(e) => handleSubmit(e, 'professional')}>
                                    <FloatingLabelInput
                                        type="email" label="Email" name="email"
                                        value={formData.professional.email}
                                        onChange={(e) => handleInputChange('professional', 'email', e.target.value)}
                                        error={errors.professional.email} required validation={validateEmail}
                                    />
                                    <FloatingLabelInput
                                        type="password" label="Senha" name="password"
                                        value={formData.professional.password}
                                        onChange={(e) => handleInputChange('professional', 'password', e.target.value)}
                                        error={errors.professional.password} required validation={validatePassword}
                                    />
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Entrando...' : 'Entrar'}
                                    </button>
                                    <p className="form-footer">
                                        <Link to="/forgot-password">Esqueci minha senha</Link>
                                        {' • '}
                                        Não tem uma conta? <Link to="/cadastro-profissional">Cadastre-se</Link>
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Login;
