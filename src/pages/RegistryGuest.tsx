import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Event, Gift, Message } from "@/src/types";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent } from "@/src/components/ui/card";
import { Heart, Gift as GiftIcon, Search, MessageCircle, Calendar, LogOut } from "lucide-react";
import AdBanner from "@/src/components/AdBanner";
import { formatDateBR, formatPhone } from "@/src/lib/utils";

export default function RegistryGuest() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  // Guest interaction state
  const [selectedGifts, setSelectedGifts] = useState<Gift[]>([]);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState(() => new URLSearchParams(window.location.search).get('phone') || "");
  const [guestData, setGuestData] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [timeLeft, setTimeLeft] = useState<{d: number, h: number, m: number, s: number} | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (event?.date) {
      const calculateTimeLeft = () => {
        const eventDate = new Date(`${event.date}T${event.time || "00:00"}:00`);
        const difference = eventDate.getTime() - new Date().getTime();
        
        if (difference > 0) {
          setTimeLeft({
            d: Math.floor(difference / (1000 * 60 * 60 * 24)),
            h: Math.floor((difference / (1000 * 60 * 60)) % 24),
            m: Math.floor((difference / 1000 / 60) % 60),
            s: Math.floor((difference / 1000) % 60)
          });
        } else {
          setTimeLeft(null);
        }
      };
      
      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [event]);

  useEffect(() => {
    if (!eventId) return;

    const loadEvent = async () => {
      try {
        const phoneParams = guestPhone ? `?phone=${encodeURIComponent(guestPhone)}` : '';
        const res = await fetch(`/api/events/${eventId}${phoneParams}`);
        if (!res.ok) {
          alert("Evento não encontrado. Verifique o código.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setEvent(data.event);
        setGifts(data.gifts || []);
        if (data.guest) {
           setGuestData(data.guest);
           if (data.guest.nome && !guestName) {
             setGuestName(data.guest.nome);
           }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
    
    const interval = setInterval(loadEvent, 10000); // Poll for updates every 10s
    return () => clearInterval(interval);
  }, [eventId, guestPhone, guestName]);

  const handleChooseGift = (g: Gift) => {
    setSelectedGifts([g]);
    setIsGiftModalOpen(true);
  };

  const handleRemoveGift = (gId: string) => {
    setSelectedGifts([]);
    setIsGiftModalOpen(false);
  };

  const [isPresenceModalOpen, setIsPresenceModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const handleConfirmPresence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !event.dbId || !guestPhone) return;

    const finalGuestName = guestName || "";

    setProcessing(true);
    try {
      const res = await fetch(`/api/events/${eventId}/confirm-presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: finalGuestName,
          guestPhone,
          message: "",
          dbId: event.dbId
        })
      });
      const data = await res.json();
      if (!res.ok) {
         if (res.status === 403) {
           alert(data.error);
           window.open(`/planos?eventId=${eventId}`, '_blank');
           return;
         }
         throw new Error("Could not confirm");
      }
      
      setIsPresenceModalOpen(true);
      fetch(`/api/events/${eventId}${guestPhone ? `?phone=${encodeURIComponent(guestPhone)}` : ''}`).then(r => r.json()).then(d => {
        setGifts(d.gifts || []);
        if (d.guest) {
           setGuestData(d.guest);
        }
      });
    } catch (err: any) {
      console.error(err);
      alert("Erro ao confirmar presença. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !event.dbId || !message.trim()) return;
    if (!guestPhone || !guestName) {
      alert("Por favor, preencha seu nome e telefone nos 'Dados do Evento' antes de enviar a mensagem.");
      return;
    }

    const finalGuestName = guestName || "";

    setProcessing(true);
    try {
      const res = await fetch(`/api/events/${eventId}/confirm-presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: finalGuestName,
          guestPhone,
          message,
          dbId: event.dbId
        })
      });
      if (!res.ok) throw new Error("Could not send");
      
      setIsEditingMessage(false);
      setGuestData((prev: any) => ({ ...prev, mensagem: message }));
      setIsMessageModalOpen(true);
      fetch(`/api/events/${eventId}${guestPhone ? `?phone=${encodeURIComponent(guestPhone)}` : ''}`).then(r => r.json()).then(d => {
        if (d.guest) {
           setGuestData(d.guest);
        }
      });
    } catch (err: any) {
      console.error(err);
      alert("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmGifts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!event || !event.dbId || !guestPhone || !guestName || selectedGifts.length === 0) {
      alert("Por favor, preencha seu nome e telefone nos 'Dados do Evento' antes de prosseguir.");
      return;
    }

    const finalGuestName = guestName || "";

    setProcessing(true);
    try {
      const res = await fetch(`/api/events/${eventId}/gifts/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftIds: selectedGifts.map(g => g.id),
          guestName: finalGuestName,
          guestPhone,
          dbId: event.dbId
        })
      });
      if (!res.ok) throw new Error("Could not confirm");
      
      setIsGiftModalOpen(false);
      fetch(`/api/events/${eventId}${guestPhone ? `?phone=${encodeURIComponent(guestPhone)}` : ''}`).then(r => r.json()).then(d => {
        setGifts(d.gifts || []);
        if (d.guest) {
           setGuestData(d.guest);
        }
      });
    } catch (err: any) {
      console.error(err);
      alert("Erro ao confirmar escolha. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  const getExpiryDate = (dateStr: string) => {
    const eventDate = new Date(`${dateStr}T00:00:00`);
    eventDate.setDate(eventDate.getDate() + 1);
    return eventDate;
  };
  
  const isEventExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    const expiryDate = getExpiryDate(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    return expiryDate < today;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-rose-50">Carregando...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center bg-rose-50">Evento não encontrado.</div>;

  const expired = isEventExpired(event.date);

  const filteredGifts = gifts.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen font-sans">
      {expired && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8" />
             </div>
             <h3 className="text-2xl font-bold text-slate-800 mb-2">Evento Encerrado</h3>
             <p className="text-slate-600 mb-6">
                Essa lista foi encerrada e o evento ocorreu no dia <strong>{formatDateBR(event.date)}</strong>.
             </p>
          </div>
        </div>
      )}
      <header className="glass-panel m-6 py-12 px-6 text-center mb-8 border-none shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] relative">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/')} 
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 bg-white/50 backdrop-blur-sm"
        >
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
        <Heart className="h-10 w-10 text-rose-500 mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-serif text-[#333] mb-2">Chá de Panela</h1>
        <h2 className="text-2xl font-serif text-rose-400 italic">{event.brideName}</h2>
        <p className="text-slate-600 mt-4 flex flex-col items-center gap-1">
          <span>{formatDateBR(event.date)} {event.time && `às ${event.time}`}</span>
          <span className="text-sm">{event.location}{event.endereco ? `, ${event.endereco}` : ''}</span>
        </p>

        {timeLeft && (
          <div className="mt-4 flex justify-center gap-3 text-rose-600">
            {[timeLeft.d, timeLeft.h, timeLeft.m, timeLeft.s].map((val, i) => (
              <div key={i} className="flex flex-col items-center bg-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.3)] shadow-sm backdrop-blur-sm px-3 py-1.5 rounded-lg min-w-[54px]">
                <span className="text-lg font-bold leading-tight">{val}</span>
                <span className="text-[9px] uppercase font-semibold mt-0.5">{i === 0 ? 'Dias' : i === 1 ? 'Horas' : i === 2 ? 'Min' : 'Segs'}</span>
              </div>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content: Gift List */}
              <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
                <div className="glass-panel p-6" id="relacao-presentes">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                      <h3 className="text-2xl font-bold font-serif text-[#333]">Relação de Presentes</h3>
                      <p className="text-sm text-slate-600">Escolha os itens que deseja presentear. As imagens dos produtos são meramente ilustrativas.</p>
                    </div>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Buscar..." 
                        className="pl-9 h-10 bg-white"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                      />
                    </div>
                  </div>

                  {(() => {
                    const filteredGifts = gifts.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
                    const totalPages = Math.ceil(filteredGifts.length / itemsPerPage);
                    const paginatedGifts = filteredGifts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {paginatedGifts.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-500">Nenhum presente na lista.</div>
                          ) : (
                            paginatedGifts.map(g => (
                              <Card key={g.id} className={`overflow-hidden border-slate-100 shadow-sm transition-all relative ${g.status === 'chosen' ? 'opacity-60' : 'hover:shadow-md'}`}>
                                {g.status === 'chosen' && (
                                  <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center pointer-events-none">
                                    <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200 text-xs font-bold text-slate-500">
                                      Já Escolhido
                                    </div>
                                  </div>
                                )}
                                <div className="flex p-3 gap-3">
                                  <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                    <img src={g.imageUrl} alt={g.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                  <div className="flex-1 flex flex-col justify-between">
                                    <h4 className="font-bold text-sm text-[#333] line-clamp-2 leading-tight">{g.name}</h4>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleChooseGift(g)} 
                                      disabled={g.status === 'chosen'}
                                      className="w-full mt-2 h-8 text-xs bg-rose-500 hover:bg-rose-600 text-white"
                                    >
                                      Selecionar
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))
                          )}
                        </div>

                        {totalPages > 1 && (
                          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
                            <p className="text-sm text-slate-500">
                              Mostrando <span className="font-medium text-slate-800">{paginatedGifts.length}</span> de <span className="font-medium text-slate-800">{filteredGifts.length}</span> presentes
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setCurrentPage(currentPage - 1); document.getElementById('relacao-presentes')?.scrollIntoView({ behavior: 'smooth' }); }}
                                disabled={currentPage === 1}
                                className="h-9 px-4 rounded-xl border-slate-200 text-slate-600"
                              >
                                Anterior
                              </Button>
                              <div className="flex items-center gap-1.5 min-w-[3rem] justify-center text-sm font-medium text-slate-600">
                                {currentPage} / {totalPages}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setCurrentPage(currentPage + 1); document.getElementById('relacao-presentes')?.scrollIntoView({ behavior: 'smooth' }); }}
                                disabled={currentPage === totalPages}
                                className="h-9 px-4 rounded-xl border-slate-200 text-slate-600"
                              >
                                Próxima
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Sidebar: Event Details, Selected Gift, Message, Confirm */}
              <div className="space-y-6 flex flex-col h-full lg:col-start-3 lg:row-start-1 lg:row-span-2 order-1 lg:order-2">
                <div className="glass-panel p-6 bg-rose-50/50 border-rose-100">
                  <h3 className="font-bold font-serif text-lg text-rose-900 mb-4 flex items-center gap-2">
                     <Calendar className="h-5 w-5" /> Dados do Evento
                  </h3>
                  <div className="space-y-3 text-sm text-slate-700">
                    <p><strong>Festa de:</strong> <span className="text-rose-700 font-medium">{event.brideName}</span></p>
                    <p><strong>Data:</strong> {formatDateBR(event.date)} {event.time && `às ${event.time}`}</p>
                    <p><strong>Local:</strong> {event.location}</p>
                    {event.endereco && <p><strong>Endereço:</strong> {event.endereco}</p>}
                  </div>
                  
                  {!guestData && (
                    <div className="mt-6 pt-6 border-t border-rose-200/60 space-y-4">
                      <h4 className="font-bold text-sm text-rose-900">Seus Dados</h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-rose-700">Seu Nome</Label>
                          <Input 
                            value={guestName} 
                            onChange={(e) => setGuestName(e.target.value)} 
                            placeholder="Ex: João Silva" 
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-rose-700">Seu Telefone / WhatsApp</Label>
                          <Input 
                            type="tel" maxLength={15} minLength={14}
                            value={guestPhone} 
                            onChange={(e) => setGuestPhone(formatPhone(e.target.value))} 
                            placeholder="(11) 99999-9999" 
                            className="bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-rose-200/60">
                    <Button type="button" onClick={handleConfirmPresence} disabled={processing || !guestPhone || !guestName || guestData?.presenca_confirmada} className="w-full bg-rose-600 hover:bg-rose-700 text-white h-12 text-base">
                      {guestData?.presenca_confirmada ? 'Presença Confirmada ✓' : 'Confirmar Presença'}
                    </Button>
                  </div>
                </div>

                {guestData && guestData.reservedGifts && guestData.reservedGifts.length > 0 && (
                  <div className="glass-panel p-6 bg-emerald-50/50 border-emerald-100">
                    <h3 className="font-bold font-serif text-lg text-emerald-900 mb-4 flex items-center gap-2">
                       <GiftIcon className="h-5 w-5 text-emerald-600" /> Presentes Escolhidos
                    </h3>
                    <div className="space-y-3">
                      {guestData.reservedGifts.map((rg: any) => (
                        <div key={rg.id} className="flex gap-3 items-center bg-white p-2.5 rounded-xl border border-emerald-100 shadow-sm">
                           <img src={rg.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-slate-50" />
                           <div className="flex-1">
                             <p className="font-bold text-sm text-slate-800 line-clamp-1">{rg.name}</p>
                             <p className="text-xs text-emerald-600 font-medium">Você escolheu e confirmou</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="hidden lg:block glass-panel p-6">
                  <h3 className="font-bold font-serif text-lg text-[#333] mb-4 leading-tight flex items-center gap-2">
                     <MessageCircle className="h-5 w-5 text-rose-500 shrink-0" /> Deixe uma mensagem para {event.brideName}
                  </h3>
                  <div className="space-y-4">
                    {guestData && guestData.mensagem && !isEditingMessage ? (
                      <div className="space-y-3">
                        <div className="w-full rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-slate-800 italic">
                          "{guestData.mensagem}"
                        </div>
                        <Button 
                          type="button" 
                          onClick={() => {
                            setMessage(guestData.mensagem);
                            setIsEditingMessage(true);
                          }} 
                          variant="outline"
                          className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 h-11"
                        >
                          Alterar mensagem
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea 
                          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:border-rose-500 min-h-[100px] resize-none"
                          placeholder="Escreva uma mensagem carinhosa..."
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                        />
                        <Button type="button" onClick={handleSendMessage} disabled={processing || !message.trim()} className="w-full bg-rose-500 hover:bg-rose-600 h-11">
                          {guestData && guestData.mensagem ? 'Atualizar mensagem' : 'Enviar mensagem'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden lg:block flex-1 min-h-[250px]">
                  <AdBanner />
                </div>
              </div>

              {/* MOBILE ONLY: Message & AdBanner below everything else */}
              <div className="lg:hidden space-y-6 flex flex-col order-3">
                <div className="glass-panel p-6">
                  <h3 className="font-bold font-serif text-lg text-[#333] mb-4 leading-tight flex items-center gap-2">
                     <MessageCircle className="h-5 w-5 text-rose-500 shrink-0" /> Deixe uma mensagem para {event.brideName}
                  </h3>
                  <div className="space-y-4">
                    {guestData && guestData.mensagem && !isEditingMessage ? (
                      <div className="space-y-3">
                        <div className="w-full rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-slate-800 italic">
                          "{guestData.mensagem}"
                        </div>
                        <Button 
                          type="button" 
                          onClick={() => {
                            setMessage(guestData.mensagem);
                            setIsEditingMessage(true);
                          }} 
                          variant="outline"
                          className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 h-11"
                        >
                          Alterar mensagem
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea 
                          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:border-rose-500 min-h-[100px] resize-none"
                          placeholder="Escreva uma mensagem carinhosa..."
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                        />
                        <Button type="button" onClick={handleSendMessage} disabled={processing || !message.trim()} className="w-full bg-rose-500 hover:bg-rose-600 h-11">
                          {guestData && guestData.mensagem ? 'Atualizar mensagem' : 'Enviar mensagem'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-[250px]">
                  <AdBanner />
                </div>
              </div>
            </div>
      </main>

      {isGiftModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 text-left">
            <button onClick={() => setIsGiftModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
              &times;
            </button>
            <h3 className="text-2xl font-bold font-serif text-[#333] mb-6 flex items-center gap-2">
              <GiftIcon className="h-6 w-6 text-rose-500" /> Confirmar Presente
            </h3>
            
            <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2">
              {selectedGifts.map(g => (
                <div key={g.id} className="flex gap-4 p-3 border border-slate-100 rounded-xl bg-slate-50 relative group">
                  <button onClick={() => handleRemoveGift(g.id)} className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    &times;
                  </button>
                  <img src={g.imageUrl} alt={g.name} className="w-16 h-16 rounded-lg object-cover bg-white" referrerPolicy="no-referrer" />
                  <div className="flex-1 flex items-center">
                    <p className="font-bold text-sm text-slate-800 line-clamp-2">{g.name}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 mb-6">
              {!guestData ? (
                <div className="space-y-3">
                  <p className="text-sm text-rose-800 font-medium mb-2">Para confirmar, preencha seus dados:</p>
                  <div>
                    <Label className="text-xs text-rose-700">Seu Nome</Label>
                    <Input 
                      value={guestName} 
                      onChange={(e) => setGuestName(e.target.value)} 
                      placeholder="Ex: João Silva" 
                      className="bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-rose-700">Seu Telefone / WhatsApp</Label>
                    <Input 
                      type="tel" maxLength={15} minLength={14}
                      value={guestPhone} 
                      onChange={(e) => setGuestPhone(formatPhone(e.target.value))} 
                      placeholder="(11) 99999-9999" 
                      className="bg-white mt-1"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-rose-800 font-bold">{guestName || ""}</strong>, você fez uma Ótima escolha! Vamos notificar os organizadores e registrar sua escolha.
                </p>
              )}
            </div>

            <Button onClick={handleConfirmGifts} disabled={processing || selectedGifts.length === 0 || !guestPhone || !guestName} className="w-full h-12 bg-rose-500 hover:bg-rose-600 shadow-md text-base">
              Confirmar escolha do presente
            </Button>
          </div>
        </div>
      )}
      {isPresenceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 text-center">
            <button onClick={() => setIsPresenceModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
              &times;
            </button>
            <div className="text-6xl mb-4">😍</div>
            <h3 className="text-2xl font-bold font-serif text-[#333] mb-2">Muito Obrigado!</h3>
            <p className="text-slate-600 mb-6">
              Obrigado por confirmar sua presença no evento.
            </p>
            <Button onClick={() => setIsPresenceModalOpen(false)} className="w-full h-11 bg-blue-600 hover:bg-blue-700 shadow-md text-base">
              Fechar
            </Button>
          </div>
        </div>
      )}

      {isMessageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 text-center">
            <button onClick={() => setIsMessageModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
              &times;
            </button>
            <div className="text-rose-500 mb-4 flex justify-center"><MessageCircle className="w-16 h-16" /></div>
            <h3 className="text-2xl font-bold font-serif text-[#333] mb-2">Mensagem enviada</h3>
            <p className="text-slate-600 mb-6">
              Eles ficarão muito felizes com suas palavras!
            </p>
            <Button onClick={() => setIsMessageModalOpen(false)} className="w-full h-11 bg-rose-500 hover:bg-rose-600 shadow-md text-base">
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
