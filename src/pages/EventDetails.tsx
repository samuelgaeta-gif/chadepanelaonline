import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { Event, Gift, Message, Guest } from "@/src/types";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent } from "@/src/components/ui/card";
import { Gift as GiftIcon, MessageSquare, Copy, Link as LinkIcon, Plus, Check, Users, Settings, Mail, Send, Calendar, Clock, MapPin, CreditCard, ShieldCheck, UserCheck } from "lucide-react";

import { formatDateBR } from "@/src/lib/utils";

import EventTopNav from "@/src/components/EventTopNav";
import PaymentStatusModal from "@/src/components/PaymentStatusModal";

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [paymentStatusModal, setPaymentStatusModal] = useState<{isOpen: boolean, status: 'loading' | 'approved' | 'pending' | 'error' | null}>({ isOpen: false, status: null });

  // Guest form
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Event modal
  const [showEventEdit, setShowEventEdit] = useState(false);
  const [eventEditForm, setEventEditForm] = useState({ brideName: "", location: "", date: "", time: "", endereco: "" });
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  useEffect(() => {
    if (!authLoading && !token) {
      navigate("/login");
    }
    if (token && eventId) {
      loadEventData(eventId);
    }
  }, [eventId, token, authLoading, navigate]);

  const loadEventData = async (eId: string) => {
    try {
      const res = await fetch(`/api/events/${eId}`);
      if (!res.ok) {
        alert("Evento não encontrado ou acesso restrito");
        navigate("/dashboard");
        return;
      }
      const data = await res.json();
      
      // Fetch pedning payment info separately or ensure it's in the event data
      // For simplicity, we'll re-fetch minimal event info from /api/events if needed or adjust /api/events/:id
      setEvent(data.event);
      setGifts(data.gifts || []);
      
      setEventEditForm({
        brideName: data.event.brideName || "",
        location: data.event.location || "",
        date: data.event.date || "",
        time: data.event.time || "",
        endereco: data.event.endereco || ""
      });

      const msgsRes = await fetch(`/api/events/${eId}/messages?dbId=${data.event.dbId}`);
      if (msgsRes.ok) {
         const msgsData = await msgsRes.json();
         setMessages(msgsData || []);
      }

      loadGuests(data.event.dbId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!event?.dbId || !token) return;
    setPaymentStatusModal({ isOpen: true, status: 'loading' });
    try {
      const res = await fetch(`/api/payments/verify?eventId=${event.dbId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.updated && data.status === 'approved') {
        setPaymentStatusModal({ isOpen: true, status: 'approved' });
        loadEventData(eventId!);
      } else {
        setPaymentStatusModal({ isOpen: true, status: 'pending' });
      }
    } catch (err) {
      console.error("Erro ao verificar pagamento:", err);
      setPaymentStatusModal({ isOpen: true, status: 'error' });
    }
  };

  const loadGuests = async (dbId: number) => {
    try {
      const res = await fetch(`/api/events/${dbId}/guests`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGuests(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/event/${eventId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event?.dbId) return;
    setIsSavingEvent(true);
    try {
      const res = await fetch(`/api/events/${event.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          bride_name: eventEditForm.brideName,
          endereco: eventEditForm.endereco,
          data: eventEditForm.date,
          horario: eventEditForm.time
        })
      });
      if (res.ok) {
        setShowEventEdit(false);
        loadEventData(eventId!);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEvent(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Caregando...</div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <EventTopNav eventId={eventId!} />

      <main className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex flex-col gap-6">
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 items-stretch">
            <div className="md:col-span-2">
              <section className="glass-panel p-6 bg-white border-rose-100 relative overflow-hidden h-full">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold font-serif text-slate-800 flex flex-wrap items-center gap-2">
                      <Calendar className="h-6 w-6 text-rose-500 shrink-0" /> 
                      Informações da Festa
                    </h2>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl text-center self-stretch flex flex-col justify-center shrink-0 min-w-[160px]">
                    <span className="block text-[9px] uppercase text-rose-500 font-bold tracking-wider">Código de Acesso</span>
                    <span className="text-xl font-bold font-mono tracking-widest text-rose-700">{event.id}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 shrink-0"><Calendar className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Data</p>
                        <p className="text-slate-800 font-bold text-base sm:text-lg truncate">{event.date ? formatDateBR(event.date) : 'A definir'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0"><Clock className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Horário</p>
                        <p className="text-slate-800 font-bold text-base sm:text-lg truncate">{event.time || 'A definir'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex items-start flex-col sm:flex-row gap-3">
                    <div className="flex gap-3 min-w-0 w-full">
                      <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shrink-0"><MapPin className="h-5 w-5" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Local e Endereço</p>
                        <p className="text-slate-800 font-bold text-base sm:text-lg leading-tight break-words">{event.location}</p>
                        {event.endereco && <p className="text-slate-600 mt-1 text-sm sm:text-base break-words">{event.endereco}</p>}
                        <Button variant="outline" size="sm" onClick={() => setShowEventEdit(true)} className="mt-4 w-full sm:w-auto">
                          <Settings className="h-4 w-4 mr-2" /> Editar Festa
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="md:col-span-1">
            {!event.isPremium && (
              <section className={event.hasPendingPayment ? "bg-gradient-to-br from-amber-500 to-amber-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-center" : "bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-center"}>
                <div className="absolute top-0 right-0 p-6 opacity-10">
                   {event.hasPendingPayment ? <CreditCard className="h-24 w-24" /> : <Users className="h-24 w-24" />}
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-2">
                    {event.hasPendingPayment ? "Pagamento em Processo" : <>Você está utilizando o plano: <br/><span className="underline decoration-emerald-300">Básico (Free)</span></>}
                  </h3>
                  <p className={event.hasPendingPayment ? "text-amber-50 text-sm mb-6" : "text-emerald-50 text-sm mb-6"}>
                    {event.hasPendingPayment 
                      ? "Já realizou o pagamento via PIX? Clique abaixo para verificar o status e liberar seu plano."
                      : "Convide quantos convidados quiser! Migre para o Plano Premium agora."}
                  </p>
                  <Button 
                    className={event.hasPendingPayment ? "bg-white text-amber-700 hover:bg-amber-50 font-bold w-full h-12 shadow-md animate-pulse" : "bg-white text-emerald-700 hover:bg-emerald-50 font-bold w-full h-12 shadow-md"}
                    onClick={event.hasPendingPayment ? checkPaymentStatus : () => navigate(`/planos?eventId=${eventId}`)}
                  >
                    {event.hasPendingPayment ? "Verificar Pagamento ↓" : "Migrar para Lista Premium →"}
                  </Button>
                </div>
              </section>
            )}
            
            {Boolean(event.isPremium) && (
               <section className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center justify-between h-full">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                       <Check className="h-6 w-6" />
                    </div>
                    <div>
                       <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Plano Ativo</p>
                       <p className="text-emerald-700 font-medium leading-tight">Você está no plano: <br/><span className="font-bold">Premium</span></p>
                    </div>
                 </div>
               </section>
            )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Event Modal */}
      {showEventEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Editar Informações da Festa</h3>
              <button onClick={() => setShowEventEdit(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <Check className="h-5 w-5 rotate-45 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nome da Organizadora/Título</Label>
                <Input value={eventEditForm.brideName} onChange={e => setEventEditForm({...eventEditForm, brideName: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={eventEditForm.date} onChange={e => setEventEditForm({...eventEditForm, date: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input type="time" value={eventEditForm.time} onChange={e => setEventEditForm({...eventEditForm, time: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Local (Ex: Salão de Festas)</Label>
                <Input value={eventEditForm.location} onChange={e => setEventEditForm({...eventEditForm, location: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Endereço Completo</Label>
                <Input value={eventEditForm.endereco} onChange={e => setEventEditForm({...eventEditForm, endereco: e.target.value})} placeholder="Rua ..., Número ..., Bairro ..." />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowEventEdit(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700" disabled={isSavingEvent}>
                  {isSavingEvent ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Limite de Convidados</h3>
              <p className="text-slate-600 mb-6">
                No plano gratuito você pode adicionar até 3 convidados. <br/>
                <strong>Faça o upgrade para o Plano Premium</strong> para convidar todos sem limites e desbloquear recursos exclusivos!
              </p>
              <div className="space-y-3">
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-bold"
                  onClick={() => navigate(`/planos?eventId=${eventId}`)}
                >
                  Fazer Upgrade Agora
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-slate-400"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  Voltar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <PaymentStatusModal 
        isOpen={paymentStatusModal.isOpen} 
        status={paymentStatusModal.status} 
        onClose={() => setPaymentStatusModal({ isOpen: false, status: null })} 
      />
    </div>
  );
}
