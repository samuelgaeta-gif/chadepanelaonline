import mysql from 'mysql2/promise';

const parseEnv = (val: string | undefined, fallback: string) => {
  if (!val) return fallback;
  const cleaned = val.trim().replace(/["']/g, '');
  // Ignore common placeholder formats like %VAR% or {VAR}
  if (cleaned.startsWith('%') && cleaned.endsWith('%')) return fallback;
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) return fallback;
  return cleaned;
};

const dbConfig = {
  host: parseEnv(process.env.DB_HOST, 'localhost'),
  user: parseEnv(process.env.DB_USER, 'root'),
  password: parseEnv(process.env.DB_PASSWORD, ''),
  database: parseEnv(process.env.DB_NAME, ''),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  console.warn('[DB] Uma ou mais variáveis de ambiente DB_HOST/DB_USER/DB_PASSWORD/DB_NAME não foram definidas. Configure-as no ambiente (ex: Railway) antes de rodar em produção.');
}

console.log(`[DB] Attempting connection to ${dbConfig.host} as ${dbConfig.user}`);

export const pool = mysql.createPool(dbConfig);

async function addColumnIfNotExists(table: string, column: string, definition: string) {
  try {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`[DB] Column ${column} added to ${table}`);
  } catch (err: any) {
    if (!err.message.includes('Duplicate column name')) {
      console.error(`[DB ERROR] Adding column ${column} to ${table}:`, err.message);
    }
  }
}

async function dropColumnIfExists(table: string, column: string) {
  try {
    await pool.query(`ALTER TABLE ${table} DROP COLUMN ${column}`);
    console.log(`[DB] Column ${column} dropped from ${table}`);
  } catch (err: any) {
    // If column doesn't exist, ignore the error
  }
}

async function initDb() {
  try {
    // Create Pagamentos table if it doesnt exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pagamentos (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        festa_id INT UNSIGNED NOT NULL,
        nome_convidado VARCHAR(120),
        email_convidado VARCHAR(180),
        lista_presente_id INT UNSIGNED NULL, -- NULL if it's a plan upgrade
        tipo ENUM('presente', 'upgrade_plano') DEFAULT 'presente',
        valor DECIMAL(10,2) NOT NULL,
        mercadopago_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pendente',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Convidados table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS convidados (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        festa_id INT UNSIGNED NOT NULL,
        nome VARCHAR(120) NOT NULL,
        email VARCHAR(180) NOT NULL,
        telefone VARCHAR(20),
        convite_enviado TINYINT(1) DEFAULT 0,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Admin table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS adm (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user VARCHAR(120) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Precos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS precos (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(50) NOT NULL UNIQUE,
        valor DECIMAL(10,2) NOT NULL
      )
    `);

    // Insert default admin if table is empty
    const [adminRows]: any = await pool.query('SELECT * FROM adm WHERE user = ?', ['adm']);
    if (adminRows.length === 0) {
      await pool.query('INSERT INTO adm (user, password) VALUES (?, ?)', ['adm', 'lisa 3008']);
    }

    // Create Anuncios table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS anuncios (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(120),
        descricao TEXT,
        imagem_url VARCHAR(255),
        link VARCHAR(255),
        formato VARCHAR(50),
        paginas VARCHAR(255),
        ativo TINYINT(1) DEFAULT 1,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Produtos Sugeridos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos_sugeridos (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        categoria VARCHAR(100),
        descricao TEXT,
        foto_url VARCHAR(255),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure backwards compatibility with old table lacking 'categoria'
    await addColumnIfNotExists('produtos_sugeridos', 'categoria', "VARCHAR(100)");

    // Clean up older items without categories to force re-insertion
    await pool.query(`DELETE FROM produtos_sugeridos WHERE categoria IS NULL OR categoria = ''`);

    // Insert default precos if table is empty

    const [precosRows]: any = await pool.query('SELECT * FROM precos');
    if (precosRows.length === 0) {
      await pool.query(`
        INSERT INTO precos (nome, valor) VALUES 
        ('lista_premium', 29.90),
        ('convite', 0.00),
        ('site', 0.00)
      `);
    }

    // Insert default produtos_sugeridos if it is empty
    const [produtosRows]: any = await pool.query('SELECT COUNT(*) as count FROM produtos_sugeridos');
    if (produtosRows[0].count === 0) {
      await pool.query(`
        INSERT INTO produtos_sugeridos (nome, categoria, foto_url) VALUES 
        ('Colher de pau', '🍳 Utensílios de Cozinha', '/produtos/Colher de pau.png'),
        ('Espátula de silicone', '🍳 Utensílios de Cozinha', '/produtos/Espátula de silicone.png'),
        ('Espátula de inox', '🍳 Utensílios de Cozinha', '/produtos/Espátula de inox.png'),
        ('Concha', '🍳 Utensílios de Cozinha', '/produtos/Concha.png'),
        ('Escumadeira', '🍳 Utensílios de Cozinha', '/produtos/Escumadeira.png'),
        ('Pegador de massa', '🍳 Utensílios de Cozinha', '/produtos/Pegador de massa.png'),
        ('Pegador de salada', '🍳 Utensílios de Cozinha', '/produtos/Pegador de salada.png'),
        ('Batedor de arame (fouet)', '🍳 Utensílios de Cozinha', '/produtos/Batedor de arame (fouet).png'),
        ('Ralador', '🍳 Utensílios de Cozinha', '/produtos/Ralador.png'),
        ('Descascador de legumes', '🍳 Utensílios de Cozinha', '/produtos/Descascador de legumes.png'),
        ('Abridor de latas', '🍳 Utensílios de Cozinha', '/produtos/Abridor de latas.png'),
        ('Abridor de garrafas', '🍳 Utensílios de Cozinha', '/produtos/Abridor de garrafas.png'),
        ('Saca-rolhas', '🍳 Utensílios de Cozinha', '/produtos/Saca-rolhas.png'),
        ('Cortador de pizza', '🍳 Utensílios de Cozinha', '/produtos/Cortador de pizza.png'),
        ('Amassador de batatas', '🍳 Utensílios de Cozinha', '/produtos/Amassador de batatas.png'),
        ('Espremedor de alho', '🍳 Utensílios de Cozinha', '/produtos/Espremedor de alho.png'),
        ('Espremedor de limão', '🍳 Utensílios de Cozinha', '/produtos/Espremedor de limão.png'),
        ('Funil', '🍳 Utensílios de Cozinha', '/produtos/Funil.png'),
        ('Peneira', '🍳 Utensílios de Cozinha', '/produtos/Peneira.png'),
        ('Medidores de cozinha (xícaras e colheres)', '🍳 Utensílios de Cozinha', '/produtos/Medidores de cozinha (xícaras e colheres).png')
      `);

      await pool.query(`
        INSERT INTO produtos_sugeridos (nome, categoria, foto_url) VALUES 
        ('Faca de chef', '🔪 Facas e Cortes', '/produtos/Faca de chef.png'),
        ('Faca para pão', '🔪 Facas e Cortes', '/produtos/Faca para pão.png'),
        ('Faca para legumes', '🔪 Facas e Cortes', '/produtos/Faca para legumes.png'),
        ('Jogo de facas', '🔪 Facas e Cortes', '/produtos/Jogo de facas.png'),
        ('Tábua de corte pequena', '🔪 Facas e Cortes', '/produtos/Tábua de corte pequena.png'),
        ('Tábua de corte grande', '🔪 Facas e Cortes', '/produtos/Tábua de corte grande.png'),
        ('Afiador de facas', '🔪 Facas e Cortes', '/produtos/Afiador de facas.png'),
        ('Panela pequena', '🍲 Panelas e Formas', '/produtos/Panela pequena.png'),
        ('Panela média', '🍲 Panelas e Formas', '/produtos/Panela média.png'),
        ('Panela grande', '🍲 Panelas e Formas', '/produtos/Panela grande.png'),
        ('Panela de pressão', '🍲 Panelas e Formas', '/produtos/Panela de pressão.png'),
        ('Frigideira antiaderente', '🍲 Panelas e Formas', '/produtos/Frigideira antiaderente.png'),
        ('Grill', '🍲 Panelas e Formas', '/produtos/Grill.png'),
        ('Leiteira', '🍲 Panelas e Formas', '/produtos/Leiteira.png')
      `);

      await pool.query(`
        INSERT INTO produtos_sugeridos (nome, categoria, foto_url) VALUES 
        ('Assadeira retangular', '🍲 Panelas e Formas', '/produtos/Assadeira retangular.png'),
        ('Assadeira redonda', '🍲 Panelas e Formas', '/produtos/Assadeira redonda.png'),
        ('Forma para bolo', '🍲 Panelas e Formas', '/produtos/Forma para bolo.png'),
        ('Forma para pudim', '🍲 Panelas e Formas', '/produtos/Forma para pudim.png'),
        ('Forma para pizza', '🍲 Panelas e Formas', '/produtos/Forma para pizza.png'),
        ('Jogo de tigelas', '🥗 Tigelas e Recipientes', '/produtos/Jogo de tigelas.png'),
        ('Saladeira', '🥗 Tigelas e Recipientes', '/produtos/Saladeira.png'),
        ('Bowl para cereais', '🥗 Tigelas e Recipientes', '/produtos/Bowl para cereais.png'),
        ('Potes herméticos', '🥗 Tigelas e Recipientes', '/produtos/Potes herméticos.png'),
        ('Potes para mantimentos', '🥗 Tigelas e Recipientes', '/produtos/Potes para mantimentos.png'),
        ('Jarra para suco', '🥗 Tigelas e Recipientes', '/produtos/Jarra para suco.png'),
        ('Garrafa térmica', '🥗 Tigelas e Recipientes', '/produtos/Garrafa térmica.png')
      `);

      await pool.query(`
        INSERT INTO produtos_sugeridos (nome, categoria, foto_url) VALUES 
        ('Jogo de pratos rasos', '🍽️ Mesa Posta', '/produtos/Jogo de pratos rasos.png'),
        ('Jogo de pratos fundos', '🍽️ Mesa Posta', '/produtos/Jogo de pratos fundos.png'),
        ('Jogo de pratos de sobremesa', '🍽️ Mesa Posta', '/produtos/Jogo de pratos de sobremesa.png'),
        ('Jogo de copos', '🍽️ Mesa Posta', '/produtos/Jogo de copos.png'),
        ('Taças para água', '🍽️ Mesa Posta', '/produtos/Taças para água.png'),
        ('Taças para vinho', '🍽️ Mesa Posta', '/produtos/Taças para vinho.png'),
        ('Jogo de talheres', '🍽️ Mesa Posta', '/produtos/Jogo de talheres.png'),
        ('Faqueiro', '🍽️ Mesa Posta', '/produtos/Faqueiro.png'),
        ('Travessas', '🍽️ Mesa Posta', '/produtos/Travessas.png'),
        ('Petisqueira', '🍽️ Mesa Posta', '/produtos/Petisqueira.png'),
        ('Porta-guardanapos', '🍽️ Mesa Posta', '/produtos/Porta-guardanapos.png')
      `);

      await pool.query(`
        INSERT INTO produtos_sugeridos (nome, categoria, foto_url) VALUES 
        ('Xícaras de café', '☕ Café e Chá', '/produtos/Xícaras de café.png'),
        ('Xícaras de chá', '☕ Café e Chá', '/produtos/Xícaras de chá.png'),
        ('Bule', '☕ Café e Chá', '/produtos/Bule.png'),
        ('Açucareiro', '☕ Café e Chá', '/produtos/Açucareiro.png'),
        ('Bandeja para servir', '☕ Café e Chá', '/produtos/Bandeja para servir.png'),
        ('Escorredor de louças', '🧺 Organização e Limpeza', '/produtos/Escorredor de louças.png'),
        ('Escorredor de arroz', '🧺 Organização e Limpeza', '/produtos/Escorredor de arroz.png'),
        ('Escorredor de macarrão', '🧺 Organização e Limpeza', '/produtos/Escorredor de macarrão.png'),
        ('Lixeira para cozinha', '🧺 Organização e Limpeza', '/produtos/Lixeira para cozinha.png'),
        ('Porta-detergente', '🧺 Organização e Limpeza', '/produtos/Porta-detergente.png'),
        ('Porta-esponja', '🧺 Organização e Limpeza', '/produtos/Porta-esponja.png'),
        ('Pano de prato', '🧺 Organização e Limpeza', '/produtos/Pano de prato.png'),
        ('Luvas térmicas', '🧺 Organização e Limpeza', '/produtos/Luvas térmicas.png'),
        ('Avental', '🧺 Organização e Limpeza', '/produtos/Avental.png'),
        ('Organizador de gavetas', '🧺 Organização e Limpeza', '/produtos/Organizador de gavetas.png')
      `);

      await pool.query(`
        INSERT INTO produtos_sugeridos (nome, categoria, foto_url) VALUES 
        ('Processador manual', '🥘 Preparação de Alimentos', '/produtos/Processador manual.png'),
        ('Mixer', '🥘 Preparação de Alimentos', '/produtos/Mixer.png'),
        ('Liquidificador', '🥘 Preparação de Alimentos', '/produtos/Liquidificador.png'),
        ('Batedeira', '🥘 Preparação de Alimentos', '/produtos/Batedeira.png'),
        ('Multiprocessador', '🥘 Preparação de Alimentos', '/produtos/Multiprocessador.png'),
        ('Centrífuga para salada', '🥘 Preparação de Alimentos', '/produtos/Centrífuga para salada.png'),
        ('Cortador de legumes', '🥘 Preparação de Alimentos', '/produtos/Cortador de legumes.png')
      `);

      await pool.query(`
        INSERT INTO produtos_sugeridos (nome, categoria, foto_url) VALUES 
        ('Formas de gelo', '🧊 Conservação', '/produtos/Formas de gelo.png'),
        ('Organizador de geladeira', '🧊 Conservação', '/produtos/Organizador de geladeira.png'),
        ('Potes para congelamento', '🧊 Conservação', '/produtos/Potes para congelamento.png'),
        ('Etiquetas para mantimentos', '🧊 Conservação', '/produtos/Etiquetas para mantimentos.png'),
        ('Air Fryer', '🎁 Itens Diferentes e Modernos', '/produtos/Air Fryer.png'),
        ('Cafeteira', '🎁 Itens Diferentes e Modernos', '/produtos/Cafeteira.png'),
        ('Sanduicheira', '🎁 Itens Diferentes e Modernos', '/produtos/Sanduicheira.png'),
        ('Torradeira', '🎁 Itens Diferentes e Modernos', '/produtos/Torradeira.png'),
        ('Chaleira elétrica', '🎁 Itens Diferentes e Modernos', '/produtos/Chaleira elétrica.png'),
        ('Panela elétrica de arroz', '🎁 Itens Diferentes e Modernos', '/produtos/Panela elétrica de arroz.png'),
        ('Kit para churrasco', '🎁 Itens Diferentes e Modernos', '/produtos/Kit para churrasco.png'),
        ('Kit para massas', '🎁 Itens Diferentes e Modernos', '/produtos/Kit para massas.png'),
        ('Kit para queijos', '🎁 Itens Diferentes e Modernos', '/produtos/Kit para queijos.png'),
        ('Kit para drinks', '🎁 Itens Diferentes e Modernos', '/produtos/Kit para drinks.png')
      `);
      console.log('[DB] Inserted initial produtos_sugeridos');
    }

    // Create Config Pixel table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS config_pixel (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(120) NOT NULL UNIQUE,
        codigo TEXT,
        ativo TINYINT(1) DEFAULT 1,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default pixels if table is empty
    const [pixelsRows]: any = await pool.query('SELECT * FROM config_pixel');
    if (pixelsRows.length === 0) {
      const metaPixel = `<!-- Meta Pixel Code -->\\n<script>\\n!function(f,b,e,v,n,t,s)\\n{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\\nif(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\\nn.queue=[];t=b.createElement(e);t.async=!0;\\nt.src=v;s=b.getElementsByTagName(e)[0];\\ns.parentNode.insertBefore(t,s)}(window, document,'script',\\n'https://connect.facebook.net/en_US/fbevents.js');\\nfbq('init', '1376601374516531');\\nfbq('track', 'PageView');\\n</script>\\n<!-- End Meta Pixel Code -->`;
      
      const analyticsPixel = `<!-- Google tag (gtag.js) -->\\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-JRRJC798VF"></script>\\n<script>\\n  window.dataLayer = window.dataLayer || [];\\n  function gtag(){dataLayer.push(arguments);}\\n  gtag('js', new Date());\\n  gtag('config', 'G-JRRJC798VF');\\n</script>`;
      
      const googleAdsPixel = `<!-- Google tag (gtag.js) - Google Ads -->\\n<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18125787706"></script>\\n<script>\\n  window.dataLayer = window.dataLayer || [];\\n  function gtag(){dataLayer.push(arguments);}\\n  gtag('js', new Date());\\n  gtag('config', 'AW-18125787706');\\n</script>`;
      
      const adsensePixel = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8710756806401980" crossorigin="anonymous"></script>`;

      await pool.query(`
        INSERT INTO config_pixel (nome, codigo) VALUES 
        ('Meta Pixel', ?),
        ('Google Analytics', ?),
        ('Google Ads', ?),
        ('Google Adsense', ?)
      `, [
        metaPixel.replace(/\\n/g, '\n'), 
        analyticsPixel.replace(/\\n/g, '\n'), 
        googleAdsPixel.replace(/\\n/g, '\n'), 
        adsensePixel
      ]);
    }

    // Run Migrations for missing columns/updates
    await addColumnIfNotExists('usuarios', 'cep', "VARCHAR(20)");
    await addColumnIfNotExists('usuarios', 'numero', "VARCHAR(20)");
    await addColumnIfNotExists('usuarios', 'complemento', "VARCHAR(150)");
    await addColumnIfNotExists('usuarios', 'bairro', "VARCHAR(150)");

    await addColumnIfNotExists('convidados', 'convite_enviado', "TINYINT(1) DEFAULT 0");
    await addColumnIfNotExists('convidados', 'presenca_confirmada', "TINYINT(1) DEFAULT 0");
    await addColumnIfNotExists('pagamentos', 'tipo', "ENUM('presente', 'upgrade_plano') DEFAULT 'presente' AFTER lista_presente_id");
    await addColumnIfNotExists('pagamentos', 'mercadopago_id', "VARCHAR(255)");
    
    // Clean up unused columns from previous versions/templates
    await dropColumnIfExists('pagamentos', 'stripe_session_id');
    await dropColumnIfExists('pagamentos', 'infinitepay_id');
    
    // Fix: ensure lista_presente_id is nullable if the table was created differently before
    try {
      await pool.query('ALTER TABLE pagamentos MODIFY lista_presente_id INT UNSIGNED NULL');
    } catch (e) {
      console.log('[DB] Note: Could not modify lista_presente_id (might already be correct)');
    }
    
    // Ensure festas has necessary columns and remove old/unused ones if possible via logic
    await addColumnIfNotExists('festas', 'premium', "TINYINT(1) DEFAULT 0");
    await addColumnIfNotExists('festas', 'endereco', "TEXT");
    await addColumnIfNotExists('festas', 'local_nome', "VARCHAR(255)");
    await addColumnIfNotExists('festas', 'data_festa', "DATE");
    await addColumnIfNotExists('festas', 'horario', "TIME");
    await addColumnIfNotExists('festas', 'codigo_acesso', "VARCHAR(20)");
    await addColumnIfNotExists('festas', 'tema', "VARCHAR(50)");
    
    await addColumnIfNotExists('festas', 'cep', "VARCHAR(20)");
    await addColumnIfNotExists('festas', 'logradouro', "VARCHAR(255)");
    await addColumnIfNotExists('festas', 'numero', "VARCHAR(20)");
    await addColumnIfNotExists('festas', 'complemento', "VARCHAR(150)");
    await addColumnIfNotExists('festas', 'bairro', "VARCHAR(150)");
    await addColumnIfNotExists('festas', 'cidade', "VARCHAR(150)");
    await addColumnIfNotExists('festas', 'estado', "VARCHAR(2)");
    
    // Marketing Blasts
    await addColumnIfNotExists('festas', 'marketing_blast_30d', "TINYINT(1) DEFAULT 0");
    await addColumnIfNotExists('festas', 'marketing_blast_20d', "TINYINT(1) DEFAULT 0");
    await addColumnIfNotExists('festas', 'marketing_blast_10d', "TINYINT(1) DEFAULT 0");
    await addColumnIfNotExists('festas', 'marketing_blast_manual_count', "INT DEFAULT 0");
    
    await dropColumnIfExists('festas', 'data'); // Removed in favor of data_festa
    
    console.log('[DB] Database initialized and columns verified');
  } catch (err: any) {
    console.error('[DB ERROR] Initialization failed:', err.message);
  }
}

initDb().catch(console.error);
