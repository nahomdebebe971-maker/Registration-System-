import express from "express";
import serverless from "serverless-http";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

// Use JSON middleware with increased limit for optimizations
app.use(express.json({ limit: "10mb" }));

// Route handlers matching both with and without /api prefix
// for resilient path routing on Netlify
app.post(["/verify-password", "/api/verify-password"], (req, res) => {
  const { password } = req.body;
  if (password === "Nahom@110108") {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Incorrect Password" });
  }
});

app.post(["/gemini", "/api/gemini"], async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Gemini API key is not configured. Administrators must configure GEMINI_API_KEY in the Netlify site dashboard under Environment Variables." 
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

// Export the serverless-http wrapped express handler
export const handler = serverless(app);
