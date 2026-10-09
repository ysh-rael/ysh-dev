# YS-Dev

Site pessoal em Next.js com o portal de licenças YSdesk em `/ysdesk`.

## Configurar o YSdesk

Copie `.env.example` para `.env.local` e preencha as credenciais. No PowerShell:

```powershell
Copy-Item .env.example .env.local
```

- `MONGODB_URI`: URI do MongoDB Atlas. O usuário do banco precisa ter acesso ao banco configurado em `MONGODB_DB` e o IP do servidor precisa estar na lista de acesso do Atlas.
- `MONGODB_DB`: banco usado pelo portal (padrão sugerido: `ysdesk`).
- `YS_DESK_AUTH_SECRET`: segredo aleatório com pelo menos 32 caracteres. Gere um com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
- `YS_DESK_APP_URL`: URL HTTPS pública do portal, sem barra no final. O Mercado Pago rejeita `localhost` e HTTP; em desenvolvimento, use um túnel HTTPS público (por exemplo, ngrok ou Cloudflare Tunnel) apontando para a porta do Next.
- `MERCADOPAGO_ACCESS_TOKEN`: token privado da aplicação Mercado Pago.
- `MERCADOPAGO_TEST_PAYER_EMAIL`: e-mail de um usuário comprador de teste; usado junto de um Access Token `TEST-` durante o desenvolvimento. Em `npm run dev`, o checkout recusa credenciais live para evitar cobranças reais.
- `MERCADOPAGO_WEBHOOK_SECRET`: chave secreta de assinatura de notificações da aplicação Mercado Pago.

Configure a URL de notificações de pagamento no painel do Mercado Pago para `{YS_DESK_APP_URL}/api/ysdesk/webhook`, selecionando notificações de pagamentos. A licença só é criada após validar a assinatura do webhook, consultar o pagamento no Mercado Pago e conferir valor e moeda.

O YSdesk usa os planos de 2 máquinas por R$ 39,98, 10 por R$ 179,91 (10% de desconto), 20 por R$ 347,83 (13% de desconto) e 100 por R$ 1.499,25. Cada pacote vale três meses-calendário a partir da aprovação do pagamento. O preço base é R$ 19,99 por máquina.

Para tornar uma conta administradora, cadastre-se normalmente e altere diretamente no Atlas o campo `master` do documento do usuário:

```javascript
db.users.updateOne({ email: "seu-email@exemplo.com" }, { $set: { master: true } })
```

O campo é consultado no banco a cada requisição administrativa; não existe ação de promoção de usuários na interface. Nunca publique `.env.local` ou inclua tokens e senhas no repositório.

## Centralizador desktop

O processo central é separado do Next porque precisa manter conexões WebSocket abertas. Inicie os dois processos em terminais distintos:

```bash
npm run dev
npm run central:dev
```

Os scripts de ambiente usam `node --env-file-if-exists`; para rodar o centralizador, use Node.js 22.9 ou superior.

O centralizador escuta em `127.0.0.1:3002` por padrão. Em produção, encaminhe `/v1/control`, `/v1/session` e `/v1/health` de `https://yshrael.com` para esse processo por um proxy TLS com WebSocket habilitado. Configure `YS_DESK_CENTRAL_ORIGIN=https://yshrael.com`, `YS_DESK_CENTRAL_TRUST_PROXY=true` e mantenha a porta 3002 inacessível pela internet. O centralizador mantém presença e sockets em memória: rode uma única instância até adicionar um broker compartilhado. Não registre cabeçalhos `Authorization`, mensagens WebSocket, códigos de ativação ou tickets no proxy.

Gere os segredos sem reutilizar a senha da conta:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Use saídas independentes para `YS_DESK_RELAY_SECRET`. Gere também um par Ed25519 para licenças; guarde a chave privada apenas em `YS_DESK_LICENSE_PRIVATE_KEY_BASE64` e fixe a chave pública no cliente desktop:

```powershell
node --input-type=module -e "import { generateKeyPairSync } from 'node:crypto'; const { publicKey, privateKey } = generateKeyPairSync('ed25519'); console.log('PRIVATE_BASE64=' + Buffer.from(privateKey.export({ type: 'pkcs8', format: 'pem' })).toString('base64')); console.log('PUBLIC_PEM=' + publicKey.export({ type: 'spki', format: 'pem' }));"
```

### Protocolo de controle

O cliente conecta a `wss://yshrael.com/v1/control` e envia envelopes JSON UTF-8 versão 1, limitados a 64 KiB, com `message_id` único, `sequence` iniciado em 1, `issued_at`/`expires_at` Unix UTC e `reply_to`. `client.hello` leva `installation_id` UUID, `public_key` como SPKI DER P-256 em Base64, `app_version`, `control_protocol_version: 1` e `client_nonce` de 32 bytes em Base64URL. O servidor responde com `client.challenge` e nonces aleatórios.

Para `client.prove`, assine com ECDSA P-256/SHA-256 a sequência UTF-8 abaixo, exatamente nessa ordem e sem quebra de linha final; use assinatura IEEE-P1363 `r || s` de 64 bytes em Base64:

```text
YS-DESK-CENTRAL-V1
<server_origin>
<challenge_id>
<installation_id>
<client_nonce>
<server_nonce>
<issued_at Unix>
<expires_at Unix>
```

No primeiro vínculo, inclua `activation_code` no payload de `client.prove`; o portal exibe esse código uma única vez, ele expira em 24 horas e é consumido no vínculo. Depois de `client.authenticated`, envie `access_token` no nível superior de cada envelope e mantenha-o apenas em memória/armazenamento protegido pelo cliente. `client.heartbeat` deve ocorrer a cada 30 segundos e leva `installation_id` e `active_session_ids`. A hospedagem central só fica disponível após `host.presence` explícito com `state: ready` e capacidades suportadas.

`session.open` aceita apenas `view_screen`, `control_input`, `send_file` e `receive_file`; o Host precisa consentir antes de `session.connect`. O relay usa `wss://yshrael.com/v1/session`, recebe o ticket efêmero no cabeçalho `Authorization: Bearer <ticket>` e encaminha somente frames binários, sem interpretar conteúdo. O cliente deve proteger os dados da sessão ponta a ponta; TLS do proxy até o relay, sozinho, não atende a esse requisito. A licença entregue em `client.authenticated`/`license.update` é JSON canônico (chaves ordenadas), assinado em Ed25519; a chave pública correspondente precisa estar embutida no cliente.

O protocolo do servidor fica definido aqui porque o código-fonte do cliente desktop não faz parte deste repositório. A integração de tela/teclado por relay permanece indisponível até o cliente implementar o formato de desafio, vínculo de código, validação da licença e transporte de dados acima; conexões locais por IP/alias não passam pelo centralizador.

## Desenvolvimento

```bash
npm run dev
```

Abra `http://localhost:3000/ysdesk` para acessar o portal.
