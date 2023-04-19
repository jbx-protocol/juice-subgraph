"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var utils_1 = require("./utils");
var projects;
var jbV2PayEvents;
beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, utils_1.getExhaustive)("project", [
                    "id",
                    "pv",
                    "handle",
                    "volume",
                    "volumeUSD",
                    "currentBalance",
                ])];
            case 1:
                projects = _a.sent();
                console.info(projects.length, "projects");
                return [4 /*yield*/, (0, utils_1.getExhaustive)("payEvent", ["id", "feeFromV2Project"], 'projectId: 1, pv: "2"')];
            case 2:
                jbV2PayEvents = _a.sent();
                console.info(jbV2PayEvents.length, "JB pay events");
                return [2 /*return*/];
        }
    });
}); }, 30000);
describe("Projects", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        it("Project count should exceed minimum", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (utils_1.network) {
                    case "mainnet":
                        expect(projects.length).toBeGreaterThan(1000);
                        break;
                    case "goerli":
                        expect(projects.length).toBeGreaterThan(500);
                        break;
                }
                return [2 /*return*/];
            });
        }); });
        it("All v1 projects should have handles", function () { return __awaiter(void 0, void 0, void 0, function () {
            var v1Projects;
            return __generator(this, function (_a) {
                v1Projects = projects.filter(function (p) { return p.pv === "1"; });
                console.info(v1Projects.length, "v1 projects");
                switch (utils_1.network) {
                    case "mainnet":
                        expect(v1Projects.length).toBeGreaterThanOrEqual(646);
                        expect(v1Projects.every(function (p) { return p.handle; })).toBeTrue();
                        break;
                    case "goerli":
                        // No v1 on goerli
                        break;
                }
                return [2 /*return*/];
            });
        }); });
        it("Some v2 projects should have handles", function () { return __awaiter(void 0, void 0, void 0, function () {
            var v2Projects;
            return __generator(this, function (_a) {
                v2Projects = projects.filter(function (p) { return p.pv === "2"; });
                console.info(v2Projects.length, "v2 projects");
                switch (utils_1.network) {
                    case "mainnet":
                        expect(v2Projects.length).toBeGreaterThan(450);
                        expect(v2Projects.some(function (p) { return p.handle; })).toBeTrue();
                        expect(v2Projects.some(function (p) { return !p.handle; })).toBeTrue();
                        break;
                    case "goerli":
                        expect(v2Projects.length).toBeGreaterThan(400);
                        expect(v2Projects.some(function (p) { return p.handle; })).toBeTrue();
                        expect(v2Projects.some(function (p) { return !p.handle; })).toBeTrue();
                        break;
                }
                return [2 /*return*/];
            });
        }); });
        it("All projects should have valid pv", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (utils_1.network) {
                    case "mainnet":
                        expect(projects.every(function (p) { return p.pv === "1" || p.pv === "2"; })).toBeTrue();
                        break;
                    case "goerli":
                        expect(projects.every(function (p) { return p.pv === "2"; })).toBeTrue();
                        break;
                }
                return [2 /*return*/];
            });
        }); });
        it("JB should have reasonable volume and currentBalance", function () { return __awaiter(void 0, void 0, void 0, function () {
            var jb;
            return __generator(this, function (_a) {
                jb = projects.find(function (p) { return p.id === "1-1"; });
                switch (utils_1.network) {
                    case "mainnet":
                        expect(jb.volume).toBeGreaterThan(7000e18);
                        expect(jb.volume).toBeLessThan(70000e18);
                        expect(jb.currentBalance).toBeGreaterThan(1000e18);
                        expect(jb.currentBalance).toBeLessThan(10000e18);
                        break;
                    case "goerli":
                        expect(jb.volume).toBeGreaterThan(10e18);
                        expect(jb.volume).toBeLessThan(100e18);
                        break;
                }
                // Check average ETH price
                expect(jb.volumeUSD / jb.volume).toBeGreaterThan(3000);
                expect(jb.volumeUSD / jb.volume).toBeLessThan(4000);
                return [2 /*return*/];
            });
        }); });
        return [2 /*return*/];
    });
}); });
describe("Pay events", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        it("JB should have reasonable number of pay events", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (utils_1.network) {
                    case "mainnet":
                        expect(jbV2PayEvents.length).toBeGreaterThan(400);
                        expect(jbV2PayEvents.length).toBeLessThan(1000);
                        break;
                    case "goerli":
                        expect(jbV2PayEvents.length).toBeGreaterThan(100);
                        expect(jbV2PayEvents.length).toBeLessThan(1000);
                        break;
                }
                return [2 /*return*/];
            });
        }); });
        it("Pay events should have valid data", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (utils_1.network) {
                    case "mainnet":
                        expect(jbV2PayEvents.some(function (e) { return e.feeFromV2Project > 0; })).toBeTrue();
                        break;
                    case "goerli":
                        break;
                }
                return [2 /*return*/];
            });
        }); });
        return [2 /*return*/];
    });
}); });
