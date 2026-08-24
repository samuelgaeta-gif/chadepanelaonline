import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Heart, Gift, Eye, EyeOff, ClipboardList, MessageSquare, Bell, Smartphone, ChevronDown, Menu, X, Check } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useAuth } from "@/src/context/AuthContext";
import { auth } from "@/src/services/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import AdBanner from "@/src/components/AdBanner";
import { formatPhone } from "@/src/lib/utils";

export default function Home() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const res = await fetch("/api/auth/google-sso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName,
          uid: user.uid
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setToken(data.token);
      if (data.user) setUser(data.user);
      
      if (data.isNewUser) {
        setShowSuccessModal(true);
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError("Erro ao autenticar com Google: " + (err.message || "Tente novamente"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.id === 'phone') {
      value = formatPhone(value);
    }
    setFormData(prev => ({ ...prev, [e.target.id]: value }));
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("As senhas não coincidem.");
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar conta");
      
      setToken(data.token);
      if (data.user) setUser(data.user);
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [showGuestAccess, setShowGuestAccess] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('guest') === 'true') {
      setShowGuestAccess(true);
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAccessList = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim()) {
      let url = `/event/${accessCode.trim().toUpperCase()}`;
      if (guestPhone.trim()) {
        url += `?phone=${encodeURIComponent(guestPhone)}`;
      }
      navigate(url);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F3E8DF]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F3E8DF]/90 backdrop-blur-md border-b border-rose-100">
        <div className="w-full max-w-5xl mx-auto px-6 py-4 flex justify-center md:justify-between items-center relative">
          <Link to="/" className={`flex items-center transition-opacity duration-300 ${!isScrolled ? 'md:opacity-100 opacity-0 pointer-events-none md:pointer-events-auto w-0 md:w-auto h-0 md:h-auto overflow-hidden md:overflow-visible' : 'opacity-100'}`}>
            <img src="/logochaN.png" alt="Chá de Panela Online" className="h-16 md:h-20 object-contain" />
          </Link>
          <div className="hidden md:flex gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-rose-600 hover:text-rose-700">Entrar / Minha Lista</Button>
            </Link>
            <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => setShowGuestAccess(true)}>Sou convidado</Button>
            <Link to="/register">
              <Button className="bg-rose-500 hover:bg-rose-600 shadow-sm">Criar Lista</Button>
            </Link>
          </div>
        </div>
      </header>

      {showGuestAccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md relative">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-8 animate-in zoom-in-95 duration-200 relative">
             <button onClick={() => setShowGuestAccess(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                &times;
             </button>
             <h3 className="text-2xl font-bold font-serif text-slate-800 mb-2 text-center">Acessar Lista</h3>
             <p className="text-sm text-slate-600 mb-6 text-center">Digite o código do evento para acessar a lista.</p>
             <form onSubmit={handleAccessList} className="space-y-4">
                <div>
                  <Label>Código do Evento</Label>
                  <Input required value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="Ex: ABC123" className="mt-1 uppercase" />
                </div>
                <div>
                  <Label>Telefone / WhatsApp</Label>
                  <Input required type="tel" maxLength={15} minLength={14} value={guestPhone} onChange={e => setGuestPhone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" className="mt-1" />
                </div>
                <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 h-11 mt-2">Acessar</Button>
             </form>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-6 pt-12 md:pt-32 pb-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          <div className="text-center md:text-left md:sticky md:top-8 mt-4 md:mt-0">
            <div className="mb-6 md:hidden flex items-center justify-center mx-auto">
              <img src="/logochaN.png" alt="Chá de Panela Online" className="h-40 object-contain drop-shadow-sm" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-800 mb-4 md:mb-6 font-serif leading-tight">
              Seu <span className="text-rose-600 break-words">Chá de Panela</span> no seu celular
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 leading-relaxed px-2 md:px-0">
              A melhor forma de organizar presentes, convidados e confirmações sem perder a essência do seu chá.
            </p>
            
            {/* MOBILE ACTION BUTTONS - App Like */}
            <div className="flex flex-col gap-3 md:hidden md:mb-0 mb-8">
              <Link to="/register">
                <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-2xl h-14 text-lg shadow-md flex items-center justify-center gap-2">
                  <ClipboardList className="w-6 h-6" />
                  Criar Minha Lista
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full border-2 border-rose-200 text-rose-600 bg-white/50 hover:bg-rose-50 rounded-2xl h-14 font-medium flex flex-col items-center justify-center gap-1 py-1">
                    <span className="text-sm">Ver Minha Lista</span>
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => setShowGuestAccess(true)} className="w-full border-2 border-rose-200 text-rose-600 bg-white/50 hover:bg-rose-50 rounded-2xl h-14 font-medium flex flex-col items-center justify-center gap-1 py-1">
                  <span className="text-sm">Sou Convidado</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-6">
            <div className="glass-panel p-6 md:p-8 w-full border-t-[4px] border-t-rose-500">
              <h2 className="text-xl font-bold font-serif text-[#333] mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500 fill-current" />
                Quer criar sua lista?
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                Crie sua lista de presentes personalizada em poucos cliques e comece a organizar seu evento!
              </p>
              
              <Link to="/register">
                <Button className="w-full bg-rose-500 hover:bg-rose-600 h-11 text-base shadow-sm">
                  Criar Minha Lista Agora
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <section className="mt-20 sm:mt-24 w-full">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-panel p-8 text-left flex flex-col items-start">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div className="text-rose-500 text-xs font-semibold uppercase tracking-wider mb-1">Organização Inteligente</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Tudo organizado em um só lugar</h3>
              <p className="text-sm text-slate-600">
                Controle convidados, confirmações de presença, presentes escolhidos e mensagens especiais em uma única plataforma.
              </p>
            </div>
            
            <div className="glass-panel p-8 text-left flex flex-col items-start">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                <Gift className="h-6 w-6" />
              </div>
              <div className="text-rose-500 text-xs font-semibold uppercase tracking-wider mb-1">Sem Perder a Essência</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">A surpresa continua no dia da festa</h3>
              <p className="text-sm text-slate-600">
                Os convidados escolhem os presentes online, mas a entrega acontece presencialmente no evento.
              </p>
            </div>

            <div className="glass-panel p-8 text-left flex flex-col items-start">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">Notificações em Tempo Real</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Receba atualizações direto no WhatsApp</h3>
              <p className="text-sm text-slate-600">
                Saiba imediatamente quando alguém confirmar presença ou escolher um presente da sua lista.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-20 sm:mt-24 w-full flex flex-col items-center">
          <div className="inline-block bg-[#EAECE6] text-[#6B7261] px-5 py-2 rounded-full text-sm font-medium mb-6">
            Perguntas frequentes
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-[#33312E] mb-10 text-center">
            Tire suas dúvidas antes de começar
          </h2>
          
          <div className="w-full max-w-3xl space-y-4">
            {[
              { question: "O que é o Chá de Panela Online?", answer: "O Chá de Panela Online é uma plataforma para organizar listas de presentes de eventos como chá de panela, chá bar, chá de casa nova e similares. Pelo site você cria sua lista, envia convites, acompanha confirmações de presença e recebe notificações dos presentes escolhidos." },
              { question: "O Chá de Panela Online recebe pagamentos dos convidados?", answer: "Não. O site não recebe dinheiro nem faz repasse ao organizador. Toda a essência do evento é mantida: o convidado escolhe o presente e entrega pessoalmente no dia da comemoração." },
              { question: "Como faço minha lista de presentes?", answer: "O organizador precisa se cadastrar na plataforma, informar os dados do evento e montar a lista de presentes. Você pode utilizar sugestões disponíveis no sistema ou cadastrar itens personalizados." },
              { question: "A lista é gratuita?", answer: "Sim. O serviço é gratuito para listas com até 10 convidados. Após esse limite, é cobrada uma taxa para utilização da plataforma." }
            ].map((faq, index) => (
              <details key={index} className="group bg-white rounded-full open:rounded-3xl border border-slate-100 shadow-sm transition-all duration-200">
                <summary className="w-full px-6 py-4 flex justify-between items-center text-left cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-medium text-[#33312E]">{faq.question}</span>
                  <div className="w-7 h-7 rounded-full bg-[#EAECE6] flex items-center justify-center shrink-0 transition-transform duration-200 group-open:-rotate-180">
                    <ChevronDown className="w-4 h-4 text-[#6B7261]" />
                  </div>
                </summary>
                <div className="px-6 text-sm text-slate-600 pb-5">
                  <div className="pt-2 border-t border-slate-100/50 mt-1">
                    {faq.answer}
                  </div>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-8">
            <Link to="/perguntas-frequentes" className="text-rose-600 font-medium hover:text-rose-700 underline underline-offset-4">
              Veja mais perguntas
            </Link>
          </div>
        </section>
        
        <div className="mt-16 sm:mt-20">
          <AdBanner />
        </div>
      </main>
      
      {/* Botão Flutuante WhatsApp */}
      <a 
        href="https://wa.me/5511999999999" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all z-50 flex items-center justify-center group"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-[200px] group-hover:ml-3 whitespace-nowrap transition-all duration-300 ease-in-out font-medium inline-block">
          Fale conosco
        </span>
      </a>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200 p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">
              Cadastro realizado com sucesso!
            </h2>
            <p className="text-slate-600 mb-8">
              Sua conta foi criada e você já pode começar a organizar o seu chá de panela.
            </p>
            <Button 
              className="w-full bg-rose-500 hover:bg-rose-600 text-lg py-6 shadow-md"
              onClick={() => navigate("/dashboard")}
            >
              Criar minha lista
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
