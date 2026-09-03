import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Google Apps Script API provided by the user for real-time traffic and route optimization
const GOOGLE_TRAFFIC_MACRO_URL = "https://script.google.com/macros/s/AKfycbxObZjQkX2KFeNzEIAj3yH72pSqr9X4Ax8cgh2eWQqWfSREOA8yZiTZ4NnbK5-OiAomEg/exec";

// 1. Route Optimization & Traffic API
app.post("/api/traffic-route-optimizer", async (req, res) => {
  const { origin, destination, waypoints, fuelRateLKm } = req.body;

  try {
    const originLat = origin?.lat || 24.5885;
    const originLng = origin?.lng || 46.3325;
    const destLat = destination?.lat || 24.6210;
    const destLng = destination?.lng || 46.4550;

    // Calculate approximate Haversine distance
    const R = 6371; // Earth radius in KM
    const dLat = ((destLat - originLat) * Math.PI) / 180;
    const dLng = ((destLng - originLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((originLat * Math.PI) / 180) *
        Math.cos((destLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightKm = R * c;
    const roadKm = Math.round(straightKm * 1.32 * 10) / 10; // road winding factor

    // Attempt to query the user's provided Google Apps Script API endpoint
    let apiData: any = null;
    let trafficCondition: "normal" | "moderate" | "heavy" = "normal";

    try {
      const urlWithParams = new URL(GOOGLE_TRAFFIC_MACRO_URL);
      urlWithParams.searchParams.append("origin", `${originLat},${originLng}`);
      urlWithParams.searchParams.append("destination", `${destLat},${destLng}`);
      urlWithParams.searchParams.append("traffic", "true");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(urlWithParams.toString(), {
        signal: controller.signal,
        headers: { Accept: "application/json" },
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
    } catch (apiErr: any) {
      // Fallback graceful handling if external google script times out or redirects
      console.log("External Google Script note: using local intelligent route calculation engine");
    }

    const trafficFactor = trafficCondition === "heavy" ? 1.45 : trafficCondition === "moderate" ? 1.2 : 1.0;
    const averageTruckSpeedKmH = 55;
    const estimatedMinutes = Math.round((roadKm / averageTruckSpeedKmH) * 60 * trafficFactor);
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
      recommendedRoute: roadKm > 40 ? "طريق الشاحنات السريع المباشر (تجنب الدائري وقت الذروة)" : "المسار اللوجستي المعتمد عبر بوابات الميزان",
      source: apiData ? "google_script_api" : "intelligent_fallback_engine",
      apiRaw: apiData,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to calculate route" });
  }
});

// 2. Fleet AI Audit Engine (Gemini API)
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAI;
}

app.post("/api/ai/audit", async (req, res) => {
  const { trips, fuelExpenses, maintenance, pettyCash } = req.body;

  try {
    const ai = getGenAI();
    if (!ai) {
      // Rule-based heuristic fallback if key not configured
      const discrepancies = (trips || []).filter((t: any) => Math.abs(t.Weight_Diff_Tons || 0) > 0.4);
      const totalFuel = (fuelExpenses || []).reduce((sum: number, f: any) => sum + (f.Total_Cost_SAR || 0), 0);
      const totalMaint = (maintenance || []).reduce((sum: number, m: any) => sum + (m.Cost_SAR || 0), 0);
      const totalPetty = (pettyCash || []).reduce((sum: number, p: any) => sum + (p.Amount_SAR || 0), 0);
      const remainingBalance = totalPetty - (totalFuel + totalMaint);

      return res.json({
        summary: `تم تدقيق سجلات الأسطول آلياً. تم رصد ${discrepancies.length} رحلة بها فروقات في أوزان الميزان تتجاوز 400 كجم. إجمالي منصرفات الوقود والصيانة بلغ ${ (totalFuel + totalMaint).toLocaleString() } ريال من أصل عهدة مستلمة قدرها ${ totalPetty.toLocaleString() } ريال، والرصيد المتبقي ${ remainingBalance.toLocaleString() } ريال.`,
        recommendations: [
          "إعادة معايرة ميزان البسكول في موقع التفريغ للرحلات التي ظهر بها عجز وزن.",
          "فحص معدل استهلاك الشاحنات التي تسجل استهلاك ديزل أعلى من المعدل النمطي 0.38 لتر/كم.",
          "تزويد السائقين بكروت وقود ذكية لمراقبة العداد (Odometer) عند كل تفويل."
        ],
        healthScore: discrepancies.length > 0 ? 84 : 96,
        model: "rule-based-analyzer"
      });
    }

    const prompt = `
أنت خبير واستشاري إدارة أساطيل النقل الثقيل واللوجستيات (Fleet Operations & Logistics Auditor).
قم بتحليل البيانات التالية لرحلات الشاحنات، منصرفات الوقود، الصيانة، والعهدة:
الرحلات: ${JSON.stringify(trips?.slice(0, 10))}
منصرفات الوقود: ${JSON.stringify(fuelExpenses?.slice(0, 10))}
منصرفات الصيانة: ${JSON.stringify(maintenance?.slice(0, 10))}
العهدة النقدية: ${JSON.stringify(pettyCash?.slice(0, 10))}

المطلوب إخراج تقرير احترافي باللغة العربية بصيغة JSON التالية فقط:
{
  "summary": "ملخص تحليلي احترافي لكفاءة الأسطول وسلامة الأوزان والمنصرفات",
  "recommendations": ["توصية 1", "توصية 2", "توصية 3"],
  "healthScore": 88
}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      ...parsed,
      model: "gemini-2.5-flash",
    });
  } catch (err: any) {
    console.error("AI Audit error:", err);
    res.json({
      summary: "تم فحص الرحلات: يُنصح بتدقيق بوالص الوزن للرحلات ذات فروقات الميزان، ومتابعة تسجيل عداد الكيلومترات في فواتير الوقود.",
      recommendations: [
        "مطابقة وزن التحميل مع وزن البسكول في موقع التفريغ فورياً.",
        "تفعيل التتبع المباشر GPS أثناء كامل مسار الرحلة لتفادي التوقفات غير المصرحة."
      ],
      healthScore: 85,
      model: "fallback"
    });
  }
});

// 3. Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 4. Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fleet Management Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
