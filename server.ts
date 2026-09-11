import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Handle CORS and credentials for AI Studio preview environment
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Configure Multer for memory storage (max 20MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

app.use(express.json({ limit: "20mb" }));

// Helper function to extract text safely from PDF buffer if needed
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    let pdfParseFn: any;
    try {
      pdfParseFn = require("pdf-parse");
      if (typeof pdfParseFn !== "function" && pdfParseFn?.default) {
        pdfParseFn = pdfParseFn.default;
      }
    } catch {
      const mod = await import("pdf-parse");
      pdfParseFn = typeof mod === "function" ? mod : ((mod as any)?.default || mod);
    }

    if (typeof pdfParseFn === "function") {
      const data = await pdfParseFn(buffer);
      return data?.text || "";
    }
  } catch (err) {
    console.warn("Optional pdf-parse text extraction skipped:", err);
  }
  return "";
}

// Helper to attempt content generation across multiple model fallbacks cleanly
async function generateContentWithFallback(
  ai: GoogleGenAI,
  models: string[],
  contents: any,
  config: any
) {
  let lastError: any = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} call failed (${err?.status || err?.message || 'Error'}). Trying fallback...`);
    }
  }
  throw lastError || new Error("All model fallbacks failed");
}

// API endpoint to health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API endpoint to process uploaded PDF with Gemini API
app.post("/api/process-pdf", (req, res, next) => {
  upload.single("pdfFile")(req, res, (err) => {
    if (err) {
      console.error("Multer upload error:", err);
      return res.status(400).json({
        success: false,
        error: `ファイルアップロードエラー: ${err.message || "20MB以下のPDFファイルを選択してください。"}`,
      });
    }
    next();
  });
}, async (req, res): Promise<void> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        success: false,
        error: "GEMINI_API_KEYが設定されていません。AI StudioのSettings > Secretsをご確認ください。",
      });
      return;
    }

    let contents: any;
    let rawTextLength = 0;

    if (req.file) {
      const base64Pdf = req.file.buffer.toString("base64");
      const extractedText = await extractTextFromPdf(req.file.buffer);
      rawTextLength = extractedText.length || req.file.size;

      // Gemini 2.5 Flash natively accepts PDF binary data as application/pdf
      contents = [
        {
          inlineData: {
            data: base64Pdf,
            mimeType: "application/pdf",
          },
        },
        "添付された講義資料PDFから、認知心理学（Cognitive Load Theory / Active Recall）に基づき最適化された学習ノート用データ（JSON）を作成してください。なお、重要単語集（key_terms）は項目数に制限を設けず、資料内に登場するすべての重要単語・専門用語を漏れなく網羅してください。",
      ];
    } else if (req.body && req.body.rawText) {
      const text = req.body.rawText;
      rawTextLength = text.length;
      contents = `以下は大学講義資料の抽出テキストです。この内容から認知心理学的に最適化された学習ノート用データ（JSON）を作成してください。重要単語集（key_terms）は項目数に制限を設けず、テキストに登場するすべての重要単語を漏れなく網羅してください：\n\n${text.slice(0, 30000)}`;
    } else {
      res.status(400).json({
        success: false,
        error: "PDFファイルまたはテキストデータがアップロードされていません。",
      });
      return;
    }

    // Initialize GoogleGenAI SDK as required with user agent
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `あなたは認知心理学・教育心理学の専門知識を持つ卓越したAI学習デザイナーです。
大学の講義用資料テキスト・スライドPDFから、学習者の認知負荷（Cognitive Load）を最小限に抑え、長期記憶（Long-term Memory）への定着を最大化する「ミニマル学習ノート」の構造化データを生成してください。

【認知心理学に基づく出力指針】
1. **Title (タイトル)**: 講義の核となるテーマを表現する短く明瞭なタイトル。
2. **Core Points (核心要約)**: 認知負荷理論に基づき、一度にワーキングメモリで処理できるよう、最も重要な概念・ポイントを3〜7個の箇条書きに要約。長文にならず直感的に理解できる文体にする。
3. **Key Terms (重要単語集)**: 意味ネットワークの形成を助けるため、講義資料・テキストに登場する全ての重要単語・専門用語（Term）と、その明確でコンパクトな定義（Definition）のペアを漏れなく網羅的に抽出してください（項目数に制限・上限は設けず、資料内のすべての重要単語を抽出すること）。

【視覚・スタイル注意点】
出力テキストには装飾記号や絵文字、過度なHTMLタグを含めず、テキストのみで正確かつ学術的にわかりやすく表現してください。`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "講義のタイトル（簡潔で明確）",
        },
        core_points: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "講義の最重要ポイント（3〜7箇条）",
        },
        key_terms: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING, description: "重要単語・概念" },
              definition: { type: Type.STRING, description: "単語の定義・説明" },
            },
            required: ["term", "definition"],
          },
          description: "講義資料内のすべての重要単語と定義の配列（項目数の上限制限なし・完全網羅）",
        },
      },
      required: ["title", "core_points", "key_terms"],
    };

    const fallbackModels = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];

    const response = await generateContentWithFallback(
      ai,
      fallbackModels,
      contents,
      {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      }
    );

    const rawJson = response.text || "";
    const parsedData = JSON.parse(rawJson);

    res.json({
      success: true,
      data: parsedData,
      rawTextLength,
    });
  } catch (err: any) {
    console.error("Server error processing PDF:", err);
    res.status(500).json({
      success: false,
      error: err.message || "PDFの処理中にサーバーエラーが発生しました。",
    });
  }
});

// API endpoint to analyze difficult terms in definitions
app.post("/api/analyze-difficult-terms", async (req, res): Promise<void> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        success: false,
        error: "GEMINI_API_KEYが設定されていません。",
      });
      return;
    }

    const { keyTerms } = req.body || {};
    if (!keyTerms || !Array.isArray(keyTerms) || keyTerms.length === 0) {
      res.json({ success: true, analyses: [] });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `あなたは学習支援・教育心理学の専門AIアシスタントです。
提供された「重要単語集（keyTerms）」の定義（definition）テキストを分析し、学習者にとって少し難解な専門用語、抽象語、学術用語（例：「認知システム」「符号化」「ワーキングメモリ」「感度」「干渉」「スキーマ」等）が含まれているかを解析してください。

分析手順：
1. 各項目の定義（definition）テキスト内にある、補足説明や平易化が必要な難解用語を検出します。
2. その難解用語について、以下を出力してください：
   - termIndex: keyTerms配列のインデックス番号 (0始まり)
   - difficultWord: 定義テキスト内に実際に含まれている正確な難解単語・フレーズ（テキストに含まれる文字と完全一致させること）
   - simplifiedExplanation: 初学者でも一目で理解できる極めて平易で親しみやすいかみくだいた解説（例：「情報を脳に覚えやすい形に変えること」）
   - suggestedReplacement: 定義テキスト中のその単語を置き換えるとした場合の言い換え・補足表現

もし定義が既に十分に平易で難解な用語がない場合は、空配列を返してください。`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        analyses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              termIndex: { type: Type.INTEGER, description: "keyTerms配列内の0始まりインデックス" },
              difficultWord: { type: Type.STRING, description: "定義テキスト内に含まれる正確な難解用語" },
              simplifiedExplanation: { type: Type.STRING, description: "かみくだいた平易な解説文" },
              suggestedReplacement: { type: Type.STRING, description: "平易な言い換え単語・フレーズ" },
            },
            required: ["termIndex", "difficultWord", "simplifiedExplanation", "suggestedReplacement"],
          },
          description: "検出された難解用語とその平易な解説のリスト",
        },
      },
      required: ["analyses"],
    };

    const promptText = `以下の重要単語集の定義テキストを分析し、難解な専門用語・フレーズを検出してください：\n\n${JSON.stringify(keyTerms, null, 2)}`;

    const fallbackModels = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];

    const response = await generateContentWithFallback(
      ai,
      fallbackModels,
      promptText,
      {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      }
    );

    const rawJson = response.text || "";
    const parsed = JSON.parse(rawJson);

    const analysesWithIds = (parsed.analyses || []).map((item: any, idx: number) => ({
      ...item,
      id: `diff-term-${item.termIndex}-${idx}-${Date.now()}`,
    }));

    res.json({
      success: true,
      analyses: analysesWithIds,
    });
  } catch (err: any) {
    console.error("Error analyzing difficult terms:", err);
    res.json({
      success: false,
      analyses: [],
      error: err.message,
    });
  }
});

// API endpoint to generate low-abstraction explanation & concrete example for a key term
app.post("/api/explain-abstract-term", async (req, res): Promise<void> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        success: false,
        error: "GEMINI_API_KEYが設定されていません。",
      });
      return;
    }

    const { term, definition, contextTitle } = req.body || {};
    if (!term || !definition) {
      res.status(400).json({
        success: false,
        error: "単語名(term)と定義(definition)が必要です。",
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `あなたは認知心理学・教育心理学に精通した最高峰の教育AI専門家です。
学術的・抽象的な重要単語（term）とその定義（definition）について、学習者の認知負荷を最小化するため、抽象度を大幅に下げた平易な解説文と日常生活レベルの具体例を生成してください。

出力条件：
1. isAbstract: boolean (この用語が概念的・抽象度の高い重要単語であるか)
2. lowAbstractionExplanation: 専門用語を避け、日常生活や経験の言葉に置き換えた超平易で親しみやすい解説文（100〜150文字程度）
3. concreteExample: 初学者や中学生でも一目で頭に映像が浮かぶ身近な具体例・日常シチュエーション（100〜150文字程度）
4. analogy: 直感的な例え話やメタファー（例：「脳の作業デスク」「パソコンのRAM」など）
5. whyImportant: なぜこの概念を理解することが重要なのか（簡潔に）`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        isAbstract: { type: Type.BOOLEAN, description: "抽象度の高い重要単語であるか" },
        lowAbstractionExplanation: { type: Type.STRING, description: "抽象度を大幅に下げた超平易な解説" },
        concreteExample: { type: Type.STRING, description: "日常生活や身近な場面に例えた具体例" },
        analogy: { type: Type.STRING, description: "直感的な例え話・メタファー" },
        whyImportant: { type: Type.STRING, description: "この概念の重要性" },
      },
      required: ["isAbstract", "lowAbstractionExplanation", "concreteExample", "analogy", "whyImportant"],
    };

    const promptText = `講義テーマ: ${contextTitle || "講義資料"}\n対象の重要単語: 「${term}」\n学術的定義: 「${definition}」\n\n上記について抽象度を下げた平易な説明文章と、身近な具体例を作成してください。`;

    const fallbackModels = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];

    const response = await generateContentWithFallback(
      ai,
      fallbackModels,
      promptText,
      {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      }
    );

    const rawJson = response.text || "";
    const parsed = JSON.parse(rawJson);

    res.json({
      success: true,
      term,
      explanation: parsed,
    });
  } catch (err: any) {
    console.error("Error generating abstract term explanation:", err);
    res.status(500).json({
      success: false,
      error: err.message || "抽象用語解説の生成中にエラーが発生しました。",
    });
  }
});

// Express global error handler to guarantee JSON responses
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Global Express error handler caught:", err);
  res.status(500).json({
    success: false,
    error: err?.message || "サーバー内部エラーが発生しました。",
  });
});

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
