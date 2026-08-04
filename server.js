const express = require('express');
const fetch = require('node-fetch');
const multer = require('multer');
const FormData = require('form-data');
const upload = multer();
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('Missing BOT_TOKEN or CHAT_ID in environment. See .env.example');
}

app.get('/', (req, res) => res.json({ ok: true, message: 'Telegram proxy running' }));

app.post('/telegram/sendMessage', async (req, res) => {
  try {
    const { text, reply_markup } = req.body || {};
    if (!BOT_TOKEN || !CHAT_ID) return res.status(500).json({ ok: false, error: 'BOT_TOKEN or CHAT_ID not configured' });
    const body = { chat_id: CHAT_ID, text: text || '', parse_mode: 'Markdown' };
    if (reply_markup) body.reply_markup = reply_markup;
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await r.json();
    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/telegram/sendPhoto', upload.single('photo'), async (req, res) => {
  try {
    if (!BOT_TOKEN || !CHAT_ID) return res.status(500).json({ ok: false, error: 'BOT_TOKEN or CHAT_ID not configured' });
    if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });

    const form = new FormData();
    form.append('chat_id', CHAT_ID);
    form.append('photo', req.file.buffer, { filename: req.file.originalname || 'photo.jpg' });

    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    const json = await r.json();
    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/telegram/getUpdates', async (req, res) => {
  try {
    if (!BOT_TOKEN) return res.status(500).json({ ok: false, error: 'BOT_TOKEN not configured' });
    const offset = req.query.offset;
    const url = new URL(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
    if (offset) url.searchParams.set('offset', offset);
    const r = await fetch(url.toString());
    const json = await r.json();
    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Telegram proxy listening on ${port}`));
