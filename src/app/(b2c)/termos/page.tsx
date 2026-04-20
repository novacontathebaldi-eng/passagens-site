export default function TermosPage() {
  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-on-surface mb-8">Termos e Condições de Uso</h1>
        
        <div className="prose prose-slate max-w-none text-on-surface-variant">
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          
          <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar o site da ViajaEdu!, você concorda em cumprir estes termos de uso, 
            todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, 
            está proibido de usar ou acessar este site.
          </p>

          <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">2. Reservas e Pagamentos</h2>
          <p>
            Todas as reservas estão sujeitas à disponibilidade. A reserva só é confirmada após a
            confirmação do pagamento integral (ou da primeira parcela, quando aplicável) via PIX ou outros meios
            disponibilizados na plataforma. Reservas com pagamento via PIX que não forem pagas dentro do prazo estipulado
            (geralmente 24 horas) serão canceladas automaticamente.
          </p>

          <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">3. Política de Cancelamento e Reembolso</h2>
          <p>
            Cancelamentos devem ser solicitados formalmente através de nossos canais de atendimento. 
            O reembolso segue as diretrizes estabelecidas pela Deliberação Normativa nº 161/85 da Embratur:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>Cancelamento a mais de 30 dias do início da viagem: retenção de 10% do valor.</li>
            <li>Cancelamento entre 29 e 21 dias do início da viagem: retenção de 20% do valor.</li>
            <li>Cancelamento a menos de 20 dias do início da viagem: retenção de percentuais progressivos de acordo com os gastos irrecuperáveis da agência (podendo chegar a 100%).</li>
          </ul>

          <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">4. Regras durante as Viagens</h2>
          <p>
            Para garantir a segurança e o conforto de todos, é estritamente proibido o consumo de bebidas alcoólicas, 
            cigarros (incluindo eletrônicos) no interior dos veículos. Atrasos nos horários de embarque 
            não serão tolerados, sendo o passageiro responsável por estar no local no horário combinado.
          </p>
        </div>
      </div>
    </div>
  );
}
