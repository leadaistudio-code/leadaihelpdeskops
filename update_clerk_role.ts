import 'dotenv/config';
import { clerkClient } from '@clerk/nextjs/server';

async function main() {
  const email = 'aryannick9868@gmail.com';
  
  // Find user in Clerk
  const response = await clerkClient.users.getUserList({ emailAddress: [email] });
  const users = response.data;
  
  if (!users || users.length === 0) {
    console.log(`No user found in Clerk with email: ${email}`);
    return;
  }
  
  const clerkUser = users[0];
  console.log(`Found Clerk user: ${clerkUser.id} (${clerkUser.emailAddresses[0].emailAddress})`);
  
  // Update public metadata
  await clerkClient.users.updateUserMetadata(clerkUser.id, {
    publicMetadata: {
      role: 'ADMIN',
    }
  });
  
  console.log('Successfully updated Clerk publicMetadata to ADMIN.');
}

main().catch(console.error);
