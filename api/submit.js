export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const leadData = req.body;
    
    // Check if the environment variable is configured
    if (!process.env.WEB3FORMS_ACCESS_KEY) {
      console.error('Missing WEB3FORMS_ACCESS_KEY in environment variables.');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const formatKey = (key) => {
      const result = key.replace(/([A-Z])/g, " $1");
      return result.charAt(0).toUpperCase() + result.slice(1);
    };

    // Construct payload for Web3Forms
    const payload = {
      access_key: process.env.WEB3FORMS_ACCESS_KEY,
      subject: `New ${leadData.formType === 'inspection' ? 'Inspection' : 'Contact'} Request from ${leadData.fullName || leadData.name || 'Client'}`,
      from_name: "Nirmaya Website Forms",
    };

    // Append all dynamic fields to payload
    for (const [key, value] of Object.entries(leadData)) {
      if (key !== 'id' && key !== 'submittedAt' && key !== 'formType' && value) {
        payload[formatKey(key)] = value;
      }
    }

    // Forward the request to Web3Forms API
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.status === 200) {
      return res.status(200).json({ success: true, message: 'Email sent securely' });
    } else {
      console.error('Web3Forms Error:', result);
      return res.status(response.status).json({ error: 'Failed to send email via provider' });
    }

  } catch (error) {
    console.error('API Endpoint Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}