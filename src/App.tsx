import { useEffect, useState, useMemo } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Users, Percent, BarChart3, RefreshCw, X } from 'lucide-react';
import { fetchSalesData, SalesData } from './services/sheetsService';
import { DateFilter } from './components/DateFilter';
import { KPICard } from './components/KPICard';
import { SalesChart } from './components/SalesChart';
import { ConversionChart } from './components/ConversionChart';
import { MarketplaceFilter } from './components/MarketplaceFilter';

function App() {
  const [allData, setAllData] = useState<SalesData[]>([]);
  const [filteredData, setFilteredData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchSalesData();
      if (import.meta.env.DEV) {
        console.log(`✅ Dashboard atualizado: ${data.length} registros carregados`);
      }
      setAllData(data);
      setFilteredData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = allData;

    if (selectedMarketplace) {
      filtered = filtered.filter((item) => item.marketplace === selectedMarketplace);
    }

    if (selectedDate) {
      filtered = filtered.filter((item) => item.data === selectedDate);
      setFilteredData(filtered);
      return;
    }

    if (!startDate && !endDate) {
      setFilteredData(filtered);
      return;
    }

    filtered = filtered.filter((item) => {
      const [day, month, year] = item.data.split('/');
      const itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end) {
        return itemDate >= start && itemDate <= end;
      } else if (start) {
        return itemDate >= start;
      } else if (end) {
        return itemDate <= end;
      }
      return true;
    });

    setFilteredData(filtered);
  }, [startDate, endDate, allData, selectedDate, selectedMarketplace]);

  const uniqueMarketplaces = useMemo(() => {
    const marketplaces = new Set(allData.map(item => item.marketplace).filter(m => m));
    return Array.from(marketplaces).sort();
  }, [allData]);

  const calculateKPIs = () => {
    if (filteredData.length === 0) {
      return {
        totalFaturamento: 0,
        totalVendas: 0,
        ticketMedio: 0,
        totalVisitas: 0,
        taxaConversaoMedia: 0,
      };
    }

    const totalFaturamento = filteredData.reduce((acc, item) => acc + item.faturamentoDia, 0);
    const totalVendas = filteredData.reduce((acc, item) => acc + item.quantidadeVendas, 0);
    const totalVisitas = filteredData.reduce((acc, item) => acc + item.numeroVisitas, 0);
    const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;
    const taxaConversaoMedia = totalVisitas > 0 ? (totalVendas / totalVisitas) * 100 : 0;

    return {
      totalFaturamento,
      totalVendas,
      ticketMedio,
      totalVisitas,
      taxaConversaoMedia,
    };
  };

  const calculateTrends = () => {
    if (filteredData.length < 2) return {};

    const midPoint = Math.floor(filteredData.length / 2);
    const firstHalf = filteredData.slice(0, midPoint);
    const secondHalf = filteredData.slice(midPoint);

    const firstHalfFaturamento = firstHalf.reduce((acc, item) => acc + item.faturamentoDia, 0) / firstHalf.length;
    const secondHalfFaturamento = secondHalf.reduce((acc, item) => acc + item.faturamentoDia, 0) / secondHalf.length;
    const faturamentoTrend = ((secondHalfFaturamento - firstHalfFaturamento) / firstHalfFaturamento) * 100;

    const firstHalfVendas = firstHalf.reduce((acc, item) => acc + item.quantidadeVendas, 0) / firstHalf.length;
    const secondHalfVendas = secondHalf.reduce((acc, item) => acc + item.quantidadeVendas, 0) / secondHalf.length;
    const vendasTrend = ((secondHalfVendas - firstHalfVendas) / firstHalfVendas) * 100;

    const firstHalfTicket = firstHalf.reduce((acc, item) => acc + item.ticketMedio, 0) / firstHalf.length;
    const secondHalfTicket = secondHalf.reduce((acc, item) => acc + item.ticketMedio, 0) / secondHalf.length;
    const ticketTrend = ((secondHalfTicket - firstHalfTicket) / firstHalfTicket) * 100;

    const firstHalfVisitas = firstHalf.reduce((acc, item) => acc + item.numeroVisitas, 0) / firstHalf.length;
    const secondHalfVisitas = secondHalf.reduce((acc, item) => acc + item.numeroVisitas, 0) / secondHalf.length;
    const visitasTrend = ((secondHalfVisitas - firstHalfVisitas) / firstHalfVisitas) * 100;

    const firstHalfConversao = firstHalf.reduce((acc, item) => acc + item.taxaConversao, 0) / firstHalf.length;
    const secondHalfConversao = secondHalf.reduce((acc, item) => acc + item.taxaConversao, 0) / secondHalf.length;
    const conversaoTrend = ((secondHalfConversao - firstHalfConversao) / firstHalfConversao) * 100;

    return {
      faturamentoTrend,
      vendasTrend,
      ticketTrend,
      visitasTrend,
      conversaoTrend,
    };
  };

  const kpis = calculateKPIs();
  const trends = calculateTrends();

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedDate(null);
    setSelectedMarketplace(null);
  };

  const handleDateClick = (date: string) => {
    if (selectedDate === date) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const handleClearSelectedDate = () => {
    setSelectedDate(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Dashboard de Vendas
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-gray-600">
                Última atualização: {lastUpdate.toLocaleString('pt-BR')}
              </p>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">
                  Conectado à planilha
                </span>
              </div>
              <div className="px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
                <span className="text-xs font-medium text-blue-700">
                  {filteredData.length} de {allData.length} registros
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onReset={handleReset}
          />
          <MarketplaceFilter
            marketplaces={uniqueMarketplaces}
            selectedMarketplace={selectedMarketplace}
            onMarketplaceChange={setSelectedMarketplace}
          />
        </div>

        {(selectedDate || selectedMarketplace) && (
          <div className="flex flex-wrap gap-3">
            {selectedDate && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center justify-between flex-1 min-w-[300px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-900">
                    Filtro de dia ativo: {selectedDate}
                  </span>
                </div>
                <button
                  onClick={handleClearSelectedDate}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium border border-blue-200"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              </div>
            )}
            {selectedMarketplace && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200 flex items-center justify-between flex-1 min-w-[300px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium text-green-900">
                    Marketplace ativo: {selectedMarketplace}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedMarketplace(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium border border-green-200"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <KPICard
            title="Faturamento Total"
            value={`R$ ${kpis.totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={DollarSign}
            trend={trends.faturamentoTrend}
            trendLabel="vs período anterior"
            iconColor="text-green-600"
            iconBgColor="bg-green-50"
          />
          <KPICard
            title="Total de Vendas"
            value={kpis.totalVendas.toString()}
            icon={ShoppingBag}
            trend={trends.vendasTrend}
            trendLabel="vs período anterior"
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
          />
          <KPICard
            title="Ticket Médio"
            value={`R$ ${kpis.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={TrendingUp}
            trend={trends.ticketTrend}
            trendLabel="vs período anterior"
            iconColor="text-orange-600"
            iconBgColor="bg-orange-50"
          />
          <KPICard
            title="Total de Visitas"
            value={kpis.totalVisitas.toLocaleString('pt-BR')}
            icon={Users}
            trend={trends.visitasTrend}
            trendLabel="vs período anterior"
            iconColor="text-purple-600"
            iconBgColor="bg-purple-50"
          />
          <KPICard
            title="Taxa de Conversão"
            value={`${kpis.taxaConversaoMedia.toFixed(2)}%`}
            icon={Percent}
            trend={trends.conversaoTrend}
            trendLabel="vs período anterior"
            iconColor="text-pink-600"
            iconBgColor="bg-pink-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesChart
            data={selectedDate ? filteredData : filteredData.slice(-10)}
            title={selectedDate ? "Dados do Dia Selecionado" : "Evolução de Faturamento e Vendas (Últimos 10 Dias)"}
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
          />
          <ConversionChart
            data={selectedDate ? filteredData : filteredData.slice(-6)}
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
          />
        </div>

        {filteredData.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
            <p className="text-gray-500">Nenhum dado encontrado para o período selecionado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
