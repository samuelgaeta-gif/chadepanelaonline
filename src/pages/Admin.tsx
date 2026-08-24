import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ShieldAlert, Users, Mail, DollarSign, ListOrdered, Crown, LogOut, Eye, X, MessageCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function Admin() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [selectedList, setSelectedList] = useState<any>(null);
  const [blastingLists, setBlastingLists] = useState<Record<number, boolean>>({});
  const [blastedLists, setBlastedLists] = useState<Record<number, boolean>>({});

  const navigate = useNavigate();

  const [precos, setPrecos] = useState<any[]>([]);
  const [pixels, setPixels] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (token) {
      loadStats();
      loadPrecos();
      loadPixels();
    }
  }, [token, startDate, endDate]);

  const loadPixels = async () => {
    try {
      const resp = await fetch('/api/adm/pixels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setPixels(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePixel = async (id: number, codigo: string, ativo: boolean) => {
    try {
      const resp = await fetch(`/api/adm/pixels/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ codigo, ativo })
      });
      if (resp.ok) {
        loadPixels();
        alert('Pixel atualizado com sucesso!');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar pixel.');
    }
  };

  const [lists, setLists] = useState<any[]>([]);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [marketingBlasts, setMarketingBlasts] = useState<any>({ pending_30d: 0, pending_20d: 0, pending_10d: 0 });
  const [newAnuncio, setNewAnuncio] = useState({ titulo: '', descricao: '', imagem_url: '', link: '', formato: 'banner_inicio', paginas: 'home', ativo: true });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(lists.length / itemsPerPage);
  const paginatedLists = lists.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const loadExtraData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resLists, resAnuncios, resStates, resMarketing] = await Promise.all([
        fetch('/api/adm/lists', { headers }),
        fetch('/api/adm/anuncios', { headers }),
        fetch('/api/adm/states', { headers }),
        fetch('/api/adm/marketing-blasts', { headers })
      ]);
      if (resLists.ok) setLists(await resLists.json());
      if (resAnuncios.ok) setAnuncios(await resAnuncios.json());
      if (resStates.ok) setStates(await resStates.json());
      if (resMarketing.ok) setMarketingBlasts(await resMarketing.json());
    } catch (e) { console.error(e); }
  };

  const handleSendMarketing = async (days: number) => {
    if (!window.confirm(`Deseja enviar WhatsApp para os organizadores pendentes (faltando ${days} dias)?`)) return;
    try {
      const resp = await fetch(`/api/adm/marketing-blasts/send/${days}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        alert(data.message || `Disparo MKT (${days} dias) iniciado. Quantidade: ${data.sending || 0}`);
        loadExtraData();
      } else {
        alert(data.error || 'Erro no disparo');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao realizar disparo de marketing');
    }
  };

  const handleManualBlast = async (list: any) => {
    setBlastingLists(prev => ({ ...prev, [list.id]: true }));
    try {
      const resp = await fetch(`/api/adm/marketing-blasts/manual/${list.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setBlastedLists(prev => ({ ...prev, [list.id]: true }));
        loadExtraData(); // refresh counts
      } else {
        alert(data.error || 'Erro ao enviar WhatsApp.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao realizar disparo manual.');
    } finally {
      setBlastingLists(prev => ({ ...prev, [list.id]: false }));
    }
  };

  const handleAddAnuncio = async () => {
    try {
      const resp = await fetch('/api/adm/anuncios', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnuncio)
      });
      if (resp.ok) {
        alert('Anúncio adicionado com sucesso!');
        loadExtraData();
        setNewAnuncio({ titulo: '', descricao: '', imagem_url: '', link: '', formato: 'banner_inicio', paginas: 'home', ativo: true });
      }
    } catch (err) {
       console.error(err);
       alert('Erro ao adicionar anúncio');
    }
  };

  const loadStats = async () => {
    try {
      const qs = new URLSearchParams();
      if (startDate && endDate) {
         qs.set('startDate', startDate + ' 00:00:00');
         qs.set('endDate', endDate + ' 23:59:59');
      }
      const resp = await fetch(`/api/adm/stats?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.status === 401 || resp.status === 403) {
        handleLogout();
        return;
      }
      const data = await resp.json();
      setStats(data);
      loadExtraData();
    } catch (err) {
      console.error(err);
    }
  };

  const setQuickDate = (type: 'last7' | 'currentMonth' | 'lastMonth' | 'all') => {
    const today = new Date();
    if (type === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (type === 'last7') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (type === 'currentMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      // toISOString uses UTC, which might slightly offset. We can just use local string building.
      const fmt = (d: Date) => {
        const _m = String(d.getMonth() + 1).padStart(2, '0');
        const _d = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${_m}-${_d}`;
      };
      setStartDate(fmt(firstDay));
      setEndDate(fmt(lastDay));
    } else if (type === 'lastMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      const fmt = (d: Date) => {
        const _m = String(d.getMonth() + 1).padStart(2, '0');
        const _d = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${_m}-${_d}`;
      };
      setStartDate(fmt(firstDay));
      setEndDate(fmt(lastDay));
    }
  };

  const loadPrecos = async () => {
    try {
      const resp = await fetch('/api/adm/precos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setPrecos(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePreco = async (id: number, valor: string) => {
    try {
      const resp = await fetch(`/api/adm/precos/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ valor: Number(valor) })
      });
      if (resp.ok) {
        loadPrecos(); // recarrega para confirmar
        loadStats(); // recarrega a soma
        alert('Preço atualizado com sucesso!');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar preço.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/adm/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password })
      });
      const data = await resp.json();
      if (data.token) {
        localStorage.setItem('adminToken', data.token);
        setToken(data.token);
      } else {
        setError(data.error || 'Login falhou');
      }
    } catch (err) {
      setError('Erro de rede');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-serif text-slate-800">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user">Usuário</Label>
                <Input 
                  id="user" 
                  value={user} 
                  onChange={(e) => setUser(e.target.value)} 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-center text-slate-500">Carregando dados...</div>;

  const pieData = [
    { name: 'Free', value: stats.listaGrafico.free, color: '#94a3b8' },
    { name: 'Premium', value: stats.listaGrafico.premium, color: '#f43f5e' }
  ];

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  // Merge period data
  const periodDataMap = new Map<string, any>();
  stats.listasPorPeriodo.forEach((item: any) => {
    periodDataMap.set(item.mes, { mes: item.mes, total: item.qtd, premium: 0 });
  });
  stats.listasPremiumPorPeriodo.forEach((item: any) => {
    if (periodDataMap.has(item.mes)) {
      periodDataMap.get(item.mes).premium = item.qtd;
    } else {
      periodDataMap.set(item.mes, { mes: item.mes, total: 0, premium: item.qtd });
    }
  });
  const mergedChartData = Array.from(periodDataMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif text-slate-800 font-bold flex items-center gap-2">
              <ShieldAlert className="text-rose-500" /> Gerência
            </h1>
            <p className="text-slate-500 text-sm mt-1">Visão geral do sistema Chá de Panela Online</p>
          </div>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex bg-white shadow-sm border border-slate-200 rounded-md p-1">
              <Button size="sm" variant={(!startDate && !endDate) ? 'default' : 'ghost'} onClick={() => setQuickDate('all')} className="rounded-sm">Todos</Button>
              <Button size="sm" variant={startDate && startDate === new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0] ? 'default' : 'ghost'} onClick={() => setQuickDate('last7')} className="rounded-sm">7 dias</Button>
              <Button size="sm" variant="ghost" onClick={() => setQuickDate('currentMonth')} className="rounded-sm">Mês atual</Button>
              <Button size="sm" variant="ghost" onClick={() => setQuickDate('lastMonth')} className="rounded-sm">Mês passado</Button>
            </div>
            <div className="flex gap-2 items-center bg-white shadow-sm border border-slate-200 rounded-md p-2">
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 border-none shadow-none bg-transparent" />
              <span className="text-slate-400">até</span>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 border-none shadow-none bg-transparent" />
            </div>
            <Button variant="outline" onClick={handleLogout} className="text-slate-600 hover:text-slate-900 border-slate-300">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 font-medium">Listas Criadas</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalFestas}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                  <ListOrdered className="h-5 w-5 text-indigo-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 font-medium">Convidados Cadastrados</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalConvidados}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 font-medium">Emails Enviados</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalEmails}</p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 font-medium">Valores Arrecadados</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalValores)}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-slate-700">Listas Criadas vs Premium por Período</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mergedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend />
                  <Bar dataKey="total" name="Total Listas" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="premium" name="Listas Premium" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="text-center pb-0">
              <CardTitle className="text-lg font-medium text-slate-700 flex items-center justify-center gap-2">
                <Crown className="w-5 h-5 text-rose-500" /> Planos
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72 flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-slate-800">Confiurações de Preços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {precos.map(p => (
                  <div key={p.id} className="space-y-2 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <Label className="text-sm font-semibold uppercase text-slate-600 block mb-1">
                      {p.nome.replace('_', ' ')}
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        step="0.01"
                        defaultValue={p.valor}
                        id={`preco-${p.id}`}
                      />
                      <Button onClick={() => {
                        const input = document.getElementById(`preco-${p.id}`) as HTMLInputElement;
                        if (input) handleUpdatePreco(p.id, input.value);
                      }}>Salvar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-slate-800">Acompanhar Listas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-2 font-medium">Organizador</th>
                      <th className="px-4 py-2 font-medium">Evento</th>
                      <th className="px-4 py-2 font-medium">Convidados</th>
                      <th className="px-4 py-2 font-medium">Presentes</th>
                      <th className="px-4 py-2 font-medium">Tipo</th>
                      <th className="px-4 py-2 font-medium">Dias</th>
                      <th className="px-4 py-2 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedLists.map((l: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2">{l.organizerName}</td>
                        <td className="px-4 py-2">{l.eventName}</td>
                        <td className="px-4 py-2">{l.totalGuests}</td>
                        <td className="px-4 py-2">{l.totalGifts}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${l.isPremium ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                            {l.isPremium ? 'Premium' : 'Básico'}
                          </span>
                        </td>
                        <td className="px-4 py-2">{l.daysLeft != null ? l.daysLeft : '-'}</td>
                        <td className="px-4 py-2 flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedList(l)} className="h-8 w-8 text-slate-500 hover:text-slate-900">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {l.daysLeft >= 0 && (
                            <div className="flex items-center gap-2">
                              {!blastedLists[l.id] ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={blastingLists[l.id]}
                                  onClick={() => handleManualBlast(l)}
                                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-8 text-xs font-medium"
                                >
                                  {blastingLists[l.id] ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                  ) : (
                                    <MessageCircle className="w-3.5 h-3.5 mr-1" />
                                  )}
                                  {blastingLists[l.id] ? 'Enviando...' : `${l.daysLeft} Dias`}
                                </Button>
                              ) : (
                                <span className="flex items-center text-xs font-medium text-emerald-600 px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Enviado
                                </span>
                              )}
                              {(l.manualBlastCount > 0) && (
                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                  Enviados: {l.manualBlastCount} vezes
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    Anterior
                  </Button>
                  <span className="text-sm text-slate-500">Página {currentPage} de {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    Próxima
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal Visualização da Lista */}
          {selectedList && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800">Detalhes da Lista</h3>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedList(null)} className="h-8 w-8 text-slate-500 rounded-full hover:bg-slate-100">
                    <X className="w-5 h-5"/>
                  </Button>
                </div>
                <div className="p-5 space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Organizador</p>
                    <p className="text-slate-900 font-medium">{selectedList.organizerName}</p>
                    {selectedList.organizerEmail && <p className="text-sm text-slate-600">{selectedList.organizerEmail}</p>}
                    {selectedList.organizerPhone && <p className="text-sm text-slate-600">{selectedList.organizerPhone}</p>}
                    {(selectedList.organizerLogradouro || selectedList.organizerCep) && (
                      <p className="text-sm text-slate-500 mt-2">
                        {selectedList.organizerLogradouro}{selectedList.organizerNumero ? `, ${selectedList.organizerNumero}` : ''}
                        {selectedList.organizerComplemento ? ` - ${selectedList.organizerComplemento}` : ''}
                        <br />
                        {selectedList.organizerBairro}{selectedList.organizerBairro && selectedList.organizerCidade ? ' - ' : ''}{selectedList.organizerCidade}{selectedList.organizerEstado ? `/${selectedList.organizerEstado}` : ''}
                        <br />
                        {selectedList.organizerCep ? `CEP: ${selectedList.organizerCep}` : ''}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Festa / Evento</p>
                    <p className="text-slate-900 font-medium">{selectedList.eventName}</p>
                    {selectedList.eventDate && <p className="text-sm text-slate-600">Data: {new Date(selectedList.eventDate).toLocaleDateString('pt-BR')}</p>}
                    {(selectedList.eventEndereco !== null && selectedList.eventEndereco !== undefined) || selectedList.eventCep ? (
                      <p className="text-sm text-slate-500 mt-2">
                        {selectedList.eventEndereco || selectedList.eventLogradouro} {selectedList.eventNumero ? `, ${selectedList.eventNumero}` : ''}
                        {selectedList.eventComplemento ? ` - ${selectedList.eventComplemento}` : ''}
                        {selectedList.eventBairro || selectedList.eventCidade ? <br /> : ''}
                        {selectedList.eventBairro}{selectedList.eventBairro && selectedList.eventCidade ? ' - ' : ''}{selectedList.eventCidade}{selectedList.eventEstado ? `/${selectedList.eventEstado}` : ''}
                        {selectedList.eventCep ? <><br />CEP: {selectedList.eventCep}</> : ''}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Presentes</p>
                      <p className="text-xl font-bold text-slate-800">{selectedList.totalGifts}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Convidados</p>
                      <p className="text-xl font-bold text-slate-800">{selectedList.totalGuests}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Criação da Lista</p>
                    <p className="text-sm text-slate-700">{selectedList.createdAt ? new Date(selectedList.createdAt).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-slate-800">Contagem de Listas por Estado (BR)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={states} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis dataKey="state" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-slate-800">Disparos de MKT (Recuperação)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-6">Disparo de WhatsApp para organizadores de listas baseado nos novos critérios de engajamento (mais de 30 dias sem convidados, até 20 dias sem convidados, ou 10 dias sem presentes).</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                   <p className="text-sm font-semibold text-slate-600 uppercase">Mais de 30 dias</p>
                   <p className="text-3xl font-bold text-slate-800">{marketingBlasts.pending_30d}</p>
                   <p className="text-xs text-slate-500">listas s/ convidados</p>
                   <Button 
                     onClick={() => handleSendMarketing(30)}
                     disabled={marketingBlasts.pending_30d === 0}
                     className="w-full mt-2"
                   >
                     Fazer disparo {marketingBlasts.pending_30d > 0 ? `(${marketingBlasts.pending_30d})` : ''}
                   </Button>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                   <p className="text-sm font-semibold text-slate-600 uppercase">Até 20 dias</p>
                   <p className="text-3xl font-bold text-slate-800">{marketingBlasts.pending_20d}</p>
                   <p className="text-xs text-slate-500">listas s/ convidados</p>
                   <Button 
                     onClick={() => handleSendMarketing(20)}
                     disabled={marketingBlasts.pending_20d === 0}
                     className="w-full mt-2"
                   >
                     Fazer disparo {marketingBlasts.pending_20d > 0 ? `(${marketingBlasts.pending_20d})` : ''}
                   </Button>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                   <p className="text-sm font-semibold text-slate-600 uppercase">Faltando 10 dias</p>
                   <p className="text-3xl font-bold text-slate-800">{marketingBlasts.pending_10d}</p>
                   <p className="text-xs text-slate-500">listas s/ presentes</p>
                   <Button 
                     onClick={() => handleSendMarketing(10)}
                     disabled={marketingBlasts.pending_10d === 0}
                     className="w-full mt-2"
                   >
                     Fazer disparo {marketingBlasts.pending_10d > 0 ? `(${marketingBlasts.pending_10d})` : ''}
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-slate-800">Gerenciar Anúncios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-slate-700">Novo Anúncio</h3>
                  <div className="space-y-2">
                     <Label>Título / Empresa</Label>
                     <Input value={newAnuncio.titulo} onChange={e => setNewAnuncio({...newAnuncio, titulo: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <Label>Link de Destino</Label>
                     <Input value={newAnuncio.link} onChange={e => setNewAnuncio({...newAnuncio, link: e.target.value})} placeholder="https://" />
                  </div>
                  <div className="space-y-2">
                     <Label>URL da Imagem</Label>
                     <Input value={newAnuncio.imagem_url} onChange={e => setNewAnuncio({...newAnuncio, imagem_url: e.target.value})} placeholder="https://" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label>Formato</Label>
                       <Input value={newAnuncio.formato} onChange={e => setNewAnuncio({...newAnuncio, formato: e.target.value})} placeholder="Ex: banner_inicio, sidebar" />
                     </div>
                     <div className="space-y-2">
                       <Label>Páginas (separadas por vírgula)</Label>
                       <Input value={newAnuncio.paginas} onChange={e => setNewAnuncio({...newAnuncio, paginas: e.target.value})} placeholder="Ex: home, dashboard" />
                     </div>
                  </div>
                  <Button onClick={handleAddAnuncio} className="bg-slate-900 hover:bg-slate-800 w-full text-white">Adicionar Anúncio</Button>
                </div>
                
                <div>
                   <h3 className="text-md font-semibold text-slate-700 mb-4">Anúncios Ativos</h3>
                   <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                     {anuncios.map(an => (
                       <div key={an.id} className="p-3 border border-slate-200 rounded-lg flex items-center space-x-3 bg-white">
                         {an.imagem_url && <img src={an.imagem_url} alt={an.titulo} className="w-16 h-12 object-cover rounded-md bg-slate-100" />}
                         <div className="flex-1 min-w-0">
                           <p className="font-semibold text-slate-800 truncate">{an.titulo}</p>
                           <p className="text-xs text-slate-500 truncate">Formato: {an.formato} | Páginas: {an.paginas}</p>
                         </div>
                       </div>
                     ))}
                     {anuncios.length === 0 && <p className="text-sm text-slate-500">Nenhum anúncio encontrado.</p>}
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 mb-12">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-slate-800">Gerenciador de Pixels e Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {pixels.map(p => (
                  <div key={p.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold uppercase text-slate-600 block">
                        {p.nome}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`ativo-${p.id}`} className="text-sm text-slate-500">Ativo</Label>
                        <input 
                          type="checkbox" 
                          id={`ativo-${p.id}`} 
                          defaultChecked={p.ativo === 1}
                          className="h-4 w-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                        />
                      </div>
                    </div>
                    <textarea 
                      id={`codigo-${p.id}`}
                      defaultValue={p.codigo}
                      className="w-full h-32 p-3 text-sm font-mono bg-slate-100 text-slate-800 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder={`Cole o código do ${p.nome} aqui...`}
                    />
                    <div className="flex justify-end">
                      <Button onClick={() => {
                        const inputCodigo = document.getElementById(`codigo-${p.id}`) as HTMLTextAreaElement;
                        const inputAtivo = document.getElementById(`ativo-${p.id}`) as HTMLInputElement;
                        if (inputCodigo && inputAtivo) {
                          handleUpdatePixel(p.id, inputCodigo.value, inputAtivo.checked);
                        }
                      }}>Salvar Configuração</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
