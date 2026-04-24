import { Mail, MessageCircle, MapPin, Clock } from "lucide-react";
import { getSiteSettings } from "@/lib/get-settings";

export default async function ContatoPage() {
  const settings = await getSiteSettings();
  
  const whatsappNumber = settings.whatsapp_support_numbers && settings.whatsapp_support_numbers.length > 0 && settings.whatsapp_support_numbers[0].trim() !== ""
    ? settings.whatsapp_support_numbers[0] 
    : "(11) 99999-9999";
    
  const contactEmail = settings.contact_email || "contato@partiuturismo.com.br";
  
  const operatingHours = settings.operating_hours 
    ? settings.operating_hours.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)
    : <><span key="1">Segunda a Sexta: 09h às 18h</span><br/><span key="2">Sábados: 09h às 13h</span></>;
    
  const address = settings.administrative_address || "São Paulo - SP";

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
                  <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline mt-1 block">{whatsappNumber}</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-full">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">E-mail</h3>
                  <p className="text-on-surface-variant mt-1 text-sm">Para parcerias, fornecedores e assuntos administrativos.</p>
                  <a href={`mailto:${contactEmail}`} className="text-primary font-bold hover:underline mt-1 block">{contactEmail}</a>
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
                  <p className="text-on-surface-variant mt-1 text-sm">{operatingHours}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-tertiary/10 text-tertiary rounded-full">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Sede Administrativa</h3>
                  <p className="text-on-surface-variant mt-1 text-sm">Nossas excursões saem de diversos pontos. Este endereço é apenas nosso escritório administrativo.</p>
                  <p className="text-on-surface-variant text-sm mt-1">{address}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
