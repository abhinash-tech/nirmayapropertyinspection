import https from 'https';

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse body - handle both parsed object and raw string
    let leadData = req.body;
    if (typeof leadData === 'string') {
      leadData = JSON.parse(leadData);
    }

    if (!leadData || Object.keys(leadData).length === 0) {
      return res.status(400).json({ error: 'Empty or invalid payload received.' });
    }

    const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      return res.status(500).json({ 
        error: 'WEB3FORMS_ACCESS_KEY is not set in Vercel Environment Variables. Please add it and redeploy.' 
      });
    }

    const formatKey = (key) => {
      const result = key.replace(/([A-Z])/g, ' $1');
      return result.charAt(0).toUpperCase() + result.slice(1);
    };

    // Build a clean, nicely formatted message body
    const isInspection = leadData.formType === 'inspection';
    let messageLines = [
      `📋 ${isInspection ? 'Property Inspection' : 'Contact'} Request`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      '',
    ];

    for (const [key, value] of Object.entries(leadData)) {
      if (key !== 'id' && key !== 'submittedAt' && key !== 'formType' && value) {
        messageLines.push(`${formatKey(key)}: ${value}`);
      }
    }

    messageLines.push('');
    messageLines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    messageLines.push(`Submitted via: nirmayapropertyinspection.in`);

    const payload = {
      access_key: accessKey,
      subject: `New ${isInspection ? 'Inspection' : 'Contact'} Request from ${leadData.fullName || leadData.name || 'Client'}`,
      from_name: 'Nirmaya Website Forms',
      message: messageLines.join('\n'),
    };

    // Use Node's built-in https module (works on ALL Node versions, no fetch needed)
    const result = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      const options = {
        hostname: 'api.web3forms.com',
        path: '/submit',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            resolve({ status: response.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: response.statusCode, body: data });
          }
        });
      });

      request.on('error', reject);
      request.write(postData);
      request.end();
    });

    if (result.status === 200) {
      return res.status(200).json({ success: true, message: 'Email sent successfully' });
    } else {
      return res.status(result.status).json({ error: 'Web3Forms API Error', details: result.body });
    }

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
}