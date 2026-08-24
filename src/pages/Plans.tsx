import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { Check, ArrowLeft, Star, Shield, Zap } from "lucide-react";
import EventTopNav from "@/src/components/EventTopNav";

export default function Plans() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [premiumPrice, setPremiumPrice] = useState<string>("R$ 29,90");

  useEffect(() => {
    fetch('/api/config/precos')
      .then(r => r.json())
      .then(data => {
        if (data && data.lista_premium !== undefined) {
          const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.lista_premium);
          setPremiumPrice(formatted);
        }
      })
      .catch(console.error);
  }, []);

  const plans = [
    {
      name: "Básico",
      price: "Grátis",
      features: ["Até 10 convidados", "Personalização avançada", "Confirmação RSVP automática", "Mural de recados"],
      current: true,
      premium: false
    },
    {
      name: "Premium",
      price: premiumPrice,
      features: [
        "Convidados ilimitados",
        "Personalização avançada",
        "Confirmação RSVP automática",
        "Mural de recados"
      ],
      current: false,
      premium: true,
      isPopular: true
    }
  ];

  const handleUpgrade = () => {
    if (!eventId) {
      alert("Por favor, selecione um evento primeiro.");
      navigate('/dashboard');
      return;
    }
    navigate(`/checkout?eventId=${eventId}&plan=premium`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {eventId ? <EventTopNav eventId={eventId} /> : (
        <div className="max-w-4xl mx-auto px-6 pt-12">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      )}

      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="text-center md:mt-0 mt-8 mb-16">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Escolha o plano ideal para sua festa</h1>
          <p className="text-slate-600 text-lg">Desbloqueie recursos exclusivos e convide todos os seus amigos sem limites.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((p) => (
            <div key={p.name} className={`relative glass-panel p-8 bg-white border-2 transition-all hover:scale-[1.02] ${p.isPopular ? 'border-rose-300 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
              {p.isPopular && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-rose-500 text-rose-950 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Mais Popular
                </div>
              )}
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{p.name}</h2>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-slate-900">{p.price}</span>
                {p.premium && <span className="text-slate-500">/único</span>}
              </div>

              <ul className="space-y-4 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-slate-600">
                    <div className={`p-1 rounded-full ${p.premium ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Check className="h-3 w-3" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              {p.premium ? (
                <Button className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-rose-950 font-bold text-lg rounded-2xl" onClick={handleUpgrade}>
                   Fazer Upgrade Agora
                </Button>
              ) : (
                <Button variant="outline" className="w-full h-12 text-slate-400 border-slate-200 cursor-not-allowed" disabled>
                   Plano Atual
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-800 mb-1">Pagamento Seguro</h4>
            <p className="text-sm text-slate-500">Transação criptografada e segura.</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-800 mb-1">Acesso Imediato</h4>
            <p className="text-sm text-slate-500">Recursos liberados na hora do pagamento.</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-800 mb-1">Sem Fidelidade</h4>
            <p className="text-sm text-slate-500">Pagamento único por evento criado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
