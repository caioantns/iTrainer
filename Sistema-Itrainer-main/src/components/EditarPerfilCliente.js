import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import './EditarPerfil.css';

const OBJETIVOS = ['emagrecimento', 'hipertrofia', 'condicionamento', 'reabilitacao', 'saude'];
const PREFERENCIAS = ['musculacao', 'funcional', 'yoga', 'pilates', 'crossfit'];
const NIVEIS = ['iniciante', 'intermediario', 'avancado'];

const empty = {
  telefone: '', data_nascimento: '', objetivos: [], nivel: 'iniciante',
  restricoes: '', preferencias: [], localizacao: '',
};

const EditarPerfilCliente = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const r = await api.get('/clientes/me/perfil');
      const p = r.data?.cliente || {};
      setForm({
        telefone: p.telefone || '',
        data_nascimento: p.data_nascimento ? String(p.data_nascimento).slice(0, 10) : '',
        objetivos: Array.isArray(p.objetivos) ? p.objetivos : [],
        nivel: p.nivel || 'iniciante',
        restricoes: p.restricoes || '',
        preferencias: Array.isArray(p.preferencias) ? p.preferencias : [],
        localizacao: p.localizacao || '',
      });
    } catch (err) {
      console.warn('Perfil cliente vazio.', err?.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const toggleArr = (key, val) => {
    setForm((p) => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter((x) => x !== val) : [...p[key], val],
    }));
  };

  const salvar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/clientes/me/perfil', {
        telefone: form.telefone || null,
        data_nascimento: form.data_nascimento || null,
        objetivos: form.objetivos,
        nivel: form.nivel || null,
        restricoes: form.restricoes || null,
        preferencias: form.preferencias,
        localizacao: form.localizacao || null,
      });
      showToast('Perfil atualizado.', 'success');
    } catch (err) {
      const msg = err?.response?.data?.error
        || (!err?.response ? 'Servidor offline.' : 'Erro ao salvar.');
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <section className="editar-perfil"><p>Carregando perfil...</p></section>;

  return (
    <section className="editar-perfil">
      <h3>Editar Meu Perfil</h3>
      <form onSubmit={salvar} className="perfil-form">
        <div className="campos-grid">
          <label>
            Telefone
            <input type="tel" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" />
          </label>
          <label>
            Data de nascimento
            <input type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} />
          </label>
          <label>
            Localização
            <input type="text" name="localizacao" value={form.localizacao} onChange={handleChange} placeholder="Cidade - UF" />
          </label>
          <label>
            Nível
            <select name="nivel" value={form.nivel} onChange={handleChange}>
              {NIVEIS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>

        <label className="bloco">
          Restrições médicas
          <textarea name="restricoes" rows={3} value={form.restricoes} onChange={handleChange} maxLength={1000} />
        </label>

        <div className="bloco">
          <span className="label-bloco">Objetivos</span>
          <div className="chips">
            {OBJETIVOS.map((o) => (
              <button type="button" key={o} className={`chip ${form.objetivos.includes(o) ? 'on' : ''}`} onClick={() => toggleArr('objetivos', o)}>
                {o}
              </button>
            ))}
          </div>
        </div>

        <div className="bloco">
          <span className="label-bloco">Preferências de treino</span>
          <div className="chips">
            {PREFERENCIAS.map((p) => (
              <button type="button" key={p} className={`chip ${form.preferencias.includes(p) ? 'on' : ''}`} onClick={() => toggleArr('preferencias', p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar perfil'}
        </button>
      </form>
    </section>
  );
};

export default EditarPerfilCliente;
