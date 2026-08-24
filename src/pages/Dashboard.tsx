import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { LogOut, Plus, Calendar, Star, ShieldCheck, CreditCard, User, X, Copy, Check } from "lucide-react";
import { Event } from "@/src/types";
import AdBanner from "@/src/components/AdBanner";
import { formatDateBR, formatPhone } from "@/src/lib/utils";
import PaymentStatusModal from "@/src/components/PaymentStatusModal";

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const navigate = useNavigate();
  const { user, token, loading, logout } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [paymentStatusModal, setPaymentStatusModal] = useState<{isOpen: boolean, status: 'loading' | 'approved' | 'pending' | 'error' | null}>({ isOpen: false, status: null });

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/event/${code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const [premiumPriceText, setPremiumPriceText] = useState("R$ 29,90");

  useEffect(() => {
    fetch('/api/config/precos')
      .then(res => res.json())
      .then(data => {
        if (data && data.lista_premium !== undefined) {
          const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(data.lista_premium));
          setPremiumPriceText(formatted);
        }
      })
      .catch(err => console.error("Erro ao buscar preço", err));

    if (window.location.search.includes('profile=1')) {
      setShowProfileModal(true);
      // clean up url without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadEvents = () => {
    if (token) {
      fetch("/api/events", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setEvents(data); else setEvents([]); })
      .catch(e => console.error("Error fetching events:", e));
    }
  };

  const checkPaymentStatus = async (eventId: string | number) => {
    setPaymentStatusModal({ isOpen: true, status: 'loading' });
    try {
      const res = await fetch(`/api/payments/verify?eventId=${eventId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.updated && data.status === 'approved') {
        setPaymentStatusModal({ isOpen: true, status: 'approved' });
        loadEvents();
      } else {
        setPaymentStatusModal({ isOpen: true, status: 'pending' });
      }
    } catch (err) {
      console.error("Erro ao verificar pagamento:", err);
      setPaymentStatusModal({ isOpen: true, status: 'error' });
    }
  };

  useEffect(() => {
    if (!loading && !token) {
      navigate('/login');
    }
  }, [token, loading, navigate]);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', telefone: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [token]);

  useEffect(() => {
    if (showProfileModal && user) {
      setProfileData({
        name: user.name || '',
        telefone: user.telefone || '',
        cep: user.cep || '',
        logradouro: user.logradouro || '',
        numero: user.numero || '',
        complemento: user.complemento || '',
        bairro: user.bairro || '',
        cidade: user.cidade || '',
        estado: user.estado || ''
      });
    }
  }, [showProfileModal, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
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

  const isProfileComplete = user && !!(user.name && user.telefone && user.logradouro && user.cidade && user.estado && user.numero && user.bairro);
  const hasActiveBasicList = events.some(ev => !isEventExpired(ev.date) && !ev.isPremium);

  const handleCreateEventClick = (e: React.MouseEvent) => {
    if (hasActiveBasicList) {
      e.preventDefault();
      alert("Você já possui uma lista básica ativa. Para criar uma nova lista, você precisa fazer o upgrade da sua lista atual para Premium ou aguardar seu encerramento.");
      return;
    }
    if (!isProfileComplete) {
      e.preventDefault();
      alert("Por favor, complete seus dados de cadastro antes de criar uma nova lista.");
      setShowProfileModal(true);
    }
  };

  const handleCepBlurProfile = async () => {
    const cep = profileData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setProfileData({
          ...profileData,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        });
      }
    } catch (error) {
      console.error("Erro ao buscar CEP", error);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        setShowProfileModal(false);
        alert('Perfil atualizado com sucesso!');
        window.location.reload();
      } else {
        const d = await res.json();
        alert(d.error || 'Erro ao atualizar perfil');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading && !user) return <div className="p-8 text-center text-slate-500">Caregando...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <header className="glass-header w-full">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logochaN.png" alt="Chá de Panela Online" className="h-20 md:h-24 object-contain" />
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowProfileModal(true)} className="text-slate-600">
              <User className="h-4 w-4 mr-2" />
              Meu Perfil
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="text-slate-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {isProfileComplete ? (
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#333]">Meus Eventos</h1>
              <p className="text-slate-600 mt-1">Gerencie seus chás de panela</p>
            </div>
            <Link to={hasActiveBasicList ? "#" : "/event/create"} onClick={handleCreateEventClick}>
              <Button className="bg-rose-500 hover:bg-rose-600" disabled={hasActiveBasicList}>
                <Plus className="h-4 w-4 mr-2" /> Novo Evento
              </Button>
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="glass-panel p-12 text-center text-[#333]">
              <Calendar className="h-12 w-12 text-rose-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum evento criado</h3>
              <p className="text-slate-600 mb-6 max-w-sm mx-auto">Você ainda não criou nenhum chá de panela. Crie o primeiro para começar a gerenciar sua lista de presentes.</p>
              <Link to="/event/create" onClick={handleCreateEventClick}>
                <Button className="bg-rose-500 hover:bg-rose-600">Criar Chá de Panela</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => (
                <div key={ev.id} className="glass-panel p-6 shadow-none hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-xl font-bold font-serif text-[#333]">
                      {ev.brideName} 
                      {ev.createdAt && (
                        <span className="text-xs font-sans font-normal text-slate-400 ml-2">
                          (criado em {new Date(ev.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})
                        </span>
                      )}
                    </h3>
                    {ev.isPremium ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                        <Star className="h-2.5 w-2.5 fill-current" /> Premium
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                        Grátis
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{formatDateBR(ev.date)} {ev.time && `às ${ev.time}`}</p>
                  <p className="text-xs text-slate-500 truncate mb-4 italic">
                    {ev.location}{ev.endereco ? `, ${ev.endereco}` : ''}
                  </p>
                  
                  <div className="mb-6 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Convidados cadastrados:</span>
                      <span className="font-bold text-[#333]">{ev.guestCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Convidados confirmados:</span>
                      <span className="font-bold text-[#333]">{ev.confirmedGuestCount || 0}</span>
                    </div>
                    {!ev.isPremium && (ev.guestCount || 0) >= 10 && (
                      <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Limite atingido! Faça o upgrade para receber mais convidados.</span>
                      </div>
                    )}
                    {isEventExpired(ev.date) && (
                      <div className="p-3 bg-slate-50 text-slate-700 text-xs rounded-lg border border-slate-200 flex items-start gap-2">
                        <Calendar className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Essa lista foi encerrada no dia {formatDateBR(getExpiryDate(ev.date!).toISOString())}.</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto space-y-3">
                    <Link to={isEventExpired(ev.date) ? "#" : `/event/${ev.id}/manage`} className="block">
                      <Button variant="outline" className="w-full" disabled={isEventExpired(ev.date)}>
                        Gerenciar Lista
                      </Button>
                    </Link>

                    {!ev.isPremium && (
                      ev.hasPendingPayment ? (
                        <Button 
                          onClick={() => ev.dbId && checkPaymentStatus(ev.dbId)}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm animate-pulse"
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" /> Verificar Pagamento
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => ev.id && navigate(`/planos?eventId=${ev.id}`)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm"
                        >
                          <CreditCard className="h-4 w-4 mr-2" /> Upgrade Premium ({premiumPriceText})
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-8">
            <AdBanner />
          </div>
        </main>
      ) : (
        <main className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="glass-panel p-12 max-w-lg mx-auto bg-rose-50/50">
            <User className="h-12 w-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-serif text-slate-800 mb-2">Complete seu Cadastro</h2>
            <p className="text-slate-600 mb-6">Você precisa preencher todos os seus dados antes de criar ou gerenciar listas de presentes.</p>
            <Button onClick={() => setShowProfileModal(true)} className="bg-rose-600 hover:bg-rose-700">
              Concluir Meu Cadastro Agora
            </Button>
          </div>
        </main>
      )}

      {(showProfileModal || (user && !isProfileComplete)) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            {isProfileComplete && (
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <div className="p-6 md:p-8 overflow-y-auto hide-scrollbar">
              <h2 className="text-2xl font-serif font-bold text-slate-800 mb-6">
                {isProfileComplete ? "Editar Meu Perfil" : "Conclua seu cadastro"}
              </h2>
              
              {!isProfileComplete && (
                <p className="text-sm text-rose-600 mb-6 bg-rose-50 p-3 rounded-md border border-rose-100">
                  Para continuar, precisamos que você preencha todos os campos do seu perfil.
                </p>
              )}
              
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Nome</Label>
                    <Input 
                      id="profile-name" 
                      value={profileData.name} 
                      onChange={e => setProfileData({...profileData, name: e.target.value})} 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile-telefone">Telefone / WhatsApp</Label>
                    <Input 
                      id="profile-telefone" 
                      value={profileData.telefone} 
                      onChange={e => setProfileData({...profileData, telefone: formatPhone(e.target.value)})} 
                      placeholder="Ex: (11) 99999-9999"
                      minLength={14}
                      maxLength={15}
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1 flex gap-1 items-start">
                      <span className="text-rose-500 font-bold">*</span> Confira o telefone para que possa acompanhar a lista pelo Whatsapp.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] md:items-end gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-cep">CEP</Label>
                    <Input 
                      id="profile-cep" 
                      value={profileData.cep} 
                      onChange={e => setProfileData({...profileData, cep: e.target.value})} 
                      onBlur={handleCepBlurProfile}
                      placeholder="Ex: 01001-000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-logradouro">Logradouro / Endereço</Label>
                    <Input 
                      id="profile-logradouro" 
                      value={profileData.logradouro} 
                      onChange={e => setProfileData({...profileData, logradouro: e.target.value})} 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile-numero">Número</Label>
                    <Input 
                      id="profile-numero" 
                      value={profileData.numero} 
                      onChange={e => setProfileData({...profileData, numero: e.target.value})} 
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-complemento">Complemento (Opcional)</Label>
                    <Input 
                      id="profile-complemento" 
                      value={profileData.complemento} 
                      onChange={e => setProfileData({...profileData, complemento: e.target.value})} 
                      placeholder="Ex: Apto 123"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-bairro">Bairro</Label>
                    <Input 
                      id="profile-bairro" 
                      value={profileData.bairro} 
                      onChange={e => setProfileData({...profileData, bairro: e.target.value})} 
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-cidade">Cidade</Label>
                    <Input 
                      id="profile-cidade" 
                      value={profileData.cidade} 
                      onChange={e => setProfileData({...profileData, cidade: e.target.value})} 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-estado">Estado</Label>
                    <Input 
                      id="profile-estado" 
                      value={profileData.estado} 
                      onChange={e => setProfileData({...profileData, estado: e.target.value})} 
                      placeholder="UF"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  {isProfileComplete && (
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowProfileModal(false)}>
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" disabled={savingProfile} className="flex-1 bg-rose-600 hover:bg-rose-700 text-rose-950">
                    {savingProfile ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
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
