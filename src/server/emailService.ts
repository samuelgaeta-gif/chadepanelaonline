import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: parseInt(process.env.SMTP_PORT || '465') === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.SMTP_FROM_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const defaultFrom = '"Chá de Panela Online" <' + (process.env.SMTP_FROM_EMAIL || 'no-reply@aglive.com.br') + '>';

export async function sendEmail(to: string, subject: string, html: string) {
  const smtpUser = process.env.SMTP_USER || process.env.SMTP_FROM_EMAIL;
  if (!smtpUser || !process.env.SMTP_PASSWORD) {
    console.warn(`[EMAIL SIMULADO para ${to}]: ${subject} (Faltam credenciais SMTP_USER/SMTP_FROM_EMAIL ou SMTP_PASSWORD)`);
    return;
  }

  try {
    console.log(`[EMAIL] Iniciando envio para ${to}... Host: ${process.env.SMTP_HOST}`);
    const info = await transporter.sendMail({
      from: defaultFrom,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL ENVIADO] Message sent: %s to %s`, info.messageId, to);
    return true;
  } catch (error) {
    console.error(`[ERRO NO ENVIO] Host: ${process.env.SMTP_HOST}, User: ${smtpUser}`);
    console.error(`[ERRO NO ENVIO CATCH] Falha ao enviar email para ${to}. Motivo:`, error);
    return false;
  }
}

// Modelos de envio que serão preenchidos
export async function sendWelcomeEmail(to: string, data: { nomeCliente: string, linkDashboard: string }) {
  const subject = "Seu Chá de Panela Online começa agora! 💛"; // TODO: Altere o assunto se desejar
  
  // TODO: Insira seu HTML abaixo (dentro das crases). Variáveis disponíveis: data.nomeCliente, data.linkDashboard
  const html = `
    <!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Seu Chá de Panela Online começa agora! 💛</title>
</head>
<body style="margin:0;padding:0;background-color:#FFF7F3;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#FFF7F3;opacity:0;">
    Seu cadastro foi realizado com sucesso. Comece a montar sua lista de presentes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF7F3;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 24px 12px 24px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:16px;font-weight:bold;color:#D9827C;">
                Chá de Panela Online
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 6px 28px;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0;font-size:26px;line-height:34px;color:#3A2A28;font-weight:bold;text-align:center;">
                Seu Chá de Panela Online começa agora! 💛
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 10px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#6B5E5B;">
              
<p>Olá, <strong>${data.nomeCliente}!</strong>!</p>
<p>Que alegria ter você com a gente! 🎉</p>
<p>Seu cadastro foi realizado com sucesso e agora você já pode começar a organizar o seu Chá de Panela Online de forma prática, moderna e cheia de carinho.</p>
<p>A partir de agora, você pode:</p>
<ul>
  <li>Criar e personalizar sua lista de presentes</li>
  <li>Compartilhar seu evento com amigos e familiares</li>
  <li>Acompanhar os presentes escolhidos em tempo real</li>
</ul>

              
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 8px auto;">
          <tr>
            <td align="center" bgcolor="#D9827C" style="border-radius:8px;">
              <a href="${data.linkDashboard}" target="_blank" style="display:inline-block;padding:14px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">
                Acessar meu Chá de Panela
              </a>
            </td>
          </tr>
        </table>
        
              <p>Estamos aqui para tornar esse momento ainda mais especial para você.<br><br>Se precisar de ajuda, é só responder este e-mail 💌</p>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 30px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#8B7B78;text-align:center;border-top:1px solid #F0E3DF;">
              Com carinho,<br>
              <strong>Chá de Panela Online</strong><br><br>
              <span>Você recebeu este e-mail porque você se cadastrou no Chá de Panela Online.</span><br>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  return await sendEmail(to, subject, html);
}

export async function sendPremiumUpgradeEmail(to: string, data: { nomeCliente: string, nomeEvento: string, linkDashboard?: string }) {
  const subject = "Você desbloqueou a experiência Premium ✨"; // TODO: Altere o assunto se desejar
  
  // TODO: Insira seu HTML abaixo. Variáveis disponíveis: data.nomeCliente, data.nomeEvento
  const html = `
    <!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Você desbloqueou a experiência Premium ✨</title>
</head>
<body style="margin:0;padding:0;background-color:#FFF7F3;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#FFF7F3;opacity:0;">
    Sua lista foi atualizada para o plano Premium.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF7F3;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 24px 12px 24px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:16px;font-weight:bold;color:#D9827C;">
                Chá de Panela Online
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 6px 28px;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0;font-size:26px;line-height:34px;color:#3A2A28;font-weight:bold;text-align:center;">
                Você desbloqueou a experiência Premium ✨
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 10px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#6B5E5B;">
              
<p>Olá, <strong>${data.nomeCliente}</strong>!</p>
<p>Boas notícias! 🎉</p>
<p>Sua lista foi atualizada para o plano <strong>Premium</strong>. Agora você tem acesso a recursos exclusivos para deixar seu Chá de Panela ainda mais completo e inesquecível.</p>
<p>Com o Premium, você pode:</p>
<ul>
  <li>Personalizar sua lista com mais detalhes</li>
  <li>Ter acesso a funcionalidades avançadas</li>
  <li>Oferecer uma experiência ainda melhor para seus convidados</li>
</ul>

              
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 8px auto;">
          <tr>
            <td align="center" bgcolor="#D9827C" style="border-radius:8px;">
              <a href="${data.linkDashboard}" target="_blank" style="display:inline-block;padding:14px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">
                Acessar minha lista Premium
              </a>
            </td>
          </tr>
        </table>
        
              <p>Qualquer dúvida, estamos por aqui!<br><br>Aproveite cada momento 💛</p>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 30px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#8B7B78;text-align:center;border-top:1px solid #F0E3DF;">
              Com carinho,<br>
              <strong>Chá de Panela Online</strong><br><br>
              <span>Você recebeu este e-mail porque está participando de um Chá de Panela Online.</span><br>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

  `;
  return await sendEmail(to, subject, html);
}

export async function sendGuestInviteEmail(to: string, data: { nomeConvidado: string, nomeDosNoivos: string, dataEvento?: string, horaEvento?: string, localEvento?: string, enderecoEvento?: string, linkEvento: string, codigoLista: string }) {
  // O Assunto agora inclui o nome dos noivos, conforme solicitado
  const subject = `Você foi convidado para um Chá de Panela especial - ${data.nomeDosNoivos} 💍`; 
  
  let formattedData = 'A definir';
  if (data.dataEvento) {
    const isDate = (data.dataEvento as any) instanceof Date || typeof (data.dataEvento as any).getMonth === 'function';
    const dateStr = isDate ? (data.dataEvento as any).toISOString() : String(data.dataEvento);
    
    // Create date without timezone shift issues
    const dt = dateStr.split('T')[0];
    const parts = dt.split('-');
    if (parts.length === 3) {
       formattedData = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else {
       const d = new Date(data.dataEvento);
       if (!isNaN(d.getTime())) {
         formattedData = d.toLocaleDateString('pt-BR');
       } else {
         formattedData = dateStr;
       }
    }
  }

  let formattedTime = 'A definir';
  if (data.horaEvento) {
    // If it's already HH:mm or HH:mm:ss it's fine, let's just make sure it's HH:MM
    const parts = data.horaEvento.split(':');
    if (parts.length >= 2) {
      formattedTime = `${parts[0]}:${parts[1]}`;
    } else {
      formattedTime = data.horaEvento;
    }
  }

  // TODO: Insira seu HTML de convite abaixo. Variáveis disponíveis listadas em 'data'
  const html = `
    <!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Você foi convidado para um Chá de Panela especial 💍</title>
</head>
<body style="margin:0;padding:0;background-color:#FFF7F3;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#FFF7F3;opacity:0;">
    Acesse a lista de presentes e participe desse momento especial.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF7F3;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 24px 12px 24px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:16px;font-weight:bold;color:#D9827C;">
               Chá de Panela Online
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 6px 28px;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0;font-size:26px;line-height:34px;color:#3A2A28;font-weight:bold;text-align:center;">
                Você foi convidado para um Chá de Panela especial 💍
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 10px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#6B5E5B;">
              
<p>Olá, <strong>${data.nomeConvidado}</strong>!</p>
<p>Você foi convidado para um momento muito especial! 💛</p>
<p><strong>${data.nomeDosNoivos}</strong> estão celebrando seu Chá de Panela e adoraria ter você participando desse momento único.</p>
<p>
      <b>Data:</b> ${formattedData} <br>
      <b>Horário:</b> ${formattedTime} <br>
      <b>Local:</b> ${data.localEvento || 'A definir'} <br>
      <b>Endereço:</b> ${data.enderecoEvento || 'A definir'}
    </p>
<p>Escolha um presente com carinho e faça parte dessa celebração.</p>
<p>Para acessar a lista, você pode clicar no botão abaixo, que o levará diretamente à página. Caso seja solicitado, utilize o seu email (o mesmo deste convite) e o código da lista:</p>
<div style="background-color: #f7f1f0; border: 1px dashed #d9827c; padding: 12px; text-align: center; border-radius: 8px; margin: 16px 0;">
  <b>Código da Lista:</b> <span style="font-size: 18px; color: #d9827c; font-weight: bold;">${data.codigoLista}</span>
</div>

              
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 8px auto;">
          <tr>
            <td align="center" bgcolor="#D9827C" style="border-radius:8px;">
              <a href="${data.linkEvento}" target="_blank" style="display:inline-block;padding:14px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">
                Acessar Lista de Presentes
              </a>
            </td>
          </tr>
        </table>
        
              <p>Contamos com você 💌</p>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 30px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#8B7B78;text-align:center;border-top:1px solid #F0E3DF;">
              Com carinho,<br>
              <strong>Chá de Panela Online</strong><br><br>
              <span>Você recebeu este e-mail porque está participando de um Chá de Panela Online.</span><br>
              <a href="[Link de Descadastro]" target="_blank" style="color:#8B7B78;text-decoration:underline;">Cancelar inscrição</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  return await sendEmail(to, subject, html);
}

export async function sendGuestGiftChosenEmail(to: string, data: { nomeConvidado: string, nomePresente: string, nomeDosNoivos: string }) {
  const subject = `Presente escolhido com sucesso 🎁 para ${data.nomeDosNoivos}!`; // TODO: Altere o assunto se desejar
  
  // TODO: Insira seu HTML para o convidado abaixo. Variáveis disponíveis: data.nomeConvidado, data.nomePresente, data.nomeDosNoivos
  const html = `
    <!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Presente escolhido com sucesso 🎁</title>
</head>
<body style="margin:0;padding:0;background-color:#FFF7F3;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#FFF7F3;opacity:0;">
    Seu presente foi escolhido com sucesso.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF7F3;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 24px 12px 24px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:16px;font-weight:bold;color:#D9827C;">
                Chá de Panela Online
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 6px 28px;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0;font-size:26px;line-height:34px;color:#3A2A28;font-weight:bold;text-align:center;">
                Presente escolhido com sucesso 🎁
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 10px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#6B5E5B;">
              
<p>Olá, <strong>${data.nomeConvidado}</strong>!</p>
<p>Perfeito! Seu presente foi escolhido com sucesso 🎉</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:#FFF7F3;border-radius:12px;">
  <tr>
    <td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#3A2A28;">
      <strong>Presente:</strong> ${data.nomePresente}<br>
      <strong>Para:</strong> ${data.nomeDosNoivos}
    </td>
  </tr>
</table>
<p>Agora é só comprar em uma loja e levar no dia do evento, essa é a essência do Chá de Panela Online.</p>
<p>Obrigado por fazer parte desse momento especial!</p>

              
              
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 30px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#8B7B78;text-align:center;border-top:1px solid #F0E3DF;">
              Com carinho,<br>
              <strong>Chá de Panela Online</strong><br><br>
              <span>Você recebeu este e-mail porque está participando de um Chá de Panela Online.</span><br>
              <a href="[Link de Descadastro]" target="_blank" style="color:#8B7B78;text-decoration:underline;">Cancelar inscrição</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  return await sendEmail(to, subject, html);
}

export async function sendOrganizerGiftNotificationEmail(to: string, data: { nomeOrganizador: string, nomeConvidado: string, nomePresente: string, linkDashboard?: string }) {
  const subject = `Você recebeu um presente 🎉`; // TODO: Altere o assunto se desejar
  
  // TODO: Insira seu HTML para notificar o organizador abaixo.
  const html = `
    <!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Você recebeu um presente 🎉</title>
</head>
<body style="margin:0;padding:0;background-color:#FFF7F3;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#FFF7F3;opacity:0;">
    Tem novidade na sua lista de Chá de Panela.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF7F3;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 24px 12px 24px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:16px;font-weight:bold;color:#D9827C;">
                Chá de Panela Online
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 6px 28px;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0;font-size:26px;line-height:34px;color:#3A2A28;font-weight:bold;text-align:center;">
                Você recebeu um presente 🎉
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 10px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#6B5E5B;">
              
<p>Olá, <strong>${data.nomeOrganizador}</strong>!</p>
<p>Tem novidade na sua lista! 💛</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:#FFF7F3;border-radius:12px;">
  <tr>
    <td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#3A2A28;">
      <strong>Convidado:</strong> ${data.nomeConvidado}<br>
      <strong>Presente escolhido:</strong> ${data.nomePresente}
    </td>
  </tr>
</table>
<p>Seu Chá de Panela está ficando ainda mais especial!</p>

              
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 8px auto;">
          <tr>
            <td align="center" bgcolor="#D9827C" style="border-radius:8px;">
              <a href="${data.linkDashboard}" target="_blank" style="display:inline-block;padding:14px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">
                Ver meus presentes
              </a>
            </td>
          </tr>
        </table>
        
              <p>Aproveite cada detalhe desse momento ✨</p>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 30px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#8B7B78;text-align:center;border-top:1px solid #F0E3DF;">
              Com carinho,<br>
              <strong>Time Chá de Panela Online</strong><br><br>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  await sendEmail(to, subject, html);
}

