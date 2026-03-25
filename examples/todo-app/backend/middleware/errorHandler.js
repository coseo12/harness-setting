// 전역 에러 핸들러
function errorHandler(err, _req, res, _next) {
  console.error('[에러]', err.message);

  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || '서버 내부 오류가 발생했습니다.',
    },
  });
}

module.exports = errorHandler;
