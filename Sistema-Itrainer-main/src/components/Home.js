import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useToast } from '../contexts/ToastContext';
import StarRating from './StarRating';
import AnimatedCounter from './AnimatedCounter';
import './Home.css';

const Home = () => {
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { type: 'support', text: 'Olá! Como posso ajudar você hoje?' }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const { showToast } = useToast();

    const [testimonials, setTestimonials] = useState([]);

    const services = [
        {
            icon: "fa-solid fa-comment",
            title: "Consultoria e Treinamento Personalizado",
            description: "Acompanhamento físico e ajustes no treino conforme progresso",
            badge: "Popular"
        },
        {
            icon: "fa-solid fa-user-plus",
            title: "Programas Específicos",
            description: "Treinamento funcional, Treino para atletas de alto rendimento",
            badge: "Novo"
        },
        {
            icon: "fa-solid fa-users",
            title: "Aulas Online e Videoaulas",
            description: "Plataforma de treinos online com vídeos explicativos",
            badge: null
        },
        {
            icon: "fas fa-stethoscope",
            title: "Avaliação Física e Nutricional",
            description: "Avaliação de desempenho e mobilidade, Orientação nutricional",
            badge: "Destaque"
        }
    ];

    useEffect(() => {
        // Inicializar AOS
        AOS.init({
            duration: 800,
            offset: 100,
            once: true
        });

        // Buscar depoimentos da API
        (async () => {
            try {
                const resp = await api.get('/depoimentos');
                const data = resp.data?.depoimentos || [];
                if (Array.isArray(data) && data.length > 0) {
                    setTestimonials(data);
                } else {
                    // Fallback local se API não tiver dados
                    setTestimonials([
                        {
                            content: 'Excelente atendimento! Os profissionais são muito atenciosos e o acompanhamento é excepcional!',
                            author: 'Maria Silva',
                            title: 'Cliente desde 2025',
                            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
                            rating: 5,
                        },
                        {
                            content: 'Sempre encontro horários disponíveis e o atendimento é rápido e eficiente. Recomendo!',
                            author: 'João Santos',
                            title: 'Cliente desde 2025',
                            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
                            rating: 5,
                        },
                        {
                            content: 'Transformei completamente minha vida com os treinos personalizados. Resultados incríveis!',
                            author: 'Ana Costa',
                            title: 'Cliente desde 2024',
                            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
                            rating: 5,
                        },
                    ]);
                }
            } catch (err) {
                // Fallback local
                setTestimonials([
                    {
                        content: 'Excelente atendimento! Os profissionais são muito atenciosos e o acompanhamento é excepcional!',
                        author: 'Maria Silva',
                        title: 'Cliente desde 2025',
                        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
                        rating: 5,
                    },
                    {
                        content: 'Sempre encontro horários disponíveis e o atendimento é rápido e eficiente. Recomendo!',
                        author: 'João Santos',
                        title: 'Cliente desde 2025',
                        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
                        rating: 5,
                    },
                    {
                        content: 'Transformei completamente minha vida com os treinos personalizados. Resultados incríveis!',
                        author: 'Ana Costa',
                        title: 'Cliente desde 2024',
                        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
                        rating: 5,
                    },
                ]);
            }
        })();

        // Auto-play do testimonial slider
        const interval = setInterval(() => {
            setCurrentTestimonial(prev => (prev + 1) % Math.max(testimonials.length, 1));
        }, 5000);

        return () => clearInterval(interval);
    }, [testimonials.length]);

    const sendMessage = () => {
        if (newMessage.trim()) {
            const userMessage = { type: 'user', text: newMessage };
            setChatMessages(prev => [...prev, userMessage]);
            setNewMessage('');

            // Simular resposta do suporte
            setTimeout(() => {
                const supportMessage = { 
                    type: 'support', 
                    text: 'Obrigado por sua mensagem! Nossa equipe entrará em contato em breve.' 
                };
                setChatMessages(prev => [...prev, supportMessage]);
                showToast('Mensagem enviada com sucesso!', 'success');
            }, 1000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <>
            <main>
                <section className="hero">
                    <div className="hero-background">
                        <img 
                            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop" 
                            alt="Personal trainer" 
                            loading="eager"
                            className="hero-bg-image"
                        />
                        <div className="hero-overlay"></div>
                    </div>
                    <div className="hero-content" data-aos="fade-up">
                        <h1>Transforme sua vida através do treinamento personalizado</h1>
                        <p>Conecte-se com os melhores profissionais e alcance seus objetivos de forma eficiente e segura</p>
                        <div className="hero-buttons">
                            <Link to="/contato" className="btn btn-primary">Agende um Treino</Link>
                            <a href="#services" className="btn btn-secondary">Conheça Nossos Serviços</a>
                        </div>
                    </div>
                    <a href="#services" className="scroll-down" aria-label="Rolar para baixo">
                        <i className="fas fa-chevron-down"></i>
                    </a>
                </section>

                <section className="welcome-section">
                    <div className="container">
                        <div className="welcome-content" data-aos="fade-up">
                            <h2>Bem-vindo ao iTrainer! 👋</h2>
                            <p>Estamos felizes em tê-lo aqui! Nossa missão é conectar você aos melhores profissionais de treinamento personalizado, ajudando você a alcançar seus objetivos de saúde e bem-estar de forma eficiente e segura.</p>
                            <div className="welcome-features">
                                <div className="welcome-feature">
                                    <i className="fas fa-heart"></i>
                                    <span>Saúde em Primeiro Lugar</span>
                                </div>
                                <div className="welcome-feature">
                                    <i className="fas fa-trophy"></i>
                                    <span>Resultados Garantidos</span>
                                </div>
                                <div className="welcome-feature">
                                    <i className="fas fa-users"></i>
                                    <span>Profissionais Certificados</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="services" id="services">
                    <div className="container">
                        <h2 data-aos="fade-up">Nossos Serviços</h2>
                        <div className="services-grid">
                            {services.map((service, index) => (
                                <div 
                                    key={index}
                                    className="service-card" 
                                    data-aos="fade-up" 
                                    data-aos-delay={100 * (index + 1)}
                                >
                                    {service.badge && (
                                        <span className="service-badge">{service.badge}</span>
                                    )}
                                    <div className="service-icon">
                                        <i className={service.icon}></i>
                                    </div>
                                    <h3>{service.title}</h3>
                                    <p>{service.description}</p>
                                    <Link to="/contato" className="service-link">
                                        Saiba mais <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="testimonials">
                    <div className="container">
                        <h2 data-aos="fade-up">O que nossos clientes dizem</h2>
                        <div className="testimonial-slider-wrapper">
                            <div 
                                className="testimonial-slider"
                                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                            >
                                {testimonials.map((testimonial, index) => (
                                    <div 
                                        key={index}
                                        className="testimonial"
                                        data-aos="fade-up"
                                    >
                                        <div className="testimonial-content">
                                            <i className="fas fa-quote-left"></i>
                                            <p>{testimonial.content}</p>
                                        </div>
                                        <div className="testimonial-rating">
                                            <StarRating rating={testimonial.rating} readonly={true} size="small" />
                                        </div>
                                        <div className="testimonial-author">
                                            <img src={testimonial.image} alt={`Cliente ${testimonial.author}`} loading="lazy" />
                                            <div className="author-info">
                                                <span className="author-name">{testimonial.author}</span>
                                                <span className="author-title">{testimonial.title}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="testimonial-controls">
                            <button 
                                className="testimonial-nav prev"
                                onClick={() => setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                                aria-label="Depoimento anterior"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            <div className="testimonial-dots">
                                {testimonials.map((_, index) => (
                                    <span 
                                        key={index}
                                        className={`dot ${index === currentTestimonial ? 'active' : ''}`}
                                        onClick={() => setCurrentTestimonial(index)}
                                    ></span>
                                ))}
                            </div>
                            <button 
                                className="testimonial-nav next"
                                onClick={() => setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                                aria-label="Próximo depoimento"
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </section>

                <section className="stats-section">
                    <div className="container">
                        <div className="stats-grid" data-aos="fade-up">
                            <div className="stat-card">
                                <AnimatedCounter value={1000} suffix="+" />
                                <p>Clientes Ativos</p>
                            </div>
                            <div className="stat-card">
                                <AnimatedCounter value={50} suffix="+" />
                                <p>Profissionais</p>
                            </div>
                            <div className="stat-card">
                                <AnimatedCounter value={95} suffix="%" />
                                <p>Satisfação</p>
                            </div>
                            <div className="stat-card">
                                <AnimatedCounter value={5} suffix=" anos" />
                                <p>Experiência</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="cta-section">
                    <div className="container">
                        <div className="cta-content" data-aos="fade-up">
                            <h2>Pronto para transformar sua vida?</h2>
                            <p>Comece sua jornada fitness hoje mesmo com os melhores profissionais</p>
                            <Link to="/contato" className="btn btn-primary">Comece Agora</Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Seção de Suporte ao Cliente */}
            <section className="support-section" id="support-section">
                <div className="container">
                    <h2 className="section-title">Suporte ao Cliente</h2>
                    <div className="support-grid">
                        <div className="support-card">
                            <i className="fas fa-headset"></i>
                            <h3>Atendimento 24/7</h3>
                            <p>Nossa equipe está disponível para ajudar você a qualquer momento.</p>
                        </div>
                        <div className="support-card">
                            <i className="fas fa-comments"></i>
                            <h3>Chat Online</h3>
                            <p>Converse com nossos atendentes em tempo real.</p>
                            <button className="btn btn-primary" onClick={() => setIsChatOpen(true)}>
                                Iniciar Chat
                            </button>
                        </div>
                        <div className="support-card">
                            <i className="fas fa-envelope"></i>
                            <h3>Email</h3>
                            <p>Envie suas dúvidas para: suporte@itrainer.com</p>
                        </div>
                        <div className="support-card">
                            <i className="fas fa-phone"></i>
                            <h3>Telefone</h3>
                            <p>Ligue para: (11) 99999-9999</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal de Chat */}
            {isChatOpen && (
                <div className="chat-modal active" id="chatModal">
                    <div className="chat-header">
                        <h3>Suporte ao Cliente</h3>
                        <button 
                            className="close-chat" 
                            aria-label="Fechar chat"
                            onClick={() => setIsChatOpen(false)}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="chat-body">
                        <div className="chat-messages">
                            {chatMessages.map((message, index) => (
                                <div key={index} className={`message ${message.type}`}>
                                    <p>{message.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="chat-input">
                            <input 
                                type="text" 
                                placeholder="Digite sua mensagem..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                            <button onClick={sendMessage}>
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Botão Flutuante de Suporte */}
            <a href="#support-section" className="support-float-button">
                <i className="fas fa-headset"></i>
                <span>Suporte</span>
            </a>
        </>
    );
};

export default Home;