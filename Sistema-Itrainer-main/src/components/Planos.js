import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './Planos.css';

const formatBRL = (cents) => (cents / 100).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL',
});

// Planos de demonstração (mostrados quando nenhum profissional cadastrou plano ainda).
const PLANOS_DEMO = [
  {
    plano_id: 'demo-basic',
    titulo: 'Treino Iniciante',
    descricao: '2 sessões por semana, foco em adaptação e condicionamento.',
    preco_centavos: 19900,
    duracao_dias: 30,
    profissional_nome: 'Joana Lima',
    demo: true,
  },
  {
    plano_id: 'demo-hipertrofia',
    titulo: 'Hipertrofia Mensal',
    descricao: '3 sessões por semana, divisão ABC, acompanhamento semanal.',
    preco_centavos: 34900,
    duracao_dias: 30,
    profissional_nome: 'Carlos Mendes',
    demo: true,
  },
  {
    plano_id: 'demo-premium',
    titulo: 'Premium Trimestral',
    descricao: 'Treino + plano nutricional + chat 24/7 com o profissional.',
    preco_centavos: 89900,
    duracao_dias: 90,
    profissional_nome: 'Ana Souza',
    demo: true,
  },
];

const Planos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usandoDemo, setUsandoDemo] = useState(false);
  const [checkout, setCheckout] = useState({ aberto: false, plano: null });
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [pixResult, setPixResult] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/planos')
      .then((r) => {
        if (!alive) return;
        const lista = r.data?.planos || [];
        if (lista.length === 0) {
          setPlanos(PLANOS_DEMO);
          setUsandoDemo(true);
        } else {
          setPlanos(lista);
          setUsandoDemo(false);
        }
      })
      .catch((err) => {
        if (!alive) return;
        // Backend offline → mostra demos pra UI nao ficar vazia
        setPlanos(PLANOS_DEMO);
        setUsandoDemo(true);
        if (err?.response) {
          showToast('Erro ao carregar planos. Exibindo exemplos.', 'error');
        }
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [showToast]);

  const isCliente = user?.tipo === 'cliente';

  const openCheckout = (plano) => {
    if (plano.demo) {
      showToast('Plano de demonstração. Profissionais precisam cadastrar planos reais.', 'info');
      return;
    }
    if (!user) {
      showToast('Faça login como cliente para assinar.', 'error');
      navigate('/login');
      return;
    }
    if (!isCliente) {
      showToast('Apenas clientes podem assinar planos.', 'error');
      return;
    }
    setPixResult(null);
    setCpfCnpj('');
    setCheckout({ aberto: true, plano });
  };

  const closeCheckout = () => {
    setCheckout({ aberto: false, plano: null });
    setPixResult(null);
  };

  const confirmarPagamento = async () => {
    if (!checkout.plano) return;
    if (!/^\d{11}$|^\d{14}$/.test(cpfCnpj.replace(/\D/g, ''))) {
      showToast('CPF (11) ou CNPJ (14) inválido.', 'error');
      return;
    }
    setPaying(true);
    try {
      const resp = await api.post('/pagamentos', {
        plano_id: checkout.plano.plano_id,
        cpfCnpj: cpfCnpj.replace(/\D/g, ''),
      });
      setPixResult({
        payload: resp.data?.pix?.payload,
        encodedImage: resp.data?.pix?.encodedImage,
        expirationDate: resp.data?.pix?.expirationDate,
      });
      showToast('Cobrança Pix gerada. Aguardando confirmação.', 'success');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Erro ao gerar cobrança.';
      showToast(msg, 'error');
    } finally {
      setPaying(false);
    }
  };

  const copiarPayload = async () => {
    if (!pixResult?.payload) return;
    try {
      await navigator.clipboard.writeText(pixResult.payload);
      showToast('Código Pix copiado!', 'success');
    } catch {
      showToast('Não foi possível copiar.', 'error');
    }
  };

  const planosOrdenados = useMemo(
    () => [...planos].sort((a, b) => a.preco_centavos - b.preco_centavos),
    [planos]
  );

  return (
    <div className="planos-container">
      <div className="planos-header">
        <h2>Planos de Treino</h2>
        <p>Escolha um plano de um profissional e ative sua assinatura.</p>
        {usandoDemo && (
          <p className="aviso-demo">
            Exibindo planos de exemplo. Profissionais cadastrados podem criar seus próprios planos.
          </p>
        )}
      </div>

      {loading && <p style={{ textAlign: 'center' }}>Carregando planos...</p>}

      <div className="planos-grid">
        {planosOrdenados.map((p) => (
          <div key={p.plano_id} className={`plano-card ${p.demo ? 'plano-demo' : ''}`}>
            {p.demo && <span className="badge-demo">EXEMPLO</span>}
            <div className="plano-title">{p.titulo}</div>
            <div className="plano-price">{formatBRL(p.preco_centavos)} / {p.duracao_dias} dias</div>
            <p className="plano-autor">Por: {p.profissional_nome}</p>
            {p.descricao && <p className="plano-desc">{p.descricao}</p>}
            <div className="plano-action">
              <button className="plano-btn assinar" onClick={() => openCheckout(p)} disabled={p.demo}>
                {p.demo ? 'Indisponível' : 'Assinar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {checkout.aberto && (
        <div className="modal">
          <div className="modal-content">
            <h4 className="modal-title">
              {pixResult ? 'Pague via Pix' : `Assinar: ${checkout.plano?.titulo}`}
            </h4>

            {!pixResult && (
              <>
                <p>Valor: <strong>{formatBRL(checkout.plano.preco_centavos)}</strong></p>
                <div className="modal-field">
                  <label>CPF ou CNPJ
                    <input
                      type="text"
                      placeholder="Somente números"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                    />
                  </label>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={closeCheckout}>Cancelar</button>
                  <button className="btn btn-primary" onClick={confirmarPagamento} disabled={paying}>
                    {paying ? 'Gerando Pix...' : 'Gerar Pix'}
                  </button>
                </div>
              </>
            )}

            {pixResult && (
              <>
                {pixResult.encodedImage && (
                  <div style={{ textAlign: 'center', margin: '16px 0' }}>
                    <img
                      src={`data:image/png;base64,${pixResult.encodedImage}`}
                      alt="QR Code Pix"
                      style={{ maxWidth: 240 }}
                    />
                  </div>
                )}
                <div className="modal-field">
                  <label>Código Pix (copia e cola)
                    <textarea readOnly rows={4} value={pixResult.payload || ''} />
                  </label>
                </div>
                {pixResult.expirationDate && (
                  <p>Expira em: {new Date(pixResult.expirationDate).toLocaleString('pt-BR')}</p>
                )}
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={closeCheckout}>Fechar</button>
                  <button className="btn btn-primary" onClick={copiarPayload}>Copiar código</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Planos;
