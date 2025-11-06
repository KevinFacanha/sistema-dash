export interface SalesData {
  data: string;
  __key?: string;
  faturamentoDia: number;
  quantidadeVendas: number;
  ticketMedio: number;
  numeroVisitas: number;
  taxaConversao: number;
  marketplace: string;
  variacaoFat?: number;
  variacaoVendas?: number;
  variacaoTicket?: number;
  variacaoVisitas?: number;
  variacaoConversao?: number;
}

const GET_SHEETS_DATA_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-sheets-data`;
const SYNC_SHEETS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sheets-sync`;

const EXPECTED_HEADERS = [
  'Data',
  'Faturamento Dia (R$)',
  'VARIAÇÃO FAT',
  'Quantidade de Vendas',
  'VARIAÇÃO VENDAS',
  'Ticket Médio (R$)',
  'VARIAÇÃO TICKET',
  'Nº de Visitas',
  'VARIAÇÃO VISITAS',
  'Taxa de Conversão (%)',
  'VARIAÇÃO TX DE CONVERSÃO',
  'Marketplace',
];

function normalizeHeaderName(header: string): string {
  return String(header || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findHeaderIndex(headers: string[], targetHeader: string): number {
  const normalized = normalizeHeaderName(targetHeader);
  return headers.findIndex(h => normalizeHeaderName(h) === normalized);
}

function parseMoneyValue(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value);
  return parseFloat(str.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim()) || 0;
}

function parsePercentValue(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value);
  return parseFloat(str.replace('%', '').replace(',', '.').trim()) || 0;
}

function parseIntValue(value: any): number {
  if (typeof value === 'number') return Math.floor(value);
  if (!value) return 0;
  return parseInt(String(value).replace(/\./g, '').replace(',', '')) || 0;
}

function parseDate(value: any): { formatted: string; iso: string } | null {
  if (!value) return null;
  const str = String(value).trim();

  let dateObj: Date | null = null;

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        dateObj = new Date(year, month - 1, day);
      }
    }
  } else {
    dateObj = new Date(value);
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return null;
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const formatted = `${day}/${month}/${year}`;
  const iso = `${year}-${month}-${day}`;

  return { formatted, iso };
}

export async function syncSheetsData(): Promise<void> {
  try {
    const response = await fetch(SYNC_SHEETS_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao sincronizar: ${response.status} ${response.statusText}`);
    }

    if (import.meta.env.DEV) {
      console.log('✅ Dados sincronizados da planilha Google Sheets');
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar Google Sheets:', error);
  }
}

export async function fetchSalesData(): Promise<SalesData[]> {
  try {
    const response = await fetch(GET_SHEETS_DATA_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.status} ${response.statusText}`);
    }

    const apiData = await response.json();
    const rawData: any[] = apiData.values || [];

    if (rawData.length === 0) {
      console.warn('Cache vazio ou sem dados');
      return [];
    }

    const salesData: SalesData[] = rawData
      .map((row: any): SalesData | null => {
        const dateResult = parseDate(row.data);
        if (!dateResult) return null;

        const parsedData: SalesData = {
          data: row.data,
          __key: dateResult.iso,
          faturamentoDia: row.faturamentoDia || 0,
          quantidadeVendas: row.quantidadeVendas || 0,
          ticketMedio: row.ticketMedio || 0,
          numeroVisitas: row.numeroVisitas || 0,
          taxaConversao: row.taxaConversao || 0,
          marketplace: row.marketplace || '',
          variacaoFat: row.variacaoFat || 0,
          variacaoVendas: row.variacaoVendas || 0,
          variacaoTicket: row.variacaoTicket || 0,
          variacaoVisitas: row.variacaoVisitas || 0,
          variacaoConversao: row.variacaoConversao || 0,
        };

        return parsedData;
      })
      .filter((item: SalesData | null): item is SalesData => item !== null);

    if (import.meta.env.DEV) {
      console.log(`📊 Dados carregados do cache: ${salesData.length} registros`);
      console.log('✅ Primeiras 2 linhas:');
      salesData.slice(0, 2).forEach((row, idx) => {
        console.log(`Linha ${idx + 1}:`, {
          data: row.data,
          faturamentoDia: row.faturamentoDia,
          quantidadeVendas: row.quantidadeVendas,
          marketplace: row.marketplace,
        });
      });
    }

    return salesData;
  } catch (error) {
    console.error('❌ Erro ao buscar dados do cache:', error);
    return [];
  }
}
