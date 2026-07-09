import { NextApiRequest, NextApiResponse } from 'next';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import { join } from 'path';

// Configuração CRÍTICA para arquivos gigantes no Next.js (Pages Router)
export const config = {
  api: {
    bodyParser: false, // Desliga o parser automático para não estourar a memória
    sizeLimit: '10gb', // Limite absurdamente alto
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawFileName = req.headers['x-file-name'];
    if (!rawFileName || typeof rawFileName !== 'string') {
      return res.status(400).json({ error: 'X-File-Name header missing' });
    }

    const fileName = decodeURIComponent(rawFileName);
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${Date.now()}_${safeFileName}`;
    const filePath = join(uploadDir, uniqueFileName);

    // O req no Pages Router já é um Node.js Readable Stream!
    const writeStream = createWriteStream(filePath);
    await pipeline(req, writeStream);

    return res.status(200).json({ url: `/uploads/${uniqueFileName}` });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
