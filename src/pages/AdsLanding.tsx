import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, Gift, Eye, EyeOff, ClipboardList, MessageSquare, Smartphone, ChevronDown, Check } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useAuth } from "@/src/context/AuthContext";
import { auth } from "@/src/services/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { formatPhone } from "@/src/lib/utils";
import AdBanner from "@/src/components/AdBanner";
import { Card, CardContent } from "@/src/components/ui/card";

export default function AdsLanding() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", password: "", confirmPassword: "" });
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailExists, setIsEmailExists] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [isScrolled, setIsScrolled] = useState(false);

  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setIsEmailExists(false);
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
        navigate("/event/create");
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

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP", error);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("As senhas não coincidem.");
    }
    setError("");
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsEmailExists(false);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'EMAIL_EXISTS') {
           throw new Error("EMAIL_EXISTS");
        }
        throw new Error(data.error || "Erro ao criar conta");
      }
      
      setToken(data.token);
      if (data.user) setUser(data.user);
      setShowSuccessModal(true);
    } catch (err: any) {
      if (err.message === "EMAIL_EXISTS") {
         setStep(1); // Go back to step 1 to show error
         setIsEmailExists(true);
      } else {
         setError(err.message || "Erro ao criar conta.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white md:bg-[#F3E8DF]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white md:bg-[#F3E8DF]/90 md:backdrop-blur-md border-b border-rose-100 shadow-sm md:shadow-none">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-center md:justify-between items-center relative">
          <Link to="/" className={`flex items-center transition-opacity duration-300 ${!isScrolled ? 'md:opacity-100 opacity-0 pointer-events-none md:pointer-events-auto w-0 md:w-auto h-0 md:h-auto overflow-hidden md:overflow-visible' : 'opacity-100'}`}>
            <img src="/logochaN.png" alt="Chá de Panela Online" className="h-14 md:h-24 object-contain" />
          </Link>
          <div className="hidden md:flex gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-rose-600 hover:text-rose-700">Entrar na minha conta</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-0 md:px-6 pt-16 md:pt-32 pb-12">
        <div className="grid md:grid-cols-[1fr_1.1fr] gap-0 md:gap-16 items-start h-full">
          <div className="text-center md:text-left pt-6 pb-4 px-6 md:px-0 md:mt-0 md:sticky md:top-32 bg-white md:bg-transparent">
            <div className="mb-4 md:hidden flex items-center justify-center mx-auto">
              <img src="/logochaN.png" alt="Chá de Panela Online" className="h-28 object-contain drop-shadow-sm" />
            </div>
            <div className="inline-block bg-rose-100 text-rose-600 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase mb-3 md:mb-4">
              Crie sua lista grátis
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-800 mb-3 md:mb-6 font-serif leading-tight">
              Organize seu <span className="text-rose-600 break-words">Chá de Panela</span> online
            </h1>
            <p className="text-sm sm:text-lg text-slate-600 mb-0 md:mb-8 leading-relaxed">
              A melhor forma de organizar presentes, convidados e confirmações de presença sem perder a essência do seu evento.
            </p>
            
            <div className="hidden md:flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0 text-rose-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Tudo em um só lugar</h4>
                  <p className="text-sm text-slate-600">Controle convidados e presentes facilmente.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0 text-rose-600">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">A surpresa continua</h4>
                  <p className="text-sm text-slate-600">Eles escolhem online, entregam na festa.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 text-emerald-600">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Notificações no WhatsApp</h4>
                  <p className="text-sm text-slate-600">Saiba quem confirmou e os presentes escolhidos.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-0 md:gap-6 w-full">
            <Card className="border-0 md:border md:glass-panel w-full md:shadow-xl rounded-none md:rounded-xl">
              <div className="p-6 md:p-8 bg-white md:bg-transparent h-full">
                <h2 className="text-xl md:text-2xl font-bold font-serif text-[#333] mb-1 md:mb-2 text-center md:text-left">
                  Comece agora mesmo
                </h2>
                <p className="text-slate-600 text-xs md:text-sm mb-6 text-center md:text-left">
                  Crie sua conta e monte sua lista de presentes grátis.
                </p>
                
                <form onSubmit={step === 1 ? handleNextStep : handleRegister} className="space-y-4 md:space-y-5">
                  {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
                  {isEmailExists && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-md flex flex-col gap-3">
                      <p className="text-orange-800 text-sm font-medium">Este e-mail já está cadastrado em nossa plataforma.</p>
                      <div className="flex gap-4">
                         <Link to="/login" className="text-sm text-rose-600 hover:text-rose-700 font-medium underline">Fazer Login</Link>
                         <Link to="/forgot-password" className="text-sm text-slate-600 hover:text-slate-800 underline">Esqueci minha senha</Link>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <>
                      <div className="mt-2 mb-6 flex flex-col gap-3">
                        <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white flex items-center justify-center gap-2 h-14 border-slate-300 hover:bg-slate-50 text-base font-medium rounded-xl shadow-sm">
                          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                          Cadastrar com Google
                        </Button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-3 bg-white md:bg-[#fbf7f4] text-slate-400 text-xs font-medium uppercase tracking-wider">Ou com seu e-mail</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-slate-700">Nome Completo</Label>
                          <Input id="name" required value={formData.name} onChange={handleChange} className="bg-white h-12 md:h-11 rounded-xl md:rounded-md text-base" />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-slate-700">E-mail</Label>
                          <Input id="email" type="email" required value={formData.email} onChange={handleChange} className="bg-white h-12 md:h-11 rounded-xl md:rounded-md text-base" />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="text-slate-700">WhatsApp</Label>
                          <Input id="phone" type="tel" required value={formData.phone} onChange={handleChange} minLength={14} maxLength={15} placeholder="(11) 99999-9999" className="bg-white h-12 md:h-11 rounded-xl md:rounded-md text-base" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-slate-700">Senha</Label>
                            <div className="relative">
                              <Input id="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange} className="pr-10 bg-white h-12 md:h-11 rounded-xl md:rounded-md text-base" />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2">
                                {showPassword ? <EyeOff className="h-5 w-5 md:h-4 md:w-4" /> : <Eye className="h-5 w-5 md:h-4 md:w-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword" className="text-slate-700">Confirmar Senha</Label>
                            <div className="relative">
                              <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={handleChange} className="pr-10 bg-white h-12 md:h-11 rounded-xl md:rounded-md text-base" />
                              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2">
                                {showConfirmPassword ? <EyeOff className="h-5 w-5 md:h-4 md:w-4" /> : <Eye className="h-5 w-5 md:h-4 md:w-4" />}
                              </button>
                            </div>
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                              <p className="text-[10px] text-rose-500 font-medium mt-1">As senhas não conferem</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 mb-8 md:mb-0">
                        <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 h-14 md:h-12 text-lg rounded-xl md:rounded-md shadow-md">
                          Continuar
                        </Button>
                        
                        <div className="md:hidden mt-6 text-center">
                          <p className="text-sm text-slate-600 mb-2">Já tem uma conta?</p>
                          <Link to="/login" className="text-rose-600 font-bold hover:underline">Fazer login</Link>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center gap-2 mb-4">
                        <button type="button" onClick={() => setStep(1)} className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center">
                          ← Voltar
                        </button>
                        <span className="text-slate-400 text-sm">| Passo 2 de 2 - Endereço</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="cep" className="text-slate-700">CEP</Label>
                          <Input id="cep" required value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} placeholder="Ex: 01001-000" className="bg-white h-12 md:h-11 rounded-xl md:rounded-md text-base" />
                        </div>
                      </div>

                      <div className="grid grid-cols-[2fr_1fr] md:grid-cols-[2fr_1fr_1fr] gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="logradouro" className="text-slate-700">Logradouro</Label>
                          <Input id="logradouro" required value={formData.logradouro} onChange={handleChange} className="bg-white h-12 md:h-11 rounded-xl md:rounded-md text-base" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="numero" className="text-slate-700">Número</Label>
                          <Input id="numero" required value={formData.numero} onChange={handleChange} className="bg-white h-12 md:h-11 rounded-xl md:rounded-md text-base" />
                        </div>
                        <div className="space-y-1.5 col-span-2 md:col-span-1">
                          <Label htmlFor="complemento" className="text-slate-700">Complemento</Label>
                          <Input id="complemento" value={formData.complemento} onChange={handleChange} placeholder="Apto 123" className="bg-white h-12 md:h-11 rounded-xl md:rounded-md text-base" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="bairro" className="text-slate-700">Bairro</Label>
                          <Input id="bairro" required value={formData.bairro} onChange={handleChange} className="bg-white h-12 md:h-11 rounded-xl md:rounded-md text-base" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cidade" className="text-slate-700">Cidade</Label>
                          <Input id="cidade" required value={formData.cidade} onChange={handleChange} className="bg-white h-12 md:h-11 rounded-xl md:rounded-md text-base" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="estado" className="text-slate-700">Estado</Label>
                          <Input id="estado" required value={formData.estado} onChange={handleChange} placeholder="UF" maxLength={2} className="bg-white h-12 md:h-11 rounded-xl md:rounded-md text-base" />
                        </div>
                      </div>

                      <div className="mt-6 pt-4 mb-8 md:mb-0">
                        <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 h-14 md:h-12 text-lg rounded-xl md:rounded-md shadow-md" disabled={loading}>
                          {loading ? "Criando conta..." : "Finalizar Cadastro Grátis"}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-center text-xs text-slate-400 mt-6 md:mt-4 hidden md:block">
                    Ao se cadastrar, você concorda com nossos Termos de Uso.
                  </p>
                </form>
              </div>
            </Card>
          </div>
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
          Tirar dúvidas
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
              onClick={() => navigate("/event/create")}
            >
              Criar minha lista
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
