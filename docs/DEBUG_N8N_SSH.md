# Guia de Debugging n8n via SSH

Este guia explica como inspecionar execuções do n8n diretamente no servidor remoto quando a interface web não for suficiente ou estiver inacessível.

## 1. Localização da Base de Dados
O banco de dados SQLite do n8n está localizado em:
`/root/.n8n/database.sqlite`

## 2. Listar Últimas Execuções
Como o servidor pode não ter o binário `sqlite3` instalado, usamos o Python para consultar o banco:

```bash
ssh -i ~/.ssh/id_ed25519 root@204.168.214.139 "python3 -c \"import sqlite3; conn = sqlite3.connect('/root/.n8n/database.sqlite'); cursor = conn.cursor(); cursor.execute('SELECT id, workflowId, status, startedAt FROM execution_entity ORDER BY startedAt DESC LIMIT 10'); rows = cursor.fetchall(); print('Últimas 10 execuções:'); [print(row) for row in rows]; conn.close()\""
```

## 3. Puxar Dados de uma Execução Específica
Para ver o JSON completo de uma execução (input, output de cada nó e erros):

```bash
ssh -i ~/.ssh/id_ed25519 root@204.168.214.139 "python3 -c \"import sqlite3; conn = sqlite3.connect('/root/.n8n/database.sqlite'); cursor = conn.cursor(); cursor.execute('SELECT data FROM execution_data WHERE executionId = <ID_DA_EXECUÇÃO>'); row = cursor.fetchone(); print(row[0] if row else 'Não encontrado'); conn.close()\""
```
*Substitua `<ID_DA_EXECUÇÃO>` pelo ID obtido no comando anterior.*

## 4. Verificar Logs do PM2
Para ver mensagens de `console.log` em tempo real e erros de crash do processo:

```bash
# Logs combinados
ssh -i ~/.ssh/id_ed25519 root@204.168.214.139 "pm2 logs cocreator --lines 100"

# Apenas erros
ssh -i ~/.ssh/id_ed25519 root@204.168.214.139 "tail -f /root/.pm2/logs/cocreator-error.log"
```

## 5. Comandos de Emergência
Se o servidor entrar em loop de reinicialização ou a porta estiver presa:

```bash
# Matar processo que prende a porta 5678
ssh -i ~/.ssh/id_ed25519 root@204.168.214.139 "fuser -k 5678/tcp"

# Reiniciar PM2 limpando o ambiente
ssh -i ~/.ssh/id_ed25519 root@204.168.214.139 "pm2 delete cocreator && pm2 start /root/ecosystem.config.js --update-env"
```
