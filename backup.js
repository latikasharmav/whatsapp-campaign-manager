require('dotenv').config();
const db = require('./database');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
  try {
    console.log('💾 Starting database backup...\n');

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir);
      console.log('✅ Created backups directory\n');
    }

    // Connect to database
    await db.connect();
    console.log('✅ Connected to database\n');

    // Export all data
    console.log('📊 Exporting data...');
    const data = await db.exportAllData();

    // Create backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(backupsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    console.log(`✅ Backup saved: ${filename}\n`);
    console.log('📊 Backup Summary:');
    console.log(`   • Groups: ${data.groups.length}`);
    console.log(`   • Scans: ${data.scans.length}`);
    console.log(`   • Settings: ${data.settings.length}`);
    console.log(`   • File Size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);
    console.log(`   • Location: ${filepath}\n`);

    await db.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    process.exit(1);
  }
}

// Run backup
backupDatabase();
