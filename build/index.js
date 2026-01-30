"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = __importDefault(require("react-dom/client"));
const App_1 = __importDefault(require("./App"));
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}
const root = client_1.default.createRoot(rootElement);
root.render(<react_1.default.StrictMode>
    <App_1.default />
  </react_1.default.StrictMode>);
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = 5000;
// JSON и API (твой код)
app.use(express_1.default.json());
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok' });
});
// Отдаём статические файлы сайта
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Для маршрутов React/Vite
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
