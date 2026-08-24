import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();
  
  const eventId = searchParams.get("eventId");
  const plan = searchParams.get("plan");
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "pending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [pixData, setPixData] = useState<{ qrCode: string, qrCodeBase64: string } | null>(null);

  const [upgradePriceText, setUpgradePriceText] = useState("R$ 29,90");

  useEffect(() => {
    if (!authLoading && !token) navigate("/login");
    if (token && eventId) loadEvent();
  }, [eventId, token, authLoading]);

  const loadEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
        initMP(data.event);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const initMP = async (eventData: any) => {
    if (!window.MercadoPago) {
      console.error("Mercado Pago SDK not loaded");
      return;
    }

    let publicKey = (import.meta as any).env.VITE_MERCADOPAGO_PUBLIC_KEY;
    
    // Try to fetch from server if not available in client env
    try {
      const configRes = await fetch('/api/config/mercadopago');
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.publicKey) {
          publicKey = configData.publicKey;
        }
      }
    } catch (e) {
      console.warn("Could not fetch MP config from server", e);
    }

    if (!publicKey || publicKey === 'APP_USR-...' || publicKey.includes('...')) {
      console.warn("Mercado Pago Public Key missing or placeholder. Payments will not load.");
      setErrorMessage("Erro de configuração: Chave pública do Mercado Pago não configurada.");
      setStatus("error");
      return;
    }

    const mp = new window.MercadoPago(publicKey);
    const bricksBuilder = mp.bricks();

    const fetchPriceAndRender = async () => {
      let upgradePrice = 29.90;
      try {
        const precosRes = await fetch('/api/config/precos');
        if (precosRes.ok) {
          const precosMap = await precosRes.json();
          if (precosMap && precosMap.lista_premium !== undefined) {
            upgradePrice = Number(precosMap.lista_premium);
            const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(upgradePrice);
            setUpgradePriceText(formatted);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar o preco', err);
      }

      const settings = {
        initialization: {
          amount: upgradePrice,
          payer: {
            email: eventData.email || "user@example.com",
          },
        },
        locale: 'pt-BR',
        customization: {
          visual: {
            style: {
              theme: "default",
            },
          },
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            bankTransfer: "all",
            pix: "all",
            maxInstallments: 1
          },
        },
        callbacks: {
          onReady: () => {
            console.log("Mercado Pago Brick Ready (pt-BR)");
          },
          onSubmit: async ({ selectedPaymentMethod, formData }: any) => {
            console.log("Submitting payment for:", eventData.brideName);
            return new Promise((resolve, reject) => {
              fetch("/api/payments/mercadopago/transaction", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                  ...formData,
                  amount: upgradePrice,
                  description: `Upgrade Plano Premium - Evento ${eventData.brideName}`,
                  metadata: {
                    type: "upgrade_plano",
                    dbId: eventData.dbId,
                    eventId: eventId
                  }
                }),
              })
                .then((response) => response.json())
                .then((result) => {
                  if (result.success) {
                    if (result.status === "approved") {
                      navigate(`/success?eventId=${eventId}`);
                    } else if (result.status === "pending" && result.point_of_interaction?.transaction_data) {
                      setPixData({
                        qrCode: result.point_of_interaction.transaction_data.qr_code,
                        qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64
                      });
                      setStatus("pending");
                    }
                    resolve(result);
                  } else {
                    setErrorMessage(result.error || "Erro ao processar pagamento");
                    setStatus("error");
                    reject(result.error);
                  }
                })
                .catch((error) => {
                  setErrorMessage("Erro de conexão com o servidor");
                  setStatus("error");
                  reject(error);
                });
            });
          },
          onError: (error: any) => {
            console.error("Payment Brick Error:", error);
            setErrorMessage("Erro ao carregar checkout");
            setStatus("error");
          },
        },
      };
      
      const cardBrickContainer = document.getElementById("paymentCardBrick_container");
      if (cardBrickContainer) {
        cardBrickContainer.innerHTML = "";
        await bricksBuilder.create("payment", "paymentCardBrick_container", settings);
      }
    };

    fetchPriceAndRender();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
      </div>
    );
  }


  if (status === "pending" && pixData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
            PIX
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Aguardando Pagamento</h2>
          <p className="text-slate-600 mb-6 text-sm">
            Escaneie o código abaixo com o app do seu banco para finalizar o upgrade.
          </p>
          
          <div className="bg-slate-50 p-4 rounded-2xl mb-6 flex justify-center border border-slate-100">
            <img 
              src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} 
              alt="QR Code PIX" 
              className="w-48 h-48"
            />
          </div>

          <div className="text-left mb-6">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Código Copia e Cola
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={pixData.qrCode}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-500 focus:outline-none"
              />
              <Button 
                variant="outline" 
                className="shrink-0 rounded-xl px-4 text-xs font-semibold"
                onClick={() => {
                  navigator.clipboard.writeText(pixData.qrCode);
                  alert("Código copiado!");
                }}
              >
                Copiar
              </Button>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-8 border-t pt-6">
            Após o pagamento, o upgrade será ativado automaticamente em alguns minutos.
          </p>

          <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white" onClick={() => navigate(`/event/${eventId}/manage`)}>
            Já paguei / Voltar ao Painel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-rose-500 p-8 text-rose-950">
            <h1 className="text-2xl font-bold mb-1">Finalizar Upgrade</h1>
            <p className="text-rose-800">Upgrade para Plano Premium - {upgradePriceText}</p>
          </div>

          <div className="p-8">
            <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm">
              <p>Evento: <strong>{event?.brideName}</strong></p>
              <p>Tipo: <strong>Pagamento Único (Vitalício para este evento)</strong></p>
            </div>

            {status === "error" && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium">
                {errorMessage}
              </div>
            )}

            <div id="paymentCardBrick_container"></div>
            
            <p className="mt-8 text-center text-xs text-slate-400">
              Ambiente Seguro Mercado Pago. Seus dados estão protegidos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
