import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  DollarSign, 
  Clock, 
  User,
  Package,
  AlertCircle,
  RefreshCw,
  Utensils,
  CheckCircle,
  XCircle,
  Search,
  X,
  Trash2
} from 'lucide-react';
import { useTableSales } from '../../hooks/useTableSales';
import { usePDVProducts } from '../../hooks/usePDV';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { RestaurantTable, TableSale } from '../../types/table-sales';
import { PDVProduct } from '../../types/pdv';
import { PesagemModal } from '../PDV/PesagemModal';
import TablePaymentModal from './TablePaymentModal';
import { updateTablesStatus } from '../../utils/updateTables';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
  isCashRegisterOpen: boolean;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName = 'Operador', isCashRegisterOpen = false }) => {
  const { currentRegister, addCashEntry } = usePDVCashRegister();
  const { tables, loading, error, stats, createTableSale, closeSale, getSaleDetails, updateTableStatus, refetch, addItemToSale, deleteItemFromSale } = useTableSales(storeId, currentRegister, addCashEntry);
  const { products, loading: productsLoading, searchProducts } = usePDVProducts();
  
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showPesagemModal, setShowPesagemModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PDVProduct | null>(null);
  const [saleDetails, setSaleDetails] = useState<TableSale | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'voucher' | 'misto'>('dinheiro');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [saleToClose, setSaleToClose] = useState<TableSale | null>(null);

  // Função para liberar mesas específicas
  const handleFreeTables = async () => {
    try {
      await updateTablesStatus();
      await refetch();
      alert('✅ Todas as mesas (1, 2 e 3) liberadas com sucesso!');
    } catch (error) {
      console.error('Erro ao liberar mesas:', error);
      alert('❌ Erro ao liberar mesas');
    }
  };

  // Função para liberar mesa individual
  const handleFreeIndividualTable = async (tableId: string, tableNumber: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que o clique abra o modal da mesa
    
    if (confirm(`Tem certeza que deseja liberar a Mesa ${tableNumber}?`)) {
      try {
        await updateTableStatus(tableId, 'livre');
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
        successMessage.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Mesa ${tableNumber} liberada com sucesso!
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
      } catch (error) {
        console.error('Erro ao liberar mesa:', error);
        alert(`❌ Erro ao liberar Mesa ${tableNumber}`);
      }
    }
  };

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada': return 'bg-red-100 text-red-800 border-red-200';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'limpeza': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'livre': return 'Livre';
      case 'ocupada': return 'Ocupada';
      case 'aguardando_conta': return 'Aguardando Conta';
      case 'limpeza': return 'Limpeza';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'livre': return <CheckCircle size={16} />;
      case 'ocupada': return <User size={16} />;
      case 'aguardando_conta': return <DollarSign size={16} />;
      case 'limpeza': return <Package size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const handleTableClick = async (table: RestaurantTable) => {
    setSelectedTable(table);
    
    if (table.status === 'livre') {
      setShowNewSaleModal(true);
    } else if (table.status === 'ocupada' && table.current_sale_id) {
      const details = await getSaleDetails(table.current_sale_id);
      setSaleDetails(details);
      setShowProductsModal(true);
    } else if (table.status === 'aguardando_conta' && table.current_sale_id) {
      const details = await getSaleDetails(table.current_sale_id);
      setSaleDetails(details);
      setShowDetailsModal(true);
    }
  };

  const handleCreateSale = async () => {
    if (!selectedTable || !selectedTable.id) {
      console.error('❌ Erro: selectedTable is null or missing ID');
      return;
    }
    
    try {
      await createTableSale(selectedTable.id, customerName, customerCount);
      setShowNewSaleModal(false);
      setCustomerName('');
      setCustomerCount(1);
      setSelectedTable(null);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Mesa ${selectedTable.number} aberta com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('Erro ao criar venda:', err);
      alert('Erro ao abrir mesa. Tente novamente.');
    }
  };

  const handleUpdateStatus = async (tableId: string, newStatus: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza') => {
    try {
      await updateTableStatus(tableId, newStatus);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status da mesa.');
    }
  };

  const handleCloseSale = (sale: TableSale) => {
    // Verificar se a venda tem itens e valor maior que zero
    if (!sale.items || sale.items.length === 0) {
      alert('❌ Não é possível fechar uma mesa sem itens. Adicione produtos antes de fechar a mesa.');
      return;
    }
    
    if (sale.total_amount <= 0) {
      alert('❌ Não é possível fechar uma mesa com valor zero. Adicione produtos com valor antes de fechar a mesa.');
      return;
    }
    
    setSaleToClose(sale);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (method: string, changeForAmount?: number) => {
    if (!saleToClose) return;

    try {
      console.log('💳 Processando pagamento da mesa:', {
        saleId: saleToClose.id,
        method,
        changeForAmount,
        totalAmount: saleToClose.total_amount
      });

      // Calcular troco corretamente
      const changeAmount = changeForAmount && changeForAmount > saleToClose.total_amount 
        ? changeForAmount - saleToClose.total_amount 
        : 0;

      await closeSale(saleToClose.id, method as any, changeAmount);
      setShowPaymentModal(false);
      setSaleToClose(null);
      setPaymentMethod('dinheiro');
      setChangeFor(undefined);
      setShowDetailsModal(false);
      setSelectedTable(null);
      setSaleDetails(null);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Mesa fechada com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (error) {
      console.error('Erro ao fechar mesa:', error);
      
      // Tratamento de erro mais específico
      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error('❌ Detalhes do erro:', {
        error,
        errorMessage,
        saleToClose,
        method,
        changeForAmount
      });
      
      // Verificar tipos específicos de erro
      if (errorMessage.includes('cash register') || errorMessage.includes('caixa')) {
        alert('Erro no caixa: Verifique se há um caixa aberto na aba "Caixas" antes de finalizar a venda.\n\nDetalhes: ' + errorMessage);
      } else if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
        alert('Erro de dados: Verifique se todos os dados da venda estão corretos.\n\nDetalhes: ' + errorMessage);
      } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
        alert('Erro de permissão: Você não tem permissão para realizar esta operação.\n\nDetalhes: ' + errorMessage);
      } else {
        alert(`Erro ao fechar mesa: ${errorMessage}\n\nTente novamente ou entre em contato com o suporte.`);
      }
    }
  };
  const handleAddProduct = async (product: PDVProduct, quantity: number = 1, weight?: number) => {
    if (!selectedTable?.current_sale_id) return;

    try {
      const item = {
        product_code: product.code,
        product_name: product.name,
        quantity: quantity,
        weight_kg: weight,
        unit_price: product.unit_price,
        price_per_gram: product.price_per_gram,
        discount_amount: 0,
        subtotal: product.is_weighable && weight && product.price_per_gram
          ? weight * 1000 * product.price_per_gram
          : quantity * (product.unit_price || 0)
      };

      await addItemToSale(selectedTable.current_sale_id, item);
      
      // Refresh table data and sale details
      refetch();
      
      // Reload sale details to show new item immediately
      if (selectedTable.current_sale_id) {
        const updatedDetails = await getSaleDetails(selectedTable.current_sale_id);
        setSaleDetails(updatedDetails);
      }
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Produto adicionado à mesa ${selectedTable.number}!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('Erro ao adicionar produto:', err);
      alert('Erro ao adicionar produto à mesa.');
    }
  };

  const handleProductClick = (product: PDVProduct) => {
    if (product.is_weighable) {
      setSelectedProduct(product);
      setShowPesagemModal(true);
    } else {
      handleAddProduct(product, 1);
    }
  };

  const handleWeightConfirm = (weightInGrams: number) => {
    if (selectedProduct) {
      const weightInKg = weightInGrams / 1000;
      handleAddProduct(selectedProduct, 1, weightInKg);
      setShowPesagemModal(false);
      setSelectedProduct(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedTable?.current_sale_id) return;

    if (confirm('Tem certeza que deseja excluir este item da venda?')) {
      try {
        await deleteItemFromSale(itemId, selectedTable.current_sale_id);
        
        // Refresh table data and sale details
        refetch();
        
        // Reload sale details to show updated items immediately
        if (selectedTable.current_sale_id) {
          const updatedDetails = await getSaleDetails(selectedTable.current_sale_id);
          setSaleDetails(updatedDetails);
        }
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
        successMessage.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Item excluído da mesa ${selectedTable.number}!
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
      } catch (err) {
        console.error('Erro ao excluir item:', err);
        alert('Erro ao excluir item da mesa.');
      }
    }
  };
  const filteredProducts = React.useMemo(() => {
    let result = searchTerm ? searchProducts(searchTerm) : products;
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    return result.filter(p => p.is_active);
  }, [products, searchProducts, searchTerm, selectedCategory]);

  // Limitar a apenas 4 mesas
  const limitedTables = tables.slice(0, 4);

  // Calcular estatísticas apenas das mesas exibidas
  const limitedStats = {
    total: limitedTables.length,
    free: limitedTables.filter(table => table.status === 'livre').length,
    occupied: limitedTables.filter(table => table.status === 'ocupada').length,
    waitingBill: limitedTables.filter(table => table.status === 'aguardando_conta').length
  };

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'acai', label: 'Açaí' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'complementos', label: 'Complementos' },
    { id: 'sobremesas', label: 'Sobremesas' },
    { id: 'outros', label: 'Outros' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando mesas da Loja {storeId}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Modo Demonstração</h3>
              <p className="text-yellow-700 text-sm">
                Supabase não configurado. Sistema de mesas limitado.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-blue-600" />
            Sistema de Mesas - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie mesas e vendas presenciais</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFreeTables}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Liberar Todas as Mesas
          </button>
          <button
            onClick={refetch}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-800">{limitedStats.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Livres</p>
              <p className="text-2xl font-bold text-green-600">{limitedStats.free}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ocupadas</p>
              <p className="text-2xl font-bold text-red-600">{limitedStats.occupied}</p>
            </div>
            <User className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aguardando</p>
              <p className="text-2xl font-bold text-yellow-600">{limitedStats.waitingBill}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Mesas (exibindo {limitedTables.length} de {tables.length})
        </h3>
        
        {limitedTables.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma mesa encontrada
            </h3>
            <p className="text-gray-500">
              {supabaseConfigured 
                ? 'Não há mesas cadastradas para esta loja.'
                : 'Configure o Supabase para acessar as mesas.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {limitedTables.map((table) => (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${getStatusColor(table.status)}`}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getStatusIcon(table.status)}
                  </div>
                  <h4 className="font-bold text-lg mb-1">Mesa {table.number}</h4>
                  <p className="text-sm font-medium mb-2">{getStatusLabel(table.status)}</p>
                  
                  {table.current_sale && (
                    <div className="text-xs space-y-1">
                      {table.current_sale.customer_name && (
                        <p>Cliente: {table.current_sale.customer_name}</p>
                      )}
                      <p>Pessoas: {table.current_sale.customer_count}</p>
                      <p className="font-semibold">
                        Total: {formatPrice(table.current_sale.total_amount)}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-600">
                    Capacidade: {table.capacity} pessoas
                  </div>
                  
                  {/* Botão para liberar mesa individual */}
                  {table.status !== 'livre' && (
                    <div className="mt-3">
                      <button
                        onClick={(e) => handleFreeIndividualTable(table.id, table.number, e)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        title={`Liberar Mesa ${table.number}`}
                      >
                        <CheckCircle size={12} />
                        Liberar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Sale Modal */}
      {showNewSaleModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Abrir Mesa {selectedTable.number}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente (opcional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Pessoas
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCustomerCount(Math.max(1, customerCount - 1))}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <Plus size={16} className="rotate-45" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{customerCount}</span>
                  <button
                    onClick={() => setCustomerCount(customerCount + 1)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Mesa:</strong> {selectedTable.name} (Capacidade: {selectedTable.capacity} pessoas)
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowNewSaleModal(false);
                  setSelectedTable(null);
                  setCustomerName('');
                  setCustomerCount(1);
                }}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSale}
                disabled={!supabaseConfigured}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors"
              >
                Abrir Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Details Modal */}
      {showDetailsModal && selectedTable && saleDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Mesa {selectedTable.number} - Detalhes
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedTable(null);
                    setSaleDetails(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Sale Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">Informações da Venda</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Venda #:</span>
                    <span className="ml-2 font-medium">{saleDetails.sale_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium capitalize">{saleDetails.status}</span>
                  </div>
                  {saleDetails.customer_name && (
                    <div>
                      <span className="text-gray-600">Cliente:</span>
                      <span className="ml-2 font-medium">{saleDetails.customer_name}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Pessoas:</span>
                    <span className="ml-2 font-medium">{saleDetails.customer_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Aberta em:</span>
                    <span className="ml-2 font-medium">
                      {new Date(saleDetails.opened_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-bold text-green-600">
                      {formatPrice(saleDetails.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              {saleDetails.items && saleDetails.items.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">
                    Itens ({saleDetails.items.length})
                  </h3>
                  <div className="space-y-2">
                    {saleDetails.items.map((item) => (
                      <div key={item.id} className="bg-white rounded p-3 flex justify-between">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-600">
                            {item.weight_kg ? 
                              `${item.weight_kg}kg × ${formatPrice((item.price_per_gram || 0) * 1000)}/kg` :
                              `${item.quantity}x × ${formatPrice(item.unit_price || 0)}`
                            }
                          </p>
                        </div>
                        <p className="font-semibold text-green-600">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {saleDetails.status === 'aberta' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedTable.id, 'aguardando_conta')}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Solicitar Conta
                    </button>
                    <button
                      onClick={() => handleCloseSale(saleDetails)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Fechar Mesa
                    </button>
                  </>
                )}
                
                {selectedTable.status === 'limpeza' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedTable.id, 'livre')}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Marcar como Livre
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {showProductsModal && selectedTable && saleDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Mesa {selectedTable.number} - Adicionar Produtos
                </h2>
                <button
                  onClick={() => {
                    setShowProductsModal(false);
                    setSelectedTable(null);
                    setSaleDetails(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Products Panel */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Search and Filters */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar produtos..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="md:w-48">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Produtos Disponíveis</h3>
                    {productsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Carregando produtos...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                        {filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                          >
                            <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                              {product.image_url ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package size={24} className="text-gray-400" />
                              )}
                            </div>
                            <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2">{product.name}</h4>
                            <div className="flex items-center justify-between">
                              <span className="text-blue-600 font-semibold text-sm">
                                {product.is_weighable ? (
                                  <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                    </svg>
                                    {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                                  </div>
                                ) : (
                                  formatPrice(product.unit_price || 0)
                                )}
                              </span>
                              <span className="text-xs text-gray-500">
                                {product.code}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredProducts.length === 0 && !productsLoading && (
                      <div className="text-center py-8">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">
                          {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sale Details Panel */}
                <div className="space-y-4">
                  {/* Sale Info */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Venda Atual</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Venda #:</span>
                        <span className="font-medium">{saleDetails.sale_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Cliente:</span>
                        <span className="font-medium">{saleDetails.customer_name || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Pessoas:</span>
                        <span className="font-medium">{saleDetails.customer_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Status:</span>
                        <span className="font-medium capitalize">{saleDetails.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Current Items */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">
                      Itens da Venda ({saleDetails.items?.length || 0})
                    </h3>
                    {saleDetails.items && saleDetails.items.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {saleDetails.items.map((item) => (
                          <div key={item.id} className="bg-white rounded p-3 flex justify-between">
                            <div>
                              <p className="font-medium text-sm">{item.product_name}</p>
                              <p className="text-xs text-gray-600">
                                {item.weight_kg ? 
                                  `${item.weight_kg}kg × ${formatPrice((item.price_per_gram || 0) * 1000)}/kg` :
                                  `${item.quantity}x × ${formatPrice(item.unit_price || 0)}`
                                }
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-green-600 text-sm">
                                {formatPrice(item.subtotal)}
                              </p>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                title="Excluir item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Package size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">Nenhum item adicionado</p>
                        <p className="text-xs">Selecione produtos para adicionar</p>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-green-800">Total:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(saleDetails.total_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedTable.id, 'aguardando_conta')}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Solicitar Conta
                    </button>
                    <button
                      onClick={() => handleCloseSale(saleDetails)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Fechar Mesa
                    </button>
                    <button
                      onClick={() => {
                        setShowProductsModal(false);
                        setSelectedTable(null);
                        setSaleDetails(null);
                      }}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pesagem Modal */}
      {showPesagemModal && selectedProduct && (
        <PesagemModal
          produto={selectedProduct}
          onConfirmar={handleWeightConfirm}
          onFechar={() => {
            setShowPesagemModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && saleToClose && (
        <TablePaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSaleToClose(null);
            setPaymentMethod('dinheiro');
            setChangeFor(undefined);
          }}
          sale={saleToClose}
          selectedTable={selectedTable}
          onConfirm={handlePaymentConfirm}
          disableConfirm={!supabaseConfigured || !currentRegister?.id}
          isCashRegisterOpen={!!currentRegister?.id}
          totalAmount={saleToClose.total_amount}
        />
      )}

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Utensils size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">ℹ️ Como usar o Sistema de Mesas</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Mesa Livre:</strong> Clique para abrir uma nova venda</li>
              <li>• <strong>Mesa Ocupada:</strong> Clique para adicionar produtos</li>
              <li>• <strong>Aguardando Conta:</strong> Cliente solicitou a conta</li>
              <li>• <strong>Limpeza:</strong> Mesa sendo limpa após fechamento</li>
              <li>• Adicione produtos diretamente pelo sistema de mesas</li>
              <li>• O sistema sincroniza automaticamente com o caixa</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableSalesPanel;