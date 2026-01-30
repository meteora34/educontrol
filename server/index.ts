import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Статические файлы фронтенда
app.use(express.static(resolve(__dirname, '../../dist')));

// Любой запрос → отдаём index.html
app.get(/.*/, (req, res) => {
  res.sendFile(resolve(__dirname, '../../dist/index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
