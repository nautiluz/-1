'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Mail, Users, PieChart, Settings, Play, Plus, X } from 'lucide-react';

const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [topSenders, setTopSenders] = useState<any[]>([]);
  const [cleaningRules, setCleaningRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'senders' | 'rules'>('dashboard');
  const [newRule, setNewRule] = useState({ name: '', type: 'age', value: '', action: 'delete' });
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        setAccessToken(token);
        setIsAuthenticated(true);
        window.location.hash = '';
      }
    }
    
    const storedToken = localStorage.getItem('gmail_token');
    if (storedToken) {
      setAccessToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken && !stats) {
      loadStats();
    }
  }, [isAuthenticated, accessToken]);

  const handleLogin = () => {
    const redirectUri = window.location.origin + '/';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(SCOPES)}&include_granted_scopes=true`;
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem('gmail_token');
    setAccessToken(null);
    setIsAuthenticated(false);
    setStats(null);
    setTopSenders([]);
  };

  const gapiRequest = async (url: string, method = 'GET', body: any = null) => {
    const options: any = { method, headers: { Authorization: `Bearer ${accessToken}` } };
    if (body) {
      options.body = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  };

  const loadStats = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const profile = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/profile');
      setStats({
        total: parseInt(profile.messagesTotal || '0'),
        unread: 0,
        starred: 0,
        storageUsed: parseInt(profile.messagesTotal || '0') * 50000,
      });

      const sendersRes = await gapiRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=500');
      const messages = sendersRes.messages || [];
      
      const senderMap = new Map();
      for (const msg of messages.slice(0, 100)) {
        const detail = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`);
        const headers = detail.payload?.headers || [];
        const from = headers.find((h: any) => h.name === 'From')?.value || '';
        const match = from.match(/<(.+)>/) || [null, from];
        const email = match[1] || from;
        
        if (senderMap.has(email)) {
          senderMap.get(email).count++;
        } else {
          senderMap.set(email, { email, count: 1 });
        }
      }
      
      setTopSenders(Array.from(senderMap.values()).sort((a, b) => b.count - a.count).slice(0, 20));
    } catch (err: any) {
      setError('Error al cargar: ' + err.message);
    }
    setLoading(false);
  };

  const handleAddRule = () => {
    if (!newRule.name || !newRule.value) return;
    const rule = {
      id: Date.now().toString(),
      name: newRule.name,
      criteria: { type: newRule.type, value: newRule.value, operator: 'greater_than' },
      action: newRule.action,
      enabled: true,
    };
    setCleaningRules([...cleaningRules, rule]);
    setNewRule({ name: '', type: 'age', value: '', action: 'delete' });
  };

  const deleteCleaningRule = (id: string) => {
    setCleaningRules(cleaningRules.filter(r => r.id !== id));
  };

  const executeRule = async (rule: any) => {
    if (!accessToken) return;
    setLoading(true);
    
    let query = '';
    if (rule.criteria.type === 'age') {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(rule.criteria.value));
      query = `before:${date.toISOString().split('T')[0]}`;
    } else if (rule.criteria.type === 'sender') {
      query = `from:${rule.criteria.value}`;
    }
    
    try {
      const res = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages?query=${encodeURIComponent(query)}&maxResults=500`);
      const messages = res.messages || [];
      
      let deleted = 0;
      for (const msg of messages) {
        try {
          if (rule.action === 'delete') {
            await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, 'DELETE');
          } else if (rule.action === 'archive') {
            await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, 'POST', { removeLabelIds: ['INBOX'] });
          }
          deleted++;
        } catch (e) {}
      }
      
      alert(`Procesados: ${deleted} correos`);
      loadStats();
    } catch (err: any) {
      setError('Error al ejecutar regla');
    }
    setLoading(false);
  };

  const removeSender = async (sender: string) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages?query=from:${encodeURIComponent(sender)}&maxResults=100`);
      const messages = res.messages || [];
      
      for (const msg of messages) {
        try {
          await gapiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, 'DELETE');
        } catch (e) {}
      }
      
      loadStats();
    } catch (err: any) {
      setError('Error al eliminar');
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
            <CardDescription>Limpia y organiza tu Gmail facilmente</CardDescription>
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
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          Salir
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
                <CardDescription>Elimina correos de remitentes especificos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topSenders.map((sender, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{sender.email}</p>
                        <p className="text-sm text-gray-500">{sender.count} correos</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removeSender(sender.email)} disabled={loading}>
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
                      <option value="age">Antiguedad (dias)</option>
                      <option value="sender">Remitente</option>
                    </select>
                    <Input placeholder={newRule.type === 'age' ? 'Dias' : 'Valor'} value={newRule.value} onChange={e => setNewRule({...newRule, value: e.target.value})} />
                    <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2" value={newRule.action} onChange={e => setNewRule({...newRule, action: e.target.value})}>
                      <option value="delete">Eliminar</option>
                      <option value="archive">Archivar</option>
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
                        <Button onClick={() => executeRule(rule)} disabled={loading}>
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