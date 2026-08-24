const HUBLING_API_KEY = process.env.HUBLING_API_KEY;

export async function sendMarketingWhatsApp(phone: string, orgName: string, days: number, qtdConvidados: number) {
    if (!phone) return { error: "No phone" };
    if (!HUBLING_API_KEY) {
        console.warn('[WHATSAPP] HUBLING_API_KEY não configurada, envio ignorado.');
        return { error: "Missing HUBLING_API_KEY" };
    }

    try {
        const cleanPhone = phone.replace(/\D/g, '');
        let formattedPhone = cleanPhone;
        if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
             formattedPhone = '55' + cleanPhone;
        }
        if (formattedPhone.length < 10) return { error: "Invalid phone length" };

        const apiKey = HUBLING_API_KEY;

        const data = {
            "assistantId": "4042f39f-0fea-4612-8cb3-4fefbb8aa131",
            "from": "5521993740786",
            "name": "Campanha",
            "template": {
                "name": "resgate",
                "variables": {
                    "1": "%contact.metadata.organizador%",
                    "2": "%contact.metadata.dias%",
                    "3": "%contact.metadata.qtd_convidados%"
                }
            },
            "contacts": [
                {
                    "phone": formattedPhone,
                    "name": orgName || "Organizador",
                    "metadata": {
                        "organizador": orgName || "Organizador",
                        "dias": String(days),
                        "qtd_convidados": String(qtdConvidados)
                    }
                }
            ]
        };

        const response = await fetch('https://api.hubling.ai/api/v1/communications', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`[WHATSAPP API ERROR] MKT ${days}d`, response.status, errBody);
            return { error: true, status: response.status, body: errBody };
        } else {
            console.log(`[WHATSAPP ENVIADO] MKT ${days}d para ${formattedPhone}`);
            return { success: true, phone: formattedPhone };
        }
    } catch (e: any) {
        console.error(`[WHATSAPP ERROR] MKT ${days}d`, e.message);
        return { error: e.message };
    }
}

export async function sendWelcomeWhatsApp(phone: string, orgName: string) {
    if (!phone) return { error: "No phone" };
    if (!HUBLING_API_KEY) {
        console.warn('[WHATSAPP] HUBLING_API_KEY não configurada, envio ignorado.');
        return { error: "Missing HUBLING_API_KEY" };
    }

    try {
        const cleanPhone = phone.replace(/\D/g, '');
        let formattedPhone = cleanPhone;
        if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
             formattedPhone = '55' + cleanPhone;
        }

        if (formattedPhone.length < 10) return { error: "Invalid phone length" };

        const apiKey = HUBLING_API_KEY;

        const data = {
            "assistantId": "4042f39f-0fea-4612-8cb3-4fefbb8aa131",
            "from": "5521993740786",
            "name": "Campanhalistacriada",
            "template": {
                "name": "listacriada",
                "variables": {
                    "1": "%contact.metadata.organizador%"
                }
            },
            "contacts": [
                {
                    "phone": formattedPhone,
                    "name": orgName || "Organizador",
                    "metadata": {
                        "organizador": orgName || "Organizador"
                    }
                }
            ]
        };

        const response = await fetch('https://api.hubling.ai/api/v1/communications', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('[WHATSAPP API ERROR]', response.status, errBody);
            return { error: true, status: response.status, body: errBody };
        } else {
            console.log(`[WHATSAPP ENVIADO] Boas vindas para ${formattedPhone}`);
            const textResponse = await response.text();
            return { success: true, phone: formattedPhone, body: textResponse };
        }
    } catch (e: any) {
        console.error('[WHATSAPP ERROR]', e.message);
        return { error: e.message };
    }
}

export async function sendOrganizerGiftNotificationWhatsApp(
    phone: string,
    guestName: string, 
    giftName: string,
    orgName: string
) {
    if (!phone) return;
    if (!HUBLING_API_KEY) {
        console.warn('[WHATSAPP] HUBLING_API_KEY não configurada, envio ignorado.');
        return;
    }

    try {
        const cleanPhone = phone.replace(/\D/g, ''); // leave only digits

        // Ensure it has country code, default to 55 if missing
        let formattedPhone = cleanPhone;
        if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
             formattedPhone = '55' + cleanPhone;
        }

        if (formattedPhone.length < 10) {
            console.log(`[WHATSAPP] Invalid phone number ${phone}`);
            return;
        }

        const apiKey = HUBLING_API_KEY;

        const data = {
            "assistantId": "4042f39f-0fea-4612-8cb3-4fefbb8aa131",
            "from": "5521993740786",
            "name": "Campanha",
            "template": {
                "name": "presente_escolhido",
                "variables": {
                    "nome": "%contact.name%",
                    "presente": "%contact.metadata.presente%",
                    "convidado": "%contact.metadata.convidado%"
                }
            },
            "contacts": [
                {
                    "phone": formattedPhone,
                    "name": orgName || "Organizador",
                    "metadata": {
                        "presente": giftName,
                        "convidado": guestName
                    }
                }
            ]
        };

        const response = await fetch('https://api.hubling.ai/api/v1/communications', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('[WHATSAPP API ERROR]', response.status, errBody);
        } else {
            console.log(`[WHATSAPP ENVIADO] Presente confirmado para ${formattedPhone}`);
        }
    } catch (e: any) {
        console.error('[WHATSAPP ERROR]', e.message);
    }
}
