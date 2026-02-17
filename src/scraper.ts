import * as cheerio from "cheerio";

const BASE_URL = "https://npb.jp";

export interface Team {
  code: string;
  name: string;
  league: "セントラル" | "パシフィック";
}

export interface PlayerSummary {
  number: string;
  name: string;
  position: string;
  team: string;
  teamCode: string;
  playerId: string;
  birthday: string;
  height: string;
  weight: string;
  throwHand: string;
  batHand: string;
  note: string;
  rosterType: "支配下" | "育成";
}

export interface PlayerDetail {
  playerId: string;
  number: string;
  name: string;
  kana: string;
  team: string;
}

export const TEAMS: Team[] = [
  { code: "g", name: "読売ジャイアンツ", league: "セントラル" },
  { code: "t", name: "阪神タイガース", league: "セントラル" },
  { code: "db", name: "横浜DeNAベイスターズ", league: "セントラル" },
  { code: "c", name: "広島東洋カープ", league: "セントラル" },
  { code: "s", name: "東京ヤクルトスワローズ", league: "セントラル" },
  { code: "d", name: "中日ドラゴンズ", league: "セントラル" },
  { code: "h", name: "福岡ソフトバンクホークス", league: "パシフィック" },
  { code: "f", name: "北海道日本ハムファイターズ", league: "パシフィック" },
  { code: "m", name: "千葉ロッテマリーンズ", league: "パシフィック" },
  { code: "e", name: "東北楽天ゴールデンイーグルス", league: "パシフィック" },
  { code: "b", name: "オリックス・バファローズ", league: "パシフィック" },
  { code: "l", name: "埼玉西武ライオンズ", league: "パシフィック" },
];

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return new TextDecoder("utf-8").decode(buffer);
}

export async function getTeamRoster(teamCode: string): Promise<PlayerSummary[]> {
  const team = TEAMS.find((t) => t.code === teamCode);
  if (!team) throw new Error(`Unknown team code: ${teamCode}`);

  const html = await fetchHtml(`${BASE_URL}/bis/teams/rst_${teamCode}.html`);
  const $ = cheerio.load(html);
  const players: PlayerSummary[] = [];

  $("table.rosterlisttbl").each((tableIdx, table) => {
    const rosterType = tableIdx === 0 ? "支配下" : "育成";
    let currentPosition = "";

    $(table)
      .find("tr")
      .each((_, row) => {
        const $row = $(row);

        if ($row.hasClass("rosterMainHead")) {
          const posText = $row.find("th.rosterPos").text().trim();
          if (posText && posText !== "監督") {
            currentPosition = posText;
          }
          return;
        }

        if ($row.hasClass("rosterPlayer") || $row.hasClass("rosterRetire")) {
          const cells = $row.find("td");
          if (cells.length < 7) return;

          const number = $(cells[0]).text().trim();
          const nameCell = $(cells[1]);
          const nameText = nameCell.text().trim().replace(/\s+/g, " ");
          const link = nameCell.find("a").attr("href") || "";
          const playerIdMatch = link.match(/\/bis\/players\/(\w+)\.html/);
          const playerId = playerIdMatch ? playerIdMatch[1] : "";

          // Skip manager row (no link)
          if (!playerId && !link) return;

          players.push({
            number,
            name: nameText,
            position: currentPosition,
            team: team.name,
            teamCode,
            playerId,
            birthday: $(cells[2]).text().trim(),
            height: $(cells[3]).text().trim(),
            weight: $(cells[4]).text().trim(),
            throwHand: $(cells[5]).text().trim(),
            batHand: $(cells[6]).text().trim(),
            note: cells.length > 7 ? $(cells[7]).text().trim() : "",
            rosterType,
          });
        }
      });
  });

  return players;
}

export async function getPlayerDetail(playerId: string): Promise<PlayerDetail> {
  const html = await fetchHtml(`${BASE_URL}/bis/players/${playerId}.html`);
  const $ = cheerio.load(html);

  const number = $("#pc_v_no").text().trim();
  const name = $("#pc_v_name").text().trim().replace(/\s+/g, " ");
  const kana = $("#pc_v_kana").text().trim();
  const team = $("#pc_v_team").text().trim();

  return { playerId, number, name, kana, team };
}

export async function searchPlayers(query: string): Promise<PlayerSummary[]> {
  const results: PlayerSummary[] = [];
  for (const team of TEAMS) {
    const roster = await getTeamRoster(team.code);
    for (const player of roster) {
      if (player.name.includes(query)) {
        results.push(player);
      }
    }
  }
  return results;
}
