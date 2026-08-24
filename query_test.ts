import { pool } from './src/server/db.js';

async function test() {
  try {
    const festaId = 1; // Assuming 1 exists
    const guestEmail = 'test@example.com';
    
    // Simulate GET /events/:code
    const [festas]: any = await pool.query(`
      SELECT 
        id, 
        titulo as brideName, 
        DATE_FORMAT(data_festa, "%Y-%m-%d") as date, 
        TIME_FORMAT(horario, "%H:%i") as time, 
        local_nome as location,
        endereco,
        premium as isPremium
      FROM festas 
      WHERE codigo_acesso = ? OR id = ?
    `, ['test', festaId]);
    console.log('Festas:', festas);

    const [guests]: any = await pool.query('SELECT id, nome, email, presenca_confirmada FROM convidados WHERE festa_id = ? AND email = ? LIMIT 1', [festaId, guestEmail]);
    console.log('Guests:', guests);

    if (guests.length > 0) {
      const guestId = guests[0].id;
      const [reservedGifts]: any = await pool.query(`
        SELECT lp.id, lp.nome_custom, ps.nome as p_nome, ps.foto_url as imagem_url 
        FROM reservas_presentes rp 
        JOIN lista_presentes lp ON rp.lista_presente_id = lp.id
        LEFT JOIN produtos_sugeridos ps ON lp.produto_sugerido_id = ps.id
        WHERE rp.convidado_id = ?
      `, [guestId]);
      console.log('Reserved gifts: ', reservedGifts);
    }
  } catch(e) { console.error('Error:', e); }
  process.exit(0);
}
test();
