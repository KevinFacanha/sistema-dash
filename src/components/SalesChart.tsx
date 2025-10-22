import { SalesData } from '../services/sheetsService';

interface SalesChartProps {
  data: SalesData[];
  title: string;
  onDateClick?: (date: string) => void;
  selectedDate?: string | null;
}

export function SalesChart({ data, title, onDateClick, selectedDate }: SalesChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
      </div>
    );
  }

  const maxFaturamento = Math.max(...data.map(d => d.faturamentoDia));
  const maxVendas = Math.max(...data.map(d => d.quantidadeVendas));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">{title}</h3>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Faturamento (R$)</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-500">Receita diária</span>
            </div>
          </div>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 rounded-lg transition-all ${
                  onDateClick ? 'cursor-pointer hover:bg-blue-50 p-2 -m-2' : ''
                } ${
                  selectedDate === item.data ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                }`}
                onClick={() => onDateClick?.(item.data)}
              >
                <span className="text-xs text-gray-500 w-20 flex-shrink-0">{item.data}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ width: `${(item.faturamentoDia / maxFaturamento) * 100}%` }}
                  >
                    {item.faturamentoDia / maxFaturamento > 0.3 && (
                      <span className="text-xs font-medium text-white">
                        R$ {item.faturamentoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
                {item.faturamentoDia / maxFaturamento <= 0.3 && (
                  <span className="text-xs font-medium text-gray-700 w-32 text-right">
                    R$ {item.faturamentoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Quantidade de Vendas</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-500">Vendas realizadas</span>
            </div>
          </div>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 rounded-lg transition-all ${
                  onDateClick ? 'cursor-pointer hover:bg-green-50 p-2 -m-2' : ''
                } ${
                  selectedDate === item.data ? 'bg-green-100 ring-2 ring-green-500' : ''
                }`}
                onClick={() => onDateClick?.(item.data)}
              >
                <span className="text-xs text-gray-500 w-20 flex-shrink-0">{item.data}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ width: `${(item.quantidadeVendas / maxVendas) * 100}%` }}
                  >
                    {item.quantidadeVendas / maxVendas > 0.3 && (
                      <span className="text-xs font-medium text-white">
                        {item.quantidadeVendas} vendas
                      </span>
                    )}
                  </div>
                </div>
                {item.quantidadeVendas / maxVendas <= 0.3 && (
                  <span className="text-xs font-medium text-gray-700 w-32 text-right">
                    {item.quantidadeVendas} vendas
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
