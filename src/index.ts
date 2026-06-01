interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * INE Spain (Instituto Nacional de Estadística) Tempus3 JSON API MCP.
 *
 * Keyless. Spain's official statistical time-series API — CPI (IPC), labor
 * force survey (EPA), housing, industry, etc. Complements datos-gob-es (which
 * covers Spain's open-data PORTAL); this is INE's structured statistics service.
 *
 * Base: https://servicios.ine.es/wstempus/js/{LANG}/{FUNCTION}/{params}
 *   LANG is "EN" or "ES". Some functions 301-redirect to a /jsCache/ path;
 *   global fetch follows the redirect transparently.
 *
 * Data model: an OPERATION (e.g. IPC=CPI, EPA=labor) contains TABLES; a TABLE
 * contains SERIES; a SERIES is one time line of {Fecha (epoch ms), Anyo, Valor}
 * points. operationId accepts the numeric Id (e.g. 25) OR the code (e.g. "IPC").
 * `nult=N` returns the last N periods; `date=YYYYMMDD:` returns from that date on.
 * Field names are Spanish even in EN mode: Nombre, Valor, Fecha, Anyo, COD, Codigo.
 */


const BASE = 'https://servicios.ine.es/wstempus/js';
const UA = 'pipeworx-mcp-ine-es/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'list_operations',
    description:
      'List all available INE statistical operations (Spain). Each has a numeric Id, a Codigo (e.g. "IPC"=CPI, "EPA"=labor force survey), and a Nombre. Use the Codigo or Id with tables_for_operation.',
    inputSchema: {
      type: 'object',
      properties: {
        lang: { type: 'string', enum: ['EN', 'ES'], description: 'Response language. Default EN.' },
      },
    },
  },
  {
    name: 'tables_for_operation',
    description:
      'List the statistical tables belonging to one INE operation. operationId may be the numeric Id (e.g. 25) or the operation code (e.g. "IPC", "EPA"). Each table has an Id used by series_in_table / table_data.',
    inputSchema: {
      type: 'object',
      properties: {
        operationId: { type: 'string', description: 'Numeric Id or code, e.g. "IPC", "EPA", "25".' },
        lang: { type: 'string', enum: ['EN', 'ES'], description: 'Response language. Default EN.' },
      },
      required: ['operationId'],
    },
  },
  {
    name: 'series_in_table',
    description:
      'List the data series contained in an INE table. Each series has a COD (series code, e.g. "IPC251852") and a Nombre describing the breakdown. Pass a COD to series_data.',
    inputSchema: {
      type: 'object',
      properties: {
        tableId: { type: 'string', description: 'Numeric table Id, e.g. "50902".' },
        lang: { type: 'string', enum: ['EN', 'ES'], description: 'Response language. Default EN.' },
      },
      required: ['tableId'],
    },
  },
  {
    name: 'table_data',
    description:
      'Fetch data points for ALL series in an INE table at once. Use nult=N for the last N periods, or date="YYYYMMDD:" for everything from that date on (trailing colon = open-ended range). Each series object carries a Data[] array of {Fecha (epoch ms), Anyo, Valor}.',
    inputSchema: {
      type: 'object',
      properties: {
        tableId: { type: 'string', description: 'Numeric table Id, e.g. "50902".' },
        nult: { type: 'number', description: 'Return the last N periods (e.g. 1, 12).' },
        date: { type: 'string', description: 'Date filter, e.g. "20250101:" for from Jan 2025 onward.' },
        lang: { type: 'string', enum: ['EN', 'ES'], description: 'Response language. Default EN.' },
      },
      required: ['tableId'],
    },
  },
  {
    name: 'series_data',
    description:
      'Fetch data for ONE INE series by its code. Use nult=N for the last N periods, or date="YYYYMMDD:" for from that date on. Returns the series with its Data[] array of {Fecha (epoch ms), Anyo, Valor} points.',
    inputSchema: {
      type: 'object',
      properties: {
        seriesCode: { type: 'string', description: 'Series code (COD), e.g. "IPC251852".' },
        nult: { type: 'number', description: 'Return the last N periods (default 12 if no date given).' },
        date: { type: 'string', description: 'Date filter, e.g. "20250101:" for from Jan 2025 onward.' },
        lang: { type: 'string', enum: ['EN', 'ES'], description: 'Response language. Default EN.' },
      },
      required: ['seriesCode'],
    },
  },
  {
    name: 'variable_values',
    description:
      'List the values of an INE classification variable (e.g. provinces, age groups, ECOICOP groups). With no variableId, lists all variables; with a variableId, lists that variable\'s allowed values (each has an Id, Codigo, Nombre). Useful for understanding the breakdowns inside tables.',
    inputSchema: {
      type: 'object',
      properties: {
        variableId: { type: 'string', description: 'Numeric variable Id, e.g. "115". Omit to list all variables.' },
        lang: { type: 'string', enum: ['EN', 'ES'], description: 'Response language. Default EN.' },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const lang = resolveLang(args.lang);
  switch (name) {
    case 'list_operations':
      return ineGet(lang, 'OPERACIONES_DISPONIBLES');
    case 'tables_for_operation':
      return ineGet(lang, `TABLAS_OPERACION/${enc(reqStr(args, 'operationId', '"IPC"'))}`);
    case 'series_in_table':
      return ineGet(lang, `SERIES_TABLA/${enc(reqStr(args, 'tableId', '"50902"'))}`);
    case 'table_data':
      return ineGet(
        lang,
        `DATOS_TABLA/${enc(reqStr(args, 'tableId', '"50902"'))}`,
        rangeQuery(args),
      );
    case 'series_data':
      return ineGet(
        lang,
        `DATOS_SERIE/${enc(reqStr(args, 'seriesCode', '"IPC251852"'))}`,
        rangeQuery(args, 12),
      );
    case 'variable_values': {
      const variableId = args.variableId;
      if (typeof variableId === 'string' && variableId.trim()) {
        return ineGet(lang, `VALORES_VARIABLE/${enc(variableId)}`);
      }
      return ineGet(lang, 'VARIABLES');
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function ineGet(lang: string, fn: string, query?: URLSearchParams): Promise<unknown> {
  const qs = query && [...query.keys()].length ? `?${query.toString()}` : '';
  const res = await fetch(`${BASE}/${lang}/${fn}${qs}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`INE Spain: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** Build the nult / date query string shared by the data endpoints. */
function rangeQuery(args: Record<string, unknown>, defaultNult?: number): URLSearchParams {
  const q = new URLSearchParams();
  const date = args.date;
  if (typeof date === 'string' && date.trim()) {
    q.set('date', date.trim());
    return q;
  }
  const nult = args.nult;
  if (typeof nult === 'number' && Number.isFinite(nult)) {
    q.set('nult', String(Math.trunc(nult)));
  } else if (defaultNult != null) {
    q.set('nult', String(defaultNult));
  }
  return q;
}

function resolveLang(v: unknown): string {
  const s = typeof v === 'string' ? v.trim().toUpperCase() : '';
  return s === 'ES' ? 'ES' : 'EN';
}

function enc(v: string): string {
  return encodeURIComponent(v.trim());
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim())
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
