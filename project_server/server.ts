import express from 'express';
import path from 'path';

const app = express();
const PORT = 5000;

// Отдаём фронтенд из папки dist
app.use(express.static(path.join(__dirname, '../dist')));

// Любой другой маршрут отсылает index.html (для SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});