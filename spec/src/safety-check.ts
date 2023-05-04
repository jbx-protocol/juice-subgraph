import { get, getExhaustive, network } from "./utils";

let protocolLog: any;
let projects: any[];
let jbV1PayEvents: any[];
let jbV2PayEvents: any[];

beforeAll(async () => {
  projects = await getExhaustive("project", [
    "id",
    "pv",
    "handle",
    "volume",
    "volumeUSD",
    "currentBalance",
  ]);
  console.info(projects.length, "projects");

  jbV2PayEvents = await getExhaustive(
    "payEvent",
    ["id", "feeFromV2Project"],
    'projectId: 1, pv: "2"'
  );

  jbV1PayEvents = await getExhaustive(
    "payEvent",
    ["id", "feeFromV2Project"],
    'projectId: 1, pv: "1"'
  );

  protocolLog = (await get("protocolLog", ["paymentsCount"]))[0];

  console.info(jbV2PayEvents.length, "JB pay events");
}, 30000);

describe("Projects", async () => {
  it("Project count should exceed minimum", async () => {
    switch (network) {
      case "mainnet":
        expect(projects.length).toBeGreaterThan(1000);
        break;
      case "goerli":
        expect(projects.length).toBeGreaterThan(500);
        break;
    }
  });

  it("All v1 projects should have handles", async () => {
    const v1Projects = projects.filter((p) => p.pv === "1");
    console.info(v1Projects.length, "v1 projects");

    switch (network) {
      case "mainnet":
        expect(v1Projects.length).toBeGreaterThanOrEqual(646);
        expect(v1Projects.every((p) => p.handle)).toBeTrue();
        break;
      case "goerli":
        // No v1 on goerli
        break;
    }
  });

  it("Some v2 projects should have handles", async () => {
    const v2Projects = projects.filter((p) => p.pv === "2");
    console.info(v2Projects.length, "v2 projects");

    switch (network) {
      case "mainnet":
        expect(v2Projects.length).toBeGreaterThan(450);
        expect(v2Projects.some((p) => p.handle)).toBeTrue();
        expect(v2Projects.some((p) => !p.handle)).toBeTrue();
        break;
      case "goerli":
        expect(v2Projects.length).toBeGreaterThan(400);
        expect(v2Projects.some((p) => p.handle)).toBeTrue();
        expect(v2Projects.some((p) => !p.handle)).toBeTrue();
        break;
    }
  });

  it("All projects should have valid pv", async () => {
    switch (network) {
      case "mainnet":
        expect(projects.every((p) => p.pv === "1" || p.pv === "2")).toBeTrue();
        break;
      case "goerli":
        expect(projects.every((p) => p.pv === "2")).toBeTrue();
        break;
    }
  });

  it("All projects should have non-zero deployer", async () => {
    expect(
      projects.every(
        (p) => p.deployer !== "0x0000000000000000000000000000000000000000"
      )
    ).toBeTrue();
  });

  it("JB should have reasonable volume and currentBalance", async () => {
    const jb = projects.find((p) => p.id === "1-1");

    switch (network) {
      case "mainnet":
        expect(jb.volume).toBeGreaterThan(7000e18);
        expect(jb.volume).toBeLessThan(70000e18);
        expect(jb.currentBalance).toBeGreaterThan(500e18);
        expect(jb.currentBalance).toBeLessThan(1000e18);
        break;
      case "goerli":
        expect(jb.volume).toBeGreaterThan(10e18);
        expect(jb.volume).toBeLessThan(100e18);
        break;
    }

    // Check average ETH price
    expect(jb.volumeUSD / jb.volume).toBeGreaterThan(3000);
    expect(jb.volumeUSD / jb.volume).toBeLessThan(4000);
  });
});

describe("Pay events", async () => {
  it("JB should have reasonable number of pay events", async () => {
    switch (network) {
      case "mainnet":
        expect(jbV2PayEvents.length).toBeGreaterThan(400);
        expect(jbV2PayEvents.length).toBeLessThan(1000);
        break;
      case "goerli":
        expect(jbV2PayEvents.length).toBeGreaterThan(100);
        expect(jbV2PayEvents.length).toBeLessThan(1000);
        break;
    }
  });

  it("Some pay events should be fees", async () => {
    expect(jbV1PayEvents.some((e) => e.feeFromV2Project > 0)).toBeTrue();
    expect(jbV1PayEvents.some((e) => !e.feeFromV2Project)).toBeTrue();
    expect(jbV2PayEvents.some((e) => e.feeFromV2Project > 0)).toBeTrue();
    expect(jbV2PayEvents.some((e) => !e.feeFromV2Project)).toBeTrue();
  });

  it("Some pay events should be distributions", async () => {
    expect(jbV1PayEvents.some((e) => e.isDistribution)).toBeTrue();
    expect(jbV1PayEvents.some((e) => !e.isDistribution)).toBeTrue();
    expect(jbV2PayEvents.some((e) => e.isDistribution)).toBeTrue();
    expect(jbV2PayEvents.some((e) => !e.isDistribution)).toBeTrue();
  });
});

describe("Protocol Logs", async () => {
  it("Should have reasonable paymentsCount", async () => {
    switch (network) {
      case "mainnet":
        expect(protocolLog.paymentsCount).toBeGreaterThan(10000);
        expect(protocolLog.paymentsCount).toBeLessThan(20000);
        break;
      case "goerli":
        expect(protocolLog.paymentsCount).toBeGreaterThan(10000);
        expect(protocolLog.paymentsCount).toBeLessThan(20000);
        break;
    }
  });
});
