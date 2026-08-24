import { pool } from './src/server/db';

async function test() {
  try {
    const [cols]: any = await pool.query("SHOW COLUMNS FROM lista_presentes");
    console.log(cols);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
test();
