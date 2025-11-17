require('dotenv').config();
const db = require('./database');

// Sample Indian city names for campaign groups
const cities = [
  'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Chandigarh', 'Indore', 'Bhopal', 'Nagpur', 'Vadodara',
  'Surat', 'Kochi', 'Patna', 'Guwahati', 'Coimbatore'
];

// Sample user agents
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) Mobile',
  'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Linux; Android 10; SM-G973F) Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
];

// Generate random IP address
function generateRandomIP() {
  return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

// Generate random date within last N days
function randomDate(days) {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await db.connect();
    await db.initialize();

    console.log('✅ Database connected and initialized\n');

    // Check if data already exists
    const existingGroups = await db.getAllGroups();
    if (existingGroups.length > 0) {
      console.log('⚠️  Database already contains data.');
      console.log('   To reseed, delete database.sqlite and run this script again.\n');
      process.exit(0);
    }

    // Create 20 sample groups
    console.log('📱 Creating 20 sample groups...');
    const groupIds = [];

    for (let i = 0; i < 20; i++) {
      const city = cities[i];
      const groupNumber = Math.floor(i / cities.length) + 1;
      const name = `Campaign ${city} Group ${groupNumber}`;

      // Generate realistic WhatsApp group invite link
      const randomCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const whatsappLink = `https://chat.whatsapp.com/${randomCode}`;

      // Random capacity between 500 and 1024
      const capacity = Math.floor(Math.random() * (1024 - 500 + 1)) + 500;

      const result = await db.addGroup(name, whatsappLink, capacity);
      groupIds.push(result.id);

      console.log(`   ✓ Created: ${name} (Capacity: ${capacity})`);
    }

    console.log(`\n✅ Created ${groupIds.length} groups\n`);

    // Generate random scans for the last 30 days
    console.log('📊 Generating scan data for last 30 days...');

    let totalScans = 0;
    const scansPerDay = Math.floor(Math.random() * 50) + 50; // 50-100 scans per day

    for (let day = 30; day >= 0; day--) {
      const scansForDay = Math.floor(Math.random() * scansPerDay) + 20;

      for (let i = 0; i < scansForDay; i++) {
        const randomGroupId = groupIds[Math.floor(Math.random() * groupIds.length)];
        const randomIP = generateRandomIP();
        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        const scanDate = randomDate(day);

        // Insert scan with custom date
        await db.run(
          `INSERT INTO scans (group_id, ip_address, user_agent, scan_time, referred_from)
           VALUES (?, ?, ?, ?, ?)`,
          [randomGroupId, randomIP, randomUserAgent, scanDate.toISOString(), 'QR Code']
        );

        // Update group count
        await db.incrementGroupCount(randomGroupId);

        totalScans++;
      }

      if (day % 5 === 0) {
        console.log(`   ✓ Generated scans for ${30 - day} days...`);
      }
    }

    console.log(`\n✅ Generated ${totalScans} scans\n`);

    // Randomly deactivate some groups
    console.log('🔧 Configuring group statuses...');
    const groupsToDeactivate = Math.floor(groupIds.length * 0.2); // 20% inactive

    for (let i = 0; i < groupsToDeactivate; i++) {
      const randomGroupId = groupIds[Math.floor(Math.random() * groupIds.length)];
      await db.toggleGroupStatus(randomGroupId);
    }

    console.log(`   ✓ Deactivated ${groupsToDeactivate} groups\n`);

    // Add some settings
    console.log('⚙️  Adding system settings...');
    await db.setSetting('last_backup', new Date().toISOString());
    await db.setSetting('campaign_name', 'WhatsApp Campaign 2024');
    console.log('   ✓ Settings configured\n');

    // Display summary
    console.log('═══════════════════════════════════════');
    console.log('           SEEDING COMPLETE            ');
    console.log('═══════════════════════════════════════');

    const stats = await db.getDashboardStats();

    console.log('\n📊 Summary:');
    console.log(`   • Total Groups: ${stats.totalGroups}`);
    console.log(`   • Active Groups: ${stats.activeGroups}`);
    console.log(`   • Total Capacity: ${stats.totalCapacity.toLocaleString()}`);
    console.log(`   • Current Members: ${stats.currentMembers.toLocaleString()}`);
    console.log(`   • Fill Rate: ${stats.fillRate}%`);
    console.log(`   • Total Scans: ${stats.totalScans.toLocaleString()}`);
    console.log(`   • Unique IPs: ${stats.uniqueIPs.toLocaleString()}`);

    console.log('\n🚀 You can now start the server:');
    console.log('   npm start');
    console.log('\n📱 Access admin panel at:');
    console.log('   http://localhost:3000/admin.html');
    console.log('\n🔑 Admin Password:');
    console.log('   SecureAdmin2024');
    console.log('\n═══════════════════════════════════════\n');

    await db.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
