// api/send.js
// Esta función corre en el servidor de Vercel. Aquí SÍ puede estar el webhook,
// porque el usuario nunca ve el código del servidor.

export const config = {
  api: {
    bodyParser: false, // Necesario para manejar multipart/form-data (archivos)
  },
};

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_URL no está configurada');
    return res.status(500).json({ error: 'Webhook no configurado' });
  }

  try {
    // Leer el cuerpo multipart/form-data que envía el frontend
    // Vercel nos da el body crudo, tenemos que reenviarlo tal cual.
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    const contentType = req.headers['content-type'] || '';

    // Reenviar a Discord con el mismo content-type (multipart/form-data)
    const discordRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
      },
      body: bodyBuffer,
    });

    console.log('Discord status:', discordRes.status);

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error('Error de Discord:', discordRes.status, errText);
      return res.status(discordRes.status).json({ error: 'Discord rechazó la solicitud' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error en /api/send:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}
