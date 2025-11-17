/**
 * Test script for milestone reminders
 * This script manually triggers the milestone reminder function to diagnose issues
 */

const { spawn } = require('child_process');

console.log('🔧 Starting diagnostic test for milestone reminders...\n');

// Start the dev server
console.log('📦 Starting Next.js dev server...');
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true
});

let serverReady = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('SERVER:', output);

  if (output.includes('Local:') || output.includes('localhost:3000') || output.includes('Ready in')) {
    serverReady = true;
    console.log('\n✅ Server is ready!\n');

    // Wait a bit for server to fully initialize
    setTimeout(() => {
      testMilestoneReminders();
    }, 3000);
  }
});

server.stderr.on('data', (data) => {
  console.error('SERVER ERROR:', data.toString());
});

// Timeout if server doesn't start
setTimeout(() => {
  if (!serverReady) {
    console.error('\n❌ Server failed to start within 60 seconds');
    process.exit(1);
  }
}, 60000);

async function testMilestoneReminders() {
  try {
    console.log('🔄 Calling milestone reminders API endpoint...\n');

    const response = await fetch('http://localhost:3000/api/milestoneReminders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Status Text:', response.statusText);

    const result = await response.json();
    console.log('\n📋 Response Body:');
    console.log(JSON.stringify(result, null, 2));

    if (result.status === 'success') {
      console.log(`\n✅ Successfully queued ${result.remindersQueued} reminders`);
      console.log('📝 Note:', result.note);
    } else {
      console.log('\n❌ Error occurred:', result.message);
      if (result.error) {
        console.log('🔍 Error details:', result.error);
      }
    }

  } catch (error) {
    console.error('\n❌ Failed to call milestone reminders API:', error.message);
  } finally {
    console.log('\n🛑 Shutting down server...');
    server.kill();
    process.exit(0);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Received SIGINT, shutting down...');
  server.kill();
  process.exit(0);
});
