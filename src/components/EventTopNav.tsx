import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, Gift, MessageSquare, Key, Heart, Send, User } from 'lucide-react';
import { Card } from '@/src/components/ui/card';

export default function EventTopNav({ eventId }: { eventId: string }) {
  const [stats, setStats] = useState<any>({
    guestCount: 0,
    confirmedGuestCount: 0,
    giftCount: 0,
    reservedGiftCount: 0,
    messageCount: 0,
    code: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!eventId) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();

    window.addEventListener('event-stats-updated', fetchStats);
    return () => window.removeEventListener('event-stats-updated', fetchStats);
  }, [eventId]);

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 80px;
          }
        }
      `}</style>
      <div className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex-1 flex overflow-x-auto hide-scrollbar gap-4 items-center">
          {/* Logo */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-slate-600 transition-colors mr-2"
              title="Voltar ao Dashboard"
            >
              ←
            </button>
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity flex items-center"
              onClick={() => navigate(`/event/${eventId}/manage`)}
            >
              <img src="/logochaN.png" alt="Chá de Panela" className="h-12 sm:h-14 object-contain" />
            </div>
          </div>

          <div className="flex-1" />

          {/* Stats right side - Desktop Only */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Convidados */}
            <div 
              onClick={() => navigate(`/event/${eventId}/guests`)}
              className="group flex items-center gap-3 px-4 py-2 sm:px-5 sm:py-2.5 bg-white hover:bg-slate-50 transition-all duration-300 rounded-full border border-slate-200 hover:border-blue-200 hover:shadow-sm cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex flex-col pr-1">
                <span className="text-[10px] leading-none mb-1 uppercase font-bold text-slate-400 group-hover:text-blue-500 tracking-wider transition-colors">Convidados</span>
                <span className="text-sm leading-none font-semibold text-slate-700">{stats.guestCount || 0}</span>
              </div>
            </div>

            {/* Presentes */}
            <div 
              onClick={() => navigate(`/event/${eventId}/gifts`)}
              className="group flex items-center gap-3 px-4 py-2 sm:px-5 sm:py-2.5 bg-white hover:bg-slate-50 transition-all duration-300 rounded-full border border-slate-200 hover:border-rose-200 hover:shadow-sm cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                <Gift className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex flex-col pr-1">
                <span className="text-[10px] leading-none mb-1 uppercase font-bold text-slate-400 group-hover:text-rose-500 tracking-wider transition-colors">Presentes</span>
                <span className="text-sm leading-none font-semibold text-slate-700">{stats.reservedGiftCount || 0} / {stats.giftCount || 0}</span>
              </div>
            </div>

            {/* Recados */}
            <div 
              onClick={() => navigate(`/event/${eventId}/messages`)}
              className="group flex items-center gap-3 px-4 py-2 sm:px-5 sm:py-2.5 bg-white hover:bg-slate-50 transition-all duration-300 rounded-full border border-slate-200 hover:border-emerald-200 hover:shadow-sm cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex flex-col pr-1">
                <span className="text-[10px] leading-none mb-1 uppercase font-bold text-slate-400 group-hover:text-emerald-500 tracking-wider transition-colors">Recados</span>
                <span className="text-sm leading-none font-semibold text-slate-700">{stats.messageCount || 0}</span>
              </div>
            </div>

            {/* Convite Whatsapp */}
            <div 
              onClick={() => navigate(`/event/${eventId}/invite`)}
              className="group flex items-center gap-3 px-4 py-2 sm:px-5 sm:py-2.5 bg-green-500 hover:bg-green-600 transition-all duration-300 rounded-full shadow-sm hover:shadow-md cursor-pointer ml-2"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
              </div>
              <div className="flex flex-col pr-2">
                <span className="text-[10px] leading-none mb-1 uppercase font-bold text-green-100 tracking-wider">Convite</span>
                <span className="text-sm leading-none font-semibold text-white">WhatsApp</span>
              </div>
            </div>

            {/* Meu Perfil */}
            <div 
              onClick={() => navigate('/dashboard?profile=1')}
              className="group flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-slate-500 hover:text-rose-600 ml-2"
              title="Meu Perfil"
            >
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-rose-50 flex items-center justify-center transition-colors border border-transparent group-hover:border-rose-100 mb-1">
                <User className="w-4 h-4" />
              </div>
              <span className="text-[10px] leading-none uppercase font-bold tracking-wider">Perfil</span>
            </div>
          </div>
        </div>
      </div>

      {/* App-like Fixed Bottom Navigation - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 pb-safe pb-env-m">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Dashboard */}
          <button 
            onClick={() => navigate(`/event/${eventId}/manage`)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${window.location.pathname.includes('/manage') ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Heart className={`w-6 h-6 ${window.location.pathname.includes('/manage') ? 'fill-rose-500/20' : ''}`} />
            <span className="text-[10px] font-medium leading-none">Início</span>
          </button>
          
          {/* Guests */}
          <button 
            onClick={() => navigate(`/event/${eventId}/guests`)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${window.location.pathname.includes('/guests') ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className="relative">
              <Users className={`w-6 h-6 ${window.location.pathname.includes('/guests') ? 'fill-rose-500/20' : ''}`} />
              <div className="absolute -top-1 -right-2 bg-slate-100 text-slate-600 text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center border border-white shadow-sm">
                {stats.guestCount || 0}
              </div>
            </div>
            <span className="text-[10px] font-medium leading-none">Convidados</span>
          </button>

          {/* Gifts */}
          <button 
            onClick={() => navigate(`/event/${eventId}/gifts`)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${window.location.pathname.includes('/gifts') ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className="relative">
              <Gift className={`w-6 h-6 ${window.location.pathname.includes('/gifts') ? 'fill-rose-500/20' : ''}`} />
              <div className="absolute -top-1 -right-2 bg-slate-100 text-slate-600 text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center border border-white shadow-sm">
                {stats.giftCount || 0}
              </div>
            </div>
            <span className="text-[10px] font-medium leading-none">Presentes</span>
          </button>

          {/* Messages */}
          <button 
            onClick={() => navigate(`/event/${eventId}/messages`)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${window.location.pathname.includes('/messages') ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className="relative">
              <MessageSquare className={`w-6 h-6 ${window.location.pathname.includes('/messages') ? 'fill-rose-500/20' : ''}`} />
              <div className="absolute -top-1 -right-2 bg-slate-100 text-slate-600 text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center border border-white shadow-sm">
                {stats.messageCount || 0}
              </div>
            </div>
            <span className="text-[10px] font-medium leading-none">Recados</span>
          </button>

          {/* Invite */}
          <button 
            onClick={() => navigate(`/event/${eventId}/invite`)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${window.location.pathname.includes('/invite') ? 'text-green-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg className={`w-6 h-6 ${window.location.pathname.includes('/invite') ? 'text-green-500' : 'text-slate-400 hover:text-green-500'}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
            <span className="text-[10px] font-medium leading-none">Convite</span>
          </button>
        </div>
      </div>
    </>
  );
}
