'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Archive, Mail, Users, PieChart, Settings, LogOut, Play, Plus, X } from 'lucide-react';

export default function Home() {
  const searchParams = useSearchParams();
  const { isAuthenticated, tokens, setTokens, stats, setStats, topSenders, setTopSenders, cleaningRules, addCleaningRule, deleteCleaningRule } = useStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'senders' | 'rules'>('dashboard');
  const [newRule, setNewRule] = useState({ name: '', type: 'age', value: '', action: 'delete' });
  const [error, setError] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('tokens');
    const errorParam = searchParams.get('error');
    
    if (tokenParam) {
      setTokens(tokenParam);
      window.history.replaceState({}, '', '/');
    }
    
    if (errorParam) {
      setError('Error de autenticación. Por favor intenta de nuevo.');
    }
  }, [searchParams, setTokens]);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/gmail/auth');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    }
  };

  const loadStats = async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const res = await fetch('/api/gmail/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens }),
      });
      const data = await res.json();
      setStats(data);
      
      const sendersRes = await fetch('/api/gmail/senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens }),
      });
      const sendersData = await sendersRes.json();
      setTopSenders(sendersData);
    } catch (err) {
      setError('Error al cargar estadísticas');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tokens && !stats) {
      loadStats();
    }
  }, [tokens]);

  const handleAddRule = () => {
    if (!newRule.name || !newRule.value) return;
    addCleaningRule({
      id: Date.now().toString(),
      name: newRule.name,
      criteria: {
        type: newRule.type as any,
        value: newRule.type === 'age' ? parseInt(newRule.value) : newRule.value,
        operator: 'greater_than' as any,
      },
      action: newRule.action as any,
      enabled: true,
    });
    setNewRule({ name: '', type: 'age', value: '', action: 'delete' });
  };

  const executeRule = async (ruleId: string) => {
    if (!tokens) return;
    const rule = cleaningRules.find(r => r.id === ruleId);
    if (!rule) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/gmail/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens, rule }),
      });
      const data = await res.json();
      alert(`Procesados: ${data.processed}, Eliminados: ${data.deleted}`);
      loadStats();
    } catch (err) {
      setError('Error al ejecutar regla');
    }
    setLoading(false);
  };

  const removeSender = async (sender: string) => {
    if (!tokens) return;
    setLoading(true);
    try {
      const res = await fetch('/api/gmail/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens, query: `from:${sender}`, maxResults: 100 }),
      });
      const messages = await res.json();
      const ids = messages.map((m: any) => m.id);
      
      if (ids.length > 0) {
        await fetch('/api/gmail/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens, action: 'delete', ids }),
        });
        loadStats();
      }
    } catch (err) {
      setError('Error al eliminar correos');
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">CleanMailBox</CardTitle>
            <CardDescription>Limpia y organiza tu Gmail fácilmente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button onClick={handleLogin} className="w-full" size="lg">
              Conectar con Gmail
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-6 h-6 text-blue-600" />
          <span className="text-xl font-bold">CleanMailBox</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => window.location.href = '/'}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>
            <PieChart className="w-5 h-5" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('senders')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${activeTab === 'senders' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>
            <Users className="w-5 h-5" /> Remitentes
          </button>
          <button onClick={() => setActiveTab('rules')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${activeTab === 'rules' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>
            <Settings className="w-5 h-5" /> Reglas
          </button>
        </aside>

        <main className="flex-1 p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>}
          
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Correos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.total?.toLocaleString() || '...'}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Sin leer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.unread?.toLocaleString() || '...'}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Destacados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.starred?.toLocaleString() || '...'}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Almacenamiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{((stats?.storageUsed || 0) / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                  <p className="text-xs text-gray-400">de 15 GB</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'senders' && (
            <Card>
              <CardHeader>
                <CardTitle>Top Remitentes</CardTitle>
                <CardDescription>Elimina correos de remitentes específicos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topSenders.map((sender, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{sender.email}</p>
                        <p className="text-sm text-gray-500">{sender.count} correos</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removeSender(sender.email)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nueva Regla</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Nombre de la regla" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} />
                  <div className="flex gap-4">
                    <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2" value={newRule.type} onChange={e => setNewRule({...newRule, type: e.target.value})}>
                      <option value="age">Antigüedad (días)</option>
                      <option value="sender">Remitente</option>
                      <option value="subject">Asunto</option>
                    </select>
                    <Input placeholder={newRule.type === 'age' ? 'Días' : 'Valor'} value={newRule.value} onChange={e => setNewRule({...newRule, value: e.target.value})} />
                    <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2" value={newRule.action} onChange={e => setNewRule({...newRule, action: e.target.value})}>
                      <option value="delete">Eliminar</option>
                      <option value="archive">Archivar</option>
                      <option value="mark_read">Marcar leído</option>
                    </select>
                    <Button onClick={handleAddRule}><Plus className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {cleaningRules.map(rule => (
                  <Card key={rule.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-gray-500">{rule.criteria.type}: {rule.criteria.value} → {rule.action}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => executeRule(rule.id)} disabled={loading}>
                          <Play className="w-4 h-4 mr-1" /> Ejecutar
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => deleteCleaningRule(rule.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}