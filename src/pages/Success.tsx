import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/src/components/ui/button";

export default function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get("eventId");

  useEffect(() => {
    // TRACKING: NÃO REMOVER — necessário para conversão no GTM/GA4/Google Ads
    ;(window as any).dataLayer = (window as any).dataLayer || [];
    ;(window as any).dataLayer.push({
      event: 'purchase',
      value: 19.90,
      currency: 'BRL'
    });

    // Automatically redirect after 5 seconds to the dashboard
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3E8DF] p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-rose-100">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Pagamento Realizado!</h2>
        <p className="text-slate-600 mb-8">
          Parabéns! O pagamento da sua Lista Premium foi confirmado com sucesso.
        </p>
        <p className="text-slate-500 text-sm mb-6 flex items-center justify-center gap-2">
          <span className="animate-pulse w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>
          Você será redirecionado automaticamente...
        </p>
        <Button className="w-full bg-rose-500 hover:bg-rose-600 h-12 text-lg text-white font-medium shadow-sm transition-all shadow-rose-200" onClick={() => navigate(`/dashboard`)}>
          Ir para o Dashboard Agora
        </Button>
      </div>
    </div>
  );
}
