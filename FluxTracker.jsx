import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Grid3x3, List, BarChart3, Trash2, Check, Clock, AlertCircle, ChevronDown, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PRIORITIES = {
  high: { label: 'Haute', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: '🔴' },
  medium: { label: 'Moyenne', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: '🟠' },
  low: { label: 'Basse', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: '🔵' }
};

const STATUSES = {
  todo: { label: 'À faire', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20', icon: Clock },
  inProgress: { label: 'En cours', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: AlertCircle },
  done: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: Check }
};

export default function FluxTracker() {
  const [view, setView] = useState('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  
  const [items, setItems] = useState([
    {
      id: 1,
      object: 'Migration Base de Données',
      action: 'Planifier et exécuter la migration PostgreSQL',
      responsible: 'Sophie Martin',
      priority: 'high',
      status: 'inProgress',
      createdAt: new Date('2025-02-10')
    },
    {
      id: 2,
      object: 'Documentation API',
      action: 'Rédiger la documentation technique complète',
      responsible: 'Marc Dubois',
      priority: 'medium',
      status: 'todo',
      createdAt: new Date('2025-02-12')
    },
    {
      id: 3,
      object: 'Tests de Performance',
      action: 'Effectuer les tests de charge sur l\'environnement de staging',
      responsible: 'Julie Leroy',
      priority: 'high',
      status: 'done',
      createdAt: new Date('2025-02-08')
    },
    {
      id: 4,
      object: 'Revue de Code',
      action: 'Analyser et valider les PR de la semaine',
      responsible: 'Thomas Bernard',
      priority: 'medium',
      status: 'inProgress',
      createdAt: new Date('2025-02-14')
    },
    {
      id: 5,
      object: 'Mise à jour Dépendances',
      action: 'Mettre à jour les packages npm et corriger les vulnérabilités',
      responsible: 'Sophie Martin',
      priority: 'low',
      status: 'todo',
      createdAt: new Date('2025-02-15')
    }
  ]);

  const [newItem, setNewItem] = useState({
    object: '',
    action: '',
    responsible: '',
    priority: 'medium',
    status: 'todo'
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.responsible.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [items, searchTerm, filterPriority, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      todo: items.filter(i => i.status === 'todo').length,
      inProgress: items.filter(i => i.status === 'inProgress').length,
      done: items.filter(i => i.status === 'done').length,
      highPriority: items.filter(i => i.priority === 'high').length,
      completionRate: Math.round((items.filter(i => i.status === 'done').length / items.length) * 100) || 0
    };
  }, [items]);

  const addItem = () => {
    if (newItem.object && newItem.action && newItem.responsible) {
      setItems([...items, {
        ...newItem,
        id: Date.now(),
        createdAt: new Date()
      }]);
      setNewItem({
        object: '',
        action: '',
        responsible: '',
        priority: 'medium',
        status: 'todo'
      });
      setShowNewItemForm(false);
    }
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItemStatus = (id, newStatus) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));
  };

  const renderKanbanView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Object.entries(STATUSES).map(([status, config]) => (
        <div key={status} className="flex flex-col">
          <div className="mb-4 flex items-center gap-2 pb-3 border-b-2 border-slate-200/50">
            <config.icon className="w-5 h-5" />
            <h3 className="font-semibold text-lg">{config.label}</h3>
            <Badge variant="outline" className="ml-auto">
              {filteredItems.filter(i => i.status === status).length}
            </Badge>
          </div>
          <div className="space-y-3 flex-1">
            {filteredItems
              .filter(item => item.status === status)
              .map(item => (
                <Card 
                  key={item.id} 
                  className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-500/30 cursor-move"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.object}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity -mt-2 -mr-2"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{item.action}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1">
                        <div className="text-xs text-slate-500 mb-1">Responsable</div>
                        <div className="text-sm font-medium text-slate-700">{item.responsible}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${PRIORITIES[item.priority].color} border text-xs`}>
                        {PRIORITIES[item.priority].icon} {PRIORITIES[item.priority].label}
                      </Badge>
                      <select
                        value={item.status}
                        onChange={(e) => updateItemStatus(item.id, e.target.value)}
                        className="ml-auto text-xs border rounded px-2 py-1 bg-white hover:bg-slate-50 cursor-pointer"
                      >
                        {Object.entries(STATUSES).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {filteredItems.map(item => (
        <Card 
          key={item.id}
          className="group hover:shadow-md transition-all duration-200 border-2 hover:border-blue-500/30"
        >
          <CardContent className="p-5">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3">
                <div className="text-xs text-slate-500 mb-1">Objet</div>
                <div className="font-semibold text-slate-900">{item.object}</div>
              </div>
              <div className="col-span-4">
                <div className="text-xs text-slate-500 mb-1">Action</div>
                <div className="text-sm text-slate-700">{item.action}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500 mb-1">Responsable</div>
                <div className="text-sm font-medium text-slate-700">{item.responsible}</div>
              </div>
              <div className="col-span-1">
                <Badge className={`${PRIORITIES[item.priority].color} border text-xs w-full justify-center`}>
                  {PRIORITIES[item.priority].icon}
                </Badge>
              </div>
              <div className="col-span-1">
                <Badge className={`${STATUSES[item.status].color} border text-xs w-full justify-center`}>
                  {React.createElement(STATUSES[item.status].icon, { className: 'w-3 h-3' })}
                </Badge>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderStatsView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-slate-600 mt-1">Total des tâches</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-slate-600 mt-1">En cours</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-green-600">{stats.done}</div>
            <div className="text-sm text-slate-600 mt-1">Terminées</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-500/20 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-red-600">{stats.highPriority}</div>
            <div className="text-sm text-slate-600 mt-1">Priorité haute</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Taux de complétion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Progression globale</span>
                <span className="text-sm font-bold text-green-600">{stats.completionRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-600">{stats.todo}</div>
                <div className="text-xs text-slate-500 mt-1">À faire</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                <div className="text-xs text-slate-500 mt-1">En cours</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.done}</div>
                <div className="text-xs text-slate-500 mt-1">Terminées</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Répartition par responsable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...new Set(items.map(i => i.responsible))].map(responsible => {
              const userItems = items.filter(i => i.responsible === responsible);
              const userDone = userItems.filter(i => i.status === 'done').length;
              const userRate = Math.round((userDone / userItems.length) * 100);
              
              return (
                <div key={responsible} className="flex items-center gap-4">
                  <div className="w-40 font-medium text-sm">{responsible}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-500">{userDone}/{userItems.length} tâches</span>
                      <span className="text-xs font-medium">{userRate}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${userRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FluxTracker Pro
              </h1>
              <p className="text-slate-600 mt-2">Gestion structurée de vos flux de projet</p>
            </div>
            <Button 
              onClick={() => setShowNewItemForm(!showNewItemForm)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle tâche
            </Button>
          </div>

          {/* Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50">
              <div className="text-2xl font-bold text-slate-700">{stats.total}</div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50">
              <div className="text-2xl font-bold text-slate-600">{stats.todo}</div>
              <div className="text-xs text-slate-500">À faire</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-yellow-200/50">
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
              <div className="text-xs text-slate-500">En cours</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-200/50">
              <div className="text-2xl font-bold text-green-600">{stats.done}</div>
              <div className="text-xs text-slate-500">Terminées</div>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-3 text-white">
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <div className="text-xs opacity-90">Progression</div>
            </div>
          </div>

          {/* New Item Form */}
          {showNewItemForm && (
            <Card className="mb-6 border-2 border-blue-500/30 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Nouvelle tâche</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowNewItemForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Objet</label>
                    <Input
                      value={newItem.object}
                      onChange={(e) => setNewItem({ ...newItem, object: e.target.value })}
                      placeholder="Ex: Migration Base de Données"
                      className="border-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Responsable</label>
                    <Input
                      value={newItem.responsible}
                      onChange={(e) => setNewItem({ ...newItem, responsible: e.target.value })}
                      placeholder="Ex: Sophie Martin"
                      className="border-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-2 block">Action</label>
                    <Input
                      value={newItem.action}
                      onChange={(e) => setNewItem({ ...newItem, action: e.target.value })}
                      placeholder="Ex: Planifier et exécuter la migration PostgreSQL"
                      className="border-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priorité</label>
                    <select
                      value={newItem.priority}
                      onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}
                      className="w-full border-2 rounded-md px-3 py-2 bg-white"
                    >
                      {Object.entries(PRIORITIES).map(([key, val]) => (
                        <option key={key} value={key}>{val.icon} {val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Statut</label>
                    <select
                      value={newItem.status}
                      onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                      className="w-full border-2 rounded-md px-3 py-2 bg-white"
                    >
                      {Object.entries(STATUSES).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={addItem}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewItemForm(false)}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Toolbar */}
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-slate-200/50 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par objet, action ou responsable..."
                  className="pl-10 border-2"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? "bg-blue-600" : ""}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </Button>
                
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                  <Button
                    variant={view === 'kanban' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('kanban')}
                    className={view === 'kanban' ? 'bg-white shadow-sm' : ''}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={view === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('list')}
                    className={view === 'list' ? 'bg-white shadow-sm' : ''}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={view === 'stats' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('stats')}
                    className={view === 'stats' ? 'bg-white shadow-sm' : ''}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="text-sm font-medium mb-2 block">Priorité</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full border-2 rounded-md px-3 py-2 bg-white"
                  >
                    <option value="all">Toutes les priorités</option>
                    {Object.entries(PRIORITIES).map(([key, val]) => (
                      <option key={key} value={key}>{val.icon} {val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Statut</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border-2 rounded-md px-3 py-2 bg-white"
                  >
                    <option value="all">Tous les statuts</option>
                    {Object.entries(STATUSES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {view === 'kanban' && renderKanbanView()}
          {view === 'list' && renderListView()}
          {view === 'stats' && renderStatsView()}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>💡 Astuce : Utilisez les filtres pour affiner votre vue • {filteredItems.length} tâche{filteredItems.length > 1 ? 's' : ''} affichée{filteredItems.length > 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  );
}