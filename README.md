# mcp-ine-es

INE Spain (Instituto Nacional de Estadística) Tempus3 JSON API MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/ine-es/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Ine Es data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/list_operations \
  -H 'Content-Type: application/json' \
  -d '{"lang":"EN"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/list_operations`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
