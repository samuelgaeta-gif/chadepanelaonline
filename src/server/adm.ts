import express from 'express';
import { pool } from './db';
import jwt from 'jsonwebtoken';
import { sendMarketingWhatsApp } from './whatsappService';

export const admRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

// Admin login
admRouter.post('/login', async (req, res) => {
  try {
    const { user, password } = req.body;
    const [rows]: any = await pool.query('SELECT * FROM adm WHERE user = ? AND password = ?', [user, password]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const admin = rows[0];
    const token = jwt.sign({ id: admin.id, role: 'adm' }, JWT_SECRET, { expiresIn: '12h' });
    
    res.json({ token });
  } catch (err: any) {
    console.error('Admin login error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Middleware to protect admin routes
export const authorizeAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token is missing' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'adm') return res.status(403).json({ error: 'Unauthorized' });
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Admin stats
admRouter.get('/lists', authorizeAdmin, async (req: any, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        f.id,
        u.nome as organizerName, 
        u.email as organizerEmail,
        u.telefone as organizerPhone,
        u.cep as organizerCep,
        u.logradouro as organizerLogradouro,
        u.numero as organizerNumero,
        u.complemento as organizerComplemento,
        u.bairro as organizerBairro,
        u.cidade as organizerCidade,
        u.estado as organizerEstado,
        f.titulo as eventName, 
        f.data_festa as eventDate,
        f.endereco as eventEndereco,
        f.cep as eventCep,
        f.logradouro as eventLogradouro,
        f.numero as eventNumero,
        f.complemento as eventComplemento,
        f.bairro as eventBairro,
        f.cidade as eventCidade,
        f.estado as eventEstado,
        f.premium as isPremium,
        f.criado_em as createdAt,
        (SELECT COUNT(*) FROM convidados WHERE festa_id = f.id) as totalGuests,
        (SELECT COUNT(*) FROM lista_presentes WHERE festa_id = f.id) as totalGifts,
        DATEDIFF(f.data_festa, CURDATE()) as daysLeft,
        f.marketing_blast_manual_count as manualBlastCount
      FROM festas f
      JOIN usuarios u ON f.usuario_id = u.id
      ORDER BY f.criado_em DESC
    `);
    res.json(rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

admRouter.get('/anuncios', authorizeAdmin, async (req: any, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM anuncios ORDER BY criado_em DESC');
    res.json(rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

admRouter.post('/anuncios', authorizeAdmin, async (req: any, res) => {
  try {
    const { titulo, descricao, imagem_url, link, formato, paginas, ativo } = req.body;
    await pool.query(
      'INSERT INTO anuncios (titulo, descricao, imagem_url, link, formato, paginas, ativo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [titulo, descricao, imagem_url, link, formato, paginas, ativo !== undefined ? ativo : 1]
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

admRouter.put('/anuncios/:id', authorizeAdmin, async (req: any, res) => {
  try {
    const { titulo, descricao, imagem_url, link, formato, paginas, ativo } = req.body;
    await pool.query(
      'UPDATE anuncios SET titulo = ?, descricao = ?, imagem_url = ?, link = ?, formato = ?, paginas = ?, ativo = ? WHERE id = ?',
      [titulo, descricao, imagem_url, link, formato, paginas, ativo ? 1 : 0, req.params.id]
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

admRouter.delete('/anuncios/:id', authorizeAdmin, async (req: any, res) => {
  try {
    await pool.query('DELETE FROM anuncios WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

admRouter.get('/states', authorizeAdmin, async (req: any, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT u.estado as state, COUNT(f.id) as total
      FROM festas f
      JOIN usuarios u ON f.usuario_id = u.id
      WHERE u.estado IS NOT NULL AND u.estado != ''
      GROUP BY u.estado
    `);
    res.json(rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

admRouter.get('/stats', authorizeAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilterFestas = '';
    let dateFilterConvidados = '';
    let dateFilterPagamentos = '';
    let queryParams: any[] = [];
    
    if (startDate && endDate) {
      dateFilterFestas = ' WHERE criado_em BETWEEN ? AND ?';
      dateFilterConvidados = ' WHERE criado_em BETWEEN ? AND ?';
      dateFilterPagamentos = ' WHERE status IN ("approved", "pago") AND criado_em BETWEEN ? AND ?';
      queryParams = [startDate, endDate];
    } else {
      dateFilterPagamentos = ' WHERE status IN ("approved", "pago")';
    }

    // 1. Quantidade de listas totais
    const [totalFestasRows]: any = await pool.query(`SELECT COUNT(*) as count FROM festas${dateFilterFestas}`, queryParams);
    const totalFestas = totalFestasRows[0].count;

    // 2. Quantidade de convidados cadastrados
    const [totalConvidadosRows]: any = await pool.query(`SELECT COUNT(*) as count FROM convidados${dateFilterConvidados}`, queryParams);
    const totalConvidados = totalConvidadosRows[0].count;

    // 3. Quantidade de emails enviados (convite_enviado = 1)
    const [totalEmailsRows]: any = await pool.query(`SELECT COUNT(*) as count FROM convidados WHERE convite_enviado = 1${dateFilterConvidados ? ' AND criado_em BETWEEN ? AND ?' : ''}`, queryParams);
    const totalEmails = totalEmailsRows[0].count;

    // 4. Quantidade de valores arrecadados 
    const [totalValoresRows]: any = await pool.query(`SELECT SUM(valor) as total FROM pagamentos${dateFilterPagamentos}`, queryParams);
    const totalValoresPagamentos = Number(totalValoresRows[0].total) || 0;

    // 5. Gráfico de listas free x lista premium
    const [festasPremiumRows]: any = await pool.query(`SELECT COUNT(*) as count FROM festas WHERE premium = 1${dateFilterFestas ? ' AND criado_em BETWEEN ? AND ?' : ''}`, queryParams);
    const listasPremium = Number(festasPremiumRows[0].count) || 0;
    const listasFree = totalFestas - listasPremium;

    // Busca o valor da lista premium da tabela precos
    const [precoListaPremiumRows]: any = await pool.query('SELECT valor FROM precos WHERE nome = "lista_premium"');
    const precoListaPremium = precoListaPremiumRows.length > 0 ? Number(precoListaPremiumRows[0].valor) : 29.90;

    // Calcula os valores dos pagamentos mais a quantidade de listas premium * preco atual
    const totalValores = totalValoresPagamentos + (listasPremium * precoListaPremium);

    // 6. Quantidade de lista por periodo (Agrupado por mês e ano)
    const [listasPorPeriodoRows]: any = await pool.query(`
      SELECT DATE_FORMAT(criado_em, '%Y-%m') as mes, COUNT(*) as qtd
      FROM festas
      ${dateFilterFestas}
      GROUP BY mes
      ORDER BY mes
    `, queryParams);

    // 7. Quantidade de lista premium por periodo
    const [listasPremiumPorPeriodoRows]: any = await pool.query(`
      SELECT DATE_FORMAT(criado_em, '%Y-%m') as mes, COUNT(*) as qtd
      FROM festas
      WHERE premium = 1${dateFilterFestas ? ' AND criado_em BETWEEN ? AND ?' : ''}
      GROUP BY mes
      ORDER BY mes
    `, queryParams);

    res.json({
      totalFestas,
      totalConvidados,
      totalEmails,
      totalValores,
      listaGrafico: {
        free: listasFree,
        premium: listasPremium
      },
      listasPorPeriodo: listasPorPeriodoRows,
      listasPremiumPorPeriodo: listasPremiumPorPeriodoRows
    });

  } catch (err: any) {
    console.error('Admin stats error', err);
    res.status(500).json({ error: 'Internal error loading stats' });
  }
});

// Admin get pixels
admRouter.get('/pixels', authorizeAdmin, async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM config_pixel ORDER BY id ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao buscar pixels' });
  }
});

// Admin update pixel
admRouter.put('/pixels/:id', authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, ativo } = req.body;
    await pool.query('UPDATE config_pixel SET codigo = ?, ativo = ? WHERE id = ?', [codigo, ativo ? 1 : 0, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar pixel' });
  }
});

admRouter.get('/precos', authorizeAdmin, async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM precos');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao buscar preços' });
  }
});

// Admin update preco
admRouter.put('/precos/:id', authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { valor } = req.body;
    await pool.query('UPDATE precos SET valor = ? WHERE id = ?', [valor, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar preço' });
  }
});

// Marketing Blasts summary
admRouter.get('/marketing-blasts', authorizeAdmin, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT
        SUM(CASE WHEN DATEDIFF(f.data_festa, CURDATE()) > 30 AND f.marketing_blast_30d = 0 AND (SELECT COUNT(*) FROM convidados WHERE festa_id = f.id) = 0 THEN 1 ELSE 0 END) as pending_30d,
        SUM(CASE WHEN DATEDIFF(f.data_festa, CURDATE()) <= 20 AND DATEDIFF(f.data_festa, CURDATE()) > 10 AND f.marketing_blast_20d = 0 AND (SELECT COUNT(*) FROM convidados WHERE festa_id = f.id) = 0 THEN 1 ELSE 0 END) as pending_20d,
        SUM(CASE WHEN DATEDIFF(f.data_festa, CURDATE()) = 10 AND f.marketing_blast_10d = 0 AND (SELECT COUNT(*) FROM lista_presentes WHERE festa_id = f.id) = 0 THEN 1 ELSE 0 END) as pending_10d
      FROM festas f
    `);
    
    // Also add metrics for overall totals just in case
    res.json(rows[0] || { pending_30d: 0, pending_20d: 0, pending_10d: 0 });
  } catch (err: any) {
    console.error('Marketing blasts load error', err);
    res.status(500).json({ error: 'Erro ao buscar dados de disparos' });
  }
});

// Execute specific Marketing Blast
admRouter.post('/marketing-blasts/manual/:listId', authorizeAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    
    // Fetch the list 
    const [listQuery]: any = await pool.query(`
      SELECT f.id, u.telefone, u.nome, DATEDIFF(f.data_festa, CURDATE()) as daysLeft,
             (SELECT COUNT(*) FROM convidados WHERE festa_id = f.id) as qtd_convidados,
             (SELECT COUNT(*) FROM lista_presentes WHERE festa_id = f.id) as qtd_presentes
      FROM festas f
      JOIN usuarios u ON f.usuario_id = u.id
      WHERE f.id = ?
    `, [listId]);

    const list = listQuery[0];
    if (!list) {
      return res.status(404).json({ error: 'Lista não encontrada' });
    }

    if (list.daysLeft < 0) {
      return res.status(400).json({ error: 'O evento já ocorreu.' });
    }

    if (list.telefone) {
      const result = await sendMarketingWhatsApp(list.telefone, list.nome, list.daysLeft, list.qtd_convidados || 0);
      if (result && result.error) {
         return res.status(400).json({ error: 'Erro na API WhatsApp: ' + (result.body || result.error) });
      }
      await pool.query(`UPDATE festas SET marketing_blast_manual_count = marketing_blast_manual_count + 1 WHERE id = ?`, [listId]);
      return res.json({ success: true, message: 'Disparo manual realizado com sucesso' });
    } else {
      return res.status(400).json({ error: 'Organizador sem telefone' });
    }

  } catch (err: any) {
    console.error('Manual Marketing blast execute error', err);
    res.status(500).json({ error: 'Erro ao executar disparo' });
  }
});

// Execute Marketing Blast
admRouter.post('/marketing-blasts/send/:type', authorizeAdmin, async (req, res) => {
  try {
    const { type } = req.params; // '30', '20', or '10'
    const days = parseInt(type, 10);
    if (![30, 20, 10].includes(days)) {
      return res.status(400).json({ error: 'Tipo de disparo inválido' });
    }

    const colNameObj: { [key: number]: string } = {
       30: 'marketing_blast_30d',
       20: 'marketing_blast_20d',
       10: 'marketing_blast_10d'
    };
    const colName = colNameObj[days];
    
    let daysCondition = "";
    let countsCondition = "";
    if (days === 30) {
      daysCondition = "DATEDIFF(f.data_festa, CURDATE()) > 30";
      countsCondition = "(SELECT COUNT(*) FROM convidados WHERE festa_id = f.id) = 0";
    } else if (days === 20) {
      daysCondition = "DATEDIFF(f.data_festa, CURDATE()) <= 20 AND DATEDIFF(f.data_festa, CURDATE()) > 10";
      countsCondition = "(SELECT COUNT(*) FROM convidados WHERE festa_id = f.id) = 0";
    } else if (days === 10) {
      daysCondition = "DATEDIFF(f.data_festa, CURDATE()) = 10";
      countsCondition = "(SELECT COUNT(*) FROM lista_presentes WHERE festa_id = f.id) = 0";
    }

    // Fetch eligible lists
    const query = `
      SELECT f.id, u.telefone, u.nome,
             (SELECT COUNT(*) FROM convidados WHERE festa_id = f.id) as qtd_convidados
      FROM festas f
      JOIN usuarios u ON f.usuario_id = u.id
      WHERE ${daysCondition}
        AND f.${colName} = 0
        AND ${countsCondition}
    `;
    const [eligibleLists]: any = await pool.query(query);

    res.json({ sending: eligibleLists.length, message: 'Iniciando disparos em background' });

    // Process sends in background
    for (const list of eligibleLists) {
      if (list.telefone) {
        await sendMarketingWhatsApp(list.telefone, list.nome, days, list.qtd_convidados || 0);
      }
      await pool.query(`UPDATE festas SET ${colName} = 1 WHERE id = ?`, [list.id]);
    }

  } catch (err: any) {
    console.error('Marketing blast execute error', err);
    res.status(500).json({ error: 'Erro ao executar disparo' });
  }
});
