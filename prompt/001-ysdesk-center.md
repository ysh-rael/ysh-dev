# Integração com o servidor central

## Escopo

Este documento define o contrato entre o YSDesk e o centralizador em `yshrael.com`. O cliente já tem identidade CNG e um canal de controle WSS opcional; o servidor, licenciamento online e transporte de sessão via relay ainda não estão implementados. A conexão direta por IP/alias e o protocolo atual continuam sendo o comportamento local do MVP.

Esta documentação descreve o contrato que o centralizador deve implementar. Não tente modificar ou reproduzir componentes internos do YSDesk. O YSDesk é um cliente externo. Implemente apenas os endpoints, WebSockets, autenticação, licenciamento, gerenciamento de dispositivos, rendezvous e relay necessários para cumprir este contrato.

Entende-se como `yshrael.com` o domínio que essa aplicação utiliza para centralizar a comunicação entre clientes YSDesk, mas pode ser outro dominio no futuro.

A integração deve ser adicionada como uma camada de controle e um transporte alternativo. Ela não deve acoplar captura de tela, codificação, entrada remota ou transferência de arquivos ao servidor central.

## Invariantes de compatibilidade local

- O acesso atual por IP:porta e alias `ysd-` na LAN deve continuar funcionando exatamente como funciona hoje: conexão TCP direta, descoberta local existente, senha e handshake atuais, protocolo de sessão e fluxo da UI.
- O caminho local não pode exigir conta, registro da instalação, licença online, conexão com `yshrael.com` ou disponibilidade do relay. Indisponibilidade do centralizador não pode impedir iniciar o YSDesk nem hospedar/conectar localmente.
- A nova rota central deve ser separada e usada para acesso entre redes, por uma identidade/ação central explícita. Não redirecionar automaticamente endereços IP ou aliases locais para o servidor e não alterar sessões salvas existentes.
- A licença e a política do servidor podem controlar os novos recursos de acesso entre redes, mas não podem desabilitar funcionalidades locais já existentes.
- Não substituir o transporte direto nem modificar o handshake local como parte da introdução do centralizador. Uma eventual mudança de segurança no caminho local exigiria uma proposta compatível independente.

## Estado atual do YSDesk

- `app::AppIdentity` persiste um alias e uma senha fixa em `%APPDATA%\\ysdesk\\identity.ini`. Os dois valores são texto puro. O alias aleatório atual é um identificador de conveniência, não uma identidade criptográfica de instalação.
- A autenticação Host/Viewer usa um nonce e HMAC-SHA256, evitando transmitir a senha, mas a conexão TCP direta não tem TLS nem autenticação criptográfica do Host.
- `HostSession` abre uma porta TCP e atende um Viewer por vez. `ViewerSession` conecta diretamente por IP:porta ou resolve aliases `ysd-` por broadcast UDP na LAN.
- `protocol` define o framing binário e mensagens de sessão. `TcpSocket` continua sendo o transporte Winsock direto. Ainda não existe transporte de sessão via relay nem TLS de ponta a ponta para essa rota.
- `saved_sessions` persiste endereço, apelido e último acesso. Não salva senha.
- `CentralClient` pode ser habilitado por `YSDESK_CENTRAL_ENDPOINT`; sem essa variável, não cria identidade central nem faz tráfego com o servidor. Ao hospedar, anuncia presença; no Viewer, `central:<installation_id>` envia um pedido central explícito.
- O cliente valida mensagens WSS e desafios assinados, envia heartbeat, apresenta pedidos recebidos para consentimento e responde a decisões. A atribuição `session.connect` ainda termina com `relay_transport_not_available`; o executável ainda não transmite frames/entrada por relay.

Esses mecanismos são suficientes para o MVP local, mas não devem ser tratados como identidade, licenciamento ou transporte seguro do futuro centralizador.

## Componentes futuros

1. **Identidade local:** armazenamento e assinatura com a chave da instalação. CNG P-256 já foi implementado no cliente.
2. **CentralClient:** conexão de controle de saída, autenticação da instalação, heartbeat e comandos tipados. A base WSS opcional já existe; licença e relay ainda são etapas futuras. O cliente executa fora da thread da UI e comunica eventos por PostMessage.
3. **Licença:** validação local de um documento assinado pelo servidor e sincronização/revogação online.
4. **Rendezvous/Relay:** alocação de uma sessão e abertura de conexões de saída de Host e Viewer para um relay.
5. **Transporte de sessão:** adicionar um caminho de stream para o relay sem remover nem mudar a implementação TCP direta usada localmente. O protocolo de frames e comandos deve continuar compartilhado quando compatível.

O canal de controle e o canal de dados de uma sessão são distintos. A perda do canal de controle não deve interromper imediatamente uma sessão já autorizada; a política de tolerância e o prazo devem ser definidos pelo servidor e pela licença.

### Habilitar o canal no cliente

Defina `YSDESK_CENTRAL_ENDPOINT` no ambiente do processo com o endpoint WebSocket TLS fornecido pelo servidor, por exemplo `wss://yshrael.com/v1/control`. A variável não tem valor padrão: sem configuração, o YSDesk não contata o centralizador e o modo local não muda. No Viewer, use `central:<installation_id>` para solicitar uma sessão central; endereços IP, IP:porta e aliases continuam no fluxo direto.

O cliente atual cobre identidade, autenticação do canal, presença, heartbeat, pedido/consentimento e mensagens de decisão. A sessão remota entre redes ainda não pode ser estabelecida até existir um relay compatível e um transporte de sessão ponta a ponta; quando receber `session.connect` antes disso, o YSDesk informa falha e fecha o fluxo sem afetar conexões locais.

## Identidade da instalação

Cada instalação deve criar uma identidade criptográfica independente do alias exibido ao usuário:

- Gerar uma chave assimétrica P-256 usando o Windows CNG Key Storage Provider. A chave privada deve ser não exportável e protegida pelo perfil Windows do usuário; usar DPAPI para proteger tokens e estado secreto que precisem ser persistidos em arquivo. A chave privada nunca deve ser enviada ao servidor nem gravada em texto puro.
- Gerar um `installation_id` aleatório de 128 bits na primeira execução e persistir sua associação à chave pública. O ID não é segredo; a chave privada prova a posse. O alias `ysd-...` continua sendo apenas um nome de descoberta e não substitui o ID.
- Persistir ID, chave pública, versão do formato e metadados não secretos em `%APPDATA%\\ysdesk\\central\\`. Restringir as permissões da pasta ao usuário atual. Preferir a chave protegida pelo CNG a exportar material privado para esse diretório.
- Em reinstalação que perca a chave, tratar a instalação como nova e exigir reativação/revogação no servidor. Não reconstruir identidade usando MAC, serial de hardware ou outros identificadores invasivos. Migração de perfil, quando necessária, deve ser explícita e autenticada.

O servidor registra `installation_id` junto ao fingerprint da chave pública. A troca da chave requer prova de posse da chave antiga ou recuperação autenticada, gera evento de auditoria e revoga a chave anterior.

## Licença

A licença deve ser um documento assinado pelo servidor, verificável sem conexão usando uma chave pública de assinatura embutida no cliente. O servidor mantém a chave privada de assinatura; ela nunca é distribuída com o YSDesk. Usar uma codificação canônica e versionada para assinar os bytes exatos do payload, evitando diferenças de serialização.

Campos mínimos do payload:

- `schema_version`, `license_id` e `issuer`;
- `installation_id` e fingerprint da chave pública vinculada;
- `issued_at`, `not_before` e `expires_at` em UTC;
- recursos permitidos, limites e políticas, por exemplo número de sessões simultâneas, uso de relay, transferência de arquivos e uso comercial;
- identificador de versão/política e, quando aplicável, prazo de tolerância offline.

O cliente deve verificar assinatura, versão, emissor, vínculo à instalação, validade temporal, recursos e limites antes de habilitar funcionalidades licenciadas. Guardar a licença e a última resposta de validação online protegidas por DPAPI. Renovação e revogação devem ocorrer no canal autenticado; o servidor é a fonte de verdade para revogação. A licença central controla os novos recursos de acesso entre redes e não deve bloquear a comunicação local já existente.

A adulteração deve ser detectada rejeitando payload inválido, assinatura incorreta, licença de outra instalação, campos desconhecidos críticos, relógio incompatível e estado local inconsistente. A aplicação deve ter assinatura Authenticode e atualizar-se por canal assinado. Nenhum controle local consegue impedir completamente um administrador de modificar um binário ou relógio sob seu próprio controle: enforcement crítico deve ser confirmado pelo servidor, e a tolerância offline deve ser limitada e documentada.

## Contrato de comunicação

### YSDesk para o servidor

Enviar apenas o necessário para autenticação, licenciamento e operação:

- versão do protocolo central, versão do aplicativo, `installation_id`, chave pública/fingerprint e prova de posse;
- estado da licença, recursos solicitados e resultado de validação;
- presença/heartbeat, estado `host_ready` quando o usuário habilitar hospedagem e capacidades compatíveis;
- IDs de comandos/sessões, confirmações, recusas e erros necessários ao fluxo;
- métricas operacionais agregadas somente se previstas na política de privacidade e configuradas para coleta.

Não enviar por padrão: senha fixa, HMAC da autenticação local, conteúdo da tela, eventos de teclado/mouse, conteúdo ou nomes de arquivos, clipboard, endereço IP/MAC local, serial de hardware ou lista de processos. Endereço IP público observado pelo servidor pode ser usado para roteamento temporário; não deve virar histórico persistente sem necessidade e política explícita.

### Servidor para o YSDesk

O cliente aceita apenas mensagens tipadas e autorizadas:

- desafio de autenticação, token de controle, renovação e estado da licença;
- heartbeat/intervalo recomendado e notificações de atualização de política;
- pedido de sessão contendo `session_id`, identidade do solicitante, recursos pedidos, expiração e política de consentimento;
- instrução de rendezvous com endpoint do relay e ticket de uso único, curto e vinculado à sessão, à instalação e ao papel (`host` ou `viewer`);
- cancelamento/revogação de pedido ou sessão e mensagens de erro versionadas.

O servidor não pode enviar comandos arbitrários de sistema. Cada tipo de comando tem esquema, tamanho máximo, validade, escopo e tratamento definido. Por padrão, iniciar uma sessão exige consentimento explícito no Host; uma política de acesso não assistido deve ser habilitada separadamente pelo usuário e limitada por licença.

### Formato das mensagens

O canal de controle deve usar mensagens JSON UTF-8 versionadas em WebSocket seguro. Cada mensagem tem um envelope comum:

```json
{
	"version": 1,
	"message_id": "uuid",
	"type": "session.request",
	"sequence": 42,
	"issued_at": 1791489600,
	"expires_at": 1791489660,
	"reply_to": null,
	"payload": {}
}
```

`sequence` é crescente por conexão autenticada; `message_id` identifica a mensagem para idempotência; `reply_to` associa respostas. Depois da autenticação, o cliente inclui `access_token` no envelope sobre TLS; o token fica somente em memória e não é registrado em logs. Horários são Unix UTC em segundos. Mensagens expiradas, repetidas, fora de ordem, desconhecidas ou acima do limite de tamanho são rejeitadas. O controle deve limitar cada mensagem a 64 KiB; frames e arquivos não trafegam nesse canal.

### Mensagens enviadas pelo YSDesk

| Tipo | Payload mínimo | Finalidade |
| --- | --- | --- |
| `client.hello` | `installation_id`, `public_key`, `app_version`, `control_protocol_version`, `client_nonce` | Identificar a instalação e iniciar o desafio de autenticação. |
| `client.prove` | `challenge_id`, `client_nonce`, `server_nonce`, `signature` | Provar posse da chave privada sobre o desafio recebido. |
| `host.presence` | `state` (`ready`/`busy`/`offline`), `capabilities`, `session_protocol_version` | Anunciar disponibilidade central somente quando o usuário habilitar hospedagem. Não inclui IP local. |
| `session.open` | `target_installation_id`, `requested_capabilities`, `viewer_nonce` | Solicitar acesso entre redes a uma instalação específica. |
| `session.decision` | `session_id`, `decision` (`accepted`/`rejected`), `reason_code` opcional | Responder a um pedido mostrado ao usuário no Host. |
| `session.state` | `session_id`, `state`, `reason_code` opcional | Confirmar conexão, falha ou encerramento. |
| `session.close` | `session_id`, `reason_code` | Encerrar uma sessão ativa de forma explícita. |
| `client.heartbeat` | `installation_id`, `sequence`, `active_session_ids` | Manter presença e renovar o estado do canal. |

`requested_capabilities` deve ser uma lista fechada, como `view_screen`, `control_input`, `send_file` e `receive_file`; conceder uma capacidade não concede as demais. O Viewer solicita apenas as necessárias. O Host confirma a lista efetivamente aceita.

Exemplo de solicitação do Viewer:

```json
{
	"version": 1,
	"message_id": "2dfdb3da-f72e-4d98-a3a6-a09ea982c500",
	"type": "session.open",
	"sequence": 8,
	"issued_at": 1791489600,
	"expires_at": 1791489660,
	"reply_to": null,
	"payload": {
		"target_installation_id": "d1c0b58b-3e6d-48a7-a0d0-4ca9cda98368",
		"requested_capabilities": ["view_screen", "control_input"],
		"viewer_nonce": "base64-encoded-random-32-bytes"
	}
}
```

### Comandos recebidos e ações permitidas

O cliente só executa os seguintes tipos de ação, após validar envelope, autenticação, expiração, licença e estado local:

| Tipo recebido | Ação local permitida |
| --- | --- |
| `client.challenge` | Assinar o desafio com a chave privada local e responder com `client.prove`. |
| `session.request` | Mostrar no Host quem solicita, capacidades e prazo. Não iniciar a sessão antes da decisão local, salvo política de acesso não assistido configurada explicitamente pelo usuário. |
| `session.cancel` | Cancelar somente o pedido pendente identificado por `session_id`. |
| `session.connect` | Validar endpoint WSS, papel e ticket; abrir relay somente quando o transporte estiver implementado e a sessão/autorização coincidirem. Na versão atual, reportar `relay_transport_not_available` e não iniciar conexão de dados. |
| `session.terminate` | Encerrar somente o `session_id` indicado e reportar o estado final. |
| `license.update` | Verificar assinatura e vínculo da licença; persistir apenas após validação. |
| `policy.update` | Validar versão e campos permitidos e aplicar somente políticas documentadas. |
| `client.ping` | Responder com `client.pong`; não altera estado da máquina. |

Exemplo de `session.connect` entregue a cada participante (cada um recebe ticket próprio):

```json
{
	"version": 1,
	"message_id": "ae21abcb-c8cd-4974-9d54-e58f62f63442",
	"type": "session.connect",
	"sequence": 19,
	"issued_at": 1791489610,
	"expires_at": 1791489670,
	"reply_to": "2dfdb3da-f72e-4d98-a3a6-a09ea982c500",
	"payload": {
		"session_id": "4b46221e-87b9-4649-8f71-e50b7ab484aa",
		"role": "host",
		"relay_endpoint": "wss://relay.yshrael.com/v1/session",
		"ticket": "opaque-single-use-ticket",
		"ticket_expires_at": 1791489670,
		"capabilities": ["view_screen", "control_input"],
		"session_protocol_version": 2
	}
}
```

O cliente não deve implementar `exec`, `shell`, `powershell`, execução de processo, download/execução de arquivo ou qualquer comando genérico recebido do servidor. O “comando remoto” do centralizador significa somente uma operação tipada de controle do YSDesk, como pedir consentimento, conectar ao relay ou terminar uma sessão. Mouse/teclado e arquivos continuam sendo mensagens do protocolo de sessão existente e só são aceitos durante uma sessão autorizada, conforme as capacidades concedidas. Comando desconhecido ou não autorizado é rejeitado e auditado sem executar efeitos locais.

### Ciclo de acesso entre redes

1. Host e Viewer autenticam suas instalações no canal persistente. O Host envia `host.presence` apenas quando estiver disponível para acesso central.
2. O Viewer envia `session.open` com o ID central do Host e capacidades solicitadas. O servidor verifica licença e autorização e entrega `session.request` ao Host.
3. O Host apresenta o pedido localmente e envia `session.decision`. Recusa, timeout ou cancelamento encerra o fluxo sem abrir relay.
4. Após aceite, o servidor envia `session.connect` com tickets diferentes ao Host e ao Viewer. Ambos iniciam conexões de saída para o relay, validam o ticket e estabelecem o canal protegido de ponta a ponta.
5. O YSDesk envia `session.state` ao conectar ou falhar. Durante a sessão, screen/input/file trafegam apenas pelo transporte de dados autorizado, nunca dentro das mensagens de controle. Encerramento local, remoto, revogação ou expiração fecha o relay e gera `session.state` final.

Esse fluxo central é independente do fluxo local por IP/alias. Não converter automaticamente `session.open` em tentativa direta nem alterar a descoberta LAN existente.

## Autenticação da instalação e canal persistente

Usar TLS com validação normal de certificado e hostname (`wss://` para WebSocket sobre TLS, ou TLS sobre TCP) nos novos canais com o servidor e com o relay. Exigir TLS 1.2 no mínimo e preferir TLS 1.3 quando disponível; nunca desativar validação de certificado como fallback. A rota relay deve proteger os dados de sessão de ponta a ponta; TLS apenas no trecho YSDesk-relay não protege contra um relay que termine TLS. Esses requisitos se aplicam à nova rota central e não alteram o transporte nem o handshake do acesso local atual.

Fluxo de registro/autenticação:

1. O cliente abre TLS de saída para o endpoint oficial e envia `protocol_version`, `installation_id`, chave pública, versão do cliente e um nonce aleatório do cliente.
2. O servidor responde com nonce aleatório próprio, identificador do desafio, horário e prazo curto.
3. O cliente assina com a chave privada uma mensagem com separação de domínio contendo nonces, desafio, origem do servidor, versão do protocolo e horário. O servidor verifica a assinatura e o vínculo da chave ao registro.
4. No primeiro registro, exigir código de ativação de uso limitado ou fluxo de conta autenticado; não embutir segredo compartilhado no executável. O servidor associa a chave e emite token opaco de curta duração, vinculado à instalação e a escopos específicos.
5. Renovar tokens por nova prova de posse. Revogação, perda da chave ou troca de conta invalida tokens existentes.

Manter o canal de controle de saída com WebSocket seguro ou TLS persistente. Enviar heartbeat com sequência e horário; usar timeout, reconexão com backoff exponencial e jitter, renovação de token e fechamento limpo. Não abrir listener no YSDesk para controle central. Implementar essa rotina em um componente de rede próprio, não na thread da UI.

## Rendezvous e relay sem portas abertas

Para a rota entre redes, o Host mantém a conexão de controle de saída e anuncia somente que está disponível. O acesso local continua conectando diretamente, sem passar pelo servidor. Quando um Viewer autenticado solicita uma sessão central, o servidor valida licença, permissões e consentimento e entrega ao Host um pedido com `session_id`, solicitante, recursos, prazo e nonce. Após a aceitação do Host, o servidor emite tickets efêmeros distintos para os papéis Host e Viewer.

Cada lado inicia uma conexão de saída para o relay, normalmente em TCP 443 sobre TLS/WebSocket para atravessar NAT e firewalls comuns. O relay valida o ticket de uso único, associa os dois sockets pelo `session_id` e encaminha bytes até a sessão terminar. Não há conexão de entrada para a máquina do usuário, port forwarding ou configuração manual de NAT. Se ambos os lados estiverem conectados e uma conexão direta puder ser estabelecida sem intervenção, ela poderá ser uma otimização futura; relay deve continuar como fallback confiável.

O relay deve tratar o fluxo da sessão como opaco. Host e Viewer autenticam-se mutuamente para a sessão e protegem o conteúdo de ponta a ponta com TLS pass-through ou protocolo autenticado equivalente; o relay não recebe chaves de sessão nem conteúdo em claro. O ticket do relay autoriza somente um papel, um `session_id`, capacidades definidas e prazo curto. Ao encerrar ou expirar, os tickets deixam de funcionar e os dois clientes fecham o túnel.

O protocolo atual pode continuar dentro do túnel central, mas a integração futura precisa introduzir uma interface de transporte estreita (por exemplo, stream confiável de leitura/escrita) para acrescentar o relay sem substituir o caminho `TcpSocket` direto de `HostSession` e `ViewerSession`. A implementação deve preservar esse caminho e o handshake local existentes. A captura, codec, frames, mouse, teclado e arquivos permanecem no protocolo de sessão. O handshake HMAC atual não deve ser considerado substituto de criptografia de ponta a ponta na nova rota relay.

## Proteções obrigatórias

- Nonces aleatórios criptográficos de pelo menos 256 bits para desafios centrais; nunca reutilizar nonce ou ticket.
- Assinar desafio com nonces de cliente/servidor, origem, finalidade, versão e papel para impedir substituição entre protocolos e replay.
- Token central opaco, escopado, vinculado à instalação, expirável, rotacionável e armazenado protegido por DPAPI. Não registrar tokens em logs.
- Ticket de relay de uso único, validade curta (por exemplo, até 60 segundos para iniciar a conexão), vinculado a `session_id`, instalação, papel e recursos. Sessão estabelecida tem prazo/renovação explícitos.
- Rejeitar sequências repetidas, desafios expirados, comando repetido ou fora de ordem; usar `command_id` idempotente, sequência monotônica por conexão e janela temporal limitada.
- Limitar tamanho de mensagens, frequência de tentativas e sessões simultâneas. Fazer rate limit de login/ativação e atraso progressivo em falhas.
- Não confiar em dados de licença, hostname, papel ou capacidade fornecidos pelo cliente sem validação no servidor. Não incluir segredos em logs, crash dumps ou mensagens de UI.
- Separar autorização/licença de transporte; perda ou revogação de autorização deve impedir novas sessões e encerrar sessões conforme a política definida.

## Compatibilidade e etapas de implementação

1. **Preparação local:** criar armazenamento de identidade baseado em CNG/DPAPI e migração cuidadosa, sem reutilizar senha/alias como chave; não alterar o funcionamento do acesso direto.
2. **Canal de controle:** adicionar `CentralClient` opcional, protocolo/versionamento próprios, TLS, registro e heartbeat. A ausência do servidor não deve impedir o modo local.
3. **Licença:** validar documentos assinados e ativar recursos por capacidades existentes; não colocar verificações espalhadas pela UI.
4. **Transporte:** definir interface de stream mantendo `TcpSocket` e o fluxo direto atual intactos. Acrescentar o transporte relay em um caminho separado e selecionável para sessões centrais.
5. **Sessões centrais:** introduzir pedido, consentimento, tickets e relay de ponta a ponta; testar expiração, desconexão, replay e reconexão.

A primeira implementação do cliente deve preservar os fluxos existentes de `HostSession` e `ViewerSession`, evitar mudanças no formato de mensagens de tela sem necessidade e ser desligável por configuração até o servidor estar disponível. O caminho por IP/alias deve continuar independente e prioritário para uso local; a rota central será usada somente para o novo acesso entre redes. Os nomes de endpoints, esquemas finais, algoritmos de assinatura, retenção de dados, duração de licença e política de consentimento são decisões que precisam ser fixadas antes de habilitar integração em produção.
