import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ChevronDown, Search } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

export default function FAQ() {
  const [showGuestAccess, setShowGuestAccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    { question: "O que é o Chá de Panela Online?", answer: "O Chá de Panela Online é uma plataforma para organizar listas de presentes de eventos como chá de panela, chá bar, chá de casa nova e similares. Pelo site você cria sua lista, envia convites, acompanha confirmações de presença e recebe notificações dos presentes escolhidos." },
    { question: "O site vende os presentes da lista?", answer: "Não. O site não comercializa os itens da lista. Os convidados escolhem os presentes pelo sistema, compram em uma loja de preferência deles e levam no dia do evento." },
    { question: "O Chá de Panela Online recebe pagamentos dos convidados?", answer: "Não. O site não recebe dinheiro nem faz repasse ao organizador. Toda a essência do evento é mantida: o convidado escolhe o presente e entrega pessoalmente no dia da comemoração." },
    { question: "Como faço minha lista de presentes?", answer: "O organizador precisa se cadastrar na plataforma, informar os dados do evento e montar a lista de presentes. Você pode utilizar sugestões disponíveis no sistema ou cadastrar itens personalizados." },
    { question: "Posso adicionar presentes personalizados?", answer: "Sim. Além das sugestões disponíveis na plataforma, você pode incluir qualquer item que desejar na sua lista." },
    { question: "Quantas listas posso criar?", answer: "Um organizador pode criar quantas listas quiser na plataforma." },
    { question: "A lista é gratuita?", answer: "Sim. O serviço é gratuito para listas com até 10 convidados. Após esse limite, é cobrada uma taxa para utilização da plataforma." },
    { question: "Como os convidados acessam a lista?", answer: "Os convidados recebem um convite por email com uma senha de acesso para entrar no site e visualizar a lista do evento." },
    { question: "O convidado pode escolher mais de um presente?", answer: "Sim. O convidado pode selecionar quantos presentes desejar na lista." },
    { question: "O convidado recebe confirmação dos presentes escolhidos?", answer: "Sim. Após selecionar os itens, o convidado recebe um email confirmando quais presentes foram escolhidos." },
    { question: "Os convidados podem confirmar presença pelo site?", answer: "Sim. O convidado pode confirmar presença diretamente pela plataforma." },
    { question: "O organizador recebe aviso quando alguém confirma presença?", answer: "Sim. O organizador recebe notificações via WhatsApp sempre que um convidado confirma presença no evento." },
    { question: "O organizador recebe aviso quando um presente é escolhido?", answer: "Sim. Sempre que um item é selecionado por um convidado, o organizador recebe uma notificação via WhatsApp." },
    { question: "Posso acompanhar o status dos convites enviados?", answer: "Sim. A plataforma mostra o status de cada email enviado. Caso algum convite falhe no envio, o sistema informa ao organizador." },
    { question: "Posso alterar os itens da lista depois de criada?", answer: "Sim. Os itens da lista podem ser alterados a qualquer momento pelo organizador." },
    { question: "Posso excluir minha lista depois de criada?", answer: "Não. Após criada, a lista não pode ser excluída." },
    { question: "Até quando a lista fica disponível?", answer: "A lista permanece ativa até 1 dia após a data do evento." },
    { question: "Os convidados podem enviar mensagens para os noivos ou organizador?", answer: "Sim. Os convidados podem enviar mensagens diretamente pela plataforma para os noivos ou para o organizador do evento." },
    { question: "O organizador consegue acompanhar tudo pela plataforma?", answer: "Sim. O organizador acompanha em tempo real o status da lista, presentes escolhidos, confirmações de presença e envio dos convites." },
    { question: "Para quais tipos de evento a plataforma pode ser usada?", answer: "A plataforma pode ser utilizada para: Chá de panela, Chá bar, Chá de casa nova, Open house, Chá de cozinha. Entre outros eventos com lista de presentes para casa e cozinha." }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F3E8DF]">
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

      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-6 pt-32 pb-12">
        <section className="w-full flex flex-col items-center">
          <div className="inline-block bg-[#EAECE6] text-[#6B7261] px-5 py-2 rounded-full text-sm font-medium mb-6">
            Perguntas frequentes
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#33312E] mb-10 text-center">
            Tire suas dúvidas antes de começar
          </h1>
          
          <div className="w-full max-w-3xl mb-8 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <Input 
              type="text" 
              placeholder="Buscar por convites, pagamentos..." 
              className="pl-12 h-14 bg-white/60 focus:bg-white transition-all text-base rounded-2xl border-rose-200 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="w-full max-w-3xl space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <details key={index} className="group bg-white rounded-2xl open:rounded-2xl border border-slate-100 shadow-sm transition-all duration-200">
                  <summary className="w-full px-6 py-4 flex justify-between items-center text-left cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="font-medium text-[#33312E]">{faq.question}</span>
                    <div className="w-7 h-7 rounded-full bg-[#EAECE6] flex items-center justify-center shrink-0 transition-transform duration-200 group-open:-rotate-180">
                      <ChevronDown className="w-4 h-4 text-[#6B7261]" />
                    </div>
                  </summary>
                  <div className="px-6 text-sm text-slate-600 pb-5">
                    <div className="pt-2 border-t border-slate-100/50 mt-1">
                      {faq.answer}
                    </div>
                  </div>
                </details>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 bg-white/50 rounded-2xl">
                Nenhuma resposta encontrada para "{searchQuery}"
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
