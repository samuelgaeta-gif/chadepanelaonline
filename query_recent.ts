import { pool } from './src/server/db';

async function test() {
  const [rows] = await pool.query('SELECT * FROM festas ORDER BY id DESC LIMIT 5');
  console.log(rows);
  process.exit(0);
}
test();
