const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database connection
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error connecting to database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  // Initialize database schema
  async initialize() {
    const queries = [
      // Groups table
      `CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        whatsapp_link TEXT NOT NULL,
        capacity INTEGER DEFAULT 1000,
        current_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Scans table
      `CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        referred_from TEXT,
        FOREIGN KEY (group_id) REFERENCES groups(id)
      )`,

      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_scans_group_id ON scans(group_id)`,
      `CREATE INDEX IF NOT EXISTS idx_scans_time ON scans(scan_time)`,
      `CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active)`
    ];

    for (const query of queries) {
      await this.run(query);
    }

    console.log('Database schema initialized');
  }

  // Run a query
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error running query:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Get single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Error getting row:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get all rows
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Error getting rows:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }

  // Group operations
  async getActiveGroups() {
    return this.all(
      'SELECT * FROM groups WHERE is_active = 1 ORDER BY current_count ASC'
    );
  }

  async getGroupById(id) {
    return this.get('SELECT * FROM groups WHERE id = ?', [id]);
  }

  async getAllGroups() {
    return this.all('SELECT * FROM groups ORDER BY created_at DESC');
  }

  async addGroup(name, whatsappLink, capacity) {
    return this.run(
      'INSERT INTO groups (name, whatsapp_link, capacity) VALUES (?, ?, ?)',
      [name, whatsappLink, capacity]
    );
  }

  async updateGroup(id, name, whatsappLink, capacity, isActive) {
    return this.run(
      'UPDATE groups SET name = ?, whatsapp_link = ?, capacity = ?, is_active = ? WHERE id = ?',
      [name, whatsappLink, capacity, isActive, id]
    );
  }

  async deleteGroup(id) {
    return this.run('DELETE FROM groups WHERE id = ?', [id]);
  }

  async resetGroupCount(id) {
    return this.run('UPDATE groups SET current_count = 0 WHERE id = ?', [id]);
  }

  async incrementGroupCount(id) {
    return this.run(
      'UPDATE groups SET current_count = current_count + 1 WHERE id = ?',
      [id]
    );
  }

  async toggleGroupStatus(id) {
    return this.run(
      'UPDATE groups SET is_active = NOT is_active WHERE id = ?',
      [id]
    );
  }

  // Scan operations
  async addScan(groupId, ipAddress, userAgent, referredFrom) {
    return this.run(
      'INSERT INTO scans (group_id, ip_address, user_agent, referred_from) VALUES (?, ?, ?, ?)',
      [groupId, ipAddress, userAgent, referredFrom]
    );
  }

  async getRecentScans(limit = 10) {
    return this.all(
      `SELECT s.*, g.name as group_name
       FROM scans s
       LEFT JOIN groups g ON s.group_id = g.id
       ORDER BY s.scan_time DESC
       LIMIT ?`,
      [limit]
    );
  }

  async getScansByDateRange(startDate, endDate) {
    return this.all(
      'SELECT * FROM scans WHERE scan_time BETWEEN ? AND ? ORDER BY scan_time DESC',
      [startDate, endDate]
    );
  }

  async getTotalScans() {
    const result = await this.get('SELECT COUNT(*) as count FROM scans');
    return result.count;
  }

  async getUniqueIPs() {
    const result = await this.get('SELECT COUNT(DISTINCT ip_address) as count FROM scans');
    return result.count;
  }

  async getScansPerDay(days = 7) {
    return this.all(
      `SELECT DATE(scan_time) as date, COUNT(*) as count
       FROM scans
       WHERE scan_time >= datetime('now', '-${days} days')
       GROUP BY DATE(scan_time)
       ORDER BY date DESC`
    );
  }

  async getScansPerHour(hours = 24) {
    return this.all(
      `SELECT strftime('%Y-%m-%d %H:00:00', scan_time) as hour, COUNT(*) as count
       FROM scans
       WHERE scan_time >= datetime('now', '-${hours} hours')
       GROUP BY hour
       ORDER BY hour DESC`
    );
  }

  async getTopGroups(limit = 5) {
    return this.all(
      `SELECT g.name, g.id, COUNT(s.id) as scan_count
       FROM groups g
       LEFT JOIN scans s ON g.id = s.group_id
       GROUP BY g.id
       ORDER BY scan_count DESC
       LIMIT ?`,
      [limit]
    );
  }

  async getDeviceBreakdown() {
    return this.all(
      `SELECT
        CASE
          WHEN user_agent LIKE '%Mobile%' OR user_agent LIKE '%Android%' OR user_agent LIKE '%iPhone%' THEN 'Mobile'
          ELSE 'Desktop'
        END as device_type,
        COUNT(*) as count
       FROM scans
       GROUP BY device_type`
    );
  }

  // Settings operations
  async getSetting(key) {
    return this.get('SELECT value FROM settings WHERE key = ?', [key]);
  }

  async setSetting(key, value) {
    return this.run(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
      [key, value, value]
    );
  }

  // Analytics
  async getDashboardStats() {
    const totalGroups = await this.get('SELECT COUNT(*) as count FROM groups');
    const activeGroups = await this.get('SELECT COUNT(*) as count FROM groups WHERE is_active = 1');
    const totalCapacity = await this.get('SELECT SUM(capacity) as total FROM groups WHERE is_active = 1');
    const currentMembers = await this.get('SELECT SUM(current_count) as total FROM groups WHERE is_active = 1');
    const totalScans = await this.getTotalScans();
    const uniqueIPs = await this.getUniqueIPs();

    return {
      totalGroups: totalGroups.count,
      activeGroups: activeGroups.count,
      totalCapacity: totalCapacity.total || 0,
      currentMembers: currentMembers.total || 0,
      fillRate: totalCapacity.total > 0
        ? ((currentMembers.total / totalCapacity.total) * 100).toFixed(2)
        : 0,
      totalScans,
      uniqueIPs
    };
  }

  // Export all data
  async exportAllData() {
    const groups = await this.getAllGroups();
    const scans = await this.all('SELECT * FROM scans ORDER BY scan_time DESC');
    const settings = await this.all('SELECT * FROM settings');

    return {
      groups,
      scans,
      settings,
      exportDate: new Date().toISOString()
    };
  }
}

module.exports = new Database();
