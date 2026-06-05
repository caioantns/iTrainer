import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './Agendamentos.css';

const STATUS_LABEL = {
  PENDENTE: '🕐 Pendente',
  CONFIRMADO: '✅ Confirmado',
  CANCELADO: '❌ Cancelado',
  CONCLUIDO: '🏁 Concluído',
};

const TABS = ['PENDENTE', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO'];

const Agendamentos = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDENTE');
  const [updating, setUpdating] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/agendamentos');
      setItems(r.data?.agendamentos || []);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Erro ao carregar agendamentos.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const alterarStatus = async (id, novo) => {
    setUpdating(id);
    try {
      await api.patch(`/agendamentos/${id}/status`, { status: novo });
      showToast('Status atualizado.', 'success');
      await carregar();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Erro ao atualizar.';
      showToast(msg, 'error');
    } finally {
      setUpdating(null);
    }
  };

  const filtrados = items.filter((a) => a.status === tab);
  const isProf = user?.tipo === 'profissional';

  return (
    <section className="agendamentos-section">
      <h3>Agendamentos</h3>

      <div className="ag-tabs">
        {TABS.map((t) => {
          const count = items.filter((a) => a.status === t).length;
          return (
            <button
              key={t}
              className={`ag-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {STATUS_LABEL[t]} ({count})
            </button>
          );
        })}
      </div>

      {loading && <p>Carregando...</p>}
      {!loading && filtrados.length === 0 && (
        <p className="ag-vazio">Nenhum agendamento {STATUS_LABEL[tab].toLowerCase()}.</p>
      )}

      <div className="ag-list">
        {filtrados.map((a) => {
          const data = new Date(a.data_hora);
          const dataStr = data.toLocaleDateString('pt-BR');
          const horaStr = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const outroId = isProf ? a.cliente_id : a.profissional_id;
          const outroLabel = isProf ? `Cliente #${outroId}` : `Profissional #${outroId}`;
          const isUpdating = updating === a.agendamento_id;

          return (
            <div key={a.agendamento_id} className="ag-card">
              <div className="ag-info">
                <strong>{dataStr} às {horaStr}</strong>
                <span>{outroLabel}</span>
                <small>{STATUS_LABEL[a.status]}</small>
              </div>
              <div className="ag-actions">
                {!isProf && a.profissional_id && (
                  <Link className="btn btn-secondary" to={`/profissional/db-${a.profissional_id}`}>
                    Ver perfil
                  </Link>
                )}
                {a.status === 'PENDENTE' && isProf && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => alterarStatus(a.agendamento_id, 'CONFIRMADO')}
                      disabled={isUpdating}
                    >Aceitar</button>
                    <button
                      className="btn btn-danger"
                      onClick={() => alterarStatus(a.agendamento_id, 'CANCELADO')}
                      disabled={isUpdating}
                    >Recusar</button>
                  </>
                )}
                {a.status === 'CONFIRMADO' && (
                  <>
                    {isProf && (
                      <button
                        className="btn btn-primary"
                        onClick={() => alterarStatus(a.agendamento_id, 'CONCLUIDO')}
                        disabled={isUpdating}
                      >Marcar concluído</button>
                    )}
                    <button
                      className="btn btn-danger"
                      onClick={() => alterarStatus(a.agendamento_id, 'CANCELADO')}
                      disabled={isUpdating}
                    >Cancelar</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Agendamentos;
