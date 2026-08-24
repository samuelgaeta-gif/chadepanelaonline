const fetch = require('node-fetch');

async function getTemplates() {
  const response = await fetch('https://api.hubling.ai/api/v1/templates', {
      method: 'GET',
      headers: {
          'x-api-key': 'hb_mpjAIto-VCTzbsl7teIGgn3wJuSualRKvXTQeW2v5tI'
      }
  });
  console.log(response.status);
  const text = await response.text();
  console.log(text);
}

getTemplates();
