import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { pool } from './db';
import { sendWelcomeEmail, sendPremiumUpgradeEmail, sendGuestInviteEmail, sendGuestGiftChosenEmail, sendOrganizerGiftNotificationEmail } from './emailService';
import { sendOrganizerGiftNotificationWhatsApp, sendWelcomeWhatsApp } from './whatsappService';

export const apiRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

// Mercado Pago Setup
const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-ACCESS-TOKEN';
const client = new MercadoPagoConfig({ 
  accessToken: mpAccessToken,
  options: { timeout: 10000 }
});
const paymentClient = new Payment(client);

apiRouter.get('/config/mercadopago', (req, res) => {
  res.json({
    publicKey: process.env.VITE_MERCADOPAGO_PUBLIC_KEY || process.env.MERCADOPAGO_PUBLIC_KEY || ''
  });
});

// Middleware for authentication
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

apiRouter.get('/config/precos', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT nome, valor FROM precos');
    const precosMap = rows.reduce((acc: any, curr: any) => {
      acc[curr.nome] = Number(curr.valor);
      return acc;
    }, {});
    
    // Provide defaults if not found in db
    if (precosMap.lista_premium === undefined) precosMap.lista_premium = 29.90;
    if (precosMap.convite === undefined) precosMap.convite = 0.00;
    if (precosMap.site === undefined) precosMap.site = 0.00;

    res.json(precosMap);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

apiRouter.get('/produtos_sugeridos', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT id, nome as name, categoria as category, foto_url as imageUrl FROM produtos_sugeridos ORDER BY id ASC');
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

apiRouter.get('/pixels', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT nome, codigo FROM config_pixel WHERE ativo = 1');
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

apiRouter.get('/test-wpp', async (req, res) => {
  try {
    const result = await sendWelcomeWhatsApp("5521967480999", "Samuel Gaeta");
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

apiRouter.post('/auth/google-sso', async (req, res) => {
  try {
    const { email, name, uid } = req.body;
    
    // Check if user exists
    let [users]: any = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    let user = users[0];

    if (!user) {
      // Create user if not exists
      const [result]: any = await pool.query(
        'INSERT INTO usuarios (nome, email, senha_hash, telefone) VALUES (?, ?, ?, ?)',
        [name, email, 'SSO_USER', '']
      );
      user = { id: result.insertId, nome: name, email };
      // Send welcome email
      sendWelcomeEmail(email, { nomeCliente: name, linkDashboard: `${req.protocol}://${req.get('host')}/dashboard` });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ 
      token, 
      isNewUser: !users[0],
      user: { 
        id: user.id, 
        name: user.nome, 
        email: user.email,
        telefone: user.telefone || '',
        logradouro: user.logradouro || '',
        cidade: user.cidade || '',
        estado: user.estado || '',
        cep: user.cep || '',
        numero: user.numero || '',
        complemento: user.complemento || '',
        bairro: user.bairro || ''
      } 
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, logradouro, cidade, estado, cep, numero, complemento, bairro } = req.body;
    
    // Check if email already exists
    const [existingUsers]: any = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'EMAIL_EXISTS', message: 'Este e-mail já está cadastrado.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result]: any = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, telefone, logradouro, cidade, estado, cep, numero, complemento, bairro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hash, phone || '', logradouro || '', cidade || '', estado || '', cep || '', numero || '', complemento || '', bairro || '']
    );
    const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET);
    // Send welcome email
    sendWelcomeEmail(email, { nomeCliente: name, linkDashboard: `${req.protocol}://${req.get('host')}/dashboard` });
    
    res.json({
      token,
      user: {
        id: result.insertId,
        name: name,
        email,
        telefone: phone || '',
        logradouro: logradouro || '',
        cidade: cidade || '',
        estado: estado || '',
        cep: cep || '',
        numero: numero || '',
        complemento: complemento || '',
        bairro: bairro || ''
      }
    });
  } catch (e: any) {
    console.error('[REGISTER ERROR]', e);
    res.status(400).json({ error: e?.sqlMessage || e?.message || String(e) || 'Erro desconhecido ao criar conta', code: e?.code });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows]: any = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.senha_hash))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.nome, 
        email: user.email,
        telefone: user.telefone || '',
        logradouro: user.logradouro || '',
        cidade: user.cidade || '',
        estado: user.estado || '',
        cep: user.cep || '',
        numero: user.numero || '',
        complemento: user.complemento || '',
        bairro: user.bairro || ''
      } 
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.get('/auth/me', authenticate, async (req: any, res) => {
  try {
    const [rows]: any = await pool.query('SELECT id, nome as name, email, telefone, logradouro, cidade, estado, cep, numero, complemento, bairro FROM usuarios WHERE id = ?', [req.user.id]);
    res.json({ user: rows[0] });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.put('/auth/me', authenticate, async (req: any, res) => {
  try {
    const { name, telefone, logradouro, cidade, estado, cep, numero, complemento, bairro } = req.body;
    await pool.query(
      'UPDATE usuarios SET nome = ?, telefone = ?, logradouro = ?, cidade = ?, estado = ?, cep = ?, numero = ?, complemento = ?, bairro = ? WHERE id = ?',
      [name, telefone, logradouro, cidade, estado, cep, numero, complemento, bairro, req.user.id]
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.get('/events', authenticate, async (req: any, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        f.id, 
        f.titulo as brideName, 
        DATE_FORMAT(f.data_festa, "%Y-%m-%d") as date, 
        TIME_FORMAT(f.horario, "%H:%i") as time, 
        f.codigo_acesso as code,
        f.premium as isPremium,
        f.local_nome as location,
        f.endereco,
        f.criado_em as createdAt,
        (SELECT COUNT(*) FROM convidados WHERE festa_id = f.id) as guestCount,
        (SELECT COUNT(*) FROM convidados WHERE festa_id = f.id AND presenca_confirmada = 1) as confirmedGuestCount,
        EXISTS(SELECT 1 FROM pagamentos p WHERE p.festa_id = f.id AND p.status = 'pendente' AND p.tipo = 'upgrade_plano') as hasPendingPayment
      FROM festas f
      WHERE f.usuario_id = ?
    `, [req.user.id]);
    const mapped = rows.map((r: any) => ({ 
      ...r, 
      id: r.code, 
      dbId: r.id, 
      hasPendingPayment: Boolean(r.hasPendingPayment) 
    }));
    res.json(mapped);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.post('/test-whatsapp', authenticate, async (req: any, res) => {
  const { phone, nome } = req.body;
  try {
    const result = await sendWelcomeWhatsApp(phone, nome);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/events', authenticate, async (req: any, res) => {
  try {
    const { brideName, date, time, location, theme, endereco } = req.body;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [result]: any = await pool.query(
      'INSERT INTO festas (usuario_id, titulo, data_festa, horario, local_nome, codigo_acesso, tema, endereco) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, brideName, date || null, time || null, location, code, theme, endereco || null]
    );

    try {
      // O WhatsApp de boas vindas só é enviado no momento em que a lista (festa) é criada, e não no cadastro.
      const [userRows]: any = await pool.query('SELECT telefone, nome FROM usuarios WHERE id = ?', [req.user.id]);
      if (userRows.length > 0 && userRows[0].telefone) {
        sendWelcomeWhatsApp(userRows[0].telefone, userRows[0].nome);
      }
    } catch (err: any) {
      console.error('[WHATSAPP ERROR in creation]', err.message);
    }

    res.json({ id: code, code, dbId: result.insertId });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.get('/events/:code/stats', async (req, res) => {
  try {
    const [festas]: any = await pool.query('SELECT id, titulo, codigo_acesso, premium FROM festas WHERE codigo_acesso = ? OR id = ?', [req.params.code, req.params.code]);
    if (!festas.length) return res.status(404).json({ error: 'Evento não encontrado' });
    const festa = festas[0];
    
    const [counts]: any = await pool.query('SELECT COUNT(*) as guestCount FROM convidados WHERE festa_id = ?', [festa.id]);
    const [countsConfirmed]: any = await pool.query('SELECT COUNT(*) as confirmedGuestCount FROM convidados WHERE festa_id = ? AND presenca_confirmada = 1', [festa.id]);
    const [gifts]: any = await pool.query('SELECT COUNT(*) as giftCount FROM lista_presentes WHERE festa_id = ? AND status = "reservado"', [festa.id]);
    const [totalGifts]: any = await pool.query('SELECT COUNT(*) as giftCount FROM lista_presentes WHERE festa_id = ?', [festa.id]);
    const [messages]: any = await pool.query('SELECT COUNT(*) as msgCount FROM depoimentos WHERE festa_id = ?', [festa.id]);

    res.json({
      id: festa.id,
      code: festa.codigo_acesso || festa.id,
      isPremium: festa.premium,
      guestCount: counts[0].guestCount,
      confirmedGuestCount: countsConfirmed[0].confirmedGuestCount,
      giftCount: totalGifts[0].giftCount,
      reservedGiftCount: gifts[0].giftCount,
      messageCount: messages[0].msgCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar stats' });
  }
});

apiRouter.get('/events/:code', async (req, res) => {
  try {
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
    `, [req.params.code, req.params.code]);
    if (!festas.length) return res.status(404).json({ error: 'Evento não encontrado' });
    const festa = festas[0];
    
    // Add guest count to the event object
    const [counts]: any = await pool.query('SELECT COUNT(*) as guestCount FROM convidados WHERE festa_id = ?', [festa.id]);
    const [countsConfirmed]: any = await pool.query('SELECT COUNT(*) as confirmedGuestCount FROM convidados WHERE festa_id = ? AND presenca_confirmada = 1', [festa.id]);
    festa.guestCount = counts[0].guestCount;
    festa.confirmedGuestCount = countsConfirmed[0].confirmedGuestCount;
    
    const [gifts]: any = await pool.query(`
      SELECT l.*, p.nome as cat_nome, p.descricao as cat_desc, p.foto_url as cat_foto 
      FROM lista_presentes l
      LEFT JOIN produtos_sugeridos p ON l.produto_sugerido_id = p.id
      WHERE l.festa_id = ?
    `, [festa.id]);

    const [pendingPayment]: any = await pool.query('SELECT 1 FROM pagamentos WHERE festa_id = ? AND status = "pendente" AND tipo = "upgrade_plano" LIMIT 1', [festa.id]);

    const mappedGifts = gifts.map((g: any) => ({
      id: g.id,
      name: g.nome_custom || g.cat_nome,
      description: g.descricao_custom || g.cat_desc,
      imageUrl: g.foto_custom_url || g.cat_foto,
      status: g.status === 'disponivel' ? 'available' : 'chosen',
      isSuggested: !!g.produto_sugerido_id
    }));

    let guest = null;
    if (req.query.phone) {
      const cleanPhone = String(req.query.phone).replace(/\D/g, '');
      const [guests]: any = await pool.query('SELECT id, nome, email, telefone, presenca_confirmada FROM convidados WHERE festa_id = ? AND REPLACE(REPLACE(REPLACE(REPLACE(telefone, "(", ""), ")", ""), "-", ""), " ", "") = ? LIMIT 1', [festa.id, cleanPhone]);
      if (guests.length > 0) {
        guest = guests[0];
        
        const [reservedGifts]: any = await pool.query(`
          SELECT lp.id, lp.nome_custom, ps.nome as p_nome, ps.foto_url as imagem_url 
          FROM reservas_presentes rp 
          JOIN lista_presentes lp ON rp.lista_presente_id = lp.id
          LEFT JOIN produtos_sugeridos ps ON lp.produto_sugerido_id = ps.id
          WHERE rp.convidado_id = ?
        `, [guest.id]);
        
        guest.reservedGifts = reservedGifts.map((r: any) => ({
          id: r.id,
          name: r.nome_custom || r.p_nome || 'Presente',
          imageUrl: r.imagem_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80'
        }));

        const [depoimentos]: any = await pool.query('SELECT mensagem FROM depoimentos WHERE festa_id = ? AND convidado_id = ? LIMIT 1', [festa.id, guest.id]);
        if (depoimentos.length > 0) {
          guest.mensagem = depoimentos[0].mensagem;
        }
      }
    }

    res.json({ 
      event: { 
        ...festa, 
        id: req.params.code, 
        dbId: festa.id,
        hasPendingPayment: pendingPayment.length > 0
      }, 
      gifts: mappedGifts,
      guest
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.post('/events/:id/gifts', authenticate, async (req: any, res) => {
  try {
    const { name, imageUrl, dbId, suggestedId } = req.body;
    if (suggestedId) {
      const [result]: any = await pool.query(
        'INSERT INTO lista_presentes (festa_id, produto_sugerido_id, status) VALUES (?, ?, "disponivel")',
        [dbId, suggestedId]
      );
      res.json({ id: result.insertId });
    } else {
      const [result]: any = await pool.query(
        'INSERT INTO lista_presentes (festa_id, nome_custom, foto_custom_url, status) VALUES (?, ?, ?, "disponivel")',
        [dbId, name, imageUrl]
      );
      res.json({ id: result.insertId });
    }
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.delete('/events/:dbId/gifts/:giftId', authenticate, async (req: any, res) => {
  try {
    const { dbId, giftId } = req.params;
    
    // Verificamos o status primeiro (só exclui se estiver disponivel)
    const [gifts]: any = await pool.query('SELECT status FROM lista_presentes WHERE id = ? AND festa_id = ?', [giftId, dbId]);
    if (gifts.length === 0) return res.status(404).json({ error: "Presente não encontrado." });
    
    if (gifts[0].status === 'reservado' || gifts[0].status === 'entregue') {
      return res.status(400).json({ error: "Presentes escolhidos não podem ser excluídos." });
    }

    await pool.query('DELETE FROM lista_presentes WHERE id = ?', [giftId]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.post('/events/:id/confirm-presence', async (req, res) => {
  try {
    const { guestName, guestPhone, message, dbId } = req.body;

    const [eventRows]: any = await pool.query('SELECT premium FROM festas WHERE id = ?', [dbId]);
    const isPremium = eventRows.length > 0 && eventRows[0].premium;

    let cleanPhone = "";
    if (guestPhone) {
        cleanPhone = guestPhone.replace(/\D/g, '');
    }

    let convidadoId;
    const [existing]: any = await pool.query('SELECT id FROM convidados WHERE festa_id = ? AND REPLACE(REPLACE(REPLACE(REPLACE(telefone, "(", ""), ")", ""), "-", ""), " ", "") = ?', [dbId, cleanPhone]);
    
    if (existing.length > 0) {
      convidadoId = existing[0].id;
      await pool.query('UPDATE convidados SET presenca_confirmada = 1 WHERE id = ?', [convidadoId]);
    } else {
      if (!isPremium) {
        const [countRows]: any = await pool.query('SELECT COUNT(*) as count FROM convidados WHERE festa_id = ?', [dbId]);
        if (countRows[0].count >= 10) {
          return res.status(403).json({ error: "Limite de convidados atingido no plano gratuito. Upgrade necessário!" });
        }
      }

      const [insertGuest]: any = await pool.query('INSERT INTO convidados (festa_id, nome, telefone, presenca_confirmada) VALUES (?, ?, ?, 1)', [dbId, guestName, guestPhone]);
      convidadoId = insertGuest.insertId;
    }

    if (message) {
      const [existingDepoimento]: any = await pool.query('SELECT id FROM depoimentos WHERE festa_id = ? AND convidado_id = ? LIMIT 1', [dbId, convidadoId]);
      if (existingDepoimento.length > 0) {
        await pool.query('UPDATE depoimentos SET mensagem = ? WHERE id = ?', [message, existingDepoimento[0].id]);
      } else {
        await pool.query('INSERT INTO depoimentos (festa_id, convidado_id, mensagem) VALUES (?, ?, ?)', [dbId, convidadoId, message]);
      }
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.post('/events/:id/gifts/reserve', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { giftIds, guestName, guestPhone, guestEmail, message, dbId } = req.body;
    const finalGiftIds = giftIds || [];
    await conn.beginTransaction();
    let cleanPhone = "";
    if (guestPhone) {
      cleanPhone = guestPhone.replace(/\D/g, '');
    }
    let convidadoId;
    const [existing]: any = await conn.query(
      'SELECT id FROM convidados WHERE festa_id = ? AND REPLACE(REPLACE(REPLACE(REPLACE(telefone, "(", ""), ")", ""), "-", ""), " ", "") = ? FOR UPDATE',
      [dbId, cleanPhone]
    );
    if (existing.length > 0) {
      convidadoId = existing[0].id;
      await conn.query('UPDATE convidados SET presenca_confirmada = 1 WHERE id = ?', [convidadoId]);
    } else {
      const [insertGuest]: any = await conn.query(
        'INSERT INTO convidados (festa_id, nome, telefone, presenca_confirmada) VALUES (?, ?, ?, 1)',
        [dbId, guestName, guestPhone]
      );
      convidadoId = insertGuest.insertId;
    }
    if (finalGiftIds.length > 0) {
      const [giftsByIdCheck]: any = await conn.query(
        'SELECT id, status FROM lista_presentes WHERE id IN (?) AND festa_id = ? FOR UPDATE',
        [finalGiftIds, dbId]
      );
      for (const giftId of finalGiftIds) {
        const gift = giftsByIdCheck.find((g: any) => g.id === giftId);
        if (!gift) {
          throw new Error(`Presente ${giftId} não encontrado neste evento`);
        }
        if (gift.status !== 'disponivel') {
          const [guestInfo]: any = await conn.query(
            'SELECT nome FROM convidados WHERE id IN (SELECT convidado_id FROM reservas_presentes WHERE lista_presente_id = ?) LIMIT 1',
            [giftId]
          );
          const reservedByName = guestInfo.length > 0 ? guestInfo[0].nome : 'outro convidado';
          throw new Error(`Este presente já foi escolhido por ${reservedByName}`);
        }
      }
      for (const giftId of finalGiftIds) {
        const [updateResult]: any = await conn.query(
          'UPDATE lista_presentes SET status = "reservado" WHERE id = ? AND status = "disponivel"',
          [giftId]
        );
        if (updateResult.affectedRows === 0) {
          throw new Error(`Falha ao reservar presente ${giftId}`);
        }
        await conn.query(
          'INSERT INTO reservas_presentes (lista_presente_id, convidado_id) VALUES (?, ?)',
          [giftId, convidadoId]
        );
      }
    }
    if (message) {
      await conn.query(
        'INSERT INTO depoimentos (festa_id, convidado_id, mensagem) VALUES (?, ?, ?)',
        [dbId, convidadoId, message]
      );
    }
    await conn.commit();
    if (finalGiftIds.length > 0) {
      const { sendGuestGiftChosenEmail, sendOrganizerGiftNotificationEmail } = await import('./emailService');
      const { sendOrganizerGiftNotificationWhatsApp } = await import('./whatsappService');
      const [rows]: any = await conn.query(
        `SELECT l.nome_custom, ps.nome as p_nome, u.email as orgEmail, u.telefone as orgPhone, u.nome as orgName, f.titulo as brideName FROM lista_presentes l LEFT JOIN produtos_sugeridos ps ON ps.id = l.produto_sugerido_id JOIN festas f ON f.id = l.festa_id JOIN usuarios u ON u.id = f.usuario_id WHERE l.id IN (?)`,
        [finalGiftIds]
      );
      if (rows.length > 0) {
        const g = rows[0];
        const presentesDesejados = rows.map((r: any) => r.nome_custom || r.p_nome || 'Presente').join(', ');
        if (guestEmail) {
          sendGuestGiftChosenEmail(guestEmail, { nomeConvidado: guestName, nomePresente: presentesDesejados, nomeDosNoivos: g.brideName }).catch((err: any) => console.error('[EMAIL]', err.message));
        }
        const baseUrl = process.env.VITE_APP_URL || 'https://chadepanelaonline.com.br';
        sendOrganizerGiftNotificationEmail(g.orgEmail, { nomeOrganizador: g.orgName, nomeConvidado: guestName, nomePresente: presentesDesejados, linkDashboard: `${baseUrl}/dashboard` }).catch((err: any) => console.error('[EMAIL]', err.message));
        if (g.orgPhone) {
          sendOrganizerGiftNotificationWhatsApp(g.orgPhone, guestName, presentesDesejados, g.orgName).catch((err: any) => console.error('[WHATSAPP]', err.message));
        }
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    await conn.rollback();
    console.error('[GIFT RESERVE ERROR]', err.message);
    if (err.message.includes('já foi escolhido por')) {
      return res.status(409).json({ error: err.message, code: 'GIFT_ALREADY_RESERVED' });
    }
    if (err.message.includes('não encontrado')) {
      return res.status(404).json({ error: err.message, code: 'GIFT_NOT_FOUND' });
    }
    res.status(400).json({ error: err.message || 'Erro ao confirmar escolha do presente', code: 'UNKNOWN_ERROR' });
  } finally {
    await conn.release();
  }
});

// Helper to process approved payments
async function processApprovedPayment(pagId: number, festaId: number, tipo: string, giftId: number | null) {
  await pool.query('UPDATE pagamentos SET status = "aprovado" WHERE id = ?', [pagId]);
  
  if (tipo === 'upgrade_plano') {
    await pool.query('UPDATE festas SET premium = 1 WHERE id = ?', [festaId]);
    console.log(`[PAYMENT] Evento ${festaId} atualizado para PREMIUM.`);
    const [rows]: any = await pool.query('SELECT u.nome as organizerName, u.email as organizerEmail, f.titulo as brideName FROM festas f JOIN usuarios u ON f.usuario_id = u.id WHERE f.id = ?', [festaId]);
    if (rows.length > 0) {
      const baseUrl = process.env.VITE_APP_URL || 'https://chadepanelaonline.com.br';
      sendPremiumUpgradeEmail(rows[0].organizerEmail, { nomeCliente: rows[0].organizerName, nomeEvento: rows[0].brideName, linkDashboard: `${baseUrl}/dashboard` });
    }
  } else if (giftId) {
    await pool.query('UPDATE lista_presentes SET status = "reservado" WHERE id = ?', [giftId]);
    console.log(`[PAYMENT] Presente ${giftId} reservado.`);
    const [rows]: any = await pool.query(`
      SELECT p.nome_convidado, p.email_convidado, l.nome_custom, ps.nome as p_nome, u.email as orgEmail, u.telefone as orgPhone, u.nome as orgName, f.titulo as brideName 
      FROM pagamentos p 
      JOIN lista_presentes l ON l.id = p.lista_presente_id 
      LEFT JOIN produtos_sugeridos ps ON ps.id = l.produto_sugerido_id
      JOIN festas f ON f.id = l.festa_id
      JOIN usuarios u ON u.id = f.usuario_id
      WHERE p.id = ?
    `, [pagId]);
    if (rows.length > 0) {
      const g = rows[0];
      const nomePresente = g.nome_custom || g.p_nome || 'Presente Especial';
      sendGuestGiftChosenEmail(g.email_convidado, { nomeConvidado: g.nome_convidado, nomePresente, nomeDosNoivos: g.brideName });
      const baseUrl = process.env.VITE_APP_URL || 'https://chadepanelaonline.com.br';
      sendOrganizerGiftNotificationEmail(g.orgEmail, { nomeOrganizador: g.orgName, nomeConvidado: g.nome_convidado, nomePresente, linkDashboard: `${baseUrl}/dashboard` });
      if (g.orgPhone) {
        sendOrganizerGiftNotificationWhatsApp(g.orgPhone, g.nome_convidado, nomePresente, g.orgName);
      }
    }
  }
}

// Background poller for pending payments
async function checkPendingPayments() {
  try {
    const [pending]: any = await pool.query('SELECT * FROM pagamentos WHERE status = "pendente" AND mercadopago_id IS NOT NULL');
    
    for (const pag of pending) {
      try {
        const payment = await paymentClient.get({ id: pag.mercadopago_id });
        if (payment.status === 'approved') {
          await processApprovedPayment(pag.id, pag.festa_id, pag.tipo, pag.lista_presente_id);
        } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
          await pool.query('UPDATE pagamentos SET status = "cancelado" WHERE id = ?', [pag.id]);
        }
      } catch (err: any) {
        console.error(`Error checking payment ${pag.mercadopago_id}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("Background poller error:", err.message);
  }
}

// Start polling every 5 minutes
setInterval(checkPendingPayments, 5 * 60 * 1000);

apiRouter.post('/payments/mercadopago/transaction', async (req, res) => {
  try {
    let { amount, description, token, issuer_id, payment_method_id, installments, payer_email, payer, metadata } = req.body;

    // Securely retrieve the upgrade price from DB if this is an upgrade
    if (metadata && metadata.type === "upgrade_plano") {
      const [precoRows]: any = await pool.query('SELECT valor FROM precos WHERE nome = "lista_premium"');
      if (precoRows.length > 0) {
        amount = Number(precoRows[0].valor);
      } else {
        amount = 29.90;
      }
    }
    
    // Use payer.email if payer_email is not provided directly
    const email = payer_email || (payer && payer.email);

    const paymentData: any = {
      body: {
        transaction_amount: Number(amount),
        token,
        description,
        installments: Number(installments) || 1,
        payment_method_id,
        issuer_id,
        payer: {
          ...payer,
          email: email || payer?.email || "user@example.com",
        },
      }
    };

    const result = await paymentClient.create(paymentData);
    
    // Log for debugging
    console.log("MP Result Status:", result.status);

    if (result.status === 'approved' || result.status === 'in_process' || result.status === 'pending') {
      const transactionId = String(result.id);
      const dbStatus = result.status === 'approved' ? 'aprovado' : 'pendente';

      if (metadata?.type === 'upgrade_plano') {
        const [insert]: any = await pool.query(
          'INSERT INTO pagamentos (festa_id, valor, tipo, status, mercadopago_id) VALUES (?, ?, ?, ?, ?)',
          [metadata.dbId, amount, 'upgrade_plano', dbStatus, transactionId]
        );
        
        if (result.status === 'approved') {
          await processApprovedPayment(insert.insertId, metadata.dbId, 'upgrade_plano', null);
        }
      } else {
        const [insert]: any = await pool.query(
          'INSERT INTO pagamentos (festa_id, nome_convidado, email_convidado, lista_presente_id, valor, status, mercadopago_id, tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [metadata.dbId, metadata.guestName, metadata.guestEmail, metadata.giftId, amount, dbStatus, transactionId, 'presente']
        );
        
        if (result.status === 'approved') {
          await processApprovedPayment(insert.insertId, metadata.dbId, 'presente', metadata.giftId);
        }
      }

      // Return full result for the Brick
      res.json({ success: true, ...result });
    } else {
      res.status(400).json({ error: `Pagamento ${result.status}: ${result.status_detail}`, ...result });
    }
  } catch (e: any) {
    console.error("MP Error Details:", e.message);
    if (e.cause && Array.isArray(e.cause)) {
      console.error("MP Error Causes:", JSON.stringify(e.cause, null, 2));
      const details = e.cause.map((c: any) => c.description).join(', ');
      return res.status(400).json({ error: `Erro Mercado Pago: ${details}` });
    }
    res.status(400).json({ error: e.message || 'Erro ao processar com Mercado Pago' });
  }
});

apiRouter.post('/payments/mercadopago/webhook', async (req, res) => {
  try {
    const { action, data } = req.body;
    
    // Mercado Pago sends action as 'payment.created' or 'payment.updated'
    // or just the id depending on the version
    const paymentId = data?.id || req.body?.id;
    
    if (paymentId) {
      const payment = await paymentClient.get({ id: paymentId });
      
      if (payment.status === 'approved') {
        const [pags]: any = await pool.query('SELECT * FROM pagamentos WHERE mercadopago_id = ?', [String(payment.id)]);
        if (pags.length > 0) {
          const pag = pags[0];
          if (pag.status !== 'aprovado') {
            await processApprovedPayment(pag.id, pag.festa_id, pag.tipo, pag.lista_presente_id);
          }
        }
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        await pool.query('UPDATE pagamentos SET status = "cancelado" WHERE mercadopago_id = ?', [String(payment.id)]);
      }
    }
    
    res.sendStatus(200);
  } catch (e: any) {
    console.error("Webhook Error:", e);
    // Return 200 to Mercado Pago even on error to stop retries if it's a logic error
    res.sendStatus(200);
  }
});

apiRouter.get('/payments/verify', authenticate, async (req: any, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) return res.status(400).json({ error: "eventId is required" });

    const [pags]: any = await pool.query(
      'SELECT * FROM pagamentos WHERE festa_id = ? AND status = "pendente" AND tipo = "upgrade_plano" ORDER BY criado_em DESC LIMIT 1',
      [eventId]
    );

    if (pags.length === 0) {
      return res.json({ updated: false, status: 'none' });
    }

    const pag = pags[0];
    if (!pag.mercadopago_id) return res.json({ updated: false, status: 'pendente' });

    const payment = await paymentClient.get({ id: pag.mercadopago_id });
    
    if (payment.status === 'approved') {
      await processApprovedPayment(pag.id, pag.festa_id, pag.tipo, pag.lista_presente_id);
      return res.json({ updated: true, status: 'approved' });
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        await pool.query('UPDATE pagamentos SET status = "cancelado" WHERE id = ?', [pag.id]);
        return res.json({ updated: true, status: 'cancelled' });
    }

    res.json({ updated: false, status: payment.status });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Event Management
apiRouter.get('/events/:dbId/guests', authenticate, async (req: any, res) => {
  try {
    const { dbId } = req.params;
    const [guests]: any = await pool.query('SELECT * FROM convidados WHERE festa_id = ? ORDER BY criado_em DESC', [dbId]);
    res.json(guests);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.post('/events/:dbId/guests', authenticate, async (req: any, res) => {
  try {
    const { dbId } = req.params;
    const { nome, email, telefone } = req.body;
    
    // Check for premium status and guest limit
    const [eventRows]: any = await pool.query('SELECT premium FROM festas WHERE id = ?', [dbId]);
    if (eventRows.length > 0 && !eventRows[0].premium) {
      const [countRows]: any = await pool.query('SELECT COUNT(*) as count FROM convidados WHERE festa_id = ?', [dbId]);
      if (countRows[0].count >= 10) {
        return res.status(403).json({ error: "Limite de convidados atingido no plano gratuito. Faça upgrade para Premium!" });
      }
    }

    if (!telefone) {
      return res.status(400).json({ error: "O telefone é obrigatório para cadastrar um convidado." });
    }

    // Check for existing email or phone
    const [existingGuests]: any = await pool.query(
      'SELECT email, telefone FROM convidados WHERE festa_id = ? AND ((email != "" AND email = ?) OR (telefone != "" AND telefone = ?))', 
      [dbId, email || '', telefone || '']
    );

    if (existingGuests.length > 0) {
       for (const existing of existingGuests) {
         if (email && existing.email === email) {
           return res.status(400).json({ error: "Este email já está cadastrado nesta lista de convidados." });
         }
         if (telefone && existing.telefone === telefone) {
           return res.status(400).json({ error: "Este telefone já está cadastrado nesta lista de convidados." });
         }
       }
    }

    const [result]: any = await pool.query(
      'INSERT INTO convidados (festa_id, nome, email, telefone, convite_enviado) VALUES (?, ?, ?, ?, 0)',
      [dbId, nome, email || null, telefone]
    );

    res.json({ id: result.insertId, nome, email: email || null, telefone, convite_enviado: 0 });
  } catch (e: any) {
    console.error("[ADD GUEST ERRO]", e);
    if (e?.message?.includes('uq_convidado_festa_email')) {
      return res.status(400).json({ error: "Este email já está na lista de convidados desta festa." });
    }
    res.status(400).json({ error: e.message });
  }
});

apiRouter.post('/events/:dbId/guests/:guestId/invite', authenticate, async (req: any, res) => {
  try {
    const { dbId, guestId } = req.params;
    const [guests]: any = await pool.query('SELECT * FROM convidados WHERE id = ? AND festa_id = ?', [guestId, dbId]);
    if (guests.length === 0) return res.status(404).json({ error: "Convidado não encontrado." });

    const guest = guests[0];
    if (!guest.email) return res.status(400).json({ error: "Este convidado não possui e-mail cadastrado." });

    let emailEnviado = 1;
    const [festa]: any = await pool.query('SELECT titulo as brideName, DATE_FORMAT(data_festa, "%Y-%m-%d") as data_festa, horario, local_nome, codigo_acesso, endereco FROM festas WHERE id = ?', [dbId]);
    if (festa.length > 0) {
      const f = festa[0];
      const host = req.get('host') || '';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const linkEvento = `${protocol}://${host}/event/${f.codigo_acesso}?email=${encodeURIComponent(guest.email)}`;
      try {
        const emailSuccess = await sendGuestInviteEmail(guest.email, { 
          nomeConvidado: guest.nome, 
          nomeDosNoivos: f.brideName, 
          dataEvento: f.data_festa, 
          horaEvento: f.horario, 
          localEvento: f.local_nome,
          enderecoEvento: f.endereco,
          linkEvento,
          codigoLista: f.codigo_acesso
        });
        if (!emailSuccess) {
           console.log("Aviso: Email nao enviado via SMTP, ignorando erro.");
        }
        await pool.query('UPDATE convidados SET convite_enviado = 1 WHERE id = ?', [guestId]);
      } catch (err: any) {
        console.error("Erro interno ao reenviar email do convidado", err);
      }
    }
    
    if(emailEnviado === 1) {
      res.json({ success: true, convite_enviado: 1 });
    } else {
      res.status(400).json({ error: "Falha ao enviar e-mail. Verifique a caixa de saída ou aguarde um momento." });
    }
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.patch('/events/:dbId/address', authenticate, async (req: any, res) => {
  try {
    const { dbId } = req.params;
    const { cep, logradouro, numero, complemento, bairro, cidade, estado } = req.body;
    
    await pool.query(
      'UPDATE festas SET cep = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ? WHERE id = ?',
      [cep, logradouro, numero, complemento, bairro, cidade, estado, dbId]
    );
    
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.patch('/events/:dbId', authenticate, async (req: any, res) => {
  try {
    const { dbId } = req.params;
    const { bride_name, endereco, data, horario } = req.body;
    
    await pool.query(
      'UPDATE festas SET titulo = ?, endereco = ?, data_festa = ?, horario = ? WHERE id = ?',
      [bride_name, endereco, data || null, horario || null, dbId]
    );
    
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.patch('/events/:dbId/guests/:guestId', authenticate, async (req: any, res) => {
  try {
    const { dbId, guestId } = req.params;
    const { email } = req.body;
    
    // Check for existing email on other guests
    if (email) {
      const [existingGuests]: any = await pool.query(
        'SELECT id FROM convidados WHERE festa_id = ? AND email = ? AND id != ?', 
        [dbId, email, guestId]
      );
      if (existingGuests.length > 0) {
        return res.status(400).json({ error: "Este email já está cadastrado nesta lista de convidados." });
      }
    }

    await pool.query(
      'UPDATE convidados SET email = ? WHERE id = ? AND festa_id = ?',
      [email || null, guestId, dbId]
    );
    
    res.json({ success: true, email: email || null });
  } catch (e: any) {
    if (e?.message?.includes('uq_convidado_festa_email')) {
      return res.status(400).json({ error: "Este email já está na lista de convidados desta festa." });
    }
    res.status(400).json({ error: e.message });
  }
});

apiRouter.delete('/events/:dbId/guests/:guestId', authenticate, async (req: any, res) => {
  try {
    const { dbId, guestId } = req.params;
    
    // Check if guest exists and belongs to the event
    const [guests]: any = await pool.query('SELECT id FROM convidados WHERE id = ? AND festa_id = ?', [guestId, dbId]);
    if (guests.length === 0) return res.status(404).json({ error: "Convidado não encontrado." });

    await pool.query('DELETE FROM convidados WHERE id = ?', [guestId]);
    
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.post('/events/:dbId/invite-all', authenticate, async (req: any, res) => {
  try {
    const { dbId } = req.params;
    const [guests]: any = await pool.query('SELECT * FROM convidados WHERE festa_id = ? AND convite_enviado = 0', [dbId]);
    const [festa]: any = await pool.query('SELECT titulo as brideName, DATE_FORMAT(data_festa, "%Y-%m-%d") as data_festa, horario, local_nome, codigo_acesso, endereco FROM festas WHERE id = ?', [dbId]);
    
    let sentCount = 0;
    for (const guest of guests) {
      if (!guest.email) continue;

      if (festa.length > 0) {
        const f = festa[0];
        const host = req.get('host') || '';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const linkEvento = `${protocol}://${host}/event/${f.codigo_acesso}?email=${encodeURIComponent(guest.email)}`;
        try {
          const emailSuccess = await sendGuestInviteEmail(guest.email, { 
            nomeConvidado: guest.nome, 
            nomeDosNoivos: f.brideName, 
            dataEvento: f.data_festa, 
            horaEvento: f.horario, 
            localEvento: f.local_nome,
            enderecoEvento: f.endereco,
            linkEvento,
            codigoLista: f.codigo_acesso
          });
          if (!emailSuccess) {
            console.log(`Aviso: Email nao enviado via SMTP para ${guest.email}, ignorando.`);
          }
          await pool.query('UPDATE convidados SET convite_enviado = 1 WHERE id = ?', [guest.id]);
          sentCount++;
        } catch (err: any) {
          console.error("Failed to send invite email internally to array item", err);
        }
      }
    }
    
    res.json({ success: true, count: sentCount, totalFailed: guests.length - sentCount });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.get('/events/:id/messages', async (req, res) => {
  try {
    const { dbId } = req.query;
    const [messages] = await pool.query(`
      SELECT d.id, d.mensagem as message, c.nome as guestName, d.criado_em 
      FROM depoimentos d
      JOIN convidados c ON d.convidado_id = c.id
      WHERE d.festa_id = ?
      ORDER BY d.criado_em DESC
    `, [dbId]);
    res.json(messages);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
