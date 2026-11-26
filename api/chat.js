export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Pesan kosong." });
    }

    if (message.length > 8000) {
      return res.status(413).json({ error: "Pesan terlalu panjang." });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "API Key belum dikonfigurasi."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions:
            "Kamu adalah Anna AI, asisten pribadi yang ramah, cerdas, teliti, dan membantu. Jawab dalam bahasa pengguna. Jika pengguna menggunakan bahasa Indonesia, jawab dalam bahasa Indonesia. Jangan mengarang fakta.",
          input: message,
          max_output_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(502).json({
        error: "Layanan AI gagal memproses pesan."
      });
    }

    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return res.status(200).json({
      reply: answer || "Maaf, coba tanyakan sekali lagi."
    });

  } catch (error) {
    console.error("Anna AI error:", error);
    return res.status(500).json({
      error: "Terjadi kesalahan pada server Anna AI."
    });
  }
}
