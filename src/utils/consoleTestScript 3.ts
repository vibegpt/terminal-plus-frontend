// Console Test Script for Terminal & Collection Validation
// Run this in your browser console to test validation

export const consoleTestScript = `
// 🧪 Terminal & Collection Validation Test Script
// Copy and paste this into your browser console

async function testCollection(terminalCode, collectionSlug) {
  console.log(\`\\n🧪 Testing: \${terminalCode} / \${collectionSlug}\\n\`);
  
  // Test format validation
  const validTerminal = /^[A-Z]{3}-[A-Z0-9]+$/.test(terminalCode);
  const validSlug = /^[a-z-]+$/.test(collectionSlug);
  
  console.log('📋 Format Validation:');
  console.log('  Terminal format:', validTerminal ? '✅' : '❌', terminalCode);
  console.log('  Collection slug format:', validSlug ? '✅' : '❌', collectionSlug);
  
  // Test against valid values
  const validTerminals = [
    'SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'SIN-JEWEL',
    'SYD-T1', 'SYD-T2', 'SYD-T3', 'SYD-TD',
    'LHR-T2', 'LHR-T3', 'LHR-T4', 'LHR-T5'
  ];
  
  const validCollectionSlugs = [
    // Universal collections
    'quick-bites', '24-7-heroes', 'coffee-chill', 'lounge-life',
    'duty-free-deals', 'healthy-choices', 'stay-connected',
    'last-minute-essentials', 'power-hour',
    // Singapore-specific
    'hawker-heaven', 'garden-city-gems', 'changi-exclusives',
    'jewel-wonders', 'kiasu-essentials',
    // Sydney-specific
    'true-blue-aussie', 'sydney-coffee-culture', 'harbour-views'
  ];
  
  const terminalValid = validTerminals.includes(terminalCode);
  const collectionValid = validCollectionSlugs.includes(collectionSlug);
  
  console.log('\\n🎯 Value Validation:');
  console.log('  Terminal value:', terminalValid ? '✅' : '❌', terminalCode);
  console.log('  Collection slug value:', collectionValid ? '✅' : '❌', collectionSlug);
  
  // Test URL construction
  if (validTerminal && validSlug && terminalValid && collectionValid) {
    const url = \`/collection/\${terminalCode}/\${collectionSlug}\`;
    console.log('\\n🔗 Valid URL:', url);
    
    // Test if we can navigate (if in React Router context)
    if (window.location.pathname.includes('/collection/')) {
      console.log('📍 Currently on collection page, can test navigation');
    }
  } else {
    console.log('\\n❌ Cannot construct valid URL - fix validation errors first');
  }
  
  // Test Supabase connection (if available)
  if (window.supabase) {
    console.log('\\n🗄️  Testing Supabase connection...');
    try {
      const { data, error } = await window.supabase
        .rpc('get_collections_for_terminal', {
          p_airport: terminalCode.split('-')[0],
          p_terminal: terminalCode.split('-')[1]
        });
      
      if (error) {
        console.log('  Supabase RPC error:', error.message);
      } else {
        console.log('  Supabase RPC success:', data?.length || 0, 'collections found');
      }
    } catch (err) {
      console.log('  Supabase connection failed:', err.message);
    }
  } else {
    console.log('\\n🗄️  Supabase not available in window object');
  }
  
  console.log('\\n📊 Summary:');
  console.log('  Format valid:', validTerminal && validSlug ? '✅' : '❌');
  console.log('  Values valid:', terminalValid && collectionValid ? '✅' : '❌');
  console.log('  Overall valid:', (validTerminal && validSlug && terminalValid && collectionValid) ? '✅' : '❌');
}

// 🚀 Quick test examples
console.log('\\n🚀 Quick Test Examples:');
console.log('testCollection("SIN-T3", "hawker-heaven");     // ✅ Should pass');
console.log('testCollection("SIN T3", "hawker_heaven");     // ❌ Should fail');
console.log('testCollection("T3", "hawker-heaven");         // ❌ Should fail');
console.log('testCollection("SIN-T3", "invalid-slug");      // ❌ Should fail');

// 🎯 Run a test
// testCollection('SIN-T3', 'hawker-heaven');
`;

// Function to copy the script to clipboard
export function copyTestScriptToClipboard() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(consoleTestScript);
    console.log('✅ Test script copied to clipboard!');
  } else {
    console.log('❌ Clipboard API not available');
    console.log('📋 Copy this manually:', consoleTestScript);
  }
}

// Export the script as a string for easy copying
export default consoleTestScript;
