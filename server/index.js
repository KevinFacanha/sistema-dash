import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const app = express();
const PORT = 8787;

app.use(cors());
app.use(express.json());

function parseMoneyValue(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value);
  return parseFloat(
    str
      .replace('R$', '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()
  ) || 0;
}

function parsePercentValue(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value);
  return parseFloat(str.replace('%', '').replace(',', '.').trim()) || 0;
}

function parseIntValue(value) {
  if (typeof value === 'number') return Math.floor(value);
  if (!value) return 0;
  return parseInt(String(value).replace(/\./g, '').replace(',', '')) || 0;
}

function parseDateToISO(value) {
  if (!value) return null;
  const str = String(value).trim();

  let dateObj = null;

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

  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function fetchGoogleSheets() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const sheetsId = process.env.GOOGLE_SHEETS_ID;
  const sheetsTabs = process.env.SHEETS_TABS?.split(',') || ['Sheet1'];

  if (!clientEmail || !privateKey || !sheetsId) {
    throw new Error('Missing required environment variables');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const allRows = [];

  for (const tab of sheetsTabs) {
    const range = `${tab.trim()}!A:Z`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetsId,
      range,
    });

    const rawData = response.data.values || [];
    if (rawData.length < 2) continue;

    const headerRow = rawData[0];
    const dataRows = rawData.slice(1);

    const normalizeHeader = (header) => {
      return String(header || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    };

    const findHeaderIndex = (headers, target) => {
      const normalized = normalizeHeader(target);
      return headers.findIndex((h) => normalizeHeader(h) === normalized);
    };

    const indices = {
      data: findHeaderIndex(headerRow, 'Data'),
      faturamento: findHeaderIndex(headerRow, 'Faturamento Dia (R$)'),
      vendas: findHeaderIndex(headerRow, 'Quantidade de Vendas'),
      ticketMedio: findHeaderIndex(headerRow, 'Ticket Medio (R$)'),
      visitas: findHeaderIndex(headerRow, 'N de Visitas'),
      taxaConversao: findHeaderIndex(headerRow, 'Taxa de Conversao (%)'),
    };

    for (const row of dataRows) {
      const dateISO = parseDateToISO(row[indices.data]);
      if (!dateISO) continue;

      allRows.push({
        conta: tab.trim(),
        dateISO,
        faturamento: parseMoneyValue(row[indices.faturamento]),
        vendas: parseIntValue(row[indices.vendas]),
        ticketMedio: parseMoneyValue(row[indices.ticketMedio]),
        visitas: parseIntValue(row[indices.visitas]),
        taxaConversao: parsePercentValue(row[indices.taxaConversao]),
      });
    }
  }

  return allRows;
}

app.get('/api/sync', async (req, res) => {
  try {
    const rows = await fetchGoogleSheets();
    res.json({ ok: true, rows });
  } catch (error) {
    console.error('Error fetching sheets:', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
