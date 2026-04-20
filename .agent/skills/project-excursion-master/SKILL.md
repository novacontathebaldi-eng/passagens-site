---
name: project-excursion-master
description: >
  Single Source of Truth (Fonte Única da Verdade) para o desenvolvimento do Sistema 
  de Gestão e Venda de Excursões. Leia esta skill OBRIGATORIAMENTE antes de 
  arquitetar banco de dados, planejar interfaces (UI/UX), criar regras de negócio 
  ou integrar meios de pagamento focado neste projeto de turismo.
---

# 👑 Master do Projeto: Sistema de Excursões

Você está atuando no núcleo intelectual do projeto **"Sistema Completo de Gestão e Venda de Excursões"**.
Seu dever é projetar e construir uma plataforma web moderna, extremamente profissional, altamente escalável e Mobile-First (B2C) e Desktop-Optimized (Admin).

> **Atenção Agent:** Utilize estas regras de negócios como a sua "Single Source of Truth" para qualquer decisão de software, banco de dados ou UI neste repositório.

---

## 1. Produto Central e Arquitetura de Frotas

Diferente de e-commerce tradicional, um "Produto" aqui é uma **Excursão**, que possui lotação rigorosa e temporal atrelada a geometria de um veículo.

### Mapas de Assentos Dinâmicos
- **Toggle Administrativo:** A escolha da poltrona (reativa e visual) pelo cliente não é uma regra sempre obrigatória. Deve existir um "Toggle" no Front-end Administrativo.
- **Se ativado:** O cliente VÊ o "Seat Map" do ônibus e clica ativamente para garantir sua poltrona na transação.
- **Se desativado:** O cliente compra apenas a "vaga" sem interagir com mapa.
- 🚨 **REGRA DE BACK-END CRÍTICA:** Se o "Toggle" estiver Desativado, o algoritmo de back-end **OBRIGATORIAMENTE** deve fazer uma alocação sequencial ou aleatória oculta no banco de dados. Isso previne overbooking caso o administrador ative o assento manual no meio do período de vendas.

### Modelagem Visual
- Os "Seat Maps" não devem ser limitados a um layout fixo no código (hardcoded).
- Prepare tabelas e lógicas de front-end para renderizar matrizes configuráveis (Ex: layouts Double-decker, Executivo, Leito, etc.).

---

## 2. Experiência B2C (Portal do Cliente Final)

O checkout e o painel do viajante precisam inspirar máxima segurança institucional (Ux de alta maturidade).

### Fluxo de Dependentes
- A compra de vagas é vinculada à **identidade real** da pessoa.
- O formulário obriga o preenchimento de passageiros na sessão de pagamento contendo: 
  `Nome Completo`, `CPF`, `RG`, `Órgão Emissor`, `Contato de Emergência`.

### Portal Self-Service
- Painel para o cliente visualizar o histórico (Futuras / Anteriores).
- Download e Geração dinâmica de **Vouchers/Tickets em PDF**. Com código **QR Code** de validação local/offline.
- Fluxos automatizados para solicitar reembolso/cancelamento dependente de multas e datas.

---

## 3. Máquina Transacional (Gateways e Holds)

- **Fluxo Síncrono (Instântaneo):** Venda e débito via Cartão/PIX → baixa de estoque instantânea em Tempo Real.
- **Fluxo Assíncrono (Transferência DOC/TED/Combinado WhatsApp):**
  1. A transação fica "Em Análise".
  2. Implemente a Lógica de `Hold & Timeout` (Carrinho Bloqueado).
  3. A poltrona é "congelada", ativando um cronômetro de TTL (Time-to-Live) no banco de dados.
  4. O sistema aguarda validação (check) do *Admin* ou vencimento desse cronômetro.
  5. Quando o cronômetro expira, a vaga volta para disponibilidade pública.

### Multiplicadores Variáveis (Políticas e Promocionais)
- Nada de regras "chumbadas" (hardcoded). Todo desconto/cupom ou retenção de cancelamento é tratado por módulos puramente relacionais.
- A política de cancelamento progressiva deve permitir definir alíquotas (ex: "estorno 100% até T-7 dias", "retiro 80% em T-1 dia").

---

## 4. Back-Office Admin & RBAC

Controle de Níveis de Acesso (Role-Based Access Control) focado em praticidade de leitura e agilidade.

### Dashboard Global
- Design de Informação Vivo: Exibir faturamento, lucros, ocupação visual macro, taxa de PIX abandonado.

### Mapeamento de Roles (Perfis)
1. **Administrador Master (Eduardo):** Acesso econômico completo, multas, configurações globais.
2. **Agente de Viagens:** Perfil focado em Conversão/Venda. Visão técnica limitada a Vendas e Emissão de Ticket, forçando mapa de poltronas para o cliente offline. Não têm visibilidade de fluxo de caixa da empresa.
3. **Motorista / Guia:** Aplicativo Mobile / PWA View. Visualiza estritamente o "Manifesto Dinâmico". Listagem base de passageiros da viagem do dia -> Click "Check-in" ou Scan "QR Code" para controle de embarque digital. 

---

## 5. Guidelines de Design Visual e Arquitetura de Software

- **UX Identity:** Evite designs simplórios ou "Templates Secos". Crie algo "premium".
  - *Cores:* Tons de confiabilidade operadora turística (azuis seguros, contrastes em corais vívidos/clean e modernos).
  - *Componentes:* Aplique **Glassmorphism**, grids estruturados em **Bento Grid** em dashboards.
  - *Identidade Visual Digital:* Espaçamento largo, cantos arredondados, tipografia arrojada.
- **Desenvolvimento Modularizado:** Seja iterativo. NENHUM componente de interface deve ser gerado sem prévia aprovação da arquitetura técnica / entidades do banco pelo usuário.
