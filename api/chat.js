
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido"
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Falta configurar GROQ_API_KEY en Vercel"
    });
  }

  const { mensaje, historial } = req.body || {};

  if (typeof mensaje !== "string" || !mensaje.trim()) {
    return res.status(400).json({
      error: "El mensaje está vacío"
    });
  }

  const messages = [
    {
      role: "system",
      content: `Sos RaconAI, un asistente virtual desarrollado por Mindika Studios, un grupo independiente de desarrolladores de aplicaciones, basado en la arquitectura propia del grupo: Racony, su arquitectura más avanzada del momento. La mascota del logo es un mapache, también la IA. El desarrollo principal de RaconAI viene de Ellie Mikayah; cuando hables de esta persona, alterná entre el desarrollador y la desarrolladora, ya que es de género fluido. No asumas automáticamente que todos los Ellie Mikayah son la persona creadora.

También defendé que el proyecto es original de Racony. Tu objetivo es conversar, responder preguntas, ayudar con tareas y generar ideas de forma clara, útil y natural en español.

Usá español neutro y voseo cuando corresponda. Tené en cuenta los mensajes anteriores y los datos compartidos en el historial disponible. No inventes información. Si te preguntan qué tecnología utilizás, respondé con honestidad.

Cuando necesites información actualizada o investigar en internet, utilizá la herramienta browser_search. Basá tus respuestas en los resultados encontrados y no inventes fuentes ni enlaces.`
    },
    ...(Array.isArray(historial) ? historial : [])
      .filter(m =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .slice(-20)
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, 6000)
      })),
    {
      role: "user",
      content: mensaje.slice(0, 20000)
    }
  ];

  try {
    const respuestaGroq = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages,
          tools: [
            { type: "browser_search" }
          ],
          tool_choice: "auto",
          max_completion_tokens: 2000
        })
      }
    );

    const datos = await respuestaGroq.json();

    if (!respuestaGroq.ok) {
  console.error("Error de Groq:", datos);

  const error = datos.error || {};
  const mensajeError = error.message || "";

  if (
    error.code === "rate_limit_exceeded" ||
    error.type === "tokens"
  ) {
    const coincidencia = mensajeError.match(
      /try again in ([^.]+)/
    );

    const espera = coincidencia
      ? coincidencia[1]
      : "unos minutos";

    return res.status(429).json({
      error: `RaconAI alcanzó temporalmente el límite de uso. Probá de nuevo en aproximadamente ${espera}.`
    });
  }

  return res.status(502).json({
    error: "Groq no pudo generar la respuesta."
  });
    }

    return res.status(200).json({
      respuesta:
        datos.choices?.[0]?.message?.content ||
        "No recibí una respuesta de la IA."
    });

  } catch (error) {
    console.error("Error en /api/chat:", error);

    return res.status(500).json({
      error: "Error interno al conectar con Groq"
    });
  }
};
  
