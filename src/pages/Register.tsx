import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card";
import { Heart, Eye, EyeOff, Check } from "lucide-react";
import AdBanner from "@/src/components/AdBanner";
import { auth } from "@/src/services/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { formatPhone } from "@/src/lib/utils";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailExists, setIsEmailExists] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

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

  const { setToken, setUser } = useAuth();

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("As senhas não coincidem.");
    }
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
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8 bg-[#F3E8DF]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F3E8DF]/90 backdrop-blur-md border-b border-rose-100">
        <div className="w-full max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img src="/logochaN.png" alt="Chá de Panela Online" className="h-16 md:h-20 object-contain" />
          </Link>
          <div className="flex gap-4">
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-rose-600 hover:text-rose-700">Entrar</Button>
            </Link>
            <Link to="/?guest=true">
              <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50">Sou convidado</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-rose-500 hover:bg-rose-600 shadow-sm">Criar Lista</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="sm:mx-auto sm:w-full sm:max-w-md md:max-w-2xl pt-16">
        <Card className="glass-panel border-0 mx-auto w-full max-w-md md:max-w-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold font-serif text-[#333]">Criar Conta</CardTitle>
            <CardDescription className="text-slate-600">Preencha seus dados para organizar o evento.</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}
              {isEmailExists && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-md flex flex-col gap-3">
                  <p className="text-orange-800 text-sm font-medium">Este e-mail já está cadastrado em nossa plataforma.</p>
                  <div className="flex gap-4">
                     <Link to="/login" className="text-sm text-rose-600 hover:text-rose-700 font-medium underline">Fazer Login</Link>
                     <Link to="/forgot-password" className="text-sm text-slate-600 hover:text-slate-800 underline">Esqueci minha senha</Link>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" required value={formData.name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={formData.email} onChange={handleChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input id="phone" type="tel" required value={formData.phone} onChange={handleChange} minLength={14} maxLength={15} placeholder="(11) 99999-9999" />
                  <p className="text-[10px] text-slate-500 mt-1 flex gap-1 items-start">
                    <span className="text-rose-500 font-bold">*</span> Confira o telefone para acompanhar a lista pelo Whatsapp.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" required value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} placeholder="Ex: 01001-000" />
                </div>
              </div>

              <div className="grid grid-cols-[2fr_1fr] md:grid-cols-[2fr_1fr_1fr] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logradouro">Logradouro / Endereço</Label>
                  <Input id="logradouro" required value={formData.logradouro} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" required value={formData.numero} onChange={handleChange} />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="complemento">Complemento (Opcional)</Label>
                  <Input id="complemento" value={formData.complemento} onChange={handleChange} placeholder="Ex: Apto 123" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" required value={formData.bairro} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" required value={formData.cidade} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input id="estado" required value={formData.estado} onChange={handleChange} placeholder="UF" maxLength={2} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange} className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={handleChange} className="pr-10" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-[10px] text-rose-500 font-medium mt-1">As senhas não conferem</p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-[10px] text-emerald-500 font-medium mt-1">As senhas são idênticas</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[rgba(255,255,255,0.4)]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[rgba(255,255,255,0.2)] backdrop-blur text-slate-500 rounded-full">Ou registre-se com</span>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-[rgba(255,255,255,0.4)] flex items-center justify-center gap-2">
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                    Continuar com Google
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando..." : "Criar Conta"}
              </Button>
              <div className="text-sm text-center text-slate-500">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-rose-600 hover:text-rose-500 font-medium">Faça login</Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <AdBanner />
      </div>

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
