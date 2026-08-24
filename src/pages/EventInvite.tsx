import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { formatDateBR } from "@/src/lib/utils";
import EventTopNav from "@/src/components/EventTopNav";

export default function EventInvite() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');
        
        const res = await fetch(`/api/events/${eventId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEvent(data.event);
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId, navigate]);

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <EventTopNav eventId={eventId!} />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-sm text-green-900 leading-relaxed shadow-sm flex gap-4 items-start mb-8">
          <div className="p-2 bg-green-100 rounded-full shrink-0">
            <svg className="w-6 h-6 text-green-700" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
          </div>
          <p className="mt-1 text-base">
            <strong>Envie Convites pelo WhatsApp:</strong> Vá até a aba <strong>Convidados</strong> e clique no ícone do WhatsApp que fica ao lado do nome de cada convidado. Com isso, a plataforma criará um <strong>modelo de convite personalizado com o nome da pessoa</strong> (já com link e código) e copiará automaticamente para você colar no WhatsApp dela. O modelo abaixo é apenas um exemplo de como fica a mensagem enviada.
          </p>
        </div>

        <section className="glass-panel p-6 bg-rose-50/50 border-rose-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="font-semibold font-serif text-slate-800 flex items-center gap-2 text-xl">
                <Mail className="h-6 w-6 text-rose-500" />
                Exemplo de Convite para Whatsapp
              </h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl text-base sm:text-lg text-slate-700 whitespace-pre-wrap font-sans border border-rose-100 shadow-sm overflow-x-auto relative leading-relaxed">
            {`💖 Olá, [Nome do Convidado(a)]!

Você foi convidado(a) para o Chá de Panela de ${event.brideName}.

📅 Data: ${event.date ? formatDateBR(event.date) : 'A definir'}
⏰ Horário: ${event.time || 'A definir'}
📍 Local: ${event.location || 'A definir'}${event.endereco ? ` - ${event.endereco}` : ''}

Para acessar a lista de presentes e confirmar sua presença, acesse:

🌐 ${window.location.origin}/

🔑 Código da Lista: ${event.id}

Com esse código você poderá:

🎁 Escolher um ou mais presentes da lista
✅ Confirmar sua presença
💌 Enviar uma mensagem especial para os organizadores

Sua participação é muito importante para nós. Esperamos você nesse momento tão especial! ✨💖`}
          </div>
        </section>
      </main>
    </div>
  );
}
