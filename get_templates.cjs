const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function getTemplates() {
  const urls = [
    'https://api.hubling.ai/templates',
    'https://api.hubling.ai/api/templates',
    'https://api.hubling.ai/v1/templates',
    'https://api.hubling.ai/api/v1/communications/templates'
  ];
  for (const url of urls) {
      console.log('Trying', url);
      const response = await fetch(url, {
          method: 'GET',
          headers: {
              'x-api-key': 'hb_mpjAIto-VCTzbsl7teIGgn3wJuSualRKvXTQeW2v5tI'
          }
      });
      console.log(response.status);
      if (response.status === 200) {
        console.log(await response.text());
        break;
      }
  }
}

getTemplates();
