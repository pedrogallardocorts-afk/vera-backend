import express from "express";
import multer from "multer";
import fs from "fs";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());

const upload = multer({
  dest: "uploads/",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/transcribe", upload.single("audio"), async (req, res) => {

  try {

    const transcription =
      await openai.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: "whisper-1",
      });

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: `
Eres Vera.

Especialista inmobiliaria en Barcelona.

Habla de forma:
- cercana
- humana
- sencilla
- tranquila

NO des cifras exactas.

Da orientación general sobre la vivienda.
`,
          },
          {
            role: "user",
            content: transcription.text,
          },
        ],
      });

    res.json({
      transcript: transcription.text,
      reply: completion.choices[0].message.content,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error procesando audio",
    });

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor funcionando");
});
