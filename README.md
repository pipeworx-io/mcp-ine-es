# mcp-ine-es

INE Spain (Instituto Nacional de Estadística) Tempus3 JSON API MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `list_operations` | List all available INE statistical operations (Spain). Each has a numeric Id, a Codigo (e.g. "IPC"=CPI, "EPA"=labor force survey), and a Nombre. Use the Codigo or Id with tables_for_operation. |
| `tables_for_operation` | List the statistical tables belonging to one INE operation. operationId may be the numeric Id (e.g. 25) or the operation code (e.g. "IPC", "EPA"). Each table has an Id used by series_in_table / table_data. |
| `series_in_table` | List the data series contained in an INE table. Each series has a COD (series code, e.g. "IPC251852") and a Nombre describing the breakdown. Pass a COD to series_data. |
| `table_data` | Fetch data points for ALL series in an INE table at once. Use nult=N for the last N periods, or date="YYYYMMDD:" for everything from that date on (trailing colon = open-ended range). Each series object carries a Data[] array of {Fecha (epoch ms), Anyo, Valor}. |
| `series_data` | Fetch data for ONE INE series by its code. Use nult=N for the last N periods, or date="YYYYMMDD:" for from that date on. Returns the series with its Data[] array of {Fecha (epoch ms), Anyo, Valor} points. |
| `variable_values` | List the values of an INE classification variable (e.g. provinces, age groups, ECOICOP groups). With no variableId, lists all variables; with a variableId, lists that variable's allowed values (each has an Id, Codigo, Nombre). Useful for understanding the breakdowns inside tables. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "ine-es": {
      "url": "https://gateway.pipeworx.io/ine-es/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Ine Es data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
