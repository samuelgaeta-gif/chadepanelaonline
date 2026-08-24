import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  onSuccess: (transactionId: string) => void;
  metadata?: any;
}

export default function PaymentModal({ isOpen, onClose, amount, description, onSuccess, metadata }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardHolder: '',
    email: metadata?.guestEmail || ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [mpPublicKey, setMpPublicKey] = useState('');

  React.useEffect(() => {
    if (isOpen && !mpPublicKey) {
      let key = (import.meta as any).env.VITE_MERCADOPAGO_PUBLIC_KEY;
      if (key && key !== 'APP_USR-...' && !key.includes('...')) {
        setMpPublicKey(key);
      } else {
        fetch('/api/config/mercadopago')
          .then(res => res.json())
          .then(data => {
            if (data.publicKey && data.publicKey !== 'APP_USR-...' && !data.publicKey.includes('...')) {
              setMpPublicKey(data.publicKey);
            }
          })
          .catch(console.error);
      }
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    if (id === 'cardNumber') {
      const formatted = value.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || value.replace(/\D/g, '');
      if (formatted.length <= 19) setFormData(prev => ({ ...prev, [id]: formatted }));
      return;
    }
    
    if (id === 'expiry') {
      const formatted = value.replace(/\D/g, '').match(/.{1,2}/g)?.join('/') || value.replace(/\D/g, '');
      if (formatted.length <= 5) setFormData(prev => ({ ...prev, [id]: formatted }));
      return;
    }

    if (id === 'cvv' && value.length > 4) return;

    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep('processing');
    setErrorMessage('');

    try {
      // 1. Initialize Mercado Pago
      if (!mpPublicKey) {
        throw new Error('Chave pública do Mercado Pago não configurada.');
      }
      const mp = new (window as any).MercadoPago(mpPublicKey);

      // 2. Create Card Token
      const [expirationMonth, expirationYear] = formData.expiry.split('/');
      
      const tokenResult = await mp.createCardToken({
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        cardholderName: formData.cardHolder,
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: '20' + expirationYear,
        securityCode: formData.cvv,
      });

      if (tokenResult.error) {
        throw new Error(tokenResult.error[0]?.message || 'Erro ao gerar token do cartão');
      }

      const cardToken = tokenResult.id;

      // 3. Identification of Payment Method (Simplified for demo, usually use bin)
      const bin = formData.cardNumber.replace(/\s/g, '').substring(0, 6);
      const paymentMethods = await mp.getPaymentMethods({ bin });
      const pm = paymentMethods[0];

      // 4. Send to Backend
      const response = await fetch('/api/payments/mercadopago/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description,
          token: cardToken,
          payment_method_id: pm?.id || 'visa',
          issuer_id: pm?.issuer?.id,
          payer_email: formData.email,
          metadata
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      setStep('success');
      setTimeout(() => {
        onSuccess(data.transactionId);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setStep('error');
      setErrorMessage(err.message || 'Erro inesperado.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Pagamento Seguro</h3>
            <p className="text-sm text-slate-500">Mercado Pago Checkout Transparente</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 mb-6">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-slate-600 font-medium">{description}</span>
                  <span className="text-rose-600 font-bold">R$ {amount.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                  <div className="relative">
                    <Input 
                      id="cardNumber" 
                      placeholder="0000 0000 0000 0000" 
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      required
                      className="pl-11"
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardHolder">Nome no Cartão</Label>
                  <Input 
                    id="cardHolder" 
                    placeholder="COMO ESTÁ NO CARTÃO" 
                    className="uppercase"
                    value={formData.cardHolder}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Validade</Label>
                    <Input 
                      id="expiry" 
                      placeholder="MM/AA" 
                      value={formData.expiry}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <div className="relative">
                      <Input 
                        id="cvv" 
                        type="password"
                        placeholder="123" 
                        value={formData.cvv}
                        onChange={handleInputChange}
                        required
                        className="pr-11"
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email do Pagador</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="seu@email.com" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700">
                Pagar com Segurança
              </Button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                <ShieldCheck className="h-3 w-3" />
                Seus dados estão criptografados
              </div>
            </form>
          )}

          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Processando Pagamento</h4>
              <p className="text-slate-500">Por favor, aguarde enquanto validamos sua transação com o Mercado Pago.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Pagamento Aprovado!</h4>
              <p className="text-slate-500">Tudo certo! Sua transação foi concluída com sucesso.</p>
            </div>
          )}

          {step === 'error' && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-12 w-12" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Erro no Pagamento</h4>
              <p className="text-slate-500 mb-6">{errorMessage || 'Não foi possível processar seu cartão. Verifique os dados e tente novamente.'}</p>
              <Button onClick={() => setStep('form')} variant="outline" className="w-full">
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
