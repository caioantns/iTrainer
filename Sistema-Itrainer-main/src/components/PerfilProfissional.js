import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { resolveFotoUrl, fallbackAvatar } from '../utils/foto';
import './PerfilProfissional.css';

const FALLBACK_FOTO = fallbackAvatar;

const horariosPadrao = Array.from({ length: 11 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);
const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIA_INDEX = { 'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6 };

// Mocks de fallback p/ rotas /profissional/prof-* (não DB)
const mockProfessionals = {
  'prof-joana':   { nome: 'Joana Lima',     cref: 'CREF 123456-G/RJ', bio: 'Personal trainer com 8 anos de experiência focada em musculação e funcional.', especialidades: ['musculacao','funcional'], localizacao: 'Rio de Janeiro - RJ', online: true,  precoHora: 120 },
  'prof-carlos':  { nome: 'Carlos Mendes',  cref: 'CREF 654321-G/SP', bio: 'Instrutor de Yoga e Pilates com foco em saúde e reabilitação.',           especialidades: ['yoga','pilates'],         localizacao: 'São Paulo - SP',     online: false, precoHora: 90  },
  'prof-ana':     { nome: 'Ana Souza',      cref: 'CREF 112233-G/MG', bio: 'Treinadora de Crossfit e Funcional com foco em performance e saúde.',   especialidades: ['crossfit','funcional'],   localizacao: 'Belo Horizonte - MG',online: true,  precoHora: 110 },
  'prof-rodrigo': { nome: 'Rodrigo Alves',  cref: 'CREF 998877-G/RS', bio: 'Especialista em musculação e condicionamento com foco em saúde geral.', especialidades: ['musculacao','funcional'], localizacao: 'Porto Alegre - RS',  online: false, precoHora: 80  },
  'prof-paula':   { nome: 'Paula Ribeiro',  cref: 'CREF 445566-G/PR', bio: 'Instrutora de Pilates e Reabilitação, foco em qualidade de vida.',      especialidades: ['pilates','reabilitacao'], localizacao: 'Curitiba - PR',      online: true,  precoHora: 100 },
};

function nextDateForWeekday(diaTexto, horarioStr) {
  const targetDow = DIA_INDEX[diaTexto] ?? 1;
  const now = new Date();
  const result = new Date(now);
  const diff = (targetDow - now.getDay() + 7) % 7;
  result.setDate(now.getDate() + (diff === 0 ? 7 : diff));
  const [hh, mm] = (horarioStr || '08:00').split(':');
  result.setHours(Number(hh), Number(mm || 0), 0, 0);
  return result;
}

const PerfilProfissional = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isDb = String(id).startsWith('db-');

  const [prof, setProf] = useState(null);
  const [agenda, setAgenda] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [selecionados, setSelecionados] = useState({ dia: diasSemana[0], horario: horariosPadrao[0] });
  const [enviando, setEnviando] = useState(false);

  // Carregar perfil
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (isDb) {
          const numericId = String(id).replace('db-', '');
          const res = await api.get(`/profissionais/${numericId}`);
          const r = res.data?.profissional;
          if (!r) throw new Error('Profissional não encontrado');
          const mapped = {
            id: `db-${r.id}`,
            numericId: Number(r.id),
            nome: r.nome,
            cref: r.cref || 'CREF —',
            bio: r.descricao || 'Perfil em construção.',
            especialidades: r.especialidades || [],
            localizacao: r.localizacao || '—',
            online: r.online !== false,
            precoHora: r.preco_hora || 100,
            foto: r.foto_url ? resolveFotoUrl(r.foto_url) : FALLBACK_FOTO(r.nome),
            pacotes: [
              { nome: 'Sessão Avulsa', preco: r.preco_hora || 100 },
              { nome: 'Mensal (4 sessões)', preco: (r.preco_hora || 100) * 4 },
            ],
            depoimentos: [],
          };
          if (mounted) setProf(mapped);
        } else {
          const m = mockProfessionals[id];
          if (!m) throw new Error('Profissional não encontrado');
          if (mounted) setProf({
            id,
            numericId: null,
            ...m,
            foto: FALLBACK_FOTO(m.nome),
            pacotes: [
              { nome: 'Sessão Avulsa', preco: m.precoHora },
              { nome: 'Mensal (4 sessões)', preco: m.precoHora * 4 },
            ],
            depoimentos: [
              { autor: 'Cliente Anônimo', texto: 'Ótimo acompanhamento e treinos bem planejados.' },
            ],
          });
        }
      } catch (err) {
        if (mounted) setError(err?.response?.data?.error || err.message || 'Falha ao carregar profissional.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, isDb]);

  // Carregar agenda
  useEffect(() => {
    if (!prof?.numericId) {
      // Mock: agenda toda disponível
      const iniciais = {};
      diasSemana.forEach((d) => {
        iniciais[d] = {};
        horariosPadrao.forEach((h) => { iniciais[d][h] = true; });
      });
      setAgenda(iniciais);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/horarios', { params: { profissional_id: prof.numericId } });
        const rows = res.data?.horarios || [];
        const grid = {};
        diasSemana.forEach((d) => { grid[d] = {}; });
        rows.forEach((r) => {
          const diaIdx = Number(r.dia_semana);
          const diaTxt = Object.keys(DIA_INDEX).find((k) => DIA_INDEX[k] === diaIdx) || diasSemana[0];
          if (!grid[diaTxt]) return;
          const hInicio = String(r.hora_inicio).slice(0, 5);
          grid[diaTxt][hInicio] = !!r.ativo;
        });
        diasSemana.forEach((d) => {
          horariosPadrao.forEach((h) => {
            if (typeof grid[d][h] === 'undefined') grid[d][h] = true;
          });
        });
        if (mounted) setAgenda(grid);
      } catch {
        const iniciais = {};
        diasSemana.forEach((d) => {
          iniciais[d] = {};
          horariosPadrao.forEach((h) => { iniciais[d][h] = true; });
        });
        if (mounted) setAgenda(iniciais);
      }
    })();
    return () => { mounted = false; };
  }, [prof]);

  const horariosDia = useMemo(() => {
    const d = selecionados.dia;
    return Object.keys(agenda[d] || {})
      .sort()
      .map((h) => ({ h, disponivel: agenda[d][h] }));
  }, [agenda, selecionados]);

  const solicitarAgendamento = async () => {
    if (!prof) return;
    if (!user) {
      showToast('Faça login como cliente para agendar.', 'error');
      return;
    }
    if (user.tipo !== 'cliente') {
      showToast('Apenas clientes podem agendar.', 'error');
      return;
    }
    if (!prof.numericId) {
      showToast('Profissional de exemplo. Cadastre-se para ver profissionais reais.', 'info');
      return;
    }
    setEnviando(true);
    try {
      const dataHora = nextDateForWeekday(selecionados.dia, selecionados.horario).toISOString();
      await api.post('/agendamentos', {
        profissional_id: prof.numericId,
        data_hora: dataHora,
      });
      setModalAberto(false);
      showToast('Solicitação enviada!', 'success');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Falha ao criar solicitação.';
      showToast(msg, 'error');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <main className="perfil-prof-container"><p>Carregando perfil...</p></main>;
  if (error) return <main className="perfil-prof-container"><p className="erro">{error}</p></main>;
  if (!prof) return <main className="perfil-prof-container"><p>Profissional não encontrado.</p></main>;

  return (
    <main className="perfil-prof-container">
      <section className="perfil-header">
        <img
          className="perfil-foto"
          src={prof.foto}
          alt={`Foto de ${prof.nome}`}
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_FOTO(prof.nome); }}
        />
        <div className="perfil-info">
          <h1>{prof.nome}</h1>
          <p className="perfil-cref">{prof.cref}</p>
          <p className="perfil-local">
            {prof.localizacao} • {prof.online ? 'Online' : 'Presencial'}
          </p>
          {prof.especialidades.length > 0 && (
            <p className="perfil-local">Especialidades: {prof.especialidades.join(', ')}</p>
          )}
          <p className="perfil-bio">{prof.bio}</p>
          <div className="perfil-pacotes">
            {prof.pacotes.map((p, idx) => (
              <div key={idx} className="pacote">
                <span>{p.nome}</span>
                <strong>R$ {p.preco}</strong>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setModalAberto(true)}>
            Agendar
          </button>
        </div>
      </section>

      {prof.depoimentos.length > 0 && (
        <section className="perfil-galeria">
          <h2>Depoimentos</h2>
          <div className="depo-grid">
            {prof.depoimentos.map((d, i) => (
              <div key={i} className="depo-item">
                <p>“{d.texto}”</p>
                <span>— {d.autor}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {modalAberto && (
        <div className="modal">
          <div className="modal-content">
            <h3>Agendar com {prof.nome}</h3>
            <label>Dia
              <select
                value={selecionados.dia}
                onChange={(e) => setSelecionados((s) => ({ ...s, dia: e.target.value }))}
              >
                {diasSemana.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label>Horário
              <select
                value={selecionados.horario}
                onChange={(e) => setSelecionados((s) => ({ ...s, horario: e.target.value }))}
              >
                {horariosDia.filter((h) => h.disponivel).map((h) => (
                  <option key={h.h} value={h.h}>{h.h}</option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={solicitarAgendamento} disabled={enviando}>
                {enviando ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default PerfilProfissional;
