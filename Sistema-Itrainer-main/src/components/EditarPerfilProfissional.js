import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { resolveFotoUrl } from '../utils/foto';
import './EditarPerfil.css';

const ESPECIALIDADES = [
  'musculacao', 'funcional', 'yoga', 'pilates', 'crossfit',
  'boxe', 'jiu-jitsu', 'natacao', 'danca', 'reabilitacao', 'nutricao',
];

const MAX_FOTO_BYTES = 1_500_000; // ~1.5 MB

const empty = {
  telefone: '', cref: '', foto_url: '', especialidades: [],
  experiencia: '', descricao: '', preco_hora: '', localizacao: '', online: true,
};

const EditarPerfilProfissional = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const r = await api.get(`/profissionais/${user.id}/perfil`);
      const p = r.data?.profissional || {};
      setForm({
        telefone: p.telefone || '',
        cref: p.cref || '',
        foto_url: p.foto_url || '',
        especialidades: Array.isArray(p.especialidades) ? p.especialidades : [],
        experiencia: p.experiencia != null ? String(p.experiencia) : '',
        descricao: p.descricao || '',
        preco_hora: p.preco_hora != null ? String(p.preco_hora) : '',
        localizacao: p.localizacao || '',
        online: p.online !== false,
      });
    } catch (err) {
      console.warn('Perfil ainda vazio.', err?.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleEsp = (esp) => {
    setForm((p) => ({
      ...p,
      especialidades: p.especialidades.includes(esp)
        ? p.especialidades.filter((x) => x !== esp)
        : [...p.especialidades, esp],
    }));
  };

  const handleFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      showToast('Formato inválido. Use PNG, JPEG, WEBP ou GIF.', 'error');
      return;
    }
    if (file.size > MAX_FOTO_BYTES) {
      showToast('Imagem maior que 1.5MB. Reduza antes de enviar.', 'error');
      return;
    }
    const fd = new FormData();
    fd.append('foto', file);
    try {
      const resp = await api.post('/uploads/foto', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((p) => ({ ...p, foto_url: resp.data?.url || '' }));
      showToast('Foto enviada.', 'success');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Erro ao enviar foto.';
      showToast(msg, 'error');
    }
  };

  const salvar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/profissionais/me/perfil', {
        telefone: form.telefone || null,
        cref: form.cref || null,
        foto_url: form.foto_url || null,
        especialidades: form.especialidades,
        experiencia: form.experiencia ? Number(form.experiencia) : null,
        descricao: form.descricao || null,
        preco_hora: form.preco_hora ? Number(form.preco_hora) : null,
        localizacao: form.localizacao || null,
        online: form.online,
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
        <div className="perfil-foto-edit">
          {form.foto_url ? (
            <img src={resolveFotoUrl(form.foto_url)} alt="Preview" />
          ) : (
            <div className="foto-placeholder">Sem foto</div>
          )}
          <input type="file" accept="image/*" onChange={handleFoto} />
        </div>

        <div className="campos-grid">
          <label>
            Telefone
            <input type="tel" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" />
          </label>
          <label>
            CREF
            <input type="text" name="cref" value={form.cref} onChange={handleChange} placeholder="CREF 000000-G/UF" maxLength={50} />
          </label>
          <label>
            Localização
            <input type="text" name="localizacao" value={form.localizacao} onChange={handleChange} placeholder="Cidade - UF" maxLength={120} />
          </label>
          <label>
            Preço por hora (R$)
            <input type="number" name="preco_hora" min="0" value={form.preco_hora} onChange={handleChange} />
          </label>
          <label>
            Anos de experiência
            <input type="number" name="experiencia" min="0" max="80" value={form.experiencia} onChange={handleChange} />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" name="online" checked={form.online} onChange={handleChange} />
            Atendo online
          </label>
        </div>

        <label className="bloco">
          Descrição (sua bio profissional)
          <textarea name="descricao" rows={4} value={form.descricao} onChange={handleChange} maxLength={1000} />
        </label>

        <div className="bloco">
          <span className="label-bloco">Especialidades</span>
          <div className="chips">
            {ESPECIALIDADES.map((e) => (
              <button
                type="button"
                key={e}
                className={`chip ${form.especialidades.includes(e) ? 'on' : ''}`}
                onClick={() => toggleEsp(e)}
              >
                {e}
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

export default EditarPerfilProfissional;
