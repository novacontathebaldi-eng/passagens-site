import { Mail, MessageCircle, MapPin, Clock } from "lucide-react";

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-on-surface font-[family-name:var(--font-display)]">Fale Conosco</h1>
          <p className="mt-4 text-lg text-on-surface-variant">
            Estamos prontos para tirar suas dúvidas e ajudar você a planejar sua viagem.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-on-surface">Canais de Atendimento</h2>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-success/10 text-success rounded-full">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">WhatsApp</h3>
                  <p className="text-on-surface-variant mt-1 text-sm">Respostas rápidas para dúvidas sobre compras e reservas.</p>
                  <a href="#" className="text-primary font-bold hover:underline mt-1 block">(11) 99999-9999</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-full">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">E-mail</h3>
                  <p className="text-on-surface-variant mt-1 text-sm">Para parcerias, fornecedores e assuntos administrativos.</p>
                  <a href="mailto:contato@viajaedu.com.br" className="text-primary font-bold hover:underline mt-1 block">contato@viajaedu.com.br</a>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-on-surface">Informações Úteis</h2>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary/10 text-secondary rounded-full">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Horário de Atendimento</h3>
                  <p className="text-on-surface-variant mt-1 text-sm">Segunda a Sexta: 09h às 18h<br/>Sábados: 09h às 13h</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-tertiary/10 text-tertiary rounded-full">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Sede Administrativa</h3>
                  <p className="text-on-surface-variant mt-1 text-sm">Nossas excursões saem de diversos pontos. Este endereço é apenas nosso escritório administrativo.</p>
                  <p className="text-on-surface-variant text-sm mt-1">São Paulo - SP</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
