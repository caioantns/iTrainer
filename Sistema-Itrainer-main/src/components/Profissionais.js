import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { resolveFotoUrl } from '../utils/foto';
import './Profissionais.css';

// Fotos Unsplash livres p/ uso. Cropped p/ retrato.
const FOTOS = {
  joana: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=400&fit=crop&crop=faces',
  carlos: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=400&fit=crop&crop=faces',
  ana: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop&crop=faces',
  rodrigo: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&h=400&fit=crop&crop=faces',
  paula: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop&crop=faces',
};
const FALLBACK_FOTO = 'https://api.dicebear.com/7.x/initials/svg?seed=iTrainer&backgroundColor=4a90e2';

// Mock de profissionais para vitrine/busca
const mockProfessionals = [
  {
    id: 'prof-joana',
    nome: 'Joana Lima',
    cref: 'CREF 123456-G/RJ',
    especialidades: ['musculacao', 'funcional'],
    localizacao: 'Rio de Janeiro - RJ',
    online: true,
    precoHora: 120,
    objetivoFoco: ['emagrecimento', 'condicionamento'],
    foto: FOTOS.joana,
    notaMedia: 4.8,
    pacotes: [
      { nome: 'Mensal', preco: 600, detalhes: '2x por semana' },
      { nome: 'Avulso', preco: 140, detalhes: 'Sessão única' },
    ],
  },
  {
    id: 'prof-carlos',
    nome: 'Carlos Mendes',
    cref: 'CREF 654321-G/SP',
    especialidades: ['yoga', 'pilates'],
    localizacao: 'São Paulo - SP',
    online: false,
    precoHora: 90,
    objetivoFoco: ['saude', 'reabilitacao'],
    foto: FOTOS.carlos,
    notaMedia: 4.6,
    pacotes: [
      { nome: 'Mensal', preco: 400, detalhes: '1x por semana' },
      { nome: 'Avulso', preco: 110, detalhes: 'Sessão única' },
    ],
  },
  {
    id: 'prof-ana',
    nome: 'Ana Souza',
    cref: 'CREF 112233-G/MG',
    especialidades: ['crossfit', 'funcional'],
    localizacao: 'Belo Horizonte - MG',
    online: true,
    precoHora: 110,
    objetivoFoco: ['condicionamento', 'emagrecimento'],
    foto: FOTOS.ana,
    notaMedia: 4.7,
    pacotes: [
      { nome: 'Mensal', preco: 520, detalhes: '2x por semana' },
      { nome: 'Avulso', preco: 130, detalhes: 'Sessão única' },
    ],
  },
  {
    id: 'prof-rodrigo',
    nome: 'Rodrigo Alves',
    cref: 'CREF 998877-G/RS',
    especialidades: ['musculacao', 'funcional'],
    localizacao: 'Porto Alegre - RS',
    online: false,
    precoHora: 80,
    objetivoFoco: ['condicionamento', 'saude'],
    foto: FOTOS.rodrigo,
    notaMedia: 4.5,
    pacotes: [
      { nome: 'Mensal', preco: 360, detalhes: '1x por semana' },
      { nome: 'Avulso', preco: 95, detalhes: 'Sessão única' },
    ],
  },
  {
    id: 'prof-paula',
    nome: 'Paula Ribeiro',
    cref: 'CREF 445566-G/PR',
    especialidades: ['pilates', 'reabilitacao'],
    localizacao: 'Curitiba - PR',
    online: true,
    precoHora: 100,
    objetivoFoco: ['reabilitacao', 'saude'],
    foto: FOTOS.paula,
    notaMedia: 4.9,
    pacotes: [
      { nome: 'Mensal', preco: 480, detalhes: '2x por semana' },
      { nome: 'Avulso', preco: 120, detalhes: 'Sessão única' },
    ],
  },
];

const especialidadesLista = ['musculacao', 'funcional', 'yoga', 'pilates', 'crossfit', 'reabilitacao'];

const Profissionais = () => {
  const [filtros, setFiltros] = useState({
    especialidade: '',
    localizacao: '',
    precoMax: '',
    objetivo: '',
    online: 'any',
    ordenacao: 'none',
  });

  const [apiProfissionais, setApiProfissionais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchList = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/profissionais');
        const rows = res.data?.profissionais || [];
        // Mapear dados mínimos do backend para o formato da vitrine
        const mapped = rows.map((r) => ({
          id: `db-${r.id}`,
          nome: r.nome,
          cref: r.cref || 'CREF —',
          especialidades: Array.isArray(r.especialidades) ? r.especialidades : [],
          localizacao: r.localizacao || '—',
          online: r.online !== false,
          precoHora: typeof r.preco_hora === 'number' ? r.preco_hora : 100,
          objetivoFoco: [],
          foto: r.foto_url ? resolveFotoUrl(r.foto_url) : `${FALLBACK_FOTO}&seed=${encodeURIComponent(r.nome || 'user')}`,
          notaMedia: Number(r.nota_media) > 0 ? Number(r.nota_media) : 4.5,
          qtdAvaliacoes: r.qtd_avaliacoes || 0,
          pacotes: [],
        }));
        if (mounted) setApiProfissionais(mapped);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.error || 'Falha ao carregar profissionais.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchList();
    return () => { mounted = false; };
  }, []);

  const resultados = useMemo(() => {
    const base = [...apiProfissionais, ...mockProfessionals];
    const filtrados = base.filter(p => {
      const byEsp = filtros.especialidade ? p.especialidades.includes(filtros.especialidade) : true;
      const byLoc = filtros.localizacao ? p.localizacao.toLowerCase().includes(filtros.localizacao.toLowerCase()) : true;
      const byPreco = filtros.precoMax ? p.precoHora <= Number(filtros.precoMax) : true;
      const byObj = filtros.objetivo ? p.objetivoFoco.includes(filtros.objetivo) : true;
      const byOnline = filtros.online === 'any' ? true : filtros.online === 'true' ? p.online : !p.online;
      return byEsp && byLoc && byPreco && byObj && byOnline;
    });

    // Ordenação por preço: mais barato / mais caro
    if (filtros.ordenacao === 'preco_asc') {
      filtrados.sort((a, b) => a.precoHora - b.precoHora);
    } else if (filtros.ordenacao === 'preco_desc') {
      filtrados.sort((a, b) => b.precoHora - a.precoHora);
    }

    return filtrados;
  }, [filtros, apiProfissionais]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  return (
    <main className="vitrine-container">
      <section className="vitrine-hero">
        <div className="hero-content">
          <h1>Encontre seu Personal Trainer</h1>
          <p>Use os filtros e ache o profissional ideal para seu objetivo.</p>
        </div>
      </section>

      <section className="vitrine-busca">
        <div className="container">
          <div className="busca-grid">
            <aside className="filtros">
              <h2>Filtros</h2>
              <label>Especialidade
                <select name="especialidade" value={filtros.especialidade} onChange={handleChange}>
                  <option value="">Todas</option>
                  {especialidadesLista.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </label>
              <label>Localização
                <input name="localizacao" value={filtros.localizacao} onChange={handleChange} placeholder="Cidade/Bairro" />
              </label>
              <label>Preço máximo (R$/hora)
                <input type="number" name="precoMax" value={filtros.precoMax} onChange={handleChange} />
              </label>
              <label>Objetivo
                <select name="objetivo" value={filtros.objetivo} onChange={handleChange}>
                  <option value="">Todos</option>
                  <option value="emagrecimento">Emagrecimento</option>
                  <option value="condicionamento">Condicionamento</option>
                  <option value="saude">Saúde</option>
                  <option value="reabilitacao">Reabilitação</option>
                </select>
              </label>
              <label>Formato
                <select name="online" value={filtros.online} onChange={handleChange}>
                  <option value="any">Todos</option>
                  <option value="true">Online</option>
                  <option value="false">Presencial</option>
                </select>
              </label>
              <label>Ordenar por preço
                <select name="ordenacao" value={filtros.ordenacao} onChange={handleChange}>
                  <option value="none">Sem ordenação</option>
                  <option value="preco_asc">Mais barato primeiro</option>
                  <option value="preco_desc">Mais caro primeiro</option>
                </select>
              </label>
            </aside>

              <div className="resultados">
                <h2>Profissionais</h2>
              {loading && <p>Carregando profissionais...</p>}
              {error && <p className="erro">{error}</p>}
              <div className="cards">
                {resultados.map(p => (
                  <div className="card" key={p.id}>
                    <div className="card-foto">
                      <img
                        src={p.foto}
                        alt={`Foto de ${p.nome}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${FALLBACK_FOTO}&seed=${encodeURIComponent(p.nome)}`;
                        }}
                      />
                    </div>
                    <div className="card-body">
                      <h3>{p.nome}</h3>
                      <p className="card-cref">{p.cref}</p>
                      <p className="card-meta">{p.especialidades.join(', ')} • {p.online ? 'Online' : 'Presencial'}</p>
                      <p className="card-preco">R$ {p.precoHora}/hora</p>
                      <p className="card-nota">Nota: {p.notaMedia.toFixed(1)}</p>
                      <Link className="btn btn-primary" to={`/profissional/${p.id}`}>
                        Ver perfil
                      </Link>
                    </div>
                  </div>
                ))}
                {resultados.length === 0 && (
                  <p>Nenhum profissional encontrado com os filtros selecionados.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Profissionais;