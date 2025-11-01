import React, { useState, useEffect } from 'react';
import { getUnknownQueries, clearUnknownQueries, getUnknownQueryStats, UnknownQuery, addTagToQuery, getQueriesByTag } from './unknowns';
import { X, Download, Trash2, RefreshCw, MessageCircle, Search, AlertCircle, Info, Tag, Filter } from 'lucide-react';

interface ChatbotAdminProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatbotAdmin: React.FC<ChatbotAdminProps> = ({ isOpen, onClose }) => {
  const [unknownQueries, setUnknownQueries] = useState<UnknownQuery[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getUnknownQueryStats>>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuery, setSelectedQuery] = useState<UnknownQuery | null>(null);
  const [filterTag, setFilterTag] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setUnknownQueries(getUnknownQueries());
    setStats(getUnknownQueryStats());
  };

  const handleClearAll = () => {
    if (window.confirm('Tem certeza que deseja limpar todas as perguntas não reconhecidas?')) {
      clearUnknownQueries();
      loadData();
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(unknownQueries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `unknown_queries_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddTag = (queryIndex: number, tag: string) => {
    addTagToQuery(queryIndex, tag);
    loadData(); // Reload data to reflect changes
  };

  // Filter queries by search term and tag
  const filteredQueries = unknownQueries.filter(q => {
    const matchesSearch = searchTerm ? 
      q.query.toLowerCase().includes(searchTerm.toLowerCase()) : 
      true;
      
    const matchesTag = filterTag === 'all' ? 
      true : 
      (q.tags && q.tags.includes(filterTag));
      
    return matchesSearch && matchesTag;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-full p-2">
                <MessageCircle size={24} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Chatbot Admin</h2>
                <p className="text-gray-600 text-sm">Gerenciamento de perguntas não reconhecidas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(90vh-120px)]">
          {/* Left Panel - Stats and Controls */}
          <div className="p-6 border-r border-gray-200 overflow-y-auto">
            <div className="space-y-6">
              {/* Stats */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <Info size={18} className="text-blue-600" />
                  Estatísticas
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Total de perguntas:</span>
                    <span className="font-medium text-blue-800">{stats?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Hoje:</span>
                    <span className="font-medium text-blue-800">{stats?.today || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Última semana:</span>
                    <span className="font-medium text-blue-800">{stats?.lastWeek || 0}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={loadData}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                  Atualizar Dados
                </button>
                <button
                  onClick={handleExport}
                  disabled={unknownQueries.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Exportar JSON
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={unknownQueries.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  Limpar Tudo
                </button>
              </div>

              {/* Tag Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por Tag
                </label>
                <div className="relative">
                  <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">Todas as tags</option>
                    <option value="nova-pergunta">Nova pergunta</option>
                    <option value="importante">Importante</option>
                    <option value="pedido">Pedido</option>
                    <option value="reclamacao">Reclamação</option>
                  </select>
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar Perguntas
                </label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Buscar perguntas..."
                  />
                </div>
              </div>

              {/* Help */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-gray-800 mb-2">Como usar</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                  <li>Perguntas não reconhecidas são salvas automaticamente</li>
                  <li>Use os dados para treinar seu chatbot</li>
                  <li>Exporte para análise ou backup</li>
                  <li>Clique em uma pergunta para ver detalhes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Panel - Query List */}
          <div className="col-span-2 flex flex-col h-full">
            {/* Query List */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="font-medium text-gray-800 mb-4 flex items-center justify-between">
                <span>Perguntas Não Reconhecidas ({filteredQueries.length})</span>
                {searchTerm && (
                  <span className="text-sm text-purple-600">
                    Filtrando por: "{searchTerm}"
                  </span>
                )}
              </h3>

              {filteredQueries.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {unknownQueries.length === 0
                      ? 'Nenhuma pergunta não reconhecida ainda'
                      : 'Nenhuma pergunta encontrada com este filtro'}
                  </p>
                  {unknownQueries.length === 0 && (
                    <p className="text-gray-400 text-sm mt-2">
                      As perguntas aparecerão aqui quando os usuários fizerem perguntas que o chatbot não conseguir responder
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQueries.map((query, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedQuery === query
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                      }`}
                      onClick={() => setSelectedQuery(query)}
                    >
                      <div className="flex items-start gap-2">
                        <MessageCircle size={16} className="text-purple-600 mt-1 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800">{query.query}</p>
                            {query.tags && query.tags.map(tag => (
                              <span key={tag} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(query.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Query Details */}
            {selectedQuery && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <h3 className="font-medium text-gray-800 mb-3">Detalhes da Pergunta</h3>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Pergunta:</p>
                      <p className="font-medium text-gray-800">{selectedQuery.query}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data/Hora:</p>
                      <p className="text-gray-800">
                        {new Date(selectedQuery.timestamp).toLocaleString()}
                      </p>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">Tags:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedQuery.tags && selectedQuery.tags.map(tag => (
                              <span key={tag} className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                                {tag}
                              </span>
                            ))}
                            <button 
                              onClick={() => handleAddTag(unknownQueries.indexOf(selectedQuery), 'importante')}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200"
                            >
                              + importante
                            </button>
                            <button 
                              onClick={() => handleAddTag(unknownQueries.indexOf(selectedQuery), 'pedido')}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200"
                            >
                              + pedido
                            </button>
                            <button 
                              onClick={() => handleAddTag(unknownQueries.indexOf(selectedQuery), 'reclamacao')}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200"
                            >
                              + reclamação
                            </button>
                          </div>
                        </div>
                    </div>
                    {selectedQuery.context && (
                      <div>
                        <p className="text-sm text-gray-600">Contexto da Conversa:</p>
                        <pre className="bg-gray-50 p-2 rounded text-sm text-gray-800 whitespace-pre-wrap">
                          {selectedQuery.context}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotAdmin;