import { pool } from './src/server/db';
async function run() {
  await pool.query('ALTER TABLE lista_presentes MODIFY foto_custom_url LONGTEXT NULL;');
  console.log('done');
  process.exit();
}
run();
