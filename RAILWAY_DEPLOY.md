# Guia de migração para o Railway — Chá de Panela Online

## 1. Suba o código para o GitHub

O repositório git já foi criado localmente (branch `main`, 1 commit com o projeto pronto para o Railway). Falta só criar o repositório remoto e enviar.

Crie um repositório vazio em https://github.com/new (ex: `cha-de-panela-online`, pode ser privado) e, no Terminal do seu Mac dentro desta pasta, rode:

```bash
git remote add origin git@github.com:SEU_USUARIO/cha-de-panela-online.git
git push -u origin main
```

(se preferir HTTPS em vez de SSH, use a URL `https://github.com/SEU_USUARIO/cha-de-panela-online.git`)

## 2. Crie o projeto no Railway

1. Em https://railway.app → **New Project** → **Deploy from GitHub repo** → selecione `cha-de-panela-online`.
2. O Railway detecta automaticamente o Node.js (Nixpacks) e usa os scripts do `package.json`:
   - Build: `npm run build` (gera `dist/` com o frontend e `dist/server.cjs` com o backend)
   - Start: `npm start` → `node dist/server.cjs`
3. Em **Settings → Networking**, gere um domínio público (`*.up.railway.app`) para testar antes de apontar o domínio final.

## 3. Adicione o banco MySQL

1. No mesmo projeto Railway: **+ New → Database → Add MySQL**.
2. O Railway cria as variáveis internas automaticamente (`MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`). No serviço do app, em **Variables**, mapeie:
   - `DB_HOST` → `${{MySQL.MYSQLHOST}}`
   - `DB_USER` → `${{MySQL.MYSQLUSER}}`
   - `DB_PASSWORD` → `${{MySQL.MYSQLPASSWORD}}`
   - `DB_NAME` → `${{MySQL.MYSQLDATABASE}}`
   (o Railway permite referenciar variáveis de outro serviço com `${{ServiceName.VAR}}`)

## 4. Variáveis de ambiente do app (aba Variables do serviço)

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | (o Railway define sozinho, não precisa setar) |
| `JWT_SECRET` | gerar um valor novo e aleatório (não usar o de dev) |
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | ver passo 3 |
| `MERCADOPAGO_ACCESS_TOKEN` | (fornecer) |
| `MERCADOPAGO_PUBLIC_KEY` / `VITE_MERCADOPAGO_PUBLIC_KEY` | (fornecer) |
| `SMTP_HOST` | (fornecer) |
| `SMTP_PORT` | (fornecer, ex: 465) |
| `SMTP_USER` | (fornecer) |
| `SMTP_PASSWORD` | (fornecer) |
| `SMTP_FROM_EMAIL` | (fornecer) |
| `GEMINI_API_KEY` | (fornecer, se ainda usado) |
| `VITE_APP_URL` | URL pública final do app (ex: `https://chadepanelaonline.com.br`) |
| `HUBLING_API_KEY` | chave da API do WhatsApp (Hubling) |

## 5. Migrar o banco de dados

No host atual (cPanel/phpMyAdmin do `chadepanelaonline.com.br`):

1. Exporte o banco `chadepan_principal` como um arquivo `.sql` (phpMyAdmin → Exportar → Rápido → SQL).
2. No Railway, abra o serviço MySQL → aba **Connect** → copie os dados de conexão pública (host, porta, usuário, senha — algo como `containers-us-west-XX.railway.app:PORTA`).
3. No seu Terminal (com `mysql` client instalado):

```bash
mysql -h HOST_DA_RAILWAY -P PORTA_DA_RAILWAY -u USUARIO -pSENHA railway < caminho/para/dump.sql
```

(troque `railway` pelo nome do banco se for diferente — confira na aba Connect)

## 6. Testes antes de trocar o domínio

Acesse a URL temporária `*.up.railway.app` e teste: login, criação de evento, checkout Mercado Pago (webhook precisa apontar para a nova URL), envio de e-mail e WhatsApp.

## 7. Domínio customizado

Em **Settings → Networking → Custom Domain**, adicione `chadepanelaonline.com.br` e siga as instruções de DNS (CNAME) que o Railway fornece. Só troque o DNS depois de confirmar que tudo funciona na URL temporária.
