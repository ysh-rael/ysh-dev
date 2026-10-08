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
- `YS_DESK_APP_URL`: URL pública do portal, sem barra no final. Em produção, configure o domínio HTTPS para os webhooks.
- `MERCADOPAGO_ACCESS_TOKEN`: token privado da aplicação Mercado Pago.
- `MERCADOPAGO_WEBHOOK_SECRET`: chave secreta de assinatura de notificações da aplicação Mercado Pago.

Configure a URL de notificações de pagamento no painel do Mercado Pago para `{YS_DESK_APP_URL}/api/ysdesk/webhook`, selecionando notificações de pagamentos. A licença só é criada após validar a assinatura do webhook, consultar o pagamento no Mercado Pago e conferir valor e moeda.

O YSdesk usa os planos de 2 máquinas por R$ 39,98, 10 por R$ 179,91 (10% de desconto), 20 por R$ 347,83 (13% de desconto) e 100 por R$ 1.499,25. Cada pacote vale três meses-calendário a partir da aprovação do pagamento. O preço base é R$ 19,99 por máquina.

Para tornar uma conta administradora, cadastre-se normalmente e altere diretamente no Atlas o campo `master` do documento do usuário:

```javascript
db.users.updateOne({ email: "seu-email@exemplo.com" }, { $set: { master: true } })
```

O campo é consultado no banco a cada requisição administrativa; não existe ação de promoção de usuários na interface. Nunca publique `.env.local` ou inclua tokens e senhas no repositório.

## Desenvolvimento

```bash
npm run dev
```

Abra `http://localhost:3000/ysdesk` para acessar o portal.
