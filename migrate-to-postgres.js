/**
 * Data Migration Script: SQLite to PostgreSQL
 *
 * This script exports data from the current production SQLite database
 * and prepares it for import into PostgreSQL.
 *
 * Usage:
 * 1. First, get current data: node migrate-to-postgres.js export
 * 2. After PostgreSQL is set up: node migrate-to-postgres.js import
 */

const axios = require('axios').default || require('axios');

const PRODUCTION_URL = 'https://whatsapp-campaign-manager-production.up.railway.app';

async function exportData() {
  try {
    console.log('📥 Fetching current production data...');

    // This will require authentication, so we'll use the health endpoint
    // which includes stats, then manually get the data from admin panel
    const healthResponse = await axios.get(`${PRODUCTION_URL}/health`);

    console.log('\n✅ Current Production Stats:');
    console.log(JSON.stringify(healthResponse.data.stats, null, 2));

    console.log('\n📋 Next Steps:');
    console.log('1. Login to: ' + PRODUCTION_URL + '/admin.html');
    console.log('2. Navigate to Settings or use browser console');
    console.log('3. Run: fetch("/admin/export").then(r=>r.json()).then(d=>console.log(JSON.stringify(d)))');
    console.log('4. Copy the output and save it as migration-data.json in this directory');
    console.log('\nOr simply visit: ' + PRODUCTION_URL + '/admin/export (while logged in)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function importData() {
  const fs = require('fs');
  const path = require('path');

  try {
    const dataPath = path.join(__dirname, 'migration-data.json');

    if (!fs.existsSync(dataPath)) {
      console.error('❌ migration-data.json not found!');
      console.log('\n📋 Please run: node migrate-to-postgres.js export first');
      return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log('📊 Data to import:');
    console.log(`  - Groups: ${data.groups.length}`);
    console.log(`  - Scans: ${data.scans.length}`);
    console.log(`  - Settings: ${data.settings.length}`);

    console.log('\n⚠️  Important: This should be run AFTER PostgreSQL is added to Railway');
    console.log('✅ Data is ready for import!');
    console.log('\nYou can import this data through the admin panel after PostgreSQL is set up.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const command = process.argv[2];

if (command === 'export') {
  exportData();
} else if (command === 'import') {
  importData();
} else {
  console.log('Usage:');
  console.log('  node migrate-to-postgres.js export   # Get current data');
  console.log('  node migrate-to-postgres.js import   # Prepare data for import');
}
