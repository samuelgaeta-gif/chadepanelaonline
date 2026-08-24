import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card";
import { Heart } from "lucide-react";
import { auth } from "@/src/services/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { setToken, setUser } = useAuth();

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
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Erro ao autenticar com Google: " + (err.message || "Tente novamente"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao fazer login");
      
      setToken(data.token);
      if (data.user) setUser(data.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Email ou senha inválidos.");
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
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md pt-16">
        <Card className="glass-panel border-0 mx-auto w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold font-serif text-[#333]">Entrar</CardTitle>
            <CardDescription className="text-slate-600">
              Acesse sua conta para organizar seu evento.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link to="/forgot-password" className="text-sm text-rose-600 hover:text-rose-500 font-medium">Esqueceu a senha?</Link>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[rgba(255,255,255,0.4)]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[rgba(255,255,255,0.2)] backdrop-blur text-slate-500 rounded-full">Ou entre com</span>
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
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <div className="text-sm text-center text-slate-500">
                Ainda não tem conta?{" "}
                <Link to="/register" className="text-rose-600 hover:text-rose-500 font-medium">
                  Cadastre-se grátis
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
