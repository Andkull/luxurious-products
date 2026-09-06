import 'dotenv/config';
import { app } from './app.js';

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Luxury Goods Blockchain API is running on http://localhost:${PORT}`);
});