# npb-mcp

NPB（日本プロ野球）選手名鑑情報を提供する MCP サーバーです。
[npb.jp](https://npb.jp/) から選手情報をスクレイピングして取得します。

## 提供ツール

| ツール名 | 説明 |
|----------|------|
| `list_teams` | NPB全12球団の一覧を取得 |
| `get_team_roster` | 指定球団の選手一覧（背番号・氏名・ポジション等）を取得 |
| `get_player_detail` | 選手の詳細情報（フルネーム・ふりがな・所属・背番号）を取得 |
| `search_players` | 選手名で全球団横断検索 |

## セットアップ

```bash
npm install
npm run build
```

## Claude Code で使う

`~/.claude/settings.json` に追加:

```json
{
  "mcpServers": {
    "npb": {
      "command": "node",
      "args": ["/path/to/npb-mcp/dist/index.js"]
    }
  }
}
```

## テスト

```bash
npm test
```
