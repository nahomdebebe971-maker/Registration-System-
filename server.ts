import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware with increased payload limit to support base64 optimization
  app.use(express.json({ limit: '10mb' }));

  // API Route - Admin Password verification (never exposed to client bundle)
  app.post("/api/verify-password", (req, res) => {
    const { password } = req.body;
    if (password === "Nahom@110108") {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: "Incorrect Password" });
    }
  });

  // API Route - Gemini AI Query & Recommendations proxy
  app.post("/api/gemini", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "Gemini API key is not configured. Administrators must configure GEMINI_API_KEY in the Settings > Secrets side panel in Google AI Studio." 
        });
      }

      const { prompt, context } = req.body;

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are the Chercher Secondary School Smart Registrar AI Assistant.
You have access to the current registrations, grades, and classes context to help school administrators analyze records, check gender balance, identify top performers, troubleshoot errors or write rejection comments.

Current school metrics/data state:
${JSON.stringify(context || {})}

Offer concise, precise, objective, and high-quality response. Use clean academic Markdown formatting. If asked to make decisions or comparisons, give clear logical suggestions.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini server error:", err);
      res.status(500).json({ error: err.message || "Failed to query Gemini AI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
