import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000; // важно для Render

// Отдаём фронтенд
app.use(express.static(path.resolve('dist')));

// Любой маршрут отдаёт index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve('dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
