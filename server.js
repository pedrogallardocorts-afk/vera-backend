const express = require("express");
const cors = require("cors");
const multer = require("multer");
const OpenAI = require("openai");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
}));

const upload = multer({
  storage: multer.memoryStorage(),
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Vera backend funcionando");
});

app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No se recibió audio",
      });
    }

    console.log("Audio recibido:", req.file.originalname);
    console.log("MimeType:", req.file.mimetype);

    const transcription = await client.audio.transcriptions.create({
      file: await OpenAI.toFile(
        req.file.buffer,
        req.file.originalname
      ),
      model: "whisper-1",
    });

    const texto = transcription.text;

    console.log("Texto:", texto);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres Vera, una asesora inmobiliaria cercana y clara especializada en Barcelona. Responde de forma natural y útil.",
        },
        {
          role: "user",
          content: texto,
        },
      ],
    });

    const reply =
      completion.choices[0].message.content;

    res.json({
      success: true,
      transcription: texto,
      reply,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});
