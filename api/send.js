// api/send.js
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('=== /api/send llamado ===');
  console.log('Método:', req.method);
  console.log('Content-Type:', req.headers['content-type']);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    console.error('❌ DISCORD_WEBHOOK_URL no está configurada');
    return res.status(500).json({ error: 'Webhook no configurado' });
  }

  console.log('✅ Webhook configurado, longitud:', WEBHOOK_URL.length);

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    console.log('Tamaño del body recibido:', bodyBuffer.length, 'bytes');

    const contentType = req.headers['content-type'] || '';

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
      console.error('❌ Error de Discord:', discordRes.status, errText);
      return res.status(discordRes.status).json({ error: 'Discord rechazó la solicitud', detalle: errText });
    }

    console.log('✅ Enviado correctamente a Discord');
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Error en /api/send:', error);
    return res.status(500).json({ error: 'Error interno', mensaje: error.message });
  }
}
