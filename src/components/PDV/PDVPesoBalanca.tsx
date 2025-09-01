import React from 'react';
import { usePesoBalanca } from '../../hooks/usePesoBalanca';
import { Scale, RefreshCw, Check, Wifi, Weight } from 'lucide-react';

interface PDVPesoBalancaProps {
  onPesoSelecionado?: (peso: string) => void;
  forceConnected?: boolean;
}

const PDVPesoBalanca: React.FC<PDVPesoBalancaProps> = ({ onPesoSelecionado, forceConnected }) => {
  // Use a try-catch to prevent errors from breaking the component
  let pesoBalancaHook = { peso: 0, pesoFormatado: "0.000 Kg", conectado: false };
  let isStackBlitz = false;
  try {
    pesoBalancaHook = usePesoBalanca();
    isStackBlitz = pesoBalancaHook.isStackBlitz;
  } catch (error) {
    console.warn('⚠️ Error using scale hook:', error);
  }
  
  const { peso, pesoFormatado, conectado: balancaConectada, isDevMode } = pesoBalancaHook;
  
  // Use forceConnected prop if provided, otherwise use the conectado state from the hook
  const conectado = forceConnected !== undefined ? forceConnected : balancaConectada;

  // Format the weight for display
  const formattedWeight = () => {
    if (!conectado) return "Sem Leitura";
    if (peso <= 0) return "0.000 Kg";
    return pesoFormatado;
  };

  const handleSelecionarPeso = () => {
    if (onPesoSelecionado && conectado) {
      onPesoSelecionado(peso.toString());
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    // Force page reload to reset connections
    window.location.reload();
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
      conectado 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <div className="flex items-center gap-2 flex-1">
        <div className={`w-3 h-3 rounded-full ${conectado ? 'bg-green-500' : 'bg-red-500'}`}></div>
        
        <div className="flex items-center gap-1">
          {conectado ? (
            <Wifi size={18} className="text-green-600" />
          ) : (
            <Wifi size={18} className="text-gray-400" />
          )}
          <span className="font-medium text-sm">
            {conectado ? 'Balança Conectada' : 'Sem Leitura'}
          </span>
        </div>
        
        {conectado && (
          <div className="ml-2 bg-white px-3 py-1 rounded-lg border border-green-200">
            <span className="font-mono font-bold text-lg text-green-700 flex items-center gap-1">
              <Weight size={16} className="text-green-600" />
              {formattedWeight()}
            </span>
          </div>
        )}
        
        {!conectado && (
          <button
            onClick={handleRefresh}
            className="ml-2 p-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
            title="Tentar reconectar"
          >
            <RefreshCw size={16} className="text-red-600" />
          </button>
        )}
        
      </div>
      
      {conectado && onPesoSelecionado && (
        <button
          onClick={handleSelecionarPeso}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
        >
          <Check size={16} />
          Usar Peso
        </button>
      )}
    </div>
  );
};

export default PDVPesoBalanca;