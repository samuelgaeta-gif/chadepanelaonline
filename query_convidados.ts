import { pool } from './src/server/db';
async function run() {
  const [rows] = await pool.query('SHOW COLUMNS FROM convidados;');
  console.log(rows);
  process.exit();
}
run();
