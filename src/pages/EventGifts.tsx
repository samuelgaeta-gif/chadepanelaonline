import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { Event, Gift } from "@/src/types";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent } from "@/src/components/ui/card";
import { Gift as GiftIcon, Plus, ArrowLeft, Heart, ChevronLeft, ChevronRight, Utensils, Bed, Bath, Zap, Sparkles, Box, Upload, AlertCircle, Trash2 } from "lucide-react";
import EventTopNav from "@/src/components/EventTopNav";

const getCategoryIcon = (category: string) => {
  if (/cozinha/i.test(category)) return <Utensils className="w-4 h-4" />;
  if (/cama/i.test(category)) return <Bed className="w-4 h-4" />;
  if (/banho/i.test(category)) return <Bath className="w-4 h-4" />;
  if (/eletro/i.test(category)) return <Zap className="w-4 h-4" />;
  if (/decoração|decoracao/i.test(category)) return <Sparkles className="w-4 h-4" />;
  return <Box className="w-4 h-4" />;
};

export default function EventGifts() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newGiftName, setNewGiftName] = useState("");
  const [newGiftImg, setNewGiftImg] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [addingGifts, setAddingGifts] = useState(false);
  const [giftToDelete, setGiftToDelete] = useState<Gift | null>(null);
  const [deletingGift, setDeletingGift] = useState(false);
  const [suggestedGifts, setSuggestedGifts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [preListPage, setPreListPage] = useState(1);
  const [myListPage, setMyListPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const ITEMS_PER_PAGE_MYLIST = 12;

  useEffect(() => {
    if (!authLoading && !token) navigate("/login");
    if (token && eventId) {
      loadData();
      loadSuggestedGifts();
    }
  }, [eventId, token, authLoading]);

  useEffect(() => {
    if (suggestedGifts.length > 0 && !selectedCategory) {
      const categories = Array.from(new Set(suggestedGifts.map(sg => sg.category)));
      if (categories.length > 0) setSelectedCategory(categories[0] as string);
    }
  }, [suggestedGifts, selectedCategory]);

  const loadSuggestedGifts = async () => {
    try {
      const resp = await fetch('/api/produtos_sugeridos');
      if (resp.ok) {
        setSuggestedGifts(await resp.json());
      }
    } catch(e) { console.error(e); }
  };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) return navigate("/dashboard");
      const data = await res.json();
      setEvent(data.event);
      setGifts(data.gifts || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSingleSuggested = async (sg: {id: number, name: string, imageUrl: string}) => {
    if (!eventId || !event?.dbId || addingGifts) return;
    setAddingGifts(true);
    try {
      await fetch(`/api/events/${eventId}/gifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ suggestedId: sg.id, name: sg.name, imageUrl: sg.imageUrl, dbId: event.dbId })
      });
      loadData();
      window.dispatchEvent(new window.Event('event-stats-updated'));
    } finally {
      setAddingGifts(false);
    }
  };

  const handleAddAllSuggested = async () => {
    if (!eventId || !event?.dbId || addingGifts) return;
    setAddingGifts(true);
    try {
      const toAdd = suggestedGifts.filter(sg => !gifts.some(g => g.name === sg.name));
      for (const sg of toAdd) {
        await fetch(`/api/events/${eventId}/gifts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ suggestedId: sg.id, name: sg.name, imageUrl: sg.imageUrl, dbId: event.dbId })
        });
      }
      loadData();
      window.dispatchEvent(new window.Event('event-stats-updated'));
    } finally {
      setAddingGifts(false);
    }
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !newGiftName || !event?.dbId) return;
    setAddingGifts(true);
    try {
      await fetch(`/api/events/${eventId}/gifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          name: newGiftName, 
          imageUrl: newGiftImg || "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduto sem imagem%3C/text%3E%3C/svg%3E",
          dbId: event.dbId 
        })
      });
      setNewGiftName("");
      setNewGiftImg("");
      setSelectedFileName("");
      const fileInput: HTMLInputElement | null = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      loadData();
      window.dispatchEvent(new window.Event('event-stats-updated'));
    } finally {
      setAddingGifts(false);
    }
  };

  const handleDeleteGift = async () => {
    if (!eventId || !giftToDelete || !event?.dbId || deletingGift) return;
    setDeletingGift(true);
    try {
      const res = await fetch(`/api/events/${event.dbId}/gifts/${giftToDelete.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Erro ao excluir presente");
        return;
      }
      setGiftToDelete(null);
      loadData();
      window.dispatchEvent(new window.Event('event-stats-updated'));
    } catch(e) {
      console.error("Error deleting gift:", e);
      alert("Erro ao excluir presente");
    } finally {
      setDeletingGift(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFileName("");
      setNewGiftImg("");
      return;
    }

    if (file.size > 1024 * 1024) {
      setFileError("A imagem selecionada possui mais de 1MB. Por favor, escolha uma imagem menor.");
      e.target.value = '';
      setSelectedFileName("");
      setNewGiftImg("");
      return;
    }

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 300;
        canvas.height = 300;
        
        if (ctx) {
          const ratio = Math.max(300 / img.width, 300 / img.height);
          const drawWidth = img.width * ratio;
          const drawHeight = img.height * ratio;
          const offsetX = (300 - drawWidth) / 2;
          const offsetY = (300 - drawHeight) / 2;
          
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 300, 300);
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          
          const base64Url = canvas.toDataURL(file.type || "image/jpeg", 0.9);
          setNewGiftImg(base64Url);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {giftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Excluir Presente</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm">
              Tem certeza que deseja excluir <strong>{giftToDelete.name}</strong>?
              {giftToDelete.isSuggested || suggestedGifts.some(sg => sg.name === giftToDelete.name)
                ? " Este presente voltará a ficar disponível na lista de sugestões." 
                : " Este presente foi criado por você e será excluído permanentemente."}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setGiftToDelete(null)} className="w-full" variant="outline" disabled={deletingGift}>
                Cancelar
              </Button>
              <Button onClick={handleDeleteGift} className="w-full bg-rose-600 hover:bg-rose-700 text-white" disabled={deletingGift}>
                {deletingGift ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {fileError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Arquivo muito grande</h3>
            </div>
            <p className="text-slate-600 mb-6">{fileError}</p>
            <Button onClick={() => setFileError("")} className="w-full bg-slate-900 hover:bg-slate-800 text-white" variant="default">
              Entendi
            </Button>
          </div>
        </div>
      )}
      <EventTopNav eventId={eventId!} />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center mt-0 mb-8 sm:mt-4">
          <div className="flex flex-row w-full max-w-2xl bg-white p-4 sm:p-5 sm:rounded-3xl shadow-sm sm:border border-slate-200 justify-between items-center gap-4 border-y sm:border-x">
            <div className="flex items-center gap-3 sm:gap-4 z-10 w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                <GiftIcon className="h-5 w-5 sm:h-6 sm:w-6 text-rose-500" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-base sm:text-xl font-bold text-slate-800 leading-tight">Minha lista de presentes</h2>
                <span className="text-xs sm:text-sm text-slate-500">{gifts.length} item{gifts.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <Button variant="ghost" className="bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-full font-medium shadow-sm z-10 whitespace-nowrap px-3 sm:px-4 text-xs sm:text-sm h-8 sm:h-10 shrink-0" onClick={() => {
              document.getElementById('minha-lista')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Ver lista ↓
            </Button>
          </div>
        </div>
        <section className="space-y-8">
          {/* Pre Lista suggestions e Formulario Custom */}
          <div className="glass-panel p-4 md:p-6 bg-white border-rose-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="h-5 w-5 text-rose-500" /> Adicione seus presentes
              </h2>
              <div className="flex flex-col md:items-end gap-2 mt-4 md:mt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddAllSuggested}
                  disabled={addingGifts}
                >
                  Incluir todos da Pré-Lista
                </Button>
                <span className="text-xs text-slate-500">* Imagens meramente ilustrativas</span>
              </div>
            </div>
            
            {(() => {
              const categories = Array.from(new Set(suggestedGifts.map(sg => sg.category)));
              const activeCategoryGifts = isMobile 
                ? suggestedGifts.filter(sg => !gifts.some(g => g.name === sg.name)) 
                : suggestedGifts.filter(sg => sg.category === selectedCategory && !gifts.some(g => g.name === sg.name));
              
              const ITEMS_PER_PRE = isMobile ? 12 : 10;
              const totalPrePages = Math.ceil(activeCategoryGifts.length / ITEMS_PER_PRE);
              const paginatedPreGifts = activeCategoryGifts.slice((preListPage - 1) * ITEMS_PER_PRE, preListPage * ITEMS_PER_PRE);

              if (categories.length === 0) return null;

              return (
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                  {/* Categorias (Navegação lateral) */}
                  {!isMobile && (
                    <div className="hidden md:flex w-full md:w-64 flex-shrink-0 flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-3 md:pb-0 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                      {categories.map(cat => (
                        <button
                          key={cat as string}
                          onClick={() => { setSelectedCategory(cat as string); setPreListPage(1); }}
                          className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-none md:w-full border flex items-center justify-center md:justify-start gap-2 ${
                            selectedCategory === cat 
                              ? "bg-rose-500 text-white border-rose-500 shadow-sm" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`md:flex ${selectedCategory === cat ? 'text-white' : 'text-slate-400'}`}>
                            {getCategoryIcon(cat as string)}
                          </div>
                          <span className="md:inline">{cat as string}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Lista de presentes da categoria */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 hidden md:block">{selectedCategory}</h3>
                    {activeCategoryGifts.length === 0 ? (
                       <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                          Todos os presentes desta categoria já foram adicionados.
                       </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                          {paginatedPreGifts.map(sg => (
                            <div key={sg.name} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow relative bg-white flex flex-col">
                              <div className="aspect-square w-full bg-slate-50 relative">
                                <img 
                                  src={sg.imageUrl} 
                                  alt={sg.name} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="p-2 md:p-3 text-center flex flex-col flex-1 justify-between gap-2">
                                <p className="text-[10px] md:text-[12px] font-semibold text-slate-700 leading-tight line-clamp-2" title={sg.name}>{sg.name}</p>
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  className="w-full text-[10px] md:text-[11px] h-7 md:h-8 bg-slate-100 hover:bg-slate-200 text-slate-700"
                                  onClick={() => handleAddSingleSuggested(sg)}
                                  disabled={addingGifts}
                                >
                                  <Plus className="w-3 h-3 md:mr-1" /> <span className="hidden md:inline">Adicionar</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {totalPrePages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-6">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setPreListPage(p => Math.max(1, p - 1))}
                              disabled={preListPage === 1}
                              className="w-8 h-8 p-0 shrink-0"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-slate-500 font-medium">
                              Página {preListPage} de {totalPrePages}
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setPreListPage(p => Math.min(totalPrePages, p + 1))}
                              disabled={preListPage === totalPrePages}
                              className="w-8 h-8 p-0 shrink-0"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {!event.isPremium && (
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-6 shadow-sm mb-6 text-center relative overflow-hidden">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider mb-3">
                    Plano Básico
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    Adicione presentes ilimitados
                  </h3>
                  <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                    Aproveite e solte a imaginação com presentes totalmente personalizados (adicione links, fotos e o que você quiser!). Crie a lista dos seus sonhos. Migre para o plano Premium agora e surpreenda seus convidados.
                  </p>
                  <Button 
                    onClick={() => navigate(`/planos?eventId=${eventId}`)}
                    className="bg-rose-500 hover:bg-rose-600 text-rose-950 font-bold px-8 shadow-sm group"
                  >
                    Fazer Upgrade para Premium
                  </Button>
                </div>
              </div>
            )}

            <div className={`border-t border-slate-100 pt-6 ${!event.isPremium ? 'opacity-60 pointer-events-none grayscale-[0.2]' : ''}`}>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Não encontrou seu presente na nossa lista? Adicione no espaço abaixo.
              </h3>
              
              <form onSubmit={handleAddCustom} className="space-y-2">
                <div className="grid md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label>Nome do Presente</Label>
                    <Input placeholder="Ex: Jogo de Panelas" required value={newGiftName} onChange={e => setNewGiftName(e.target.value)} disabled={!event.isPremium} />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label>Imagem (Opcional)</Label>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="file-upload" className={`cursor-pointer flex items-center justify-center w-full h-11 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600 text-sm font-medium ${!event.isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Upload className="w-4 h-4 mr-2 text-slate-400" />
                        {selectedFileName ? 'Trocar Imagem' : 'Procurar...'}
                      </Label>
                      <Input id="file-upload" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} disabled={!event.isPremium} style={{ display: 'none' }} />
                      {newGiftImg && (
                        <div className="h-11 w-11 shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                          <img src={newGiftImg} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                    {selectedFileName && <p className="text-[10px] text-slate-500 truncate max-w-full">{selectedFileName}</p>}
                  </div>
                  <Button type="submit" disabled={addingGifts || !event.isPremium} className="w-full" variant="secondary">
                    <Plus className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight pt-1">
                  * Imagens até 1MB nos formatos PNG, JPG e GIF. Elas são redimensionadas para as dimensões da pré lista (300x300) no momento do upload.
                </p>
              </form>
            </div>
          </div>

          <div id="minha-lista" className="scroll-mt-24">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 font-serif mb-1 md:mb-2 flex items-center gap-2">
              <GiftIcon className="h-5 w-5 md:h-6 md:w-6 text-rose-500 shrink-0" />
              Minha lista de presentes ({gifts.length})
            </h3>
            <p className="text-sm text-slate-500 mb-6">As imagens dos produtos são meramente ilustrativas.</p>
            {(() => {
              const totalMyPages = Math.ceil(gifts.length / ITEMS_PER_PAGE_MYLIST);
              const paginatedMyGifts = gifts.slice((myListPage - 1) * ITEMS_PER_PAGE_MYLIST, myListPage * ITEMS_PER_PAGE_MYLIST);
              return (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                    {paginatedMyGifts.map(g => (
                      <Card key={g.id} className={`overflow-hidden border-none shadow-md hover:shadow-lg transition-all relative ${g.status === 'chosen' ? 'border-rose-100 ring-1 ring-rose-200 shadow-sm' : 'hover:-translate-y-1 hover:shadow-xl'}`}>
                        {g.status === 'chosen' && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center pointer-events-none transition-all">
                            <div className="bg-white px-2 md:px-4 py-1.5 md:py-2 rounded-full shadow-lg border border-rose-100 flex items-center gap-1.5 transform -rotate-2">
                              <Heart className="h-3 w-3 md:h-4 md:w-4 text-rose-500 fill-current" />
                              <span className="text-[10px] md:text-sm font-bold text-slate-800">Escolhido</span>
                            </div>
                          </div>
                        )}
                        <div className="aspect-square overflow-hidden bg-slate-100 relative">
                          <img 
                            src={g.imageUrl} 
                            alt={g.name} 
                            className={`w-full h-full object-cover transition-transform duration-500 ${g.status === 'chosen' ? 'grayscale' : 'group-hover:scale-105'}`} 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                        <CardContent className="p-3 md:p-4 relative bg-white flex-1 flex flex-col justify-between">
                          <div className="flex flex-col gap-1 md:gap-1.5 mb-2">
                            {g.category && <span className="text-[9px] md:text-[10px] font-bold uppercase text-slate-400 max-w-fit leading-none">{g.category}</span>}
                            <h4 className={`font-bold text-[11px] md:text-sm line-clamp-2 md:line-clamp-2 min-h-[1.7rem] md:min-h-[2.5rem] leading-tight ${g.status === 'chosen' ? 'text-slate-500' : 'text-slate-800'}`}>{g.name}</h4>
                          </div>
                          {g.status === 'available' ? (
                            <div className="flex items-center justify-between mt-auto">
                              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-sm border border-emerald-100 shadow-sm truncate">Disponível</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 md:h-7 md:w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setGiftToDelete(g)}
                              >
                                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-rose-100/50 mt-auto">
                              <p className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold mb-0.5 tracking-wider truncate">Presenteado</p>
                              <p className="text-[10px] md:text-xs font-bold text-rose-600 truncate">{g.chosenByGuestName}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {gifts.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                      <p className="text-slate-400">Nenhum presente na sua lista ainda.</p>
                    </div>
                  )}
                  {totalMyPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setMyListPage(p => Math.max(1, p - 1)); document.getElementById('minha-lista')?.scrollIntoView({ behavior: 'smooth' }); }}
                        disabled={myListPage === 1}
                        className="w-10 h-10 p-0 shrink-0 rounded-full"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <span className="text-sm text-slate-500 font-medium px-4">
                        Página {myListPage} de {totalMyPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setMyListPage(p => Math.min(totalMyPages, p + 1)); document.getElementById('minha-lista')?.scrollIntoView({ behavior: 'smooth' }); }}
                        disabled={myListPage === totalMyPages}
                        className="w-10 h-10 p-0 shrink-0 rounded-full"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </section>
      </main>
    </div>
  );
}
