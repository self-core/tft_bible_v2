export default function handler(req, res) {
  res.status(200).json({ 
    status: 'OK', 
    service: 'TFT Bible Backend',
    timestamp: new Date().toISOString()
  });
}