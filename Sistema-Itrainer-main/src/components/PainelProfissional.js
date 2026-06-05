import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import MeusPlanos from './MeusPlanos';
import EditarPerfilProfissional from './EditarPerfilProfissional';
import Agendamentos from './Agendamentos';
import './PainelProfissional.css';

const PainelProfissional = () => {
  const [user, setUser] = useState(null);
  const [profissional, setProfissional] = useState(undefined);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [horarios, setHorarios] = useState({});
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [precoHora, setPrecoHora] = useState(100);
  const [plano, setPlano] = useState('basic'); // basic | premium
  const [periodo, setPeriodo] = useState('30'); // 'hoje' | '7' | '30' | 'todos'
  const [filtroHorarios, setFiltroHorarios] = useState('todos'); // 'todos' | 'disponivel' | 'ocupado'
  const [alunoModal, setAlunoModal] = useState({ aberto: false, nome: '', prontuario: { lesoes: '', metas: '', anamnese: '' } });
  const inputFotoRef = useRef(null);

  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const horariosDisponiveis = Array.from({ length: 11 }, (_, i) => `${i + 8}:00`);

  useEffect(() => {
    let raw;
    try { raw = localStorage.getItem('itrainer_user'); } catch {}
    if (!raw) return;

    let userObj;
    try { userObj = JSON.parse(raw); } catch { return; }
    setUser(userObj);

    const loadProfile = async () => {
      // --- Carrega perfil do profissional via API ---
      if (userObj.id) {
        try {
          const res = await api.get(`/profissionais/${userObj.id}`);
          const prof = res.data?.profissional;
          if (prof) {
            setProfissional(prof);
            if (prof.foto_url) setFotoPreview(prof.foto_url);
          }
        } catch (err) {
          console.warn('Não foi possível carregar perfil via API:', err?.message);
        }
      }

      // --- Carrega horários via API ---
      try {
        if (userObj.id) {
          const res = await api.get('/horarios', { params: { profissional_id: userObj.id } });
          const rows = res.data?.horarios || [];
          const grid = {};
          diasSemana.forEach(d => { grid[d] = {}; });
          rows.forEach((r) => {
            const diaIdx = Number(r.dia_semana);
            const diaTxt = diasSemana[diaIdx] ?? diasSemana[0];
            const hInicio = String(r.hora_inicio).slice(0, 5);
            grid[diaTxt][hInicio] = !!r.ativo;
          });
          // Preencher slots não definidos como true por padrão
          diasSemana.forEach((d) => {
            horariosDisponiveis.forEach((h) => {
              if (typeof grid[d][h] === 'undefined') grid[d][h] = true;
            });
          });
          setHorarios(grid);
        } else {
          throw new Error('sem id');
        }
      } catch {
        const storageEmail = (userObj.email || '').toLowerCase();
        let horariosData;
        try { horariosData = localStorage.getItem(`horarios_${storageEmail}`); } catch {}
        if (horariosData) {
          try { setHorarios(JSON.parse(horariosData)); } catch {}
        } else {
          const horariosIniciais = {};
          diasSemana.forEach(dia => {
            horariosIniciais[dia] = {};
            horariosDisponiveis.forEach(horario => { horariosIniciais[dia][horario] = true; });
          });
          setHorarios(horariosIniciais);
          try { localStorage.setItem(`horarios_${storageEmail}`, JSON.stringify(horariosIniciais)); } catch {}
        }
      }

      // --- Carrega agendamentos via API ---
      try {
        if (userObj.id) {
          const [pend, hist] = await Promise.all([
            api.get('/agendamentos', { params: { profissional_id: userObj.id, status: 'PENDENTE' } }),
            api.get('/agendamentos', { params: { profissional_id: userObj.id, status: 'CONFIRMADO,CANCELADO,CONCLUIDO' } }),
          ]);
          const toSolic = (pend.data?.agendamentos || []).map(a => ({
            id: a.agendamento_id,
            aluno: `Cliente #${a.cliente_id}`,
            data: new Date(a.data_hora).toLocaleDateString('pt-BR'),
            horario: new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          }));
          setSolicitacoes(toSolic);
          const toHist = (hist.data?.agendamentos || []).map(a => ({
            aluno: `Cliente #${a.cliente_id}`,
            data: new Date(a.data_hora).toLocaleString('pt-BR'),
            horario: '',
            tipo: 'Aula',
            status: a.status,
            timestamp: Date.parse(a.data_hora),
            dataISO: a.data_hora,
          }));
          setHistorico(toHist);
        } else {
          throw new Error('sem id');
        }
      } catch {
        const storageEmail = (userObj.email || '').toLowerCase();
        let solicitacoesData, historicoData;
        try { solicitacoesData = localStorage.getItem(`solicitacoes_${storageEmail}`); } catch {}
        try { historicoData = localStorage.getItem(`historico_${storageEmail}`); } catch {}
        if (solicitacoesData) { try { setSolicitacoes(JSON.parse(solicitacoesData)); } catch {} }
        if (historicoData) { try { setHistorico(JSON.parse(historicoData)); } catch {} }
      }

      // --- Carrega dados financeiros e configurações do localStorage ---
      const storageEmail = (userObj.email || '').toLowerCase();
      try {
        const finData = localStorage.getItem(`financeiro_${storageEmail}`);
        if (finData) setFinanceiro(JSON.parse(finData));
      } catch {}
      try {
        const ph = localStorage.getItem(`precoHora_${storageEmail}`);
        if (ph) setPrecoHora(Number(ph));
      } catch {}
      try {
        const planoData = localStorage.getItem(`plano_${storageEmail}`);
        if (planoData) setPlano(planoData);
      } catch {}
    };

    loadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const handleFotoClick = () => {
    inputFotoRef.current?.click();
  };

  const handleFotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
        salvarFoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const salvarFoto = (fotoBase64) => {
    const allUsers = JSON.parse(localStorage.getItem('itrainer_users') || '[]');
    const userIndex = allUsers.findIndex(u => u.email === user.email && u.type === 'professional');
    
    if (userIndex !== -1) {
      allUsers[userIndex] = {
        ...allUsers[userIndex],
        foto: fotoBase64
      };
      localStorage.setItem('itrainer_users', JSON.stringify(allUsers));
      setProfissional(allUsers[userIndex]);
    }
  };

  const toggleHorario = async (dia, horario) => {
    const novoValor = !horarios[dia]?.[horario];
    // Atualiza UI imediato
    setHorarios(h => ({ ...h, [dia]: { ...h[dia], [horario]: novoValor } }));
    // Persistência via API (upsert) e fallback para localStorage
    try {
      if (user?.id) {
        const diaIdx = diasSemana.indexOf(dia);
        const horaInicio = horario.padStart(5, '0');
        // Considera slots de 1h
        const [hh, mm] = horaInicio.split(':');
        const fimH = String(Number(hh) + 1).padStart(2, '0');
        const horaFim = `${fimH}:${mm}`;
        await api.post('/horarios', {
          dia_semana: diaIdx,
          hora_inicio: horaInicio,
          hora_fim: horaFim,
          ativo: novoValor,
        });
      } else {
        throw new Error('Sem id de profissional');
      }
    } catch (err) {
      const storageEmail = (user?.email || '').toLowerCase();
      const novosHorarios = {
        ...horarios,
        [dia]: {
          ...horarios[dia],
          [horario]: novoValor
        }
      };
      localStorage.setItem(`horarios_${storageEmail}`, JSON.stringify(novosHorarios));
    }
  };

  const liberarDia = async (dia) => {
    const day = { ...(horarios[dia] || {}) };
    horariosDisponiveis.forEach(h => { day[h] = true; });
    const novosHorarios = { ...horarios, [dia]: day };
    setHorarios(novosHorarios);
    try {
      if (user?.id) {
        const diaIdx = diasSemana.indexOf(dia);
        const slots = horariosDisponiveis.map((horario) => {
          const hIni = horario.padStart(5, '0');
          const [hh, mm] = hIni.split(':');
          const hFim = `${String(Number(hh) + 1).padStart(2, '0')}:${mm}`;
          return { dia_semana: diaIdx, hora_inicio: hIni, hora_fim: hFim, ativo: true };
        });
        await api.post('/horarios/bulk', { slots });
      }
    } catch (err) {
      const storageEmail = (user?.email || '').toLowerCase();
      localStorage.setItem(`horarios_${storageEmail}`, JSON.stringify(novosHorarios));
    }
  };

  const bloquearDia = async (dia) => {
    const day = { ...(horarios[dia] || {}) };
    horariosDisponiveis.forEach(h => { day[h] = false; });
    const novosHorarios = { ...horarios, [dia]: day };
    setHorarios(novosHorarios);
    try {
      if (user?.id) {
        const diaIdx = diasSemana.indexOf(dia);
        const slots = horariosDisponiveis.map((horario) => {
          const hIni = horario.padStart(5, '0');
          const [hh, mm] = hIni.split(':');
          const hFim = `${String(Number(hh) + 1).padStart(2, '0')}:${mm}`;
          return { dia_semana: diaIdx, hora_inicio: hIni, hora_fim: hFim, ativo: false };
        });
        await api.post('/horarios/bulk', { slots });
      }
    } catch (err) {
      const storageEmail = (user?.email || '').toLowerCase();
      localStorage.setItem(`horarios_${storageEmail}`, JSON.stringify(novosHorarios));
    }
  };

  const handleSolicitacao = async (id, aceitar) => {
    const solicitacao = solicitacoes.find(s => s.id === id);
    if (solicitacao) {
      if (aceitar) {
        const taxa = plano === 'premium' ? 0.05 : 0.15; // sugerido
        const valorBruto = Number(precoHora) || 0; // por hora; pacotes podem ajustar futuramente
        const valorLiquido = Math.round((valorBruto * (1 - taxa)) * 100) / 100;
        const receitaPlataforma = Math.round((valorBruto * taxa) * 100) / 100;
        const timestamp = Date.now();
        const dataISO = new Date().toISOString();

        // Adicionar ao histórico
        const novoHistorico = [...historico, {
          aluno: solicitacao.aluno,
          data: solicitacao.data,
          horario: solicitacao.horario,
          tipo: 'Aula agendada',
          status: 'Confirmada',
          timestamp,
          dataISO
        }];
        setHistorico(novoHistorico);
        try {
          if (id && user?.id) {
            // tentar atualizar status no backend se id for agendamento_id real
            await api.patch(`/agendamentos/${id}/status`, { status: 'CONFIRMADO' });
          }
        } catch {}
        localStorage.setItem(`historico_${user.email}`, JSON.stringify(novoHistorico));

        // Bloquear horário na agenda
        const novosHorarios = { ...horarios, [solicitacao.data]: { ...horarios[solicitacao.data], [solicitacao.horario]: false } };
        setHorarios(novosHorarios);
        try {
          if (user?.id) {
            const diaIdx = diasSemana.indexOf(solicitacao.data);
            const horaInicio = solicitacao.horario.padStart(5, '0');
            const [hh, mm] = horaInicio.split(':');
            const horaFim = `${String(Number(hh) + 1).padStart(2, '0')}:${mm}`;
            await api.post('/horarios', { dia_semana: diaIdx, hora_inicio: horaInicio, hora_fim: horaFim, ativo: false });
          }
        } catch {}
        localStorage.setItem(`horarios_${user.email}`, JSON.stringify(novosHorarios));

        // Lançar receita no financeiro
        const novoLancamento = { id: `${Date.now()}`, aluno: solicitacao.aluno, data: solicitacao.data, horario: solicitacao.horario, valorBruto, taxa, valorLiquido, timestamp, dataISO };
        const novoFinanceiro = [...financeiro, novoLancamento];
        setFinanceiro(novoFinanceiro);
        localStorage.setItem(`financeiro_${user.email}`, JSON.stringify(novoFinanceiro));

        // Registrar receita da plataforma (global)
        const keyPlat = 'plataforma_financeiro';
        const regPlat = JSON.parse(localStorage.getItem(keyPlat) || '[]');
        regPlat.push({ id: `${Date.now()}`, pefEmail: user.email, aluno: solicitacao.aluno, data: solicitacao.data, horario: solicitacao.horario, valorBruto, taxa, receitaPlataforma, timestamp, dataISO });
        localStorage.setItem(keyPlat, JSON.stringify(regPlat));
      }

      // Remover solicitação (ou recusar)
      try {
        if (!aceitar && id && user?.id) {
          await api.patch(`/agendamentos/${id}/status`, { status: 'CANCELADO' });
        }
      } catch {}
      const novasSolicitacoes = solicitacoes.filter(s => s.id !== id);
      setSolicitacoes(novasSolicitacoes);
      const storageEmail = (user?.email || '').toLowerCase();
      localStorage.setItem(`solicitacoes_${storageEmail}`, JSON.stringify(novasSolicitacoes));
    }
  };

  const salvarPlano = (p) => {
    setPlano(p);
    if (user?.email) {
      const storageEmail = (user.email || '').toLowerCase();
      localStorage.setItem(`plano_${storageEmail}`, p);
    }
  };

  const salvarPrecoHora = (valor) => {
    setPrecoHora(valor);
    if (user?.email) {
      const storageEmail = (user.email || '').toLowerCase();
      localStorage.setItem(`precoHora_${storageEmail}`, String(valor));
    }
  };

  const abrirProntuario = (nomeAluno) => {
    const storageEmail = (user?.email || '').toLowerCase();
    const chave = `prontuario_${storageEmail}_${nomeAluno}`;
    const dados = JSON.parse(localStorage.getItem(chave) || '{"lesoes":"","metas":"","anamnese":""}');
    setAlunoModal({ aberto: true, nome: nomeAluno, prontuario: dados });
  };

  const salvarProntuario = () => {
    const storageEmail = (user?.email || '').toLowerCase();
    const chave = `prontuario_${storageEmail}_${alunoModal.nome}`;
    localStorage.setItem(chave, JSON.stringify(alunoModal.prontuario));
    setAlunoModal({ aberto: false, nome: '', prontuario: { lesoes: '', metas: '', anamnese: '' } });
    alert('Prontuário salvo com sucesso!');
  };

  if (!user) {
    return (
      <main className="painel-container">
        <div className="prof-perfil">
          <h1>Painel do Profissional</h1>
          <p>Usuário não encontrado. Faça login novamente.</p>
        </div>
      </main>
    );
  }

  // Helpers para período e tendências
  const nowMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const getEntryTime = (e) => {
    if (!e) return null;
    if (typeof e.timestamp === 'number') return e.timestamp;
    if (e.dataISO) {
      const t = Date.parse(e.dataISO);
      return Number.isNaN(t) ? null : t;
    }
    // tentativa de parse de 'data' se for ISO/Date
    if (e.data) {
      const t = Date.parse(e.data);
      return Number.isNaN(t) ? null : t;
    }
    return null;
  };

  const boundsForPeriod = (p) => {
    if (p === 'hoje') return { start: nowMs - dayMs, end: nowMs, prevStart: nowMs - 2 * dayMs, prevEnd: nowMs - dayMs };
    if (p === '7') return { start: nowMs - 7 * dayMs, end: nowMs, prevStart: nowMs - 14 * dayMs, prevEnd: nowMs - 7 * dayMs };
    if (p === '30') return { start: nowMs - 30 * dayMs, end: nowMs, prevStart: nowMs - 60 * dayMs, prevEnd: nowMs - 30 * dayMs };
    return { start: -Infinity, end: Infinity, prevStart: -Infinity, prevEnd: -Infinity };
  };

  const { start, end, prevStart, prevEnd } = boundsForPeriod(periodo);
  const inRange = (t) => t != null && t >= start && t < end;
  const inPrevRange = (t) => t != null && t >= prevStart && t < prevEnd;

  // Métricas derivadas do dashboard
  const formatBRL = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const historicoFiltrado = historico.filter(h => inRange(getEntryTime(h)) || periodo === 'todos');
  const financeiroFiltrado = financeiro.filter(f => inRange(getEntryTime(f)) || periodo === 'todos');
  const pendentes = solicitacoes.length; // pendências atuais, sem filtro temporal
  const atendimentos = historicoFiltrado.length;
  const alunosAtivos = Array.from(new Set(historicoFiltrado.map(h => h.aluno))).length;
  const totalLiquido = financeiroFiltrado.reduce((acc, f) => acc + Number((f.valorLiquido ?? f.valor ?? 0)), 0);
  const totalPlataforma = financeiroFiltrado.reduce((acc, f) => acc + Number((f.valorBruto && f.taxa) ? (f.valorBruto * f.taxa) : 0), 0);
  const totalSomado = totalLiquido + totalPlataforma;
  const percLiquido = totalSomado > 0 ? Math.round((totalLiquido / totalSomado) * 100) : 0;
  const percPlataforma = totalSomado > 0 ? 100 - percLiquido : 0;

  // Tendências
  const historicoPrev = historico.filter(h => inPrevRange(getEntryTime(h)));
  const financeiroPrev = financeiro.filter(f => inPrevRange(getEntryTime(f)));
  const atendPrev = historicoPrev.length;
  const totalLiquidoPrev = financeiroPrev.reduce((acc, f) => acc + Number((f.valorLiquido ?? f.valor ?? 0)), 0);
  const trendCalc = (current, prev) => {
    if (!prev || prev <= 0) return null;
    const perc = Math.round(((current - prev) / prev) * 100);
    return { perc, up: perc >= 0 };
  };
  const trendAtend = trendCalc(atendimentos, atendPrev);
  const trendFatur = trendCalc(totalLiquido, totalLiquidoPrev);

  // Sparkline de faturamento (últimos 12 lançamentos do período)
  const lastFinanceiro = [...financeiroFiltrado].sort((a,b) => (getEntryTime(a) ?? 0) - (getEntryTime(b) ?? 0)).slice(-12);
  const sparkVals = lastFinanceiro.map(f => Number(f.valorLiquido ?? f.valor ?? 0));
  const sparkMax = Math.max(10, ...sparkVals, 0);

  return (
    <main className="painel-container">
      {/* Sidebar com informações do profissional */}
      <aside className="prof-sidebar">
        <div className="prof-perfil">
          <div className="prof-foto-container" onClick={handleFotoClick}>
            <div className="prof-foto">
              {fotoPreview ? (
                <img src={fotoPreview} alt={`Foto de ${user.name}`} />
              ) : (
                <div className="prof-foto-placeholder">👤</div>
              )}
              <div className="foto-overlay">
                <span>Clique para alterar a foto</span>
              </div>
            </div>
            <input
              type="file"
              ref={inputFotoRef}
              className="foto-input"
              accept="image/*"
              onChange={handleFotoChange}
            />
          </div>
          <div className="prof-info">
            <h1>{user.name}</h1>
            <div className="prof-detalhes">
              <div className="info-list">
                <div className="info-row"><span className="info-label">Área</span><span className="info-value">{Array.isArray(profissional?.especialidades) ? profissional.especialidades.join(', ') : (profissional?.especialidades || 'Área não especificada')}</span></div>
                <div className="info-row"><span className="info-label">Email</span><span className="info-value">{user.email}</span></div>
                <div className="info-row"><span className="info-label">Telefone</span><span className="info-value">{profissional?.telefone || 'Telefone não cadastrado'}</span></div>
                <div className="info-row"><span className="info-label">Localização</span><span className="info-value">{profissional?.localizacao || 'Localização não cadastrada'}</span></div>
              </div>

              <div className="plan-card">
                <h3>Plano e preço</h3>
                <div className="segmented" role="group" aria-label="Seleção de plano">
                  <button className={`seg-btn ${plano === 'basic' ? 'active' : ''}`} onClick={() => salvarPlano('basic')}>Basic</button>
                  <button className={`seg-btn ${plano === 'premium' ? 'active' : ''}`} onClick={() => salvarPlano('premium')}>Premium</button>
                </div>
                <div className="plan-meta">Seu plano: <strong>{plano === 'premium' ? 'Premium' : 'Basic'}</strong> • Comissão: <strong>{plano === 'premium' ? '5%' : '15%'}</strong></div>
                <div className="plan-actions"><a href="/planos">Gerenciar plano</a></div>
                <div className="input-group">
                  <span className="input-prefix">R$</span>
                  <input
                    type="number"
                    className="price-input"
                    value={precoHora}
                    onChange={(e) => salvarPrecoHora(Number(e.target.value))}
                  />
                  <div className="stepper">
                    <button className="step-btn" onClick={() => salvarPrecoHora(Math.max(0, Number(precoHora) - 10))}>−10</button>
                    <button className="step-btn" onClick={() => salvarPrecoHora(Number(precoHora) + 10)}>+10</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Área principal com horários, solicitações e histórico */}
      <div className="prof-main">
        {/* Dashboard */}
        <section className="dashboard">
          <h2 className="container-titulo">Visão Geral</h2>
          <div className="period-filter">
            <div className="segmented" role="group" aria-label="Filtro de período">
              <button className={`seg-btn ${periodo === 'hoje' ? 'active' : ''}`} onClick={() => setPeriodo('hoje')}>Hoje</button>
              <button className={`seg-btn ${periodo === '7' ? 'active' : ''}`} onClick={() => setPeriodo('7')}>7 dias</button>
              <button className={`seg-btn ${periodo === '30' ? 'active' : ''}`} onClick={() => setPeriodo('30')}>30 dias</button>
              <button className={`seg-btn ${periodo === 'todos' ? 'active' : ''}`} onClick={() => setPeriodo('todos')}>Todos</button>
            </div>
          </div>
          <div className="dashboard-cards">
            <div className="dash-card">
              <div className="dash-icon">📥</div>
              <div className="dash-meta">
                <span className="dash-label">Solicitações Pendentes</span>
                <strong className="dash-value">{pendentes}</strong>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-icon">✅</div>
              <div className="dash-meta">
                <span className="dash-label">Atendimentos</span>
                <div className="dash-row">
                  <strong className="dash-value">{atendimentos}</strong>
                  {trendAtend && (
                    <span className={`trend ${trendAtend.up ? 'up' : 'down'}`}>{trendAtend.up ? '▲' : '▼'} {Math.abs(trendAtend.perc)}%</span>
                  )}
                </div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-icon">👥</div>
              <div className="dash-meta">
                <span className="dash-label">Alunos Ativos</span>
                <strong className="dash-value">{alunosAtivos}</strong>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-icon">💰</div>
              <div className="dash-meta">
                <span className="dash-label">Faturamento</span>
                <div className="dash-row">
                  <strong className="dash-value">{formatBRL(totalLiquido)}</strong>
                  {trendFatur && (
                    <span className={`trend ${trendFatur.up ? 'up' : 'down'}`}>{trendFatur.up ? '▲' : '▼'} {Math.abs(trendFatur.perc)}%</span>
                  )}
                </div>
                <div className="sparkline" aria-hidden="true">
                  {sparkVals.map((v, i) => (
                    <div key={i} className="spark-bar" style={{ height: `${Math.max(2, Math.round((v / sparkMax) * 100))}%` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-icon">🏦</div>
              <div className="dash-meta">
                <span className="dash-label">Receita Plataforma</span>
                <strong className="dash-value">{formatBRL(totalPlataforma)}</strong>
              </div>
            </div>
          </div>
          <div className="revenue-summary">
            <div className="rev-row">
              <span className="rev-label">Receita PEF</span>
              <div className="rev-bar">
                <div className="rev-bar-inner pef" style={{ width: `${percLiquido}%` }} />
              </div>
            </div>
            <div className="rev-row">
              <span className="rev-label">Receita Plataforma</span>
              <div className="rev-bar">
                <div className="rev-bar-inner platform" style={{ width: `${percPlataforma}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* Container de Horários */}
        <section className="horarios-container">
          <h2 className="container-titulo">Horários Disponíveis</h2>
          <div className="horarios-toolbar">
            <div className="legend">
              <span className="legend-item available">✓ Disponível</span>
              <span className="legend-item occupied">⛔ Ocupado</span>
            </div>
            <div className="segmented" role="group" aria-label="Filtro de horários">
              <button className={`seg-btn ${filtroHorarios === 'todos' ? 'active' : ''}`} onClick={() => setFiltroHorarios('todos')}>Todos</button>
              <button className={`seg-btn ${filtroHorarios === 'disponivel' ? 'active' : ''}`} onClick={() => setFiltroHorarios('disponivel')}>Disponíveis</button>
              <button className={`seg-btn ${filtroHorarios === 'ocupado' ? 'active' : ''}`} onClick={() => setFiltroHorarios('ocupado')}>Ocupados</button>
            </div>
          </div>
          <div className="horarios-grid">
            {diasSemana.map(dia => (
              <div key={dia} className="dia-semana">
                <div className="dia-header">
                  <h3 className="dia-titulo">{dia}</h3>
                  <div className="dia-actions">
                    <button className="dia-action liberar" onClick={() => liberarDia(dia)}>Liberar dia</button>
                    <button className="dia-action bloquear" onClick={() => bloquearDia(dia)}>Bloquear dia</button>
                  </div>
                </div>
                <div className="horarios-row">
                  {horariosDisponiveis.map(horario => {
                    const disponivel = !!horarios[dia]?.[horario];
                    if (filtroHorarios === 'disponivel' && !disponivel) return null;
                    if (filtroHorarios === 'ocupado' && disponivel) return null;
                    return (
                      <button
                        key={horario}
                        className={`horario-btn ${disponivel ? 'disponivel' : 'ocupado'}`}
                        onClick={() => toggleHorario(dia, horario)}
                        type="button"
                        title={disponivel ? 'Clique para bloquear' : 'Clique para liberar'}
                      >
                        <span className="hora-text">{horario}</span>
                        <span className="hora-icon">{disponivel ? '✓' : '⛔'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Container de Solicitações */}
        <section className="solicitacoes-container">
          <h2 className="container-titulo">Solicitações de Agendamento</h2>
          {solicitacoes.length === 0 ? (
            <p>Nenhuma solicitação pendente</p>
          ) : (
            solicitacoes.map(solicitacao => (
              <div key={solicitacao.id} className="solicitacao-item">
                <div className="solicitacao-header">
                  <span className="solicitacao-aluno">{solicitacao.aluno}</span>
                  <span className="solicitacao-data">{solicitacao.data}</span>
                </div>
                <p>{solicitacao.horario}</p>
                <div className="solicitacao-acoes">
                  <button
                    className="btn-aceitar"
                    onClick={() => handleSolicitacao(solicitacao.id, true)}
                  >
                    Aceitar
                  </button>
                  <button
                    className="btn-recusar"
                    onClick={() => handleSolicitacao(solicitacao.id, false)}
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Container de Alunos */}
        <section className="alunos-container">
          <h2 className="container-titulo">Alunos</h2>
          {Array.from(new Set(historico.map(h => h.aluno))).length === 0 ? (
            <p>Nenhum aluno cadastrado no histórico</p>
          ) : (
            <div className="alunos-grid">
              {Array.from(new Set(historico.map(h => h.aluno))).map(nome => (
                <div key={nome} className="aluno-item">
                  <div className="aluno-info">
                    <span className="aluno-nome">{nome}</span>
                  </div>
                  <div className="aluno-acoes">
                    <button className="btn" onClick={() => abrirProntuario(nome)}>Prontuário</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Container de Histórico */}
        <section className="historico-container">
          <h2 className="container-titulo">Histórico de Atendimentos</h2>
          {historico.length === 0 ? (
            <p>Nenhum atendimento registrado</p>
          ) : (
            historico.map((atendimento, index) => (
              <div key={index} className="historico-item">
                <div className="historico-header">
                  <span className="historico-aluno">{atendimento.aluno}</span>
                  <span className="historico-data">{atendimento.data}</span>
                </div>
                <div className="historico-detalhes">
                  <p>{atendimento.tipo}</p>
                  <p>{atendimento.status}</p>
                  {atendimento.observacoes && <p>{atendimento.observacoes}</p>}
                </div>
              </div>
            ))
          )}
        </section>

        <Agendamentos />
        <EditarPerfilProfissional />
        <MeusPlanos />
      </div>

      {alunoModal.aberto && (
        <div className="modal">
          <div className="modal-content">
            <h3>Prontuário — {alunoModal.nome}</h3>
            <label>Histórico de lesões
              <textarea value={alunoModal.prontuario.lesoes} onChange={(e) => setAlunoModal(m => ({ ...m, prontuario: { ...m.prontuario, lesoes: e.target.value } }))} />
            </label>
            <label>Metas
              <textarea value={alunoModal.prontuario.metas} onChange={(e) => setAlunoModal(m => ({ ...m, prontuario: { ...m.prontuario, metas: e.target.value } }))} />
            </label>
            <label>Anamnese
              <textarea value={alunoModal.prontuario.anamnese} onChange={(e) => setAlunoModal(m => ({ ...m, prontuario: { ...m.prontuario, anamnese: e.target.value } }))} />
            </label>
            <div className="modal-actions">
              <button className="btn" onClick={() => setAlunoModal({ aberto: false, nome: '', prontuario: { lesoes: '', metas: '', anamnese: '' } })}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarProntuario}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default PainelProfissional;
