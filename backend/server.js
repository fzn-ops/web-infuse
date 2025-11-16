// ==========================================
// INFUSESECRET BACKEND API
// Node.js + Express + MySQL
// ==========================================

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());

// ========== DATABASE CONNECTION ==========
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'infusesecret',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// ========== HELPER FUNCTIONS ==========

// Generate unique ID for message
function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

// Generate edit key
function generateEditKey() {
  return crypto.randomBytes(16).toString('hex');
}

// Get frontend URL (change in production)
function getFrontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

// ========== DATABASE INITIALIZATION ==========
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create messages table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        message TEXT NOT NULL,
        theme ENUM('romantic', 'friendship', 'motivation', 'general') NOT NULL,
        photo_url VARCHAR(500),
        quote VARCHAR(255),
        edit_key VARCHAR(255) UNIQUE NOT NULL,
        scan_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_edit_key (edit_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✓ Database initialized successfully');
    connection.release();
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// ========== API ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'InfuseSecret API is running',
    timestamp: new Date().toISOString()
  });
});

// CREATE new message
app.post('/api/messages', async (req, res) => {
  try {
    const { message, theme, photo_url, quote } = req.body;

    // Validation
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!['romantic', 'friendship', 'motivation', 'general'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }

    // Generate IDs
    const id = generateId();
    const editKey = generateEditKey();

    // Insert into database
    await pool.query(
      `INSERT INTO messages (id, message, theme, photo_url, quote, edit_key) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, message.trim(), theme, photo_url || null, quote || null, editKey]
    );

    // Return success with URLs
    const frontendUrl = getFrontendUrl();
    res.status(201).json({
      success: true,
      id,
      editKey,
      viewUrl: `${frontendUrl}/#/view/${id}`,
      message: 'Message created successfully'
    });

  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// GET message by ID (for viewing)
app.get('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT id, message, theme, photo_url, quote, scan_count, created_at 
       FROM messages WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ error: 'Failed to retrieve message' });
  }
});

// GET message by edit key (for editing)
app.get('/api/messages/edit/:editKey', async (req, res) => {
  try {
    const { editKey } = req.params;

    const [rows] = await pool.query(
      `SELECT id, message, theme, photo_url, quote, scan_count, created_at 
       FROM messages WHERE edit_key = ?`,
      [editKey]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invalid edit key' });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error('Get message by edit key error:', error);
    res.status(500).json({ error: 'Failed to retrieve message' });
  }
});

// UPDATE message (requires edit key)
app.put('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, photo_url, quote, editKey } = req.body;

    // Validation
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!editKey) {
      return res.status(400).json({ error: 'Edit key is required' });
    }

    // Verify edit key matches
    const [rows] = await pool.query(
      'SELECT id FROM messages WHERE id = ? AND edit_key = ?',
      [id, editKey]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Invalid edit key or message not found' });
    }

    // Update message
    await pool.query(
      `UPDATE messages 
       SET message = ?, photo_url = ?, quote = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [message.trim(), photo_url || null, quote || null, id]
    );

    res.json({ 
      success: true, 
      message: 'Message updated successfully' 
    });

  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// INCREMENT scan count
app.patch('/api/messages/:id/scan', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE messages SET scan_count = scan_count + 1 WHERE id = ?',
      [id]
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Increment scan count error:', error);
    res.status(500).json({ error: 'Failed to update scan count' });
  }
});

// DELETE message (optional - for admin)
app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { editKey } = req.body;

    if (!editKey) {
      return res.status(400).json({ error: 'Edit key is required' });
    }

    // Verify edit key
    const [rows] = await pool.query(
      'SELECT id FROM messages WHERE id = ? AND edit_key = ?',
      [id, editKey]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Invalid edit key' });
    }

    await pool.query('DELETE FROM messages WHERE id = ?', [id]);

    res.json({ 
      success: true, 
      message: 'Message deleted successfully' 
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// GET all messages (optional - for admin dashboard)
app.get('/api/admin/messages', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, LEFT(message, 50) as message_preview, theme, scan_count, created_at 
       FROM messages 
       ORDER BY created_at DESC 
       LIMIT 100`
    );

    res.json(rows);

  } catch (error) {
    console.error('Get all messages error:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// ========== ERROR HANDLING ==========
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ========== START SERVER ==========
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════╗
║   InfuseSecret API Server Running    ║
║   Port: ${PORT}                        
║   Database: ${dbConfig.database}      
║   Environment: ${process.env.NODE_ENV || 'development'}
╚═══════════════════════════════════════╝
      `);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app; // For testing purposes