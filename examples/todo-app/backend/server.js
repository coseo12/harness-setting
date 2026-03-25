const express = require('express');
const cors = require('cors');
const todosRouter = require('./routes/todos');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 라우트
app.use('/api/todos', todosRouter);

// 헬스 체크
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 에러 핸들러
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

module.exports = app;
