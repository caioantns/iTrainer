import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import EditarPerfilCliente from './EditarPerfilCliente';
import Agendamentos from './Agendamentos';
import './PerfilCliente.css';

const PerfilCliente = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [perfil, setPerfil] = useState(null);
  const [aulas, setAulas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        const [perfilRes, agendRes, pagRes] = await Promise.all([
          api.get('/clientes/me/perfil'),
          api.get('/agendamentos'),
          api.get('/pagamentos/me').catch(() => ({ data: { pagamentos: [] } })),
        ]);

        setPerfil(perfilRes.data?.cliente || null);

        const mapped = (agendRes.data?.agendamentos || []).map((a) => ({
          id: a.agendamento_id,
          tipo: 'Aula',
          data: new Date(a.data_hora).toLocaleDateString('pt-BR'),
          horario: new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: a.status,
          profissional_id: a.profissional_id,
        }));
        setAulas(mapped);
        setPagamentos(pagRes.data?.pagamentos || []);
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        if (err?.response?.status !== 401) {
          showToast('Falha ao carregar perfil. Verifique o backend.', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  // Calcula idade a partir da data de nascimento
  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const idade = perfil ? calcularIdade(perfil.data_nascimento) : null;

  if (loading) {
    return (
      <main className="perfil-container">
        <div className="perfil-header">
          <p>Carregando perfil...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="perfil-container">
      <div className="perfil-header">
        <div className="perfil-foto-container">
          <div className="perfil-foto">
            <div className="perfil-foto-placeholder">👤</div>
          </div>
        </div>
        <div className="perfil-info">
          <h1 className="perfil-nome">{user?.name}</h1>
          <div className="perfil-detalhes">
            {idade && <p>{idade} anos</p>}
            {(perfil?.localizacao) && <p>{perfil.localizacao}</p>}
            <p>{user?.email}</p>
            {perfil?.nivel && <p>Nível: {perfil.nivel.charAt(0).toUpperCase() + perfil.nivel.slice(1)}</p>}
            {perfil?.objetivos?.length > 0 && (
              <p>Objetivos: {perfil.objetivos.join(', ')}</p>
            )}
          </div>
        </div>
      </div>

      {aulas.length === 0 && (
        <div className="sem-aulas">
          <p>Você ainda não tem aulas registradas.</p>
          <Link className="btn btn-primary" to="/profissionais">
            Encontrar um personal trainer
          </Link>
        </div>
      )}

      <Agendamentos />
      <EditarPerfilCliente />

      {pagamentos.length > 0 && (
        <div className="perfil-aulas">
          <h2>Meus Pagamentos</h2>
          {pagamentos.map((p) => (
            <div key={p.pagamento_id} className="aula-item">
              <div className="aula-info">
                <h3>Plano #{p.plano_id}</h3>
                <p className="aula-data">
                  {new Date(p.created_at).toLocaleDateString('pt-BR')} • R$ {(p.valor_centavos / 100).toFixed(2)}
                </p>
              </div>
              <span>{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default PerfilCliente;
