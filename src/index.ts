#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  TEAMS,
  getTeamRoster,
  getPlayerDetail,
  searchPlayers,
} from "./scraper.js";

const server = new McpServer({
  name: "npb-mcp",
  version: "1.0.0",
});

server.tool("list_teams", "NPB全12球団の一覧を取得します", {}, async () => {
  const central = TEAMS.filter((t) => t.league === "セントラル");
  const pacific = TEAMS.filter((t) => t.league === "パシフィック");

  const lines = [
    "【セントラル・リーグ】",
    ...central.map((t) => `  ${t.name} (code: ${t.code})`),
    "",
    "【パシフィック・リーグ】",
    ...pacific.map((t) => `  ${t.name} (code: ${t.code})`),
  ];

  return { content: [{ type: "text", text: lines.join("\n") }] };
});

server.tool(
  "get_team_roster",
  "指定した球団の選手一覧を取得します（所属、選手名、背番号、ポジション等）",
  {
    team_code: z
      .string()
      .describe(
        "球団コード (g, t, db, c, s, d, h, f, m, e, b, l)"
      ),
  },
  async ({ team_code }) => {
    try {
      const players = await getTeamRoster(team_code);
      const team = TEAMS.find((t) => t.code === team_code);

      const lines = [`【${team?.name}】選手一覧 (${players.length}名)`, ""];
      let currentPos = "";
      for (const p of players) {
        if (p.position !== currentPos) {
          currentPos = p.position;
          lines.push(`■ ${currentPos}`);
        }
        const rosterTag = p.rosterType === "育成" ? " [育成]" : "";
        lines.push(`  #${p.number} ${p.name}${rosterTag}`);
      }

      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `エラー: ${msg}` }], isError: true };
    }
  }
);

server.tool(
  "get_player_detail",
  "選手の詳細情報（フルネーム、ふりがな、所属球団、背番号）を取得します",
  {
    player_id: z.string().describe("選手ID（例: 11215114）"),
  },
  async ({ player_id }) => {
    try {
      const detail = await getPlayerDetail(player_id);
      const lines = [
        `選手名: ${detail.name}`,
        `ふりがな: ${detail.kana}`,
        `所属: ${detail.team}`,
        `背番号: ${detail.number}`,
      ];
      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `エラー: ${msg}` }], isError: true };
    }
  }
);

server.tool(
  "search_players",
  "選手名で検索します（全球団を横断検索）",
  {
    query: z.string().describe("検索する選手名（部分一致）"),
  },
  async ({ query }) => {
    try {
      const results = await searchPlayers(query);
      if (results.length === 0) {
        return {
          content: [{ type: "text", text: `「${query}」に該当する選手は見つかりませんでした` }],
        };
      }

      const lines = [`「${query}」の検索結果 (${results.length}件)`, ""];
      for (const p of results) {
        lines.push(
          `#${p.number} ${p.name} - ${p.team} (${p.position}) [ID: ${p.playerId}]`
        );
      }
      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `エラー: ${msg}` }], isError: true };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
