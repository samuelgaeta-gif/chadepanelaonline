import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card";
import { User, LogOut } from "lucide-react";
import AdBanner from "@/src/components/AdBanner";

export default function CreateEvent() {
  const [formData, setFormData] = useState({ brideName: "", date: "", time: "", location: "", address: "", theme: "Chá de Panela" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  useEffect(() => {
    if (user && !(user.name && user.telefone && user.logradouro && user.cidade && user.estado)) {
      alert("Por favor, complete seus dados de cadastro antes de criar uma nova lista.");
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return navigate("/login");
    
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // We map address to endereco which backend handles
        body: JSON.stringify({...formData, endereco: formData.address})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      navigate(`/event/${data.code}/manage`);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao criar evento: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="glass-header w-full border-b border-rose-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logochaN.png" alt="Chá de Panela Online" className="h-16 md:h-20 object-contain" />
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-slate-600">
              <User className="h-4 w-4 mr-2" />
              Meu Painel
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="text-slate-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col justify-center py-12 px-6">
        <div className="max-w-xl w-full mx-auto">
          <Card className="glass-panel border-0 mx-auto w-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold font-serif text-[#333]">Criar seu evento</CardTitle>
              <CardDescription className="text-slate-600">Defina as informações principais da sua festa.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreate}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brideName">Nome da Noiva (ou Casal)</Label>
                  <Input id="brideName" required value={formData.brideName} onChange={(e) => setFormData({...formData, brideName: e.target.value})} placeholder="Ex: Maria e João" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data da Festa</Label>
                    <Input id="date" type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input id="time" type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Nome do Local</Label>
                  <Input id="location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Ex: Salão de Festas, Casa da Noiva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço do evento</Label>
                  <textarea 
                    id="address" 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                    placeholder="Ex: Rua das Flores, 123" 
                    className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema / Estilo</Label>
                  <select 
                    id="theme" 
                    value={formData.theme} 
                    onChange={(e) => setFormData({...formData, theme: e.target.value})}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Chá de Panela">Chá de Panela</option>
                    <option value="Chá de Casa Nova">Chá de Casa Nova</option>
                    <option value="Chá Bar">Chá Bar</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando..." : "Criar Lista"}
                </Button>
              </CardFooter>
            </form>
        </Card>
        <AdBanner />
      </div>
      </div>
    </div>
  );
}
