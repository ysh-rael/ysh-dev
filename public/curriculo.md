# Yshrael Pimentel

<!-- Em portugues -->
**Desenvolvedor de Sistemas | Visão Computacional | Software Developer | Hardware & Systems Integration**

Belém, Pará, Brasil
**E-mail:** [ysp.rael@gmail.com](mailto:ysp.rael@gmail.com)
**LinkedIn:** [linkedin.com/in/yshrael-pimentel](https://www.linkedin.com/in/yshrael-pimentel)
**GitHub:** [github.com/ysh-rael](https://github.com/ysh-rael)
**Portfólio:** [ysh-dev.vercel.app](https://ysh-dev.vercel.app)

### Resumo Profissional

Desenvolvedor de software com experiência no ciclo completo de desenvolvimento, desde a concepção e implementação até testes, integração, tomada de decisões e implantação em produção. Atuação em aplicações web, desktop e mobile, sistemas embarcados, visão computacional e automação de processos. Experiência na integração entre software, hardware, serviços externos e sistemas legados, com foco em confiabilidade, desempenho e resolução de problemas técnicos.

### Experiência Profissional

#### Brasoluções — Analista de Sistemas

**Fevereiro de 2023 – Atual**

Desenvolvimento e evolução de soluções para gestão de estacionamentos, controle de acesso e automação operacional.

* Desenvolvimento de aplicações frontend, backend e desktop, além de ferramentas e serviços auxiliares.
* Integração com pagamentos eletrônicos, Pix, sistemas fiscais, cancelas, câmeras IP, impressoras e equipamentos de autoatendimento.
* Desenvolvimento de soluções de reconhecimento automático de placas veiculares (LPR) e processamento de imagens.
* Implementação de sistemas de Business Intelligence e processamento de dados.
* Integração entre sistemas legados, APIs, bancos de dados e dispositivos físicos.
* Desenvolvimento de testes, diagnóstico de falhas, otimização de desempenho e implantação de aplicações em servidores Linux e Windows.

### Projetos Relevantes

#### Hardware e Sistemas Embarcados

Projeto e desenvolvimento de uma controladora eletrônica própria para equipamentos de estacionamento, desde a concepção e prototipagem da placa até a implementação da lógica embarcada.

* Desenvolvimento de PCB com ESP32-S3 N16R8 utilizando EasyEDA Pro.
* Integração de Ethernet, Wi-Fi e interfaces para comunicação com periféricos.
* Implementação de mecanismos de fallback para falhas de comunicação e monitoramento de periféricos, incluindo alertas operacionais como pouco papel em impressoras.

**Tecnologias:** C/C++, ESP32-S3, W5500, EasyEDA Pro, UART/RS-232, I²C e SPI.

#### LPR — Reconhecimento de Placas Veiculares

Desenvolvimento de uma solução de reconhecimento automático de placas veiculares (LPR), abrangendo treinamento de modelos de visão computacional, processamento de imagens, OCR e integração com sistemas de controle de acesso. A solução suporta tanto operação embarcada quanto processamento centralizado a partir de câmeras IP.

* **Treinamento de modelo próprio:** modelo baseado em YOLO, treinado com aproximadamente 10 mil imagens reais e 2,5 mil imagens sintéticas geradas a partir de referências de produção, com variações de ambientes e condições visuais.
* **Validação em produção controlada:** testes em dois ambientes distintos, com mais de 50 mil acessos processados em base de teste, sem encaminhamento dos registros ao servidor principal. O sistema reconheceu aproximadamente 99% dos veículos (Somente Carros).
* **Desempenho de reconhecimento:** precisão média reportada de 94%, com melhor resultado de 99,98% , conforme as medições realizadas durante os testes.
* **Análise de limitações:** identificação de maior incidência de leituras incorretas em placas antigas de fundo cinza, orientando oportunidades de melhoria do modelo e do processamento de imagens.
* **Arquitetura flexível:** suporte à execução embarcada e à integração com câmeras IP conectadas a um servidor responsável pelo processamento e pela inteligência de LPR.

**Tecnologias:** Python, YOLO, Node.js, ONNX Runtime, PaddleOCR e processamento de imagens.


#### SaaS de Business Intelligence

Desenvolvimento e otimização de uma plataforma SaaS multi-tenant para análise de dados operacionais, com foco em processamento concorrente, eficiência de memória, isolamento de dados e experiência do usuário.

* **Otimização de memória:** análise com `process.memoryUsage()` utilizando padrões de consultas representativos do ambiente de produção. Redução do RSS de 393,19 MB para 99 MB (74,8%) e do heap de 201,94 MB para 12,85 MB (93,6%).
* **Processamento concorrente:** utilização de `worker_threads` para distribuir tarefas conforme sua complexidade e consumo de recursos, com monitoramento de memória e mecanismos de contenção de processos potencialmente problemáticos.
* **Carregamento progressivo:** implementação de entrega parcial de dados, animações e *Skeleton Screens* para melhorar a percepção de velocidade, compensando o leve aumento no tempo total de execução. Usuários relataram unanimemente melhora na performance percebida.
* **Arquitetura multi-tenant:** isolamento lógico de dados por `tenant_id`, aplicado às consultas e operações da aplicação.
* **Controle de acesso hierárquico:** autorização baseada na hierarquia de usuários e no tenant, restringindo o gerenciamento aos usuários subordinados pertencentes à mesma empresa.

**Tecnologias:** Node.js, JavaScript, React, MySQL, `worker_threads`, streams e Chart.js.



#### Gestão de Estacionamentos (Servidor Local/ Nuvem)

Desenvolvimento e manutenção de sistemas de gestão operacional, controle de acesso e integração com equipamentos.

* Implementação de funcionalidades operacionais, pagamentos, relatórios e integrações fiscais.
* Comunicação com equipamentos físicos, serviços externos e sistemas legados.
* Otimização de consultas, processamento de dados e consumo de recursos em produção.
* Sincronização de dados com aplicação em nuvem para garantir consistência e disponibilidade em tempo real.
* Criptografia e proteção de código proprietário: Criptografia em tempo de execução, descriptografador único por build e licenciamento vinculado ao hardware local, com ofuscação e fragmentação da lógica de descriptografia para dificultar a engenharia reversa e a análise automatizada, inclusive por IA, em ambientes offline.

**Tecnologias:** JavaScript, Node.js, Express, MongoDB e APIs REST.
**Ambiente:** Windows/Linux: Servidor local e nuvem.


#### Sistema Android de Gestão de Estacionamentos (POS Android)

Desenvolvimento e integração de soluções de gestão de estacionamentos, incluindo aplicações para terminais de pagamento Android e equipamentos operacionais.

Desenvolvimento de arquitetura de projeto reutilizável entre diferentes modelos de POS Android, compartilhando informações e funcionalidades comuns.
Separação das dependências, bibliotecas e SDKs específicos de cada fabricante ou modelo de terminal.
Integração entre aplicações, periféricos, sistemas de pagamento e serviços de gestão de estacionamento.
Desenvolvimento de funcionalidades operacionais e integração com sistemas legados, mantendo compatibilidade entre diferentes ambientes de execução.

**Tecnologias:** Java, Kotlin, Android, SDKs de POS, e APIs REST.

### Competências Técnicas

* **Linguagens:** JavaScript, TypeScript, C#, C++, Go, Python, Kotlin/Java (Mobile).
* **Frontend e mobile:** React, React Native, Next.js, Vite e Material UI.
* **Backend e desktop:** Node.js, Express, Electron e APIs REST.
* **Bancos de dados:** MySQL, MongoDB, MS SQL e SQLite.
* **Sistemas embarcados:** ESP32, STMicroelectronics, C/C++, interfaces de comunicação e integração com hardware.
* **IA e visão computacional:** YOLO, ONNX Runtime, PaddleOCR e OpenCV.
* **Infraestrutura:** Linux, Windows, Docker, Apache, Git e implantação de aplicações.
* **Integrações:** pagamentos, Pix, TEF, sistemas fiscais, câmeras IP, controle de acesso e periféricos.

### Formação Acadêmica

**Universidade Federal do Pará (UFPA)**
Bacharelado em Sistemas de Informação
Março de 2022 – Agosto de 2027 *(previsão de conclusão)*
