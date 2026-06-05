import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './Cadastro.css';

const CadastroCliente = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        telefone: '',
        data_nascimento: '',
        objetivos: [],
        nivel: 'iniciante',
        restricoes: '',
        preferencias: [],
        disponibilidade: '',
        localizacao: ''
    });
    const [searchObjetivo, setSearchObjetivo] = useState('');
    const [searchPreferencia, setSearchPreferencia] = useState('');

    const objetivos = [
        'emagrecimento',
        'hipertrofia',
        'condicionamento',
        'reabilitacao',
        'saude'
    ];

    const preferencias = [
        'musculacao',
        'funcional',
        'yoga',
        'pilates',
        'crossfit'
    ];

    useEffect(() => {
        AOS.init({
            duration: 800,
            offset: 100,
            once: true
        });
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (e, type) => {
        const { value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [type]: checked 
                ? [...prev[type], value]
                : prev[type].filter(item => item !== value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nome || !formData.email || !formData.senha) {
            showToast('Preencha nome, email e senha.', 'error');
            return;
        }
        if (formData.senha.length < 8) {
            showToast('Senha deve ter pelo menos 8 caracteres.', 'error');
            return;
        }
        try {
            await register({
                nome: formData.nome,
                email: formData.email,
                password: formData.senha,
                kind: 'cliente',
            });

            // Salva perfil estendido via API
            try {
                await api.put('/clientes/me/perfil', {
                    telefone: formData.telefone || null,
                    data_nascimento: formData.data_nascimento || null,
                    objetivos: formData.objetivos || [],
                    nivel: formData.nivel || null,
                    restricoes: formData.restricoes || null,
                    preferencias: formData.preferencias || [],
                    localizacao: formData.localizacao || null,
                });
            } catch (perfilErr) {
                console.warn('Perfil cliente nao salvo:', perfilErr?.message);
            }

            showToast('Cadastro realizado!', 'success');
            navigate('/perfil-cliente');
        } catch (err) {
            console.error('[Cadastro cliente]', err);
            const apiMsg = err?.response?.data?.error;
            const isNetwork = !err?.response;
            const msg = apiMsg
                || (isNetwork ? 'Servidor offline. Verifique se o backend está rodando em :3010.' : 'Falha ao cadastrar.');
            showToast(msg, 'error');
        }
    };

    const filteredObjetivos = objetivos.filter(objetivo => 
        objetivo.toLowerCase().includes(searchObjetivo.toLowerCase())
    );

    const filteredPreferencias = preferencias.filter(preferencia => 
        preferencia.toLowerCase().includes(searchPreferencia.toLowerCase())
    );

    return (
        <main className="cadastro-container">
            <div className="cadastro-form" data-aos="fade-up">
                <h1>Cadastro de Cliente</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="nome">Nome Completo</label>
                        <input 
                            type="text" 
                            id="nome" 
                            name="nome" 
                            value={formData.nome}
                            onChange={handleInputChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">E-mail</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            value={formData.email}
                            onChange={handleInputChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="senha">Senha</label>
                        <input 
                            type="password" 
                            id="senha" 
                            name="senha" 
                            value={formData.senha}
                            onChange={handleInputChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="telefone">Telefone</label>
                        <input 
                            type="tel" 
                            id="telefone" 
                            name="telefone" 
                            value={formData.telefone}
                            onChange={handleInputChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="data_nascimento">Data de Nascimento</label>
                        <input 
                            type="date" 
                            id="data_nascimento" 
                            name="data_nascimento" 
                            value={formData.data_nascimento}
                            onChange={handleInputChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="objetivos">Objetivos de Treino</label>
                        <div className="search-container">
                            <input 
                                type="text" 
                                id="searchObjetivo" 
                                placeholder="Buscar objetivo..."
                                value={searchObjetivo}
                                onChange={(e) => setSearchObjetivo(e.target.value)}
                            />
                            <i className="fas fa-search"></i>
                        </div>
                        <div className="especialidades-container">
                            <div className="especialidades-grid">
                                {filteredObjetivos.map(objetivo => (
                                    <label key={objetivo} className="especialidade-item">
                                        <input 
                                            type="checkbox" 
                                            name="objetivos" 
                                            value={objetivo}
                                            checked={formData.objetivos.includes(objetivo)}
                                            onChange={(e) => handleCheckboxChange(e, 'objetivos')}
                                        />
                                        <span>{objetivo.charAt(0).toUpperCase() + objetivo.slice(1)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="nivel">Nível de Atividade Física</label>
                        <select 
                            id="nivel" 
                            name="nivel" 
                            value={formData.nivel}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="iniciante">Iniciante</option>
                            <option value="intermediario">Intermediário</option>
                            <option value="avancado">Avançado</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="restricoes">Restrições Médicas</label>
                        <textarea 
                            id="restricoes" 
                            name="restricoes" 
                            rows="3" 
                            placeholder="Descreva qualquer restrição médica ou lesão prévia"
                            value={formData.restricoes}
                            onChange={handleInputChange}
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="preferencias">Preferências de Treino</label>
                        <div className="search-container">
                            <input 
                                type="text" 
                                id="searchPreferencia" 
                                placeholder="Buscar preferência..."
                                value={searchPreferencia}
                                onChange={(e) => setSearchPreferencia(e.target.value)}
                            />
                            <i className="fas fa-search"></i>
                        </div>
                        <div className="especialidades-container">
                            <div className="especialidades-grid">
                                {filteredPreferencias.map(preferencia => (
                                    <label key={preferencia} className="especialidade-item">
                                        <input 
                                            type="checkbox" 
                                            name="preferencias" 
                                            value={preferencia}
                                            checked={formData.preferencias.includes(preferencia)}
                                            onChange={(e) => handleCheckboxChange(e, 'preferencias')}
                                        />
                                        <span>{preferencia.charAt(0).toUpperCase() + preferencia.slice(1)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="disponibilidade">Disponibilidade de Horários</label>
                        <input 
                            type="text" 
                            id="disponibilidade" 
                            name="disponibilidade" 
                            placeholder="Ex: Seg-Sex, 8h-18h"
                            value={formData.disponibilidade}
                            onChange={handleInputChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="localizacao">Localização (Cidade/Estado)</label>
                        <input 
                            type="text" 
                            id="localizacao" 
                            name="localizacao" 
                            value={formData.localizacao}
                            onChange={handleInputChange}
                            required 
                        />
                    </div>

                    <button type="submit" className="btn-cadastro">Cadastrar</button>
                </form>
            </div>
        </main>
    );
};

export default CadastroCliente;