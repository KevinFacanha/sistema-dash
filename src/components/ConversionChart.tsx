import { SalesData } from '../services/sheetsService';
import { Users, ShoppingCart, Percent } from 'lucide-react';

interface ConversionChartProps {
  data: SalesData[];
  onDateClick?: (date: string) => void;
  selectedDate?: string | null;
}

export function ConversionChart({ data, onDateClick, selectedDate }: ConversionChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Análise de Conversão</h3>
        <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
      </div>
    );
  }

  const maxVisitas = Math.max(...data.map(d => d.numeroVisitas));
  const maxConversao = Math.max(...data.map(d => d.taxaConversao));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Análise de Conversão</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Visitas por Dia</span>
          </div>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div
                key={index}
                className={`rounded-lg transition-all ${
                  onDateClick ? 'cursor-pointer hover:bg-purple-50 p-2 -m-2' : ''
                } ${
                  selectedDate === item.data ? 'bg-purple-100 ring-2 ring-purple-500' : ''
                }`}
                onClick={() => onDateClick?.(item.data)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{item.data}</span>
                  <span className="text-xs font-medium text-gray-700">{item.numeroVisitas}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(item.numeroVisitas / maxVisitas) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Percent className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Taxa de Conversão</span>
          </div>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div
                key={index}
                className={`rounded-lg transition-all ${
                  onDateClick ? 'cursor-pointer hover:bg-orange-50 p-2 -m-2' : ''
                } ${
                  selectedDate === item.data ? 'bg-orange-100 ring-2 ring-orange-500' : ''
                }`}
                onClick={() => onDateClick?.(item.data)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{item.data}</span>
                  <span className="text-xs font-medium text-gray-700">{item.taxaConversao.toFixed(2)}%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(item.taxaConversao / maxConversao) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4">
          {data.map((item, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border transition-all ${
                onDateClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-md' : ''
              } ${
                selectedDate === item.data ? 'border-blue-500 ring-2 ring-blue-500 shadow-lg' : 'border-gray-100'
              }`}
              onClick={() => onDateClick?.(item.data)}
            >
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-600">{item.data}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Visitas:</span>
                  <span className="font-medium text-gray-700">{item.numeroVisitas}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Vendas:</span>
                  <span className="font-medium text-gray-700">{item.quantidadeVendas}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                  <span className="text-gray-500">Conversão:</span>
                  <span className="font-semibold text-blue-600">{item.taxaConversao.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
