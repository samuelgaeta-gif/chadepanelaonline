import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { Event, Guest } from "@/src/types";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Users, Plus, Check, Mail, ArrowLeft, Trash2, Loader2, RefreshCw } from "lucide-react";
import { formatPhone, formatDateBR } from "@/src/lib/utils";

import EventTopNav from "@/src/components/EventTopNav";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const EditableEmail = ({ guest, onUpdate }: { guest: Guest, onUpdate: (id: number, email: string) => void }) => {
  const [value, setValue] = useState(guest.email || "");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { setValue(guest.email || ""); }, [guest.email]);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== (guest.email || "")) {
      onUpdate(guest.id, value);
    }
  };

  if (!isEditing && !guest.email) {
    return (
      <span 
        className="text-slate-400 italic font-mono text-xs cursor-pointer hover:text-slate-600 transition-colors border-b border-dashed border-slate-300 pb-0.5"
        onClick={() => setIsEditing(true)}
        title="Clique para adicionar e-mail"
      >
        sem email
      </span>
    );
  }

  if (!isEditing && guest.email) {
     return (
       <span 
        className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed border-transparent hover:border-blue-300 pb-0.5"
        onClick={() => setIsEditing(true)}
        title="Clique para editar"
      >
        {guest.email}
      </span>
     );
  }

  return (
    <input 
      autoFocus
      type="email"
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      className="bg-transparent border-b border-blue-500 outline-none w-full max-w-[200px] text-slate-800 px-1 py-0.5 text-sm"
      placeholder="sem email"
    />
  );
};

export default function EventGuests() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [guestForm, setGuestForm] = useState({ nome: "", email: "", telefone: "" });
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [deleteGuestConfirm, setDeleteGuestConfirm] = useState<number | null>(null);
  const [errorModalMsg, setErrorModalMsg] = useState<string | null>(null);
  const [invitingGuestIds, setInvitingGuestIds] = useState<number[]>([]);
  const [whatsappCopyModal, setWhatsappCopyModal] = useState<{show: boolean, guestName: string}>({show: false, guestName: ""});

  useEffect(() => {
    if (!authLoading && !token) navigate("/login");
    if (token && eventId) loadData();
  }, [eventId, token, authLoading]);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) return navigate("/dashboard");
      const data = await res.json();
      setEvent(data.event);
      loadGuests(data.event.dbId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadGuests = async (dbId: number) => {
    const res = await fetch(`/api/events/${dbId}/guests`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) setGuests(await res.json());
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event?.dbId || !guestForm.nome || !guestForm.telefone) return;

    if (!event.isPremium && guests.length >= 10) {
      setShowUpgradeModal(true);
      return; 
    }

    setIsAddingGuest(true);
    try {
      const res = await fetch(`/api/events/${event.dbId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(guestForm)
      });
      if (res.ok) {
        setGuestForm({ nome: "", email: "", telefone: "" });
        loadGuests(event.dbId);
        window.dispatchEvent(new window.Event('event-stats-updated'));
        // We no longer display a message for convite_enviado=0 because it doesn't auto-send.
      } else {
        const err = await res.json();
        console.error("Error adding guest:", err);
        setErrorModalMsg(err.error || "Erro ao adicionar convidado.");
      }
    } catch (e) {
      console.error("Network error:", e);
      setErrorModalMsg("Erro de conexão ao adicionar convidado.");
    } finally {
      setIsAddingGuest(false);
    }
  };

  const handleInviteAll = async () => {
    if (!event?.dbId) return;
    if (!confirm("Deseja enviar convite por e-mail para todos os convidados pendentes?")) return;
    try {
      const res = await fetch(`/api/events/${event.dbId}/invite-all`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.totalFailed > 0) {
          setErrorModalMsg(`Enviado para ${data.count} convidado(s). Falha no envio para ${data.totalFailed} convidado(s). Tente novamente mais tarde.`);
        } else {
          setErrorModalMsg(`Convites enviados com sucesso para ${data.count} convidado(s)!`);
        }
      } else {
        setErrorModalMsg(data.error || "Erro ao enviar convites em massa.");
      }
    } catch (e) {
      console.error(e);
      setErrorModalMsg("Erro de conexão ao enviar convites.");
    }
    loadGuests(event.dbId);
  };

  const handleInviteGuest = async (guestId: number) => {
    if (!event?.dbId || !token) return;
    setInvitingGuestIds(prev => [...prev, guestId]);
    try {
      const res = await fetch(`/api/events/${event.dbId}/guests/${guestId}/invite`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setGuests(guests.map(g => g.id === guestId ? { ...g, convite_enviado: true } : g));
        setErrorModalMsg("Convite enviado com sucesso!");
      } else {
        const data = await res.json();
        setErrorModalMsg(data.error || "Erro ao tentar reenviar convite.");
      }
    } catch (e) {
      console.error(e);
      setErrorModalMsg("Erro de conexão.");
    } finally {
      setInvitingGuestIds(prev => prev.filter(id => id !== guestId));
    }
  };

  const handleUpdateEmail = async (guestId: number, newEmail: string) => {
    if (!event?.dbId || !token) return;
    try {
      const res = await fetch(`/api/events/${event.dbId}/guests/${guestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail })
      });
      if (res.ok) {
        setGuests(guests.map(g => g.id === guestId ? { ...g, email: newEmail } : g));
      } else {
        const data = await res.json();
        setErrorModalMsg(data.error || "Erro ao atualizar email.");
      }
    } catch (e) {
      console.error(e);
      setErrorModalMsg("Erro de conexão ao atualizar email.");
    }
  };

  const handleCopyWhatsappInvite = (guest: Guest) => {
    if (!event) return;
    const origin = window.location.origin;
    const inviteText = `💖 Olá, ${guest.nome}!

Você foi convidado(a) para o Chá de Panela de ${event.brideName}.

📅 Data: ${event.date ? formatDateBR(event.date) : 'A definir'}
⏰ Horário: ${event.time || 'A definir'}
📍 Local: ${event.location || 'A definir'}${event.endereco ? ` - ${event.endereco}` : ''}

Para acessar a lista de presentes e confirmar sua presença, acesse:

🌐 ${origin}/

🔑 Código da Lista: ${event.id}

Com esse código você poderá:

🎁 Escolher um ou mais presentes da lista
✅ Confirmar sua presença
💌 Enviar uma mensagem especial para os organizadores

Sua participação é muito importante para nós. Esperamos você nesse momento tão especial! ✨💖`;

    navigator.clipboard.writeText(inviteText);
    setWhatsappCopyModal({show: true, guestName: guest.nome});
  };

  const handleDeleteGuest = async () => {
    if (!event?.dbId || !token || deleteGuestConfirm === null) return;
    try {
      const res = await fetch(`/api/events/${event.dbId}/guests/${deleteGuestConfirm}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setGuests(guests.filter(g => g.id !== deleteGuestConfirm));
        window.dispatchEvent(new window.Event('event-stats-updated'));
      } else {
        const data = await res.json();
        setErrorModalMsg(data.error || "Erro ao tentar excluir convidado.");
      }
    } catch (e) {
      console.error(e);
      setErrorModalMsg("Erro de conexão.");
    } finally {
       setDeleteGuestConfirm(null);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!event) return null;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortedGuests = [...guests].sort((a, b) => a.nome.localeCompare(b.nome));
  const totalPages = Math.ceil(sortedGuests.length / itemsPerPage);
  const paginatedGuests = sortedGuests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50">
      <EventTopNav eventId={eventId!} />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <section className="glass-panel p-6 bg-white border-blue-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-500" /> 
                Gestão de Convidados
              </h2>
              <div className="text-sm text-slate-500 mt-2 flex flex-col gap-1">
                <span>Convidados cadastrados: {guests.length}</span>
                <span>Convidados confirmados: {guests.filter(g => g.presenca_confirmada).length}</span>
              </div>
            </div>
          </div>

          {!event.isPremium && guests.length >= 10 && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-amber-800">
                  Você atingiu o limite de 10 convidados gratuitos. <strong>Assine o Plano Premium</strong> para liberar convites ilimitados!
                </p>
              </div>
              <Button 
                className="bg-amber-600 hover:bg-amber-700 h-10 text-xs font-bold shrink-0"
                onClick={() => navigate(`/planos?eventId=${eventId}`)}
              >
                Ativar Lista Premium
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-8">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-sm text-blue-800 leading-relaxed shadow-sm">
              <p>
                <strong>Você pode cadastrar todos os seus convidados</strong> para montar sua lista e confirmar garantias de presença. 
                O e-mail é opcional, mas o <strong>telefone é obrigatório</strong> para identificarmos seu convidado quando ele entrar na sua lista.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-sm text-green-900 leading-relaxed shadow-sm flex gap-4 items-start">
              <div className="p-2 bg-green-100 rounded-full shrink-0">
                <WhatsAppIcon className="w-5 h-5 text-green-700" />
              </div>
              <p className="mt-1">
                <strong>Envie Convites pelo WhatsApp:</strong> Clique no ícone do WhatsApp que fica ao lado do nome de cada convidado na tabela abaixo. Com isso, a plataforma criará um <strong>modelo de convite personalizado com o nome da pessoa</strong> (já com link e código) e copiará automaticamente para você colar no WhatsApp dela.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-500" /> Novo Convidado
              </h3>
              <form onSubmit={handleAddGuest} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input placeholder="Nome Completo" value={guestForm.nome} onChange={e => setGuestForm({...guestForm, nome: e.target.value})} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">E-mail</Label>
                    <Input type="email" placeholder="email@exemplo.com" value={guestForm.email} onChange={e => setGuestForm({...guestForm, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">WhatsApp (DDD + Número)</Label>
                    <Input placeholder="(11) 99999-9999" type="tel" value={guestForm.telefone} onChange={e => setGuestForm({...guestForm, telefone: formatPhone(e.target.value)})} required />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-sm" disabled={isAddingGuest}>
                    {isAddingGuest ? "Adicionando..." : "Adicionar à Lista"}
                </Button>
              </form>
            </div>

            <div className="bg-transparent md:bg-white md:rounded-2xl md:border md:border-slate-200 overflow-hidden shadow-none md:shadow-sm">
                
                {/* Desktop Table View */}
                <table className="hidden md:table w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Nome</th>
                      <th className="px-6 py-4 font-semibold">E-mail</th>
                      <th className="px-6 py-4 font-semibold text-center">Status do Convite</th>
                      <th className="px-6 py-4 font-semibold text-center">Ação</th>
                      <th className="px-6 py-4 font-semibold text-center">Presença</th>
                      {Boolean(event.isPremium) && <th className="px-6 py-4 font-semibold text-center">Excluir</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedGuests.length === 0 ? (
                      <tr>
                        <td colSpan={event.isPremium ? 6 : 5} className="px-6 py-12 text-center text-slate-400 italic">Nenhum convidado na lista.</td>
                      </tr>
                    ) : (
                      paginatedGuests.map(g => (
                        <tr key={g.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">
                            <div className="flex items-center gap-2">
                              {g.nome}
                              <button 
                                onClick={() => handleCopyWhatsappInvite(g)}
                                title="Copiar convite para WhatsApp"
                                className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                              >
                                <WhatsAppIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <EditableEmail guest={g} onUpdate={handleUpdateEmail} />
                          </td>
                          <td className="px-6 py-4 text-center">
                            {!g.email ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-bold uppercase">
                                Não Aplicável
                              </span>
                            ) : g.convite_enviado ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">
                                Enviado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase">
                                Não enviado
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {!g.email ? (
                              <span className="text-slate-400 text-xs font-medium">-</span>
                            ) : g.presenca_confirmada && g.convite_enviado ? (
                              <span className="text-slate-400 text-xs font-medium">-</span>
                            ) : (
                              <button 
                                onClick={() => handleInviteGuest(g.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors text-xs font-bold uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={invitingGuestIds.includes(g.id)}
                              >
                                {invitingGuestIds.includes(g.id) ? (
                                  <><Loader2 className="h-3 w-3 animate-spin" /> Enviando...</>
                                ) : (
                                  <><Mail className="h-3 w-3" /> {g.convite_enviado ? 'Reenviar' : 'Enviar'}</>
                                )}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {g.presenca_confirmada ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">
                                Confirmado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase">
                                Pendente
                              </span>
                            )}
                          </td>
                          {Boolean(event.isPremium) && (
                            <td className="px-6 py-4 text-center">
                              <button
                                  onClick={() => setDeleteGuestConfirm(g.id)}
                                  className="inline-flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  title="Excluir convidado"
                              >
                                  <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col gap-4">
                  {paginatedGuests.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 italic shadow-sm">
                      Nenhum convidado na lista.
                    </div>
                  ) : (
                    paginatedGuests.map(g => (
                      <div key={g.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 relative">
                        {Boolean(event.isPremium) && (
                          <button
                              onClick={() => setDeleteGuestConfirm(g.id)}
                              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Excluir convidado"
                          >
                              <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        
                        <div className="flex flex-col gap-1 pr-10">
                          <div className="flex items-start gap-3">
                            <button 
                                onClick={() => handleCopyWhatsappInvite(g)}
                                title="Copiar convite para WhatsApp"
                                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-full transition-colors flex shrink-0 items-center justify-center animate-whatsapp-pulse z-10"
                              >
                                <WhatsAppIcon className="w-5 h-5" />
                            </button>
                            <h4 className="font-bold text-slate-800 text-lg leading-tight pt-1">
                              {g.nome}
                            </h4>
                          </div>
                          <div className="flex flex-col ps-12">
                            <span className="text-slate-500 text-sm"><EditableEmail guest={g} onUpdate={handleUpdateEmail} /></span>
                            <span className="text-slate-500 text-sm">{g.telefone ? g.telefone : <span className="text-slate-400 italic">Sem telefone</span>}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                          <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Convite</span>
                            <div>
                               {!g.email ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">
                                  N/A
                                </span>
                              ) : g.convite_enviado ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                                    Enviado
                                  </span>
                                  {!g.presenca_confirmada && (
                                    <button onClick={() => handleInviteGuest(g.id)} disabled={invitingGuestIds.includes(g.id)} className="text-blue-600 hover:text-blue-800 flex items-center justify-center p-1.5 rounded-full hover:bg-blue-50 transition-colors bg-blue-50/50">
                                      {invitingGuestIds.includes(g.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleInviteGuest(g.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors text-[10px] font-bold uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                                  disabled={invitingGuestIds.includes(g.id)}
                                >
                                  {invitingGuestIds.includes(g.id) ? (
                                    <><Loader2 className="h-3 w-3 animate-spin" /> Aguarde...</>
                                  ) : (
                                    <><Mail className="h-3 w-3" /> Enviar</>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Presença</span>
                            <div>
                              {g.presenca_confirmada ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                                  Confirmado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">
                                  Pendente
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="px-6 py-8 md:py-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-white md:rounded-b-2xl">
                    <p className="text-sm text-slate-500">
                      Mostrando <span className="font-medium text-slate-800">{paginatedGuests.length}</span> de <span className="font-medium text-slate-800">{guests.length}</span> convidados
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-9 px-4 rounded-xl border-slate-200"
                      >
                        Anterior
                      </Button>
                      <div className="flex items-center gap-1.5 min-w-[3rem] justify-center text-sm font-medium text-slate-600">
                        {currentPage} / {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-9 px-4 rounded-xl border-slate-200"
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Limite de Convidados</h3>
              <p className="text-slate-600 mb-6">
                Você atingiu o limite de 10 convidados do plano gratuito. <br/>
                <strong>Faça o upgrade para o Plano Premium</strong> para liberar sua lista e convidar todos sem limites!
              </p>
              <div className="space-y-3">
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-bold"
                  onClick={() => navigate(`/planos?eventId=${eventId}`)}
                >
                  Fazer Upgrade Agora
                </Button>
                <Button variant="ghost" className="w-full text-slate-400" onClick={() => setShowUpgradeModal(false)}>
                  Voltar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteGuestConfirm !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Excluir Convidado</h3>
            <p className="text-slate-600 mb-8">Tem certeza que deseja excluir este convidado? Esta ação é irreversível.</p>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteGuestConfirm(null)}>Cancelar</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteGuest}>Excluir</Button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Error Modal */}
      {errorModalMsg && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-8 text-center border-t-8 border-amber-500">
             <h3 className="text-xl font-bold text-slate-800 mb-4">Aviso</h3>
             <p className="text-slate-600 mb-8">{errorModalMsg}</p>
             <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white" onClick={() => setErrorModalMsg(null)}>
               Certo
             </Button>
          </div>
        </div>
      )}

      {/* WhatsApp Copy Modal */}
      {whatsappCopyModal.show && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-green-500 py-6 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 text-white rounded-full flex items-center justify-center mb-3">
                <WhatsAppIcon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white text-center px-4">Convite Copiado!</h3>
            </div>
            <div className="p-8 text-center bg-white flex-1">
              <p className="text-slate-600 mb-6 font-medium">
                O modelo de convite para <strong className="text-slate-800">{whatsappCopyModal.guestName}</strong> foi copiado para sua área de transferência.
              </p>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm text-slate-500 mb-6 shadow-inner text-left">
                <p><strong>Dica:</strong> Abra a conversa do WhatsApp dessa pessoa, cole a mensagem lá (Ctrl+V ou toque longo no celular) e envie!</p>
              </div>
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-lg font-bold rounded-xl shadow-md" 
                onClick={() => setWhatsappCopyModal({show: false, guestName: ""})}
              >
                Tudo Certo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
