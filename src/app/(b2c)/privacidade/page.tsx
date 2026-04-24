export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-on-surface mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-slate max-w-none text-on-surface-variant">
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          
          <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">1. Introdução</h2>
          <p>
            A Partiu Turismo tem o compromisso de proteger sua privacidade e seus dados pessoais. 
            Esta política explica como coletamos, usamos e protegemos as informações que você nos fornece 
            através do nosso site, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </p>

          <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">2. Coleta de Dados</h2>
          <p>
            Coletamos as informações estritamente necessárias para a prestação dos nossos serviços de turismo:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>Dados Cadastrais:</strong> Nome completo, CPF, RG, data de nascimento e e-mail.</li>
            <li><strong>Dados de Contato:</strong> Número de telefone/WhatsApp.</li>
            <li><strong>Dados de Dependentes:</strong> Informações de passageiros adicionais vinculados à sua conta.</li>
          </ul>

          <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">3. Uso das Informações</h2>
          <p>
            Utilizamos seus dados para:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>Processar e gerenciar suas reservas.</li>
            <li>Gerar a lista de passageiros (manifesto) obrigatória para órgãos rodoviários (ANTT, DER).</li>
            <li>Enviar comunicações sobre suas viagens (vouchers, alterações de horário).</li>
            <li>Comunicações de marketing (apenas se você tiver nos dado o consentimento explícito).</li>
          </ul>

          <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">4. Compartilhamento e Proteção (Segurança do Motorista)</h2>
          <p>
            Nós não vendemos seus dados. Seus dados são compartilhados apenas com os parceiros necessários para a execução 
            da viagem (ex: guias e seguradoras).
          </p>
          <p className="mt-2">
            <strong>Nota Importante:</strong> No aplicativo do nosso motorista e equipe de apoio, seu CPF é exibido 
            de forma mascarada (ex: ***.456.789-**) para garantir sua segurança em campo, evitando a exposição 
            desnecessária de dados sensíveis.
          </p>

          <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">5. Seus Direitos</h2>
          <p>
            Você pode acessar, corrigir, baixar ou solicitar a exclusão dos seus dados a qualquer momento 
            através do painel do cliente ou entrando em contato conosco.
          </p>
        </div>
      </div>
    </div>
  );
}
