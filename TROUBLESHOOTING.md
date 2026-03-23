# Troubleshooting - ERP System

## Problema: Frontend abre mas login falha com ERR_CONNECTION_REFUSED

**Sintomas:**
- Frontend abre em http://localhost:5173
- Ao tentar login, erro: `POST http://localhost:8000/api/v1/auth/login net::ERR_CONNECTION_REFUSED`
- Backend não responde na porta 8000

**Causas possíveis:**
1. Backend não iniciou corretamente
2. Banco de dados não foi inicializado
3. Processo uvicorn morreu durante startup
4. Problemas com as migrações do Alembic

### Passo 1: Verificar Status

```bash
# Abrir terminal e executar:
python3 diagnose.py
```

Isso mostrará:
- Se backend está rodando
- Se frontend está rodando
- Últimos erros dos logs
- Recomendações específicas

### Passo 2: Verificar Logs

```bash
# Se estiver usando Linux com tmux:
tmux attach -t erp:backend

# Se estiver usando background (sem tmux):
tail -f backend/backend.log

# Ver log de setup (procura pelo mais recente):
tail -50 setup_*.log | grep -i error
```

### Passo 3: Reiniciar Backend

**Opção 1: Modo rápido (recomendado)**
```bash
./setup-linux.sh restart
```

**Opção 2: Manual**
```bash
# Parar tudo
pkill -f uvicorn
pkill -f "npm run dev"

# Limpar banco (se necessário)
rm backend/erp_system.db

# Reinicar
./setup-linux.sh
```

### Passo 4: Resetar Banco de Dados

Se o banco estiver corrompido:

```bash
cd backend
python reset_db.py
cd ..

# Depois reiniciar
./setup-linux.sh restart
```

### Passo 5: Reinstalar Dependências

Se nada acima funcionar:

```bash
# Backend
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
cd ..

# Reiniciar
./setup-linux.sh
```

---

## Problema: Backend inicia mas com erros de migração

**Erro:**
```
[WARNING] Migrações falharam (continuando com init_db.py)
```

**Solução:**

```bash
cd backend

# Limpar migrações antigo
rm -rf migrations/versions/*

# Limpar banco
rm erp_system.db

# Tentar novamente
python init_db.py

cd ..
./setup-linux.sh restart
```

---

## Problema: Banco de dados não inicia

**Erro na init_db.py:**
```
[ERROR] Erro ao inicializar dados: ...
```

**Solução:**

```bash
cd backend

# Ver o erro completo
python init_db.py

# Limpar tudo
rm erp_system.db
rm -rf migrations/versions/*
rm -rf __pycache__
find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true

# Reinstalar requirements
pip install --force-reinstall -r requirements.txt

# Tentar novamente
python init_db.py
```

---

## Problema: Frontend não carrega em http://localhost:5173

**Solução:**

```bash
cd frontend

# Limpar cache
rm -rf node_modules .vite dist
npm cache clean --force

# Reinstalar
npm install
npm run build

# Voltar e reiniciar
cd ..
./setup-linux.sh restart
```

---

## Comandos Úteis

```bash
# Verificar saúde dos serviços
./setup-linux.sh check

# Restartar serviços
./setup-linux.sh restart

# Ver logs do setup
./setup-linux.sh logs

# Se usando tmux, attachar:
tmux attach -t erp

# Se usando tmux, ver apenas o backend:
tmux attach -t erp:backend

# Parar todos os serviços
docker-compose down  # se usando docker
# ou
pkill -f uvicorn
pkill -f "npm run dev"
```

---

## Verificação de Conectividade

```bash
# Testar backend
curl http://localhost:8000/health

# Testar health check detalhado
curl -v http://localhost:8000/health

# Testar API docs
curl http://localhost:8000/docs

# Ver processos rodando
ps aux | grep -E "uvicorn|npm"

# Ver portas em uso
lsof -i :8000
lsof -i :5173
```

---

## Logs Importantes

- **Setup log**: `setup_YYYYMMDD_HHMMSS.log` (raiz do projeto)
- **Backend log**: `backend/backend.log`
- **Frontend log**: `frontend/frontend.log`
- **Database**: `backend/erp_system.db`

---

## Stack Técnico

- **Backend**: Python 3.9+, FastAPI, SQLAlchemy, SQLite
- **Frontend**: Vite, TypeScript, React
- **Database**: SQLite (migrations via Alembic)
- **Process Management**: tmux (Linux/Mac) ou background (Windows)

---

## Se Nada Funcionar

1. **Resetar tudo para o estado inicial:**
   ```bash
   # Parar serviços
   pkill -f uvicorn
   pkill -f "npm run dev"
   
   # Limpar diretórios
   rm -rf backend/venv backend/erp_system.db backend/migrations/versions/*
   rm -rf frontend/node_modules frontend/dist frontend/.vite
   
   # Reinstalar tudo
   ./setup-linux.sh clean
   ./setup-linux.sh
   ```

2. **Verificar Python e Node:**
   ```bash
   python3 --version  # Deve ser 3.9+
   node --version     # Deve ser 18+
   npm --version      # Deve estar instalado
   ```

3. **Verificar permissões:**
   ```bash
   ls -la backend/
   ls -la frontend/
   ```

4. **Coletar logs para debug:**
   ```bash
   # Enviar esses arquivos para suporte:
   setup_*.log
   backend/backend.log
   frontend/frontend.log
   ```

---

## Contato/Suporte

Para reportar bugs ou solicitar ajuda:
1. Execute: `python3 diagnose.py`
2. Compartilhe os logs
3. Descreva o que você fez antes do erro

