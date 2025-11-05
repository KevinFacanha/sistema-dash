import * as XLSX from 'xlsx';

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

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sharepoint-proxy`;
const SHEET_TAB_NAME = '';

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

export async function fetchSalesData(): Promise<SalesData[]> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.status} ${response.statusText}`);
    }

    const apiData = await response.json();
    const rawData: any[] = apiData.values || [];

    if (rawData.length < 2) {
      console.warn('Planilha vazia ou sem dados');
      return [];
    }

    const headerRow = rawData[0];
    const dataRows = rawData.slice(1);

    const headerIndices = {
      data: findHeaderIndex(headerRow, EXPECTED_HEADERS[0]),
      faturamentoDia: findHeaderIndex(headerRow, EXPECTED_HEADERS[1]),
      variacaoFat: findHeaderIndex(headerRow, EXPECTED_HEADERS[2]),
      quantidadeVendas: findHeaderIndex(headerRow, EXPECTED_HEADERS[3]),
      variacaoVendas: findHeaderIndex(headerRow, EXPECTED_HEADERS[4]),
      ticketMedio: findHeaderIndex(headerRow, EXPECTED_HEADERS[5]),
      variacaoTicket: findHeaderIndex(headerRow, EXPECTED_HEADERS[6]),
      numeroVisitas: findHeaderIndex(headerRow, EXPECTED_HEADERS[7]),
      variacaoVisitas: findHeaderIndex(headerRow, EXPECTED_HEADERS[8]),
      taxaConversao: findHeaderIndex(headerRow, EXPECTED_HEADERS[9]),
      variacaoConversao: findHeaderIndex(headerRow, EXPECTED_HEADERS[10]),
      marketplace: findHeaderIndex(headerRow, EXPECTED_HEADERS[11]),
    };

    if (import.meta.env.DEV) {
      console.log('Headers encontrados:', {
        data: headerIndices.data,
        faturamentoDia: headerIndices.faturamentoDia,
        quantidadeVendas: headerIndices.quantidadeVendas,
      });
    }

    const isDev = import.meta.env.DEV;

    const salesData: SalesData[] = dataRows
      .map((row: any[]): SalesData | null => {
        const dateResult = parseDate(row[headerIndices.data]);
        if (!dateResult) return null;

        const parsedData: SalesData = {
          data: dateResult.formatted,
          __key: dateResult.iso,
          faturamentoDia: parseMoneyValue(row[headerIndices.faturamentoDia]),
          quantidadeVendas: parseIntValue(row[headerIndices.quantidadeVendas]),
          ticketMedio: parseMoneyValue(row[headerIndices.ticketMedio]),
          numeroVisitas: parseIntValue(row[headerIndices.numeroVisitas]),
          taxaConversao: parsePercentValue(row[headerIndices.taxaConversao]),
          marketplace: String(row[headerIndices.marketplace] || '').trim(),
          variacaoFat: parsePercentValue(row[headerIndices.variacaoFat]),
          variacaoVendas: parsePercentValue(row[headerIndices.variacaoVendas]),
          variacaoTicket: parsePercentValue(row[headerIndices.variacaoTicket]),
          variacaoVisitas: parsePercentValue(row[headerIndices.variacaoVisitas]),
          variacaoConversao: parsePercentValue(row[headerIndices.variacaoConversao]),
        };

        return parsedData;
      })
      .filter((item: SalesData | null): item is SalesData => item !== null);

    if (isDev) {
      console.log(`📊 Dados carregados: ${salesData.length} registros`);
      console.log('✅ Primeiras 2 linhas normalizadas:');
      salesData.slice(0, 2).forEach((row, idx) => {
        console.log(`Linha ${idx + 1}:`, {
          data: row.data,
          __key: row.__key,
          faturamentoDia: row.faturamentoDia,
          quantidadeVendas: row.quantidadeVendas,
          marketplace: row.marketplace,
        });
      });
    }

    return salesData;
  } catch (error) {
    console.error('❌ Erro ao buscar dados do Google Sheets:', error);
    return [];
  }
}
