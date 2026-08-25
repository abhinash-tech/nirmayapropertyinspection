/**
 * NOTE: Web3Forms free plan requires client-side submissions.
 * Email sending is handled directly from the browser in js/form-handler.js
 * This file is kept as a placeholder for future server-side integrations.
 */
export default async function handler(req, res) {
  res.status(200).json({ message: 'Email is handled client-side via Web3Forms.' });
}