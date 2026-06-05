import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useToast } from '../contexts/ToastContext';
import './MeusPlanos.css';

const formatBRL = (cents) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const emptyForm = { titulo: '', descricao: '', preco_reais: '', duracao_dias: '30' };

const MeusPlanos = () => {
  const { showToast } = useToast();
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/planos/meus');
      setPlanos(r.data?.planos || []);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Erro ao carregar planos.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const validarForm = () => {
    if (!form.titulo || form.titulo.trim().length < 2) return 'Título obrigatório (min 2 chars).';
    const preco = Number(form.preco_reais);
    if (!Number.isFinite(preco) || preco < 0) return 'Preço inválido.';
    const dur = parseInt(form.duracao_dias, 10);
    if (!Number.isInteger(dur) || dur <= 0) return 'Duração em dias inválida.';
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validarForm();
    if (err) { showToast(err, 'error'); return; }
    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      preco_centavos: Math.round(Number(form.preco_reais) * 100),
      duracao_dias: parseInt(form.duracao_dias, 10),
    };
    setSaving(true);
    try {
      if (editId) {
        await api.patch(`/planos/${editId}`, payload);
        showToast('Plano atualizado.', 'success');
      } else {
        await api.post('/planos', payload);
        showToast('Plano criado.', 'success');
      }
      setForm(emptyForm);
      setEditId(null);
      await carregar();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Erro ao salvar.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const editar = (p) => {
    setEditId(p.plano_id);
    setForm({
      titulo: p.titulo,
      descricao: p.descricao || '',
      preco_reais: (p.preco_centavos / 100).toString(),
      duracao_dias: String(p.duracao_dias),
    });
  };

  const cancelarEdicao = () => {
    setEditId(null);
    setForm(emptyForm);
  };

  const toggleAtivo = async (p) => {
    try {
      await api.patch(`/planos/${p.plano_id}`, { ativo: !p.ativo });
      showToast(`Plano ${!p.ativo ? 'ativado' : 'inativado'}.`, 'success');
      await carregar();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Erro ao alterar status.';
      showToast(msg, 'error');
    }
  };

  return (
    <section className="meus-planos">
      <h3>Meus Planos</h3>

      <form className="plano-form" onSubmit={submit}>
        <div className="plano-form-row">
          <label>
            Título
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex: Treino Hipertrofia Mensal"
              maxLength={120}
              required
            />
          </label>
        </div>
        <div className="plano-form-row">
          <label>
            Descrição
            <textarea
              rows={2}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="O que está incluído?"
            />
          </label>
        </div>
        <div className="plano-form-row two">
          <label>
            Preço (R$)
            <input
              type="number" step="0.01" min="0"
              value={form.preco_reais}
              onChange={(e) => setForm({ ...form, preco_reais: e.target.value })}
              placeholder="0,00"
              required
            />
          </label>
          <label>
            Duração (dias)
            <input
              type="number" min="1"
              value={form.duracao_dias}
              onChange={(e) => setForm({ ...form, duracao_dias: e.target.value })}
              required
            />
          </label>
        </div>
        <div className="plano-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : (editId ? 'Atualizar plano' : 'Criar plano')}
          </button>
          {editId && (
            <button type="button" className="btn btn-secondary" onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="planos-list">
        {loading && <p>Carregando...</p>}
        {!loading && planos.length === 0 && <p>Nenhum plano criado ainda.</p>}
        {!loading && planos.map((p) => (
          <div key={p.plano_id} className={`plano-row ${p.ativo ? '' : 'inativo'}`}>
            <div className="plano-info">
              <strong>{p.titulo}</strong>
              <span>{formatBRL(p.preco_centavos)} / {p.duracao_dias} dias</span>
              {p.descricao && <small>{p.descricao}</small>}
              {!p.ativo && <span className="badge-inativo">INATIVO</span>}
            </div>
            <div className="plano-acoes">
              <button className="btn btn-secondary" onClick={() => editar(p)}>Editar</button>
              <button className="btn btn-secondary" onClick={() => toggleAtivo(p)}>
                {p.ativo ? 'Inativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MeusPlanos;
