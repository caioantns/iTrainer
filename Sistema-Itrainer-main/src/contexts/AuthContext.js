import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken } from '../api';

const AuthContext = createContext(null);

const STORAGE_USER = 'itrainer_user';

function readUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  // Bootstrap: se ha user no storage, tenta refresh p/ obter access token novo.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) { setBootstrapping(false); return; }
      try {
        const resp = await api.post('/refresh');
        if (alive && resp.data?.accessToken) {
          setAccessToken(resp.data.accessToken);
        } else {
          throw new Error('sem token');
        }
      } catch {
        if (alive) {
          localStorage.removeItem(STORAGE_USER);
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (alive) setBootstrapping(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync entre abas (user state apenas, token nao sincroniza — refresh trata)
  useEffect(() => {
    const onStorage = (e) => { if (e.key === STORAGE_USER) setUser(readUser()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async ({ email, password, kind }) => {
    setLoading(true);
    try {
      const path = kind === 'cliente' ? '/login/clientes' : '/login/profissionais';
      const resp = await api.post(path, { email, senha: password });
      const apiUser = resp.data?.user;
      const token = resp.data?.accessToken;
      if (!apiUser || !token) throw new Error('Resposta inválida do servidor.');
      const userData = {
        id: apiUser.id,
        name: apiUser.nome,
        email: apiUser.email,
        type: kind === 'cliente' ? 'client' : 'professional',
        tipo: kind,
      };
      localStorage.setItem(STORAGE_USER, JSON.stringify(userData));
      setAccessToken(token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async ({ nome, email, password, kind }) => {
    setLoading(true);
    try {
      const path = kind === 'cliente' ? '/cadastro/clientes' : '/cadastro/profissionais';
      const resp = await api.post(path, { nome, email, senha: password });
      const apiUser = resp.data?.user;
      const token = resp.data?.accessToken;
      if (!apiUser || !token) throw new Error('Resposta inválida do servidor.');
      const userData = {
        id: apiUser.id,
        name: apiUser.nome,
        email: apiUser.email,
        type: kind === 'cliente' ? 'client' : 'professional',
        tipo: kind,
      };
      localStorage.setItem(STORAGE_USER, JSON.stringify(userData));
      setAccessToken(token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/logout'); } catch (_) { /* ignore */ }
    localStorage.removeItem(STORAGE_USER);
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, bootstrapping, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora de AuthProvider');
  return ctx;
}
