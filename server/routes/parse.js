const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const { spawn } = require('child_process');
const { prepare } = require('../db');
const { authMiddleware } = require('../auth');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.use(authMiddleware);

const PARSE_PROMPT = `You are a real estate contract parser. Extract the following from this contract text and return ONLY valid JSON (no markdown, no explanation):

{
  "property": "property name/description",
  "address": "street address",
  "city": "city",
  "state": "state abbreviation",
  "county": "county",
  "price": 0,
  "contract_date": "YYYY-MM-DD",
  "closing_date": "YYYY-MM-DD",
  "contract_type": "Purchase|Sale|Lease",
  "parties": [{"role": "Buyer|Seller|Agent|Attorney|Lender", "name": "", "email": "", "phone": "", "firm": ""}],
  "milestones": [{"label": "", "date": "YYYY-MM-DD", "category": "Contract|Inspection|Financing|Closing"}],
  "documents": [{"name": "", "status": "Pending|Received"}],
  "contingencies": [{"name": ""}],
  "vendors": [{"type": "Inspector|Lender|Title Company|Appraiser", "name": "", "email": "", "phone": ""}]
}

Contract text:
`;

async function parseWithAnthropicAPI(text) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: PARSE_PROMPT + text.substring(0, 15000) }],
  });
  return message.content[0].text;
}

async function parseWithClaudeCLI(text) {
  return new Promise((resolve, reject) => {
    const cliPath = process.env.CLAUDE_CLI_PATH || '/Users/chriseanniello/.local/bin/claude';
    const proc = spawn(cliPath, [
      '--print', '--output-format', 'text', '--model', 'sonnet', '--max-turns', '1'
    ], { timeout: 180000 });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(stderr || `Exit code ${code}`)));
    proc.on('error', reject);
    proc.stdin.write(PARSE_PROMPT + text.substring(0, 15000));
    proc.stdin.end();
  });
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const pdfData = await pdf(req.file.buffer);
    const text = (pdfData.text || '').trim();

    // Guard against blank/empty documents
    if (text.length < 50) {
      return res.status(422).json({ error: "This document appears blank. Use 'Create Transaction' to start a transaction manually, then upload documents to it." });
    }

    let result;
    if (process.env.ANTHROPIC_API_KEY) {
      result = await parseWithAnthropicAPI(text);
    } else {
      result = await parseWithClaudeCLI(text);
    }

    // Extract JSON from response
    let parsed;
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      return res.status(422).json({ error: 'Could not parse AI response' });
    }

    // Insert transaction
    const txResult = prepare(
      'INSERT INTO transactions (user_id, property, address, city, state, county, price, status, contract_date, closing_date, contract_type, raw_parsed_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run(
      req.user.id, parsed.property || 'Unknown', parsed.address || '', parsed.city || '', parsed.state || '',
      parsed.county || null, parsed.price || 0, 'Active', parsed.contract_date || null,
      parsed.closing_date || null, parsed.contract_type || null, JSON.stringify(parsed)
    );
    const txId = txResult.lastInsertRowid;

    if (parsed.parties) for (const p of parsed.parties) {
      prepare('INSERT INTO parties (transaction_id, role, name, email, phone, firm) VALUES (?,?,?,?,?,?)').run(txId, p.role, p.name, p.email || null, p.phone || null, p.firm || null);
    }
    if (parsed.milestones) for (const m of parsed.milestones) {
      prepare('INSERT INTO milestones (transaction_id, label, date, completed, category) VALUES (?,?,?,?,?)').run(txId, m.label, m.date, 0, m.category || null);
    }
    if (parsed.documents) for (const d of parsed.documents) {
      prepare('INSERT INTO documents (transaction_id, name, status) VALUES (?,?,?)').run(txId, d.name, d.status || 'Pending');
    }
    if (parsed.contingencies) for (const c of parsed.contingencies) {
      prepare('INSERT INTO contingencies (transaction_id, name) VALUES (?,?)').run(txId, c.name);
    }
    if (parsed.vendors) for (const v of parsed.vendors) {
      prepare('INSERT INTO vendors (transaction_id, type, name, email, phone) VALUES (?,?,?,?,?)').run(txId, v.type, v.name, v.email || null, v.phone || null);
    }

    // Log activity
    try {
      prepare('INSERT INTO activity_log (transaction_id, user_id, action, detail) VALUES (?,?,?,?)').run(txId, req.user.id, 'contract_parsed', `Contract parsed via AI: ${parsed.property || 'Unknown'}`);
    } catch(e) {}

    // Return full transaction
    const full = prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
    full.milestones = prepare('SELECT * FROM milestones WHERE transaction_id = ?').all(txId);
    full.parties = prepare('SELECT * FROM parties WHERE transaction_id = ?').all(txId);
    full.documents = prepare('SELECT * FROM documents WHERE transaction_id = ?').all(txId);
    full.contingencies = prepare('SELECT * FROM contingencies WHERE transaction_id = ?').all(txId);
    full.vendors = prepare('SELECT * FROM vendors WHERE transaction_id = ?').all(txId);

    res.json(full);
  } catch (e) {
    console.error('Parse error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
