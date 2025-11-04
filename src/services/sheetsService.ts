import * as XLSX from 'xlsx';

export interface SalesData {
  data: string;
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

function parseDate(value: any): string {
  if (!value) return '';
  const str = String(value).trim();

  if (str.includes('/')) {
    return str;
  }

  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return str;
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
      throw new Error(`Erro ao buscar arquivo: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      console.warn('Planilha vazia ou sem dados');
      return [];
    }

    const dataRows = jsonData.slice(1);

    const salesData: SalesData[] = dataRows
      .map((row: any[]): SalesData | null => {
        if (!row[0]) return null;

        const data = parseDate(row[0]);
        const faturamentoDia = parseMoneyValue(row[1]);
        const variacaoFat = parsePercentValue(row[2]);
        const quantidadeVendas = parseIntValue(row[3]);
        const variacaoVendas = parsePercentValue(row[4]);
        const ticketMedio = parseMoneyValue(row[5]);
        const variacaoTicket = parsePercentValue(row[6]);
        const numeroVisitas = parseIntValue(row[7]);
        const variacaoVisitas = parsePercentValue(row[8]);
        const taxaConversao = parsePercentValue(row[9]);
        const variacaoConversao = parsePercentValue(row[10]);
        const marketplace = String(row[11] || '').trim();

        if (!data) return null;

        return {
          data,
          faturamentoDia,
          quantidadeVendas,
          ticketMedio,
          numeroVisitas,
          taxaConversao,
          marketplace,
          variacaoFat,
          variacaoVendas,
          variacaoTicket,
          variacaoVisitas,
          variacaoConversao,
        };
      })
      .filter((item: SalesData | null): item is SalesData => item !== null);

    console.log(`📊 Dados carregados do Google Sheets: ${salesData.length} registros`);
    return salesData;
  } catch (error) {
    console.error('❌ Erro ao buscar dados do Google Sheets:', error);
    return [];
  }
}
