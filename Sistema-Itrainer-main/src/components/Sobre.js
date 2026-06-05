import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import AnimatedCounter from './AnimatedCounter';
import './Sobre.css';

const Sobre = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            offset: 100,
            once: true
        });
    }, []);

    return (
        <main>
            {/* Hero Section */}
            <section className="about-hero">
                <div className="hero-overlay"></div>
                <div className="container">
                    <div className="hero-content" data-aos="fade-up">
                        <h1>Sobre o iTRAINER</h1>
                        <p>Conectando profissionais qualificados com pessoas que buscam transformar suas vidas através do exercício físico</p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-card" data-aos="fade-up" data-aos-delay="0">
                            <div className="stat-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <div className="stat-number">
                                <AnimatedCounter value={1000} suffix="+" />
                            </div>
                            <p>Usuários Ativos</p>
                        </div>
                        <div className="stat-card" data-aos="fade-up" data-aos-delay="100">
                            <div className="stat-icon">
                                <i className="fas fa-user-tie"></i>
                            </div>
                            <div className="stat-number">
                                <AnimatedCounter value={200} suffix="+" />
                            </div>
                            <p>Profissionais Certificados</p>
                        </div>
                        <div className="stat-card" data-aos="fade-up" data-aos-delay="200">
                            <div className="stat-icon">
                                <i className="fas fa-star"></i>
                            </div>
                            <div className="stat-number">
                                <AnimatedCounter value={4.9} decimals={1} />
                            </div>
                            <p>Avaliação Média</p>
                        </div>
                        <div className="stat-card" data-aos="fade-up" data-aos-delay="300">
                            <div className="stat-icon">
                                <i className="fas fa-calendar-check"></i>
                            </div>
                            <div className="stat-number">
                                <AnimatedCounter value={5000} suffix="+" />
                            </div>
                            <p>Treinos Realizados</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Content Section */}
            <section className="about-section">
                <div className="container">
                    <div className="about-content">
                        <div className="about-text" data-aos="fade-right">
                            <div className="section-header">
                                <span className="section-label">Nossa História</span>
                                <h2>Transformando Vidas Através do Fitness</h2>
                            </div>
                            <p>O iTRAINER nasceu da necessidade de conectar profissionais de educação física qualificados com pessoas que buscam melhorar sua qualidade de vida através do exercício físico. Nossa plataforma foi desenvolvida para tornar esse processo mais acessível, transparente e eficiente.</p>
                            <p>Desde 2025, temos trabalhado incansavelmente para criar uma comunidade onde a saúde e o bem-estar são prioridades. Acreditamos que todos merecem acesso a profissionais qualificados e treinamentos personalizados que realmente fazem a diferença.</p>
                        </div>
                        
                        <div className="about-image" data-aos="fade-left">
                            <img 
                                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop" 
                                alt="Equipe iTRAINER" 
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission, Vision, Values */}
            <section className="mvv-section">
                <div className="container">
                    <div className="mvv-grid">
                        <div className="mvv-card" data-aos="fade-up" data-aos-delay="0">
                            <div className="mvv-icon">
                                <i className="fas fa-bullseye"></i>
                            </div>
                            <h3>Nossa Missão</h3>
                            <p>Transformar vidas através da educação física, conectando profissionais qualificados e pessoas que buscam uma vida mais saudável, de forma simples e acessível.</p>
                        </div>
                        
                        <div className="mvv-card" data-aos="fade-up" data-aos-delay="100">
                            <div className="mvv-icon">
                                <i className="fas fa-eye"></i>
                            </div>
                            <h3>Nossa Visão</h3>
                            <p>Ser a principal plataforma de conexão entre profissionais de educação física e alunos em todo o Brasil, reconhecida pela qualidade dos serviços e pelo impacto positivo na vida das pessoas.</p>
                        </div>
                        
                        <div className="mvv-card" data-aos="fade-up" data-aos-delay="200">
                            <div className="mvv-icon">
                                <i className="fas fa-heart"></i>
                            </div>
                            <h3>Nossos Valores</h3>
                            <p>Qualidade, compromisso, inovação, ética e responsabilidade social são os pilares que guiam todas as nossas ações e decisões.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Detail Section */}
            <section className="values-section">
                <div className="container">
                    <div className="section-header-center" data-aos="fade-up">
                        <span className="section-label">Nossos Valores</span>
                        <h2>O Que Nos Move</h2>
                    </div>
                    <div className="values-grid">
                        <div className="value-card" data-aos="fade-up" data-aos-delay="0">
                            <div className="value-icon">
                                <i className="fas fa-award"></i>
                            </div>
                            <h3>Qualidade e Excelência</h3>
                            <p>Buscamos sempre o melhor em tudo que fazemos, desde a seleção de profissionais até a experiência do usuário.</p>
                        </div>
                        <div className="value-card" data-aos="fade-up" data-aos-delay="100">
                            <div className="value-icon">
                                <i className="fas fa-handshake"></i>
                            </div>
                            <h3>Compromisso com o Cliente</h3>
                            <p>Nossos clientes são nossa prioridade. Trabalhamos para superar expectativas e garantir satisfação total.</p>
                        </div>
                        <div className="value-card" data-aos="fade-up" data-aos-delay="200">
                            <div className="value-icon">
                                <i className="fas fa-lightbulb"></i>
                            </div>
                            <h3>Inovação Constante</h3>
                            <p>Estamos sempre evoluindo, buscando novas tecnologias e métodos para melhorar nossos serviços.</p>
                        </div>
                        <div className="value-card" data-aos="fade-up" data-aos-delay="300">
                            <div className="value-icon">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <h3>Ética e Transparência</h3>
                            <p>Agimos com integridade em todas as nossas relações, mantendo transparência e honestidade.</p>
                        </div>
                        <div className="value-card" data-aos="fade-up" data-aos-delay="400">
                            <div className="value-icon">
                                <i className="fas fa-globe"></i>
                            </div>
                            <h3>Responsabilidade Social</h3>
                            <p>Contribuímos para uma sociedade mais saudável e consciente sobre a importância da atividade física.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header-center" data-aos="fade-up">
                        <span className="section-label">Por Que Escolher o iTRAINER</span>
                        <h2>Nossos Diferenciais</h2>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card" data-aos="fade-up" data-aos-delay="0">
                            <div className="feature-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <h3>Comunidade Ativa</h3>
                            <p>Milhares de profissionais e alunos conectados, compartilhando experiências e resultados.</p>
                        </div>
                        <div className="feature-card" data-aos="fade-up" data-aos-delay="100">
                            <div className="feature-icon">
                                <i className="fas fa-certificate"></i>
                            </div>
                            <h3>Profissionais Qualificados</h3>
                            <p>Rigoroso processo de verificação de credenciais e certificações profissionais.</p>
                        </div>
                        <div className="feature-card" data-aos="fade-up" data-aos-delay="200">
                            <div className="feature-icon">
                                <i className="fas fa-star"></i>
                            </div>
                            <h3>Experiência Premium</h3>
                            <p>Interface intuitiva, suporte dedicado e ferramentas avançadas para seu treino.</p>
                        </div>
                        <div className="feature-card" data-aos="fade-up" data-aos-delay="300">
                            <div className="feature-icon">
                                <i className="fas fa-mobile-alt"></i>
                            </div>
                            <h3>Plataforma Moderna</h3>
                            <p>Totalmente responsiva e otimizada para uso em qualquer dispositivo.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content" data-aos="fade-up">
                        <h2>Comece sua jornada fitness hoje</h2>
                        <p>Encontre o profissional ideal para alcançar seus objetivos e transformar sua vida</p>
                        <Link to="/profissionais" className="btn btn-primary">Encontrar Profissional</Link>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Sobre; 