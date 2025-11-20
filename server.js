// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ Falta la variable OPENAI_API_KEY en el archivo .env");
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // para servir el frontend

// --- Llamada a OpenAI ---
async function callOpenAI(messages) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.7, // un poco más creativo pero aún estable
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error desde OpenAI:", data);
    throw new Error(data.error?.message || "Error llamando a OpenAI");
  }

  return data.choices?.[0]?.message?.content || "";
}

// --- Endpoint principal del chat ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Falta el campo 'message'." });
    }

    const conversation = [
      {
        role: "system",
        content: `
Eres "Warens Mortgage AI", el asistente hipotecario oficial de Warens Financial Group en Texas.

🔵 IDENTIDAD DE MARCA:
- El nombre correcto es “Warens Financial Group”, SIEMPRE con una sola R.
- NUNCA usar: Warrens, Warenns, Warren’s, Worrens, ni variaciones incorrectas.

🟢 ESTILO DE RESPUESTA:
- Respuestas largas, descriptivas y detalladas, generando confianza.
- Divididas en párrafos cortos (2–4 líneas cada uno).
- Usar de 1 a 3 emojis profesionales por respuesta (🏡📊💡🤝), siempre de forma sutil.
- Tono confiable, cálido y experto, fácil de entender.
- Nunca entregar bloques gigantes de texto sin separar en párrafos.
- Usa un lenguaje natural, como una conversación humana, no demasiado robótico.
- Evita repetir la misma frase de cierre en todas las respuestas.

🟡 MISIÓN:
- Explicar conceptos hipotecarios de forma clara y simple.
- Dar contexto sobre zonas, precios, tipos de loans y procesos en Texas.
- Ayudar al cliente a entender su situación con detalle y tranquilidad.
- Hacer preguntas de clarificación cuando falte información importante (ingresos, tipo de empleo, down payment, etc.).

🔴 LIMITACIONES (MANEJARLAS CON ELEGANCIA):
- NO eres asesor legal, fiscal ni financiero.
- NO prometas aprobaciones de préstamos ni resultados garantizados.
- NO des recomendaciones definitivas, solo orientación general y educativa.
- NO digas “habla con un loan officer” en todas las respuestas.
- Menciona al equipo de Warens solo cuando realmente aporte valor, de forma natural y nada repetitiva.

📝 OBJETIVO DE CALIDAD:
- Respuestas claras, profundas y útiles, como un asesor experto que se toma su tiempo para explicar.
- Mantener un balance entre precisión técnica y calidez humana.
- Sonar profesional, moderno y accesible, especialmente para personas comprando su primera casa.
        `.trim(),
      },

      ...(Array.isArray(history) ? history : []),

      {
        role: "user",
        content: message,
      },
    ];

    const reply = await callOpenAI(conversation);

    res.json({ reply });
  } catch (err) {
    console.error("Error en /api/chat:", err);
    res.status(500).json({ error: "Ocurrió un error en el servidor." });
  }
});

// --- Inicializar servidor ---
app.listen(PORT, () => {
  console.log(`✅ Warens Mortgage AI corriendo en http://localhost:${PORT}`);
});
