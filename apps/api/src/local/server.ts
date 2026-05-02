import { app } from '../baseblocks/admin/admin-api';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

app.listen(PORT, () => {
  console.log(`Local API server: http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});
