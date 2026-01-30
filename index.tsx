
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
import express from 'express';
import path from 'path';

const app = express();
const PORT = 5000;

// JSON и API (твой код)
app.use(express.json());
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok' });
});

// Отдаём статические файлы сайта
app.use(express.static(path.join(__dirname, 'public')));

// Для маршрутов React/Vite
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));