import * as XLSX from 'xlsx';

export interface SalesData {
  data: string;
  faturamentoDia: number;
  quantidadeVendas: number;
  ticketMedio: number;
  numeroVisitas: number;
  taxaConversao: number;
  marketplace: string;
}

const SHAREPOINT_URL = 'https://grupoaleimports.sharepoint.com/sites/Comercial/_layouts/15/download.aspx?SourceUrl=/sites/Comercial/Documentos%20Compartilhados/Comercial/Acompanhamento%20BI/CONTA%201%20-%20Analise%20BI%20-%20Curva%20ABC%20cpx.xlsx';

function parseMoneyValue(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value);
  return parseFloat(str.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
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

export async function fetchSalesData(): Promise<SalesData[]> {
  try {
    const response = await fetch(SHAREPOINT_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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

        const data = String(row[0] || '');
        const faturamentoDia = parseMoneyValue(row[1]);
        const quantidadeVendas = parseIntValue(row[2]);
        const ticketMedio = parseMoneyValue(row[3]);
        const numeroVisitas = parseIntValue(row[4]);
        const taxaConversao = parsePercentValue(row[5]);
        const marketplace = String(row[6] || '').trim();

        if (!data) return null;

        return {
          data,
          faturamentoDia,
          quantidadeVendas,
          ticketMedio,
          numeroVisitas,
          taxaConversao,
          marketplace,
        };
      })
      .filter((item: SalesData | null): item is SalesData => item !== null);

    console.log(`📊 Dados carregados do SharePoint: ${salesData.length} registros`);
    return salesData;
  } catch (error) {
    console.error('❌ Erro ao buscar dados do SharePoint:', error);
    return [];
  }
}
