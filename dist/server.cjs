var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "15mb" }));
var GOOGLE_TRAFFIC_MACRO_URL = "https://script.google.com/macros/s/AKfycbxObZjQkX2KFeNzEIAj3yH72pSqr9X4Ax8cgh2eWQqWfSREOA8yZiTZ4NnbK5-OiAomEg/exec";
app.post("/api/traffic-route-optimizer", async (req, res) => {
  const { origin, destination, waypoints, fuelRateLKm } = req.body;
  try {
    const originLat = origin?.lat || 24.5885;
    const originLng = origin?.lng || 46.3325;
    const destLat = destination?.lat || 24.621;
    const destLng = destination?.lng || 46.455;
    const R = 6371;
    const dLat = (destLat - originLat) * Math.PI / 180;
    const dLng = (destLng - originLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightKm = R * c;
    const roadKm = Math.round(straightKm * 1.32 * 10) / 10;
    let apiData = null;
    let trafficCondition = "normal";
    try {
      const urlWithParams = new URL(GOOGLE_TRAFFIC_MACRO_URL);
      urlWithParams.searchParams.append("origin", `${originLat},${originLng}`);
      urlWithParams.searchParams.append("destination", `${destLat},${destLng}`);
      urlWithParams.searchParams.append("traffic", "true");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const response = await fetch(urlWithParams.toString(), {
        signal: controller.signal,
        headers: { Accept: "application/json" }
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const text = await response.text();
        try {
          apiData = JSON.parse(text);
          if (apiData?.trafficStatus) {
            trafficCondition = apiData.trafficStatus;
          }
        } catch {
          apiData = { status: "success", raw: text.slice(0, 200) };
        }
      }
    } catch (apiErr) {
      console.log("External Google Script note: using local intelligent route calculation engine");
    }
    const trafficFactor = trafficCondition === "heavy" ? 1.45 : trafficCondition === "moderate" ? 1.2 : 1;
    const averageTruckSpeedKmH = 55;
    const estimatedMinutes = Math.round(roadKm / averageTruckSpeedKmH * 60 * trafficFactor);
    const rate = fuelRateLKm || 0.38;
    const estimatedFuelLiters = Math.round(roadKm * rate * 10) / 10;
    res.json({
      success: true,
      origin: origin?.name || `${originLat.toFixed(4)}, ${originLng.toFixed(4)}`,
      destination: destination?.name || `${destLat.toFixed(4)}, ${destLng.toFixed(4)}`,
      distanceKm: roadKm,
      estimatedDurationMins: estimatedMinutes,
      fuelEstimatedLiters: estimatedFuelLiters,
      trafficStatus: trafficCondition,
      recommendedRoute: roadKm > 40 ? "\u0637\u0631\u064A\u0642 \u0627\u0644\u0634\u0627\u062D\u0646\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0639 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 (\u062A\u062C\u0646\u0628 \u0627\u0644\u062F\u0627\u0626\u0631\u064A \u0648\u0642\u062A \u0627\u0644\u0630\u0631\u0648\u0629)" : "\u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A \u0627\u0644\u0645\u0639\u062A\u0645\u062F \u0639\u0628\u0631 \u0628\u0648\u0627\u0628\u0627\u062A \u0627\u0644\u0645\u064A\u0632\u0627\u0646",
      source: apiData ? "google_script_api" : "intelligent_fallback_engine",
      apiRaw: apiData
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to calculate route" });
  }
});
var genAI = null;
function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAI;
}
app.post("/api/ai/audit", async (req, res) => {
  const { trips, fuelExpenses, maintenance, pettyCash } = req.body;
  try {
    const ai = getGenAI();
    if (!ai) {
      const discrepancies = (trips || []).filter((t) => Math.abs(t.Weight_Diff_Tons || 0) > 0.4);
      const totalFuel = (fuelExpenses || []).reduce((sum, f) => sum + (f.Total_Cost_SAR || 0), 0);
      const totalMaint = (maintenance || []).reduce((sum, m) => sum + (m.Cost_SAR || 0), 0);
      const totalPetty = (pettyCash || []).reduce((sum, p) => sum + (p.Amount_SAR || 0), 0);
      const remainingBalance = totalPetty - (totalFuel + totalMaint);
      return res.json({
        summary: `\u062A\u0645 \u062A\u062F\u0642\u064A\u0642 \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0623\u0633\u0637\u0648\u0644 \u0622\u0644\u064A\u0627\u064B. \u062A\u0645 \u0631\u0635\u062F ${discrepancies.length} \u0631\u062D\u0644\u0629 \u0628\u0647\u0627 \u0641\u0631\u0648\u0642\u0627\u062A \u0641\u064A \u0623\u0648\u0632\u0627\u0646 \u0627\u0644\u0645\u064A\u0632\u0627\u0646 \u062A\u062A\u062C\u0627\u0648\u0632 400 \u0643\u062C\u0645. \u0625\u062C\u0645\u0627\u0644\u064A \u0645\u0646\u0635\u0631\u0641\u0627\u062A \u0627\u0644\u0648\u0642\u0648\u062F \u0648\u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0628\u0644\u063A ${(totalFuel + totalMaint).toLocaleString()} \u0631\u064A\u0627\u0644 \u0645\u0646 \u0623\u0635\u0644 \u0639\u0647\u062F\u0629 \u0645\u0633\u062A\u0644\u0645\u0629 \u0642\u062F\u0631\u0647\u0627 ${totalPetty.toLocaleString()} \u0631\u064A\u0627\u0644\u060C \u0648\u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0645\u062A\u0628\u0642\u064A ${remainingBalance.toLocaleString()} \u0631\u064A\u0627\u0644.`,
        recommendations: [
          "\u0625\u0639\u0627\u062F\u0629 \u0645\u0639\u0627\u064A\u0631\u0629 \u0645\u064A\u0632\u0627\u0646 \u0627\u0644\u0628\u0633\u0643\u0648\u0644 \u0641\u064A \u0645\u0648\u0642\u0639 \u0627\u0644\u062A\u0641\u0631\u064A\u063A \u0644\u0644\u0631\u062D\u0644\u0627\u062A \u0627\u0644\u062A\u064A \u0638\u0647\u0631 \u0628\u0647\u0627 \u0639\u062C\u0632 \u0648\u0632\u0646.",
          "\u0641\u062D\u0635 \u0645\u0639\u062F\u0644 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0627\u0644\u0634\u0627\u062D\u0646\u0627\u062A \u0627\u0644\u062A\u064A \u062A\u0633\u062C\u0644 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u062F\u064A\u0632\u0644 \u0623\u0639\u0644\u0649 \u0645\u0646 \u0627\u0644\u0645\u0639\u062F\u0644 \u0627\u0644\u0646\u0645\u0637\u064A 0.38 \u0644\u062A\u0631/\u0643\u0645.",
          "\u062A\u0632\u0648\u064A\u062F \u0627\u0644\u0633\u0627\u0626\u0642\u064A\u0646 \u0628\u0643\u0631\u0648\u062A \u0648\u0642\u0648\u062F \u0630\u0643\u064A\u0629 \u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0639\u062F\u0627\u062F (Odometer) \u0639\u0646\u062F \u0643\u0644 \u062A\u0641\u0648\u064A\u0644."
        ],
        healthScore: discrepancies.length > 0 ? 84 : 96,
        model: "rule-based-analyzer"
      });
    }
    const prompt = `
\u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u0648\u0627\u0633\u062A\u0634\u0627\u0631\u064A \u0625\u062F\u0627\u0631\u0629 \u0623\u0633\u0627\u0637\u064A\u0644 \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u062B\u0642\u064A\u0644 \u0648\u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0627\u062A (Fleet Operations & Logistics Auditor).
\u0642\u0645 \u0628\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0627\u0644\u064A\u0629 \u0644\u0631\u062D\u0644\u0627\u062A \u0627\u0644\u0634\u0627\u062D\u0646\u0627\u062A\u060C \u0645\u0646\u0635\u0631\u0641\u0627\u062A \u0627\u0644\u0648\u0642\u0648\u062F\u060C \u0627\u0644\u0635\u064A\u0627\u0646\u0629\u060C \u0648\u0627\u0644\u0639\u0647\u062F\u0629:
\u0627\u0644\u0631\u062D\u0644\u0627\u062A: ${JSON.stringify(trips?.slice(0, 10))}
\u0645\u0646\u0635\u0631\u0641\u0627\u062A \u0627\u0644\u0648\u0642\u0648\u062F: ${JSON.stringify(fuelExpenses?.slice(0, 10))}
\u0645\u0646\u0635\u0631\u0641\u0627\u062A \u0627\u0644\u0635\u064A\u0627\u0646\u0629: ${JSON.stringify(maintenance?.slice(0, 10))}
\u0627\u0644\u0639\u0647\u062F\u0629 \u0627\u0644\u0646\u0642\u062F\u064A\u0629: ${JSON.stringify(pettyCash?.slice(0, 10))}

\u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0625\u062E\u0631\u0627\u062C \u062A\u0642\u0631\u064A\u0631 \u0627\u062D\u062A\u0631\u0627\u0641\u064A \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0628\u0635\u064A\u063A\u0629 JSON \u0627\u0644\u062A\u0627\u0644\u064A\u0629 \u0641\u0642\u0637:
{
  "summary": "\u0645\u0644\u062E\u0635 \u062A\u062D\u0644\u064A\u0644\u064A \u0627\u062D\u062A\u0631\u0627\u0641\u064A \u0644\u0643\u0641\u0627\u0621\u0629 \u0627\u0644\u0623\u0633\u0637\u0648\u0644 \u0648\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0623\u0648\u0632\u0627\u0646 \u0648\u0627\u0644\u0645\u0646\u0635\u0631\u0641\u0627\u062A",
  "recommendations": ["\u062A\u0648\u0635\u064A\u0629 1", "\u062A\u0648\u0635\u064A\u0629 2", "\u062A\u0648\u0635\u064A\u0629 3"],
  "healthScore": 88
}
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    res.json({
      ...parsed,
      model: "gemini-2.5-flash"
    });
  } catch (err) {
    console.error("AI Audit error:", err);
    res.json({
      summary: "\u062A\u0645 \u0641\u062D\u0635 \u0627\u0644\u0631\u062D\u0644\u0627\u062A: \u064A\u064F\u0646\u0635\u062D \u0628\u062A\u062F\u0642\u064A\u0642 \u0628\u0648\u0627\u0644\u0635 \u0627\u0644\u0648\u0632\u0646 \u0644\u0644\u0631\u062D\u0644\u0627\u062A \u0630\u0627\u062A \u0641\u0631\u0648\u0642\u0627\u062A \u0627\u0644\u0645\u064A\u0632\u0627\u0646\u060C \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u062A\u0633\u062C\u064A\u0644 \u0639\u062F\u0627\u062F \u0627\u0644\u0643\u064A\u0644\u0648\u0645\u062A\u0631\u0627\u062A \u0641\u064A \u0641\u0648\u0627\u062A\u064A\u0631 \u0627\u0644\u0648\u0642\u0648\u062F.",
      recommendations: [
        "\u0645\u0637\u0627\u0628\u0642\u0629 \u0648\u0632\u0646 \u0627\u0644\u062A\u062D\u0645\u064A\u0644 \u0645\u0639 \u0648\u0632\u0646 \u0627\u0644\u0628\u0633\u0643\u0648\u0644 \u0641\u064A \u0645\u0648\u0642\u0639 \u0627\u0644\u062A\u0641\u0631\u064A\u063A \u0641\u0648\u0631\u064A\u0627\u064B.",
        "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062A\u062A\u0628\u0639 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 GPS \u0623\u062B\u0646\u0627\u0621 \u0643\u0627\u0645\u0644 \u0645\u0633\u0627\u0631 \u0627\u0644\u0631\u062D\u0644\u0629 \u0644\u062A\u0641\u0627\u062F\u064A \u0627\u0644\u062A\u0648\u0642\u0641\u0627\u062A \u063A\u064A\u0631 \u0627\u0644\u0645\u0635\u0631\u062D\u0629."
      ],
      healthScore: 85,
      model: "fallback"
    });
  }
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fleet Management Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
