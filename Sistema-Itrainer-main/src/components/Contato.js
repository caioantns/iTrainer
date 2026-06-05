import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useToast } from '../contexts/ToastContext';
import './Contato.css';

const WHATSAPP_NUMERO = '5521987654321';
const SOCIAL = [
  { nome: 'Instagram', icone: 'fa-instagram', url: 'https://instagram.com/itrainer' },
  { nome: 'Facebook',  icone: 'fa-facebook',  url: 'https://facebook.com/itrainer' },
  { nome: 'YouTube',   icone: 'fa-youtube',   url: 'https://youtube.com/@itrainer' },
  { nome: 'TikTok',    icone: 'fa-tiktok',    url: 'https://tiktok.com/@itrainer' },
];

const FAQ = [
  {
    q: 'Como funciona o iTrainer?',
    a: 'Conectamos clientes a personal trainers qualificados. O cliente busca profissionais por especialidade, agenda sessões e pode pagar online via Pix.',
  },
  {
    q: 'Os profissionais são certificados?',
    a: 'Sim. Todos os profissionais possuem registro no CREF e são validados pela nossa equipe antes de aparecer na vitrine.',
  },
  {
    q: 'Como faço para me cadastrar como personal?',
    a: 'Clique em "Login" no topo e selecione a opção de cadastro de profissional. Após o cadastro, você poderá criar seus planos no painel.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Atualmente trabalhamos com Pix via Asaas. Em breve aceitaremos cartão de crédito e boleto.',
  },
  {
    q: 'Posso cancelar minha assinatura?',
    a: 'Sim. Você pode cancelar a qualquer momento no seu perfil de cliente. O acesso permanece ativo até o fim do período pago.',
  },
];

const Contato = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  });
  const [sending, setSending] = useState(false);
  const [faqAberta, setFaqAberta] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 800, offset: 100, once: true });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast('Preencha nome, email e mensagem.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast('Email inválido.', 'error');
      return;
    }
    setSending(true);
    // TODO: integrar endpoint /api/contato (Fase futura).
    setTimeout(() => {
      setSending(false);
      showToast('Mensagem enviada! Entraremos em contato em breve.', 'success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 600);
  };

  const abrirWhatsApp = () => {
    const msg = encodeURIComponent('Olá! Vim pelo site iTrainer e gostaria de mais informações.');
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <main>
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(102,126,234,0.55), rgba(118,75,162,0.55)), url(https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&h=1080&fit=crop)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="hero-content" data-aos="fade-up">
          <h1>Entre em Contato</h1>
          <p>Estamos aqui para ajudar você a alcançar seus objetivos</p>
          <button className="btn-whatsapp-hero" onClick={abrirWhatsApp}>
            <i className="fab fa-whatsapp"></i> Fale conosco no WhatsApp
          </button>
        </div>
        <div className="hero-overlay"></div>
      </section>

      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info" data-aos="fade-right">
              <h2>Informações de Contato</h2>

              <div className="info-item">
                <i className="fas fa-map-marker-alt"></i>
                <div>
                  <h3>Endereço</h3>
                  <p>Av. Principal, 123 - Centro</p>
                  <p>Rio de Janeiro - RJ</p>
                </div>
              </div>

              <div className="info-item">
                <i className="fas fa-phone"></i>
                <div>
                  <h3>Telefone</h3>
                  <p>(21) 1234-5678</p>
                  <p>(21) 98765-4321</p>
                </div>
              </div>

              <div className="info-item">
                <i className="fab fa-whatsapp" style={{ color: '#25D366' }}></i>
                <div>
                  <h3>WhatsApp</h3>
                  <p>
                    <button className="link-button" onClick={abrirWhatsApp}>
                      Iniciar conversa
                    </button>
                  </p>
                </div>
              </div>

              <div className="info-item">
                <i className="fas fa-envelope"></i>
                <div>
                  <h3>Email</h3>
                  <p>contato@iTrainer.com</p>
                  <p>suporte@iTrainer.com</p>
                </div>
              </div>

              <div className="info-item">
                <i className="fas fa-clock"></i>
                <div>
                  <h3>Horário de Atendimento</h3>
                  <p>Segunda a Sexta: 8h às 20h</p>
                  <p>Sábado: 8h às 14h</p>
                  <p>Domingo: Fechado</p>
                </div>
              </div>

              <div className="social-icons">
                <h3>Siga-nos</h3>
                <div className="social-list">
                  {SOCIAL.map((s) => (
                    <a
                      key={s.nome}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.nome}
                      className="social-link"
                    >
                      <i className={`fab ${s.icone}`}></i>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="contact-form" data-aos="fade-left">
              <h2>Envie sua Mensagem</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Nome Completo *</label>
                  <input
                    type="text" id="name" name="name"
                    value={formData.name} onChange={handleInputChange} required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email" id="email" name="email"
                    value={formData.email} onChange={handleInputChange} required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Telefone</label>
                  <input
                    type="tel" id="phone" name="phone"
                    value={formData.phone} onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Assunto</label>
                  <select
                    id="subject" name="subject"
                    value={formData.subject} onChange={handleInputChange}
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="agendamento">Agendamento de Treino</option>
                    <option value="duvidas">Dúvidas</option>
                    <option value="orcamento">Orçamento</option>
                    <option value="parceria">Parceria</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Mensagem *</label>
                  <textarea
                    id="message" name="message" rows="5"
                    value={formData.message} onChange={handleInputChange} required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container">
          <h2 data-aos="fade-up">Perguntas Frequentes</h2>
          <div className="faq-list">
            {FAQ.map((item, idx) => (
              <div
                key={idx}
                className={`faq-item ${faqAberta === idx ? 'aberta' : ''}`}
                data-aos="fade-up"
              >
                <button
                  className="faq-pergunta"
                  onClick={() => setFaqAberta(faqAberta === idx ? null : idx)}
                  aria-expanded={faqAberta === idx}
                >
                  <span>{item.q}</span>
                  <i className={`fas ${faqAberta === idx ? 'fa-minus' : 'fa-plus'}`}></i>
                </button>
                {faqAberta === idx && <div className="faq-resposta">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="map-section">
        <div className="container">
          <div className="map-container" data-aos="fade-up">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3673.121794492808!2d-43.18094768452811!3d-22.9064191!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x997f58a6a00a9d%3A0x3f251d85272f76f7!2sAv.%20Rio%20Branco%2C%201%20-%20Centro%2C%20Rio%20de%20Janeiro%20-%20RJ%2C%2020090-003!5e0!3m2!1spt-BR!2sbr!4v1648123456789!5m2!1spt-BR!2sbr"
              width="100%" height="400"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              title="Localização iTrainer"
            ></iframe>
          </div>
        </div>
      </section>

      <button className="whatsapp-float" onClick={abrirWhatsApp} aria-label="Abrir WhatsApp">
        <i className="fab fa-whatsapp"></i>
      </button>
    </main>
  );
};

export default Contato;
