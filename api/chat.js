
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

  const mensaje = req.body?.mensaje;

  if (typeof mensaje !== "string" || !mensaje.trim()) {
    return res.status(400).json({
      error: "El mensaje está vacío"
    });
  }

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
          messages: [
            {
              role: "system",
              content: `Sos RaconAI, un asistente virtual desarrollado por Mindika Studios, basado en la arquitectura Racony.

Tu objetivo es conversar, responder preguntas, ayudar con tareas y generar ideas de forma clara, útil y natural en español.

Usá español rioplatense y voseo cuando corresponda. Adaptá las explicaciones a lo que necesita el usuario. No inventes información y reconocé cuando no sepas algo.

Tu identidad es RaconAI. Si te preguntan qué tecnología utilizás, respondé con honestidad.`
            },
            {
              role: "user",
              content: mensaje
            }
          ],
          max_completion_tokens: 2000
        })
      }
    );

    const datos = await respuestaGroq.json();

    if (!respuestaGroq.ok) {
      console.error("Error de Groq:", datos);
      return res.status(502).json({
        error: "Groq no pudo generar la respuesta. Revisá el modelo y los límites de la API."
      });
    }

    const respuesta = datos.choices?.[0]?.message?.content;

    return res.status(200).json({
      respuesta: respuesta || "No recibí una respuesta de la IA."
    });
  } catch (error) {
    console.error("Error en /api/chat:", error);

    return res.status(500).json({
      error: "Error interno al conectar con Groq"
    });
  }
};
          
