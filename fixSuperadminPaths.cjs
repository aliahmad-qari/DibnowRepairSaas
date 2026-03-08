// Script to fix all superadmin API paths
// Run with: node fixSuperadminPaths.js

const fs = require('fs');
const path = require('path');

const files = [
  'pages/superadmin/SuperAdminDashboard.tsx',
  'pages/superadmin/ShopManagement.tsx',
  'pages/superadmin/RevenueAnalytics.tsx',
  'pages/superadmin/SystemAuditLogs.tsx',
  'pages/superadmin/GlobalPlans.tsx',
  'pages/superadmin/GlobalCurrencies.tsx',
  'pages/superadmin/GlobalAnnouncements.tsx',
  'pages/superadmin/GlobalFeatureFlags.tsx',
  'pages/superadmin/GlobalSupport.tsx'
];

const replacements = [
  { from: "'/superadmin/", to: "'/api/superadmin/" },
  { from: '"/superadmin/', to: '"/api/superadmin/' },
  { from: "'/plans'", to: "'/api/plans'" },
  { from: '"/plans"', to: '"/api/plans"' }
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  replacements.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.replaceAll(from, to);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`⏭️  No changes needed: ${file}`);
  }
});

console.log('\n✅ All files processed!');
