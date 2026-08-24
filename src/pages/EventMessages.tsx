import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { Event, Message } from "@/src/types";
import { Button } from "@/src/components/ui/button";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { formatDateBR } from "@/src/lib/utils";
import EventTopNav from "@/src/components/EventTopNav";

export default function EventMessages() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading && !token) navigate("/login");
    if (token && eventId) loadData();
  }, [eventId, token, authLoading]);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) return navigate("/dashboard");
      const data = await res.json();
      setEvent(data.event);

      const msgsRes = await fetch(`/api/events/${eventId}/messages?dbId=${data.event.dbId}`);
      if (msgsRes.ok) setMessages(await msgsRes.json());
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!event) return null;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(messages.length / itemsPerPage);
  const paginatedMessages = messages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50">
      <EventTopNav eventId={eventId!} />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <MessageSquare className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold font-serif text-slate-800">Recados dos Convidados</h2>
          <p className="text-slate-600 mt-2">Veja todas as mensagens deixadas pelos seus amigos e familiares.</p>
        </div>

        <div className="grid gap-6">
          {paginatedMessages.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
              <p className="text-slate-400 italic">Nenhum recado recebido ainda.</p>
            </div>
          ) : (
            <>
              {paginatedMessages.map(m => (
                <div key={m.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <MessageSquare className="h-20 w-20" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-slate-800">{m.guestName}</h3>
                      <span className="text-xs text-slate-400">{formatDateBR(m.createdAt)}</span>
                    </div>
                    <blockquote className="text-xl text-slate-700 italic font-medium leading-relaxed">
                      "{m.message}"
                    </blockquote>
                  </div>
                </div>
              ))}
              
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
                  <p className="text-sm text-slate-500">
                    Mostrando <span className="font-medium text-slate-800">{paginatedMessages.length}</span> de <span className="font-medium text-slate-800">{messages.length}</span> recados
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-9 px-4 rounded-xl border-slate-200"
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1.5 min-w-[3rem] justify-center text-sm font-medium text-slate-600">
                      {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-9 px-4 rounded-xl border-slate-200"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
