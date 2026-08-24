import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface PaymentStatusModalProps {
  isOpen: boolean;
  status: 'loading' | 'approved' | 'pending' | 'error' | null;
  onClose: () => void;
}

export default function PaymentStatusModal({ isOpen, status, onClose }: PaymentStatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white max-w-sm w-full rounded-3xl p-8 text-center shadow-xl relative animate-in fade-in zoom-in duration-200">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
            <h3 className="text-xl font-bold text-slate-800">Verificando...</h3>
            <p className="text-slate-500 mt-2 text-sm text-center">Aguarde alguns segundos.</p>
          </div>
        )}

        {status === 'approved' && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Pagamento Aprovado!</h3>
            <p className="text-slate-500 mt-2 text-sm text-center">Seu evento agora é Premium.</p>
            <Button className="mt-6 w-full bg-rose-600 hover:bg-rose-700 text-white" onClick={onClose}>Continuar</Button>
          </div>
        )}

        {status === 'pending' && (
          <div className="flex flex-col items-center">
            <Clock className="h-16 w-16 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Em Processamento</h3>
            <p className="text-slate-500 mt-2 text-sm text-center">O pagamento ainda está sendo processado ou não foi encontrado no sistema.</p>
            <Button className="mt-6 w-full bg-slate-800 hover:bg-slate-900 text-white" onClick={onClose}>Fechar</Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <AlertCircle className="h-16 w-16 text-rose-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Erro na Verificação</h3>
            <p className="text-slate-500 mt-2 text-sm text-center">Ocorreu um problema ao conectar. Tente novamente mais tarde.</p>
            <Button className="mt-6 w-full bg-slate-800 hover:bg-slate-900 text-white" onClick={onClose}>Fechar</Button>
          </div>
        )}
      </div>
    </div>
  );
}
