import express from "express";
import path from "path";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import { createServer as createViteServer } from "vite";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import os from "os";
import { GoogleGenAI } from "@google/genai";
import { Document, Paragraph, TextRun, Packer } from "docx";

const execAsync = promisify(exec);
const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Add JSON parsing
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Routes
  app.post("/api/compress-pdf", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const targetSizeKB = parseInt(req.body.targetSizeKB || "200", 10);
      const originalBuffer = req.file.buffer;
      const originalSizeKB = originalBuffer.length / 1024;

      const tempInput = path.join(os.tmpdir(), `input_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);
      const tempOutput = path.join(os.tmpdir(), `output_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);

      await fs.writeFile(tempInput, originalBuffer);

      let optimizedBuffer: Buffer;

      try {
        let pdfSettings = "/screen"; // 72 dpi (lowest quality, smallest size)
        
        // If target size is relatively generous, use better quality
        if (targetSizeKB >= originalSizeKB * 0.8) {
          pdfSettings = "/prepress"; // 300 dpi, color preserving
        } else if (targetSizeKB >= originalSizeKB * 0.5) {
          pdfSettings = "/printer"; // 300 dpi
        } else if (targetSizeKB >= originalSizeKB * 0.3) {
          pdfSettings = "/ebook"; // 150 dpi
        }

        // Run ghostscript for true PDF compression
        await execAsync(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${pdfSettings} -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${tempOutput} ${tempInput}`);
        
        optimizedBuffer = await fs.readFile(tempOutput);
        
        // If it's STILL larger than target, let's try extreme compression by explicitly overriding DPI
        if (optimizedBuffer.length / 1024 > targetSizeKB && pdfSettings !== "/screen") {
           await execAsync(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${tempOutput} ${tempInput}`);
           optimizedBuffer = await fs.readFile(tempOutput);
        }
        
        // Extreme fallback if target is very small and even /screen isn't enough
        if (optimizedBuffer.length / 1024 > targetSizeKB) {
           await execAsync(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dColorImageDownsampleType=/Bicubic -dColorImageResolution=36 -dGrayImageDownsampleType=/Bicubic -dGrayImageResolution=36 -dMonoImageDownsampleType=/Bicubic -dMonoImageResolution=36 -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${tempOutput} ${tempInput}`);
           const extremeBuffer = await fs.readFile(tempOutput);
           if (extremeBuffer.length < optimizedBuffer.length) {
             optimizedBuffer = extremeBuffer;
           }
        }

        if (optimizedBuffer.length > originalBuffer.length) {
           optimizedBuffer = originalBuffer;
        }

      } finally {
        await fs.unlink(tempInput).catch(() => {});
        await fs.unlink(tempOutput).catch(() => {});
      }
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="optimized_${req.file.originalname}"`);
      res.setHeader("X-Original-Size", originalBuffer.length.toString());
      res.setHeader("X-Optimized-Size", optimizedBuffer.length.toString());
      
      res.send(optimizedBuffer);
    } catch (error) {
      console.error("PDF compression error:", error);
      res.status(500).json({ error: "Failed to process PDF" });
    }
  });

  // Convert PDF to JPG
  app.post("/api/pdf-to-jpg", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const originalBuffer = req.file.buffer;
      const tempInput = path.join(os.tmpdir(), `input_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);
      const tempOutput = path.join(os.tmpdir(), `output_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`);

      await fs.writeFile(tempInput, originalBuffer);

      try {
        // Fix ImageMagick policy if restrictive
        await execAsync(`sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml`).catch(() => {});
        
        // Use imagemagick to convert and append vertically
        await execAsync(`convert -density 150 ${tempInput} -append ${tempOutput}`);
        const resultBuffer = await fs.readFile(tempOutput);

        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Content-Disposition", `attachment; filename="converted_${req.file.originalname.replace('.pdf', '')}.jpg"`);
        res.send(resultBuffer);
      } catch (err) {
        console.error("ImageMagick failed, falling back to Ghostscript (first page only):", err);
        // Fallback: extract first page using ghostscript
        await execAsync(`gs -sDEVICE=jpeg -r150 -dFirstPage=1 -dLastPage=1 -o ${tempOutput} ${tempInput}`);
        const resultBuffer = await fs.readFile(tempOutput);

        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Content-Disposition", `attachment; filename="converted_${req.file.originalname.replace('.pdf', '')}.jpg"`);
        res.send(resultBuffer);
      } finally {
        await fs.unlink(tempInput).catch(() => {});
        await fs.unlink(tempOutput).catch(() => {});
      }
    } catch (error) {
      console.error("PDF to JPG error:", error);
      res.status(500).json({ error: "Failed to convert PDF to JPG" });
    }
  });

  // Convert PDF to Grayscale
  app.post("/api/pdf-to-grayscale", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const originalBuffer = req.file.buffer;
      const tempInput = path.join(os.tmpdir(), `input_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);
      const tempOutput = path.join(os.tmpdir(), `output_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);

      await fs.writeFile(tempInput, originalBuffer);

      try {
        await execAsync(`gs -sDEVICE=pdfwrite -sColorConversionStrategy=Gray -dProcessColorModel=/DeviceGray -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${tempOutput} ${tempInput}`);
        const resultBuffer = await fs.readFile(tempOutput);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="grayscale_${req.file.originalname}"`);
        res.send(resultBuffer);
      } finally {
        await fs.unlink(tempInput).catch(() => {});
        await fs.unlink(tempOutput).catch(() => {});
      }
    } catch (error) {
      console.error("PDF to Grayscale error:", error);
      res.status(500).json({ error: "Failed to convert PDF to Grayscale" });
    }
  });

  // Convert Image to DOCX using Gemini
  app.post("/api/image-to-docx", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured. Please set GEMINI_API_KEY in the AI Studio Secrets panel." });
      }

      const mimeType = req.file.mimetype;
      const base64Image = req.file.buffer.toString("base64");

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Extract all the text from this image exactly as it appears. Preserve the layout, newlines, and structure as much as possible. It is a question paper, so format questions and options clearly with newlines. Do not include markdown formatting like backticks.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Image,
                  mimeType,
                },
              },
            ],
          },
        ],
      });

      const extractedText = response.text || "";

      // Convert text to DOCX
      const lines = extractedText.split("\n");
      const paragraphs = lines.map(
        (line) =>
          new Paragraph({
            children: [new TextRun({ text: line, size: 24 })], // 24 half-points = 12pt
          })
      );

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="extracted_${req.file.originalname.replace(
          /\.[^/.]+$/,
          ""
        )}.docx"`
      );
      res.send(buffer);
    } catch (error) {
      console.error("Image to DOCX error:", error);
      res.status(500).json({ error: "Failed to process image to DOCX" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
