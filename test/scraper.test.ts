import { describe, it, expect } from "vitest";
import { TEAMS, getTeamRoster, getPlayerDetail } from "../src/scraper.js";

describe("TEAMS", () => {
  it("should have 12 teams", () => {
    expect(TEAMS).toHaveLength(12);
  });

  it("should have 6 teams per league", () => {
    const central = TEAMS.filter((t) => t.league === "セントラル");
    const pacific = TEAMS.filter((t) => t.league === "パシフィック");
    expect(central).toHaveLength(6);
    expect(pacific).toHaveLength(6);
  });
});

describe("getTeamRoster", () => {
  it("should fetch Giants roster", async () => {
    const players = await getTeamRoster("g");
    expect(players.length).toBeGreaterThan(30);

    // Every player should have required fields
    for (const p of players) {
      expect(p.number).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.position).toBeTruthy();
      expect(p.team).toBe("読売ジャイアンツ");
      expect(p.teamCode).toBe("g");
      expect(p.playerId).toBeTruthy();
    }
  });

  it("should include both roster types", async () => {
    const players = await getTeamRoster("g");
    const shihaika = players.filter((p) => p.rosterType === "支配下");
    const ikusei = players.filter((p) => p.rosterType === "育成");
    expect(shihaika.length).toBeGreaterThan(0);
    expect(ikusei.length).toBeGreaterThan(0);
  });

  it("should include position categories", async () => {
    const players = await getTeamRoster("g");
    const positions = new Set(players.map((p) => p.position));
    expect(positions.has("投手")).toBe(true);
    expect(positions.has("捕手")).toBe(true);
    expect(positions.has("内野手")).toBe(true);
    expect(positions.has("外野手")).toBe(true);
  });

  it("should throw for unknown team code", async () => {
    await expect(getTeamRoster("x")).rejects.toThrow("Unknown team code");
  });
});

describe("getPlayerDetail", () => {
  it("should fetch player detail with kana name", async () => {
    // 田中将大
    const detail = await getPlayerDetail("11215114");
    expect(detail.name).toContain("田中");
    expect(detail.kana).toContain("たなか");
    expect(detail.number).toBe("11");
    expect(detail.team).toContain("ジャイアンツ");
  });
});
