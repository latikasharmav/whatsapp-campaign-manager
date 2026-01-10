const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// Determine database type from environment
const usePostgres = !!process.env.DATABASE_URL;
const dbPath = path.join(__dirname, 'database.sqlite');

class Database {
  constructor() {
    this.db = null;
    this.isPostgres = usePostgres;
  }

  // Initialize database connection
  async connect() {
    if (this.isPostgres) {
      // PostgreSQL connection
      this.db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : false
      });

      try {
        await this.db.query('SELECT NOW()');
        console.log('Connected to PostgreSQL database');
      } catch (error) {
        console.error('Error connecting to PostgreSQL:', error);
        throw error;
      }
    } else {
      // SQLite connection
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
  }

  // Initialize database schema
  async initialize() {
    if (this.isPostgres) {
      const queries = [
        // Groups table
        `CREATE TABLE IF NOT EXISTS groups (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          whatsapp_link TEXT NOT NULL,
          capacity INTEGER DEFAULT 1000,
          current_count INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          campaign TEXT DEFAULT 'puducherry',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // Scans table
        `CREATE TABLE IF NOT EXISTS scans (
          id SERIAL PRIMARY KEY,
          group_id INTEGER REFERENCES groups(id),
          ip_address TEXT,
          user_agent TEXT,
          scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          referred_from TEXT
        )`,

        // Settings table
        `CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // Create indexes for better performance
        `CREATE INDEX IF NOT EXISTS idx_scans_group_id ON scans(group_id)`,
        `CREATE INDEX IF NOT EXISTS idx_scans_time ON scans(scan_time)`,
        `CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active)`,
        `CREATE INDEX IF NOT EXISTS idx_groups_campaign ON groups(campaign)`
      ];

      for (const query of queries) {
        await this.run(query);
      }

      // Migration: Add campaign column if it doesn't exist (for existing databases)
      try {
        await this.db.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS campaign TEXT DEFAULT 'puducherry'`);
      } catch (e) {
        // Column might already exist, ignore error
      }
    } else {
      const queries = [
        // Groups table
        `CREATE TABLE IF NOT EXISTS groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          whatsapp_link TEXT NOT NULL,
          capacity INTEGER DEFAULT 1000,
          current_count INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          campaign TEXT DEFAULT 'puducherry',
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
        `CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active)`,
        `CREATE INDEX IF NOT EXISTS idx_groups_campaign ON groups(campaign)`
      ];

      // Run table creation queries first (without campaign index)
      const tableQueries = queries.filter(q => !q.includes('idx_groups_campaign'));
      for (const query of tableQueries) {
        await this.run(query);
      }

      // Migration: Add campaign column if it doesn't exist (for existing databases)
      try {
        await this.run(`ALTER TABLE groups ADD COLUMN campaign TEXT DEFAULT 'puducherry'`);
        console.log('Added campaign column to existing database');
      } catch (e) {
        // Column might already exist, ignore error
      }

      // Now create the campaign index after ensuring column exists
      try {
        await this.run(`CREATE INDEX IF NOT EXISTS idx_groups_campaign ON groups(campaign)`);
      } catch (e) {
        // Index might already exist
      }
    }

    console.log('Database schema initialized');
  }

  // Run a query
  async run(sql, params = []) {
    if (this.isPostgres) {
      const result = await this.db.query(sql, params);
      return { id: result.rows[0]?.id, changes: result.rowCount };
    } else {
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
  }

  // Get single row
  async get(sql, params = []) {
    if (this.isPostgres) {
      // Convert ? placeholders to $1, $2, etc.
      let pgSql = sql;
      let paramIndex = 1;
      while (pgSql.includes('?')) {
        pgSql = pgSql.replace('?', `$${paramIndex}`);
        paramIndex++;
      }
      const result = await this.db.query(pgSql, params);
      return result.rows[0];
    } else {
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
  }

  // Get all rows
  async all(sql, params = []) {
    if (this.isPostgres) {
      // Convert ? placeholders to $1, $2, etc.
      let pgSql = sql;
      let paramIndex = 1;
      while (pgSql.includes('?')) {
        pgSql = pgSql.replace('?', `$${paramIndex}`);
        paramIndex++;
      }
      const result = await this.db.query(pgSql, params);
      return result.rows;
    } else {
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
  }

  // Close database connection
  async close() {
    if (this.isPostgres) {
      await this.db.end();
      console.log('PostgreSQL connection closed');
    } else {
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
  }

  // Group operations
  async getActiveGroups(campaign = null) {
    if (campaign) {
      const sql = this.isPostgres
        ? 'SELECT * FROM groups WHERE is_active = true AND campaign = $1 ORDER BY current_count ASC'
        : 'SELECT * FROM groups WHERE is_active = 1 AND campaign = ? ORDER BY current_count ASC';
      return this.isPostgres
        ? (await this.db.query(sql, [campaign])).rows
        : this.all(sql, [campaign]);
    }
    const sql = this.isPostgres
      ? 'SELECT * FROM groups WHERE is_active = true ORDER BY current_count ASC'
      : 'SELECT * FROM groups WHERE is_active = 1 ORDER BY current_count ASC';
    return this.all(sql);
  }

  async getGroupById(id) {
    return this.get('SELECT * FROM groups WHERE id = ?', [id]);
  }

  async getAllGroups(campaign = null) {
    if (campaign) {
      return this.all('SELECT * FROM groups WHERE campaign = ? ORDER BY created_at DESC', [campaign]);
    }
    return this.all('SELECT * FROM groups ORDER BY campaign ASC, created_at DESC');
  }

  async getCampaigns() {
    const sql = 'SELECT DISTINCT campaign FROM groups ORDER BY campaign ASC';
    const results = await this.all(sql);
    return results.map(r => r.campaign);
  }

  async addGroup(name, whatsappLink, capacity, campaign = 'puducherry') {
    if (this.isPostgres) {
      const result = await this.db.query(
        'INSERT INTO groups (name, whatsapp_link, capacity, campaign) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, whatsappLink, capacity, campaign]
      );
      return { id: result.rows[0].id };
    } else {
      return this.run(
        'INSERT INTO groups (name, whatsapp_link, capacity, campaign) VALUES (?, ?, ?, ?)',
        [name, whatsappLink, capacity, campaign]
      );
    }
  }

  async updateGroup(id, name, whatsappLink, capacity, isActive, campaign = null) {
    if (campaign !== null) {
      return this.run(
        'UPDATE groups SET name = ?, whatsapp_link = ?, capacity = ?, is_active = ?, campaign = ? WHERE id = ?',
        [name, whatsappLink, capacity, isActive, campaign, id]
      );
    }
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
    if (this.isPostgres) {
      return this.run(
        'UPDATE groups SET is_active = NOT is_active WHERE id = $1',
        [id]
      );
    } else {
      return this.run(
        'UPDATE groups SET is_active = NOT is_active WHERE id = ?',
        [id]
      );
    }
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
    return result.count || 0;
  }

  async getUniqueIPs() {
    const result = await this.get('SELECT COUNT(DISTINCT ip_address) as count FROM scans');
    return result.count || 0;
  }

  async getScansPerDay(days = 7) {
    if (this.isPostgres) {
      return this.all(
        `SELECT DATE(scan_time) as date, COUNT(*) as count
         FROM scans
         WHERE scan_time >= NOW() - INTERVAL '${days} days'
         GROUP BY DATE(scan_time)
         ORDER BY date DESC`
      );
    } else {
      return this.all(
        `SELECT DATE(scan_time) as date, COUNT(*) as count
         FROM scans
         WHERE scan_time >= datetime('now', '-${days} days')
         GROUP BY DATE(scan_time)
         ORDER BY date DESC`
      );
    }
  }

  async getScansPerHour(hours = 24) {
    if (this.isPostgres) {
      return this.all(
        `SELECT DATE_TRUNC('hour', scan_time) as hour, COUNT(*) as count
         FROM scans
         WHERE scan_time >= NOW() - INTERVAL '${hours} hours'
         GROUP BY DATE_TRUNC('hour', scan_time)
         ORDER BY hour DESC`
      );
    } else {
      return this.all(
        `SELECT strftime('%Y-%m-%d %H:00:00', scan_time) as hour, COUNT(*) as count
         FROM scans
         WHERE scan_time >= datetime('now', '-${hours} hours')
         GROUP BY hour
         ORDER BY hour DESC`
      );
    }
  }

  async getTopGroups(limit = 5) {
    return this.all(
      `SELECT g.name, g.id, COUNT(s.id) as scan_count
       FROM groups g
       LEFT JOIN scans s ON g.id = s.group_id
       GROUP BY g.id, g.name
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
    if (this.isPostgres) {
      return this.db.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
    } else {
      return this.run(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
        [key, value, value]
      );
    }
  }

  // Analytics
  async getDashboardStats() {
    const totalGroups = await this.get('SELECT COUNT(*) as count FROM groups');
    const activeGroupsSql = this.isPostgres
      ? 'SELECT COUNT(*) as count FROM groups WHERE is_active = true'
      : 'SELECT COUNT(*) as count FROM groups WHERE is_active = 1';
    const activeGroups = await this.get(activeGroupsSql);

    const totalCapacitySql = this.isPostgres
      ? 'SELECT SUM(capacity) as total FROM groups WHERE is_active = true'
      : 'SELECT SUM(capacity) as total FROM groups WHERE is_active = 1';
    const totalCapacity = await this.get(totalCapacitySql);

    const currentMembersSql = this.isPostgres
      ? 'SELECT SUM(current_count) as total FROM groups WHERE is_active = true'
      : 'SELECT SUM(current_count) as total FROM groups WHERE is_active = 1';
    const currentMembers = await this.get(currentMembersSql);

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
