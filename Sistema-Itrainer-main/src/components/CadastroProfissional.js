import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './Cadastro.css';

const CadastroProfissional = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        telefone: '',
        foto: null,
        fotoBase64: '',
        especialidades: [],
        experiencia: '',
        descricao: '',
        preco: '',
        horarios: '',
        localizacao: ''
    });
    const [searchEspecialidade, setSearchEspecialidade] = useState('');

    const especialidades = [
        'musculacao',
        'funcional',
        'yoga',
        'pilates',
        'crossfit',
        'boxe',
        'jiu-jitsu',
        'natacao',
        'danca',
        'meditacao',
        'reabilitacao',
        'nutricao'
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setFormData(prev => ({ ...prev, foto: null, fotoBase64: '' }));
            return;
        }
        setFormData(prev => ({ ...prev, foto: file }));
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({
                ...prev,
                fotoBase64: reader.result || ''
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            especialidades: checked 
                ? [...prev.especialidades, value]
                : prev.especialidades.filter(item => item !== value)
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
                kind: 'profissional',
            });

            // Upload foto p/ disco (se houver arquivo)
            let foto_url = null;
            if (formData.foto) {
                try {
                    const fd = new FormData();
                    fd.append('foto', formData.foto);
                    const up = await api.post('/uploads/foto', fd, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    foto_url = up.data?.url || null;
                } catch (fotoErr) {
                    console.warn('Upload foto falhou:', fotoErr?.message);
                }
            }

            // Persiste perfil estendido via API. Se falhar, prossegue (perfil opcional).
            try {
                await api.put('/profissionais/me/perfil', {
                    telefone: formData.telefone || null,
                    foto_url,
                    especialidades: formData.especialidades || [],
                    experiencia: Number(formData.experiencia) || null,
                    descricao: formData.descricao || null,
                    preco_hora: Number(formData.preco) || null,
                    localizacao: formData.localizacao || null,
                    online: true,
                });
            } catch (perfilErr) {
                console.warn('Perfil estendido nao salvo:', perfilErr?.message);
            }

            showToast('Cadastro realizado!', 'success');
            navigate('/painel-profissional');
        } catch (err) {
            console.error('[Cadastro profissional]', err);
            const apiMsg = err?.response?.data?.error;
            const isNetwork = !err?.response;
            const msg = apiMsg
                || (isNetwork ? 'Servidor offline. Verifique se o backend está rodando em :3010.' : 'Falha ao cadastrar profissional.');
            showToast(msg, 'error');
        }
    };

    const filteredEspecialidades = especialidades.filter(especialidade => 
        especialidade.toLowerCase().includes(searchEspecialidade.toLowerCase())
    );

    return (
        <main className="cadastro-container">
            <div className="cadastro-form" data-aos="fade-up">
                <h1>Cadastro de Profissional</h1>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
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
                        <label htmlFor="foto">Foto de Perfil</label>
                        <input 
                            type="file" 
                            id="foto" 
                            name="foto" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="especialidades">Especialidades</label>
                        <div className="search-container">
                            <input 
                                type="text" 
                                id="searchEspecialidade" 
                                placeholder="Buscar especialidade..."
                                value={searchEspecialidade}
                                onChange={(e) => setSearchEspecialidade(e.target.value)}
                            />
                            <i className="fas fa-search"></i>
                        </div>
                        <div className="especialidades-container">
                            <div className="especialidades-grid">
                                {filteredEspecialidades.map(especialidade => (
                                    <label key={especialidade} className="especialidade-item">
                                        <input 
                                            type="checkbox" 
                                            name="especialidades" 
                                            value={especialidade}
                                            checked={formData.especialidades.includes(especialidade)}
                                            onChange={handleCheckboxChange}
                                        />
                                        <span>{especialidade.charAt(0).toUpperCase() + especialidade.slice(1)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="experiencia">Anos de Experiência</label>
                        <input 
                            type="number" 
                            id="experiencia" 
                            name="experiencia" 
                            min="0" 
                            value={formData.experiencia}
                            onChange={handleInputChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="descricao">Descrição Pessoal</label>
                        <textarea 
                            id="descricao" 
                            name="descricao" 
                            rows="4" 
                            value={formData.descricao}
                            onChange={handleInputChange}
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="preco">Preço por Sessão (R$)</label>
                        <input 
                            type="number" 
                            id="preco" 
                            name="preco" 
                            min="0" 
                            step="0.01" 
                            value={formData.preco}
                            onChange={handleInputChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="horarios">Horários Disponíveis</label>
                        <input 
                            type="text" 
                            id="horarios" 
                            name="horarios" 
                            placeholder="Ex: Seg-Sex, 8h-18h"
                            value={formData.horarios}
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

export default CadastroProfissional;