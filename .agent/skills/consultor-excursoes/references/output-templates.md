# Output Templates: Consultor Sênior de Arquitetura de Excursões

Templates usados exclusivamente ao final do BLOCO 8 para cimentar a documentação final que servirá como Kickoff para LLMs Engenheiros (no Antigravity IDE) e LLMs Designers (Stitch).
**O Agente deve sempre substituir os `[VARIÁVEIS]` pelo que foi discutido e validado nos 8 blocos.**

---

## 1. Arquitetura de Dados (Modelo de Entidade-Relacionamento)

*(O agente deve formatar isso em TypeScript/Prisma ou em schemas Supabase/SQL puro a depender da stack do Bloco 7)*

- **Entity `UserAuth` & `Profile`**:
  - `role`: Enum `[ADMIN, AGENT, DRIVER, CLIENT]`.
  - Controle de RBAC e separação do acesso de quem só "vende" vs quem mexe no "financeiro".
- **Entity `VehicleLayout`**:
  - `id`, `name` (ex: Double Decker 60), `grid_matrix` (JSON que desenha a geometria: `[{row: 1, col: A, type: 'window', status: 'active'}, ...]`).
- **Entity `Excursion`**:
  - Dados: `title`, `description`, `price_per_seat`, `departure_date`.
  - Relacionamentos: Linkado a um `VehicleLayout`.
  - Core Business: `allow_seat_selection` (boolean) - O famigerado Toggle de Assentos Dinâmico.
- **Entity `Reservation` (Order/Cart)**:
  - Dados: `user_id`, `total_amount`, `status` (PENDING_PIX, APPROVED, CANCELLED).
  - Lógica TTL/Hold: `expires_at` (Timestamp crítico. Se pago, `expires_at = null_or_ignored`).
  - `gateway_provider`: String baseada na resposta da conversa (Ex: `[GATEWAY_ESCOLHIDO]`).
- **Entity `PassengerTicket`**:
  - Representa a "Cadeira (Vaga)" real (1 Reservation pode conter 4 PassengerTickets).
  - `seat_code`: String (Ex: "1A", ou se `allow_seat_selection=false`, id serial gerado no back).
  - Dados Reais: `full_name`, `cpf`, `rg`, `orgao_emissor`, `emergency_contact_name`, `emergency_contact_phone`.
  - `check_in_status`: boolean (Gatilho pro PWA do motorista).

---

## 2. Requisitos Funcionais e Roadmap (Modular)

**Fase 1: Fundação & Acessos (Infra)**
- Inicialização do Repo (`[STACK_ESCOLHIDA]`).
- Setup de Autenticação.
- Definição de Rotas com Midllewares Protegidos baseados no RBAC Profile.

**Fase 2: Gestão Geométrica e Excursões (Core ERP)**
- Módulo Admin: CRUD de Mapas de Ônibus. A UI deve permitir ao Admin (Eduardo) construir um grid visual das poltronas do ônibus.
- CRUD de Excursões. Ação vital: Administrador amarrar Preço + Ônibus + Habilitar/Desabilitar Mapas de Assento.

**Fase 3: B2C Experience & Pagamentos (Carrinho de Compras)**
- Portal logado do passageiro.
- Cadastro profundo dos dependentes obrigatórios no checkout.
- Função Algorítmica Principal: **Se Mapas Desativados -> Script back-end de alocação de poltronas oculto**.
- Trigger de Isolamento: Criar `Reservation`, injetar array de poltronas presas, disparar TTL em `expires_at`.
- Webhooks com `[GATEWAY_ESCOLHIDO]` para mudar status de PENDING para APPROVED.

**Fase 4: A Área Operacional Final**
- Tela do Bento Grid (KPIs de Ocupação e Lucro).
- PWA "Visão Slim" Manifesto do Motorista (Filtro por viagem -> Lista Assentos -> Check-In QR).
- Geração Dinâmica Frontend/Backend do Voucher em Arquivo PDF para impressão do cliente final.
- (Opcional) Trigger N8N/WhatsApp para envio de ticket digital `[CASO_TENHA_SIDO_ESCOLHIDO]`.

---

## 3. Prompt de Kickoff para o Agente (Antigravity IDE)

*(Gere a caixa preta de markdown abaixo para que o usuário jogue direto no painel do agente)*

```markdown
Você é um Arquiteto de Software e Desenvolvedor Full-Stack operando no nível Mais Sênior da indústria.
Inicie o projeto: **Sistema Integrado de Gestão e Venda de Excursões**.

**Stack Tecnológica Obrigatória:** `[INSERIR_STACK_ESCOLHIDA_COM_VERSOES_EXATAS]`
**Apresentação:** B2C deverá ser "Mobile-First" e Back-Office B2B "Desktop-Optimized".

### REGRAS CRÍTICAS DA DOMÍNIO
1. **Lotação vs Assentos**: Todo ticket vendido possui uma "cadeira de van/ônibus". Você TEM que olhar pro Boolean `allow_seat_selection` na tabela da Excursão. Se `true`, a transação recebe o ID da cadeira no Body do client. Se `false`, **SEU BACK-END DEVE OBRIGATORIAMENTE varrer as colunas disponíveis de forma segura/transacional (mutex/RLS) e alocar assentos numerados 'under-the-hood'** e atrelar aos CPFs dos tickets criados.

2. **Cron TTL PIX Lock-out**: Implemente uma mecânica de Hold temporal (Reserve). Quando um evento entra em Checkout com `status=PENDING`, lance `expires_at = now() + 15m`. Implemente o Cron/Trigger de limpeza (`pg_cron/background`) que expurgará passagens onde o TTL bateu para retornar pro estoque global imediatamente (Combatendo Ociosidade).

### MODELO DE DADOS
[O Agente deve ler o item 1 e você vai transcrevê-lo aqui na integra na linguagen SQL ou Prisma apropriada].

Inicie configurando o App Router, Layouts base de RBAC (`/app/(admin)`, `/app/(cliente)`, `/app/(manifesto)`), os estilos primordiais e a persistência do setup do Banco. Ao terminar, forneça o `Status:` e aguarde novo prompt para fase 2.
```

---

## 4. Prompt para Google Stitch (Design System)

*(Gere a caixa preta abaixo para que o usuário gere a interface Base no Stitch)*

```markdown
Assuma o papel de um Heavy/Lead UI UX Designer da Apple. Seu objetivo é estruturar o visual completo para um **Portal e ERP de Venda de Excursões Turísticas de Alto Padrão**.

**Diretrizes de Identidade Visual (Não pule nenhuma):**
- **Cores Oficiais:** `[INJETAR_CORES_ESCOLHIDAS_DURANTE_BLOCO_5_COM_CODIGOS_HEX]`.
- **Backgrounds:** Não use fundo branco bruto. Use Tons de Cinza/Superfícies muito cleans com elevações macias.
- **Micro-interações B2C:** Design System precisa exalar extrema segurança pro cliente na hora das compras.
- **Estética Global:** Utilize **Glassmorphism** leve em sidebars/modais flutuantes. Para painéis administrativos, utilize layout estrito de **Bento Grid** (Cartões encapsulados e espaçamento simétrico generoso). Layout clean e profissional, fugindo de "templates de cursinho".

**Gere o código / protótipo das 3 Páginas Fundamentais:**

1. **Dashboard do Viajante (Logado📱)**: Mobile-first bottom navigation bar. Cards grandes com a Próxima Viagem do cliente. Um botão hiper-destacado para "Baixar Voucher (QR Code)". Tem de transpor a sensação de que a agência tem porte militar com reservas garantidas.
2. **Dashboard Master do Eduardo (ERP Administrativo 🖥️)**: Bento Grid Desktop. Grid de caixas contendo: [Receita do Mês], [Lucro Operacional Estimado], [% Cadeiras Ocupadas]. Um widget na esquerda alertando "Pix com Timers Prestes a Estourar (Liberação Automática da Vaga)".
3. **PWA Manifesto de Embarque do Motorista (📱)**: UX mais limpa possível (para uso rápido na porta do ônibus escuro). Bottom estático de SCAN QR CODE, corpo com as ROWS de [1A, 1B, 1C], mostrando "Check", "Nome: João da Silva", "Falta Embarcar". Cores de ação primária focada na fluidez rápida da tarefa.

Respire fundo, analise a UI exigida, use Tailwind generoso e faça a implementação primorosa.
```
