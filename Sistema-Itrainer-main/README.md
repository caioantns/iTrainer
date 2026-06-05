# 🏋️ iTrainer Práticas – Frontend + Backend

Projeto iTrainer com frontend React e backend Node/Express + SQLite (banco de dados local).

## 🚀 Rodando em outra máquina (sem erros)

### Pré-requisitos
- Node.js 18+ (recomendado)
- npm (ou yarn)
- SQLite (vem com Node.js, não precisa instalação separada)

### Passo a passo
1) Clone o repositório:
   - `git clone https://github.com/vngomes18/iTrainerPraticas.git`
   - `cd iTrainerPraticas`

2) Instale dependências:
   - Frontend (raiz): `npm install`
   - Backend: `cd backend && npm install`

3) Configure o backend (.env):
   - Crie `backend/.env` com as seguintes variáveis:
     - `PORT=3010` (porta do backend)
     - `CORS_ORIGIN=http://localhost:3000` (origem do frontend)
     - `JWT_SECRET` (defina um segredo seguro, ex: `seu-secret-super-seguro-aqui`)
     - `DB_PATH` (opcional, padrão: `backend/data/itrainer.db`)

4) Prepare o banco de dados:
   - Execute migrações: `cd backend && npm run migrate`
   - O banco SQLite será criado automaticamente em `backend/data/itrainer.db`

5) Inicie os servidores:
   - Backend: `cd backend && npm start` → `http://localhost:3010`
   - Frontend (em outro terminal na raiz): `npm start` → `http://localhost:3000`

6) Teste a API:
   - `http://localhost:3010/` → JSON “iTrainer API”
   - `http://localhost:3010/api/status` → saúde da API/DB

### Observações importantes
- O frontend já aponta para `http://localhost:3010/api` em `src/api.js`.
- Não commite `.env` (o arquivo está no `.gitignore`).
- O banco de dados SQLite é criado automaticamente em `backend/data/itrainer.db`.
- O diretório `backend/data/` está no `.gitignore` para não commitar o banco.

## 🚀 Deploy no Render

### Configuração no Render

1. **Crie um novo Web Service** no Render
2. **Conecte seu repositório** GitHub/GitLab
3. **Configure as variáveis de ambiente**:
   - `PORT` (Render define automaticamente, mas você pode usar `3001`)
   - `CORS_ORIGIN` (URL do seu frontend, ex: `https://seu-frontend.onrender.com`)
   - `JWT_SECRET` (defina um segredo seguro)
   - `NODE_ENV=production`

4. **Configure o Build Command**:
   ```
   npm install; cd backend; npm install; cd ..; npm run build
   ```

5. **Configure o Start Command**:
   ```
   cd backend; npm run migrate; npm start
   ```

6. **Observações para Render**:
   - O SQLite funciona perfeitamente no Render
   - O banco será criado automaticamente na primeira execução
   - O arquivo do banco ficará no sistema de arquivos do Render
   - **Importante**: O sistema de arquivos do Render é efêmero, então os dados podem ser perdidos se o serviço reiniciar. Para produção, considere usar um banco de dados persistente ou fazer backups regulares.

## 📦 Publicação no Git (exemplo rápido)

```bash
echo "# iTrainerPraticas" > README.md
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/vngomes18/iTrainerPraticas.git
git push -u origin main
```

## 📁 Estrutura do Projeto

## 📁 Estrutura do Projeto

```
meu-site-react/
├── public/                 # Arquivos públicos
│   └── index.html         # HTML principal
├── src/                   # Código fonte React
│   ├── components/        # Componentes React
│   │   ├── Header.js      # Cabeçalho da aplicação
│   │   ├── Header.css     # Estilos do cabeçalho
│   │   ├── Footer.js      # Rodapé da aplicação
│   │   ├── Footer.css     # Estilos do rodapé
│   │   ├── Home.js        # Página inicial
│   │   ├── Home.css       # Estilos da página inicial
│   │   ├── Login.js       # Página de login
│   │   └── Login.css      # Estilos da página de login
│   ├── App.js             # Componente principal
│   ├── App.css            # Estilos globais
│   └── index.js           # Ponto de entrada
├── package.json           # Dependências e scripts
└── README.md             # Este arquivo
```

## 🎯 Funcionalidades Implementadas

### ✅ Páginas Convertidas
- **Página Inicial (Home)** - Com hero section, serviços, sobre, depoimentos e CTA
- **Página de Login** - Sistema de login com abas para cliente e profissional
- **Header** - Navegação responsiva com menu mobile
- **Footer** - Rodapé com links e informações de contato

### ✅ Funcionalidades
- **Navegação Responsiva** - Menu mobile funcional
- **Sistema de Login** - Abas para cliente e profissional
- **Animações AOS** - Animações de scroll
- **Chat de Suporte** - Modal de chat funcional
- **Slider de Depoimentos** - Auto-play e navegação manual
- **Gerenciamento de Estado** - Usando React hooks
- **Roteamento** - React Router para navegação

### 🔐 Dados de Teste para Login
- **Cliente:** 
  - Email: `aluno@teste.com`
  - Senha: `12345`
- **Profissional:**
  - Email: `admin@teste.com`
  - Senha: `12345`

## 🛠️ Tecnologias Utilizadas

- **React 19** - Biblioteca principal
- **React Router DOM** - Roteamento
- **AOS (Animate On Scroll)** - Animações
- **Font Awesome** - Ícones
- **CSS3** - Estilos e animações

## 📱 Responsividade

O projeto é totalmente responsivo e funciona em:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (até 767px)

## 🎨 Design System

### Cores Principais
- **Primária:** `#667eea` (Azul)
- **Secundária:** `#764ba2` (Roxo)
- **Texto:** `#333` (Cinza escuro)
- **Texto Secundário:** `#666` (Cinza médio)

### Gradientes
- **Principal:** `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

## 🔧 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a versão de produção
- `npm test` - Executa os testes
- `npm run eject` - Ejetar configurações (irreversível)

## 📋 Próximos Passos

### Páginas a Implementar
- [ ] Página de Profissionais
- [ ] Página de Contato
- [ ] Página Sobre
- [ ] Perfil do Cliente
- [ ] Painel do Profissional

### Funcionalidades a Adicionar
- [ ] Sistema de cadastro
- [ ] Filtros de busca
- [ ] Sistema de avaliações
- [ ] Agendamento de treinos
- [ ] Chat em tempo real

## 🐛 Solução de Problemas

### Erro "Missing script: start"
Certifique-se de estar no diretório correto:
```bash
cd meu-site-react
npm start
```

### Erro de dependências
Reinstale as dependências:
```bash
npm install
```

### Porta 3000 ocupada
O React tentará automaticamente a próxima porta disponível.

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Documentação do React: https://reactjs.org/
- Documentação do React Router: https://reactrouter.com/

---

**Desenvolvido com ❤️ para o projeto iTrainer**
