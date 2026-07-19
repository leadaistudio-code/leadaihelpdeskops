import 'dotenv/config';

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing CLERK_SECRET_KEY');
  }

  const email = 'aryannick9868@gmail.com';
  
  console.log('Fetching user from Clerk API...');
  const getRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
    headers: { 'Authorization': `Bearer ${secretKey}` }
  });
  
  if (!getRes.ok) {
    throw new Error(`Failed to fetch user: ${await getRes.text()}`);
  }
  
  const users = await getRes.json();
  if (users.length === 0) {
    console.log('No user found in Clerk with that email.');
    return;
  }
  
  const user = users[0];
  console.log(`Found user: ${user.id}`);
  
  console.log('Updating public_metadata for user...');
  const patchRes = await fetch(`https://api.clerk.com/v1/users/${user.id}/metadata`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      public_metadata: { role: 'ADMIN' }
    })
  });
  
  if (!patchRes.ok) {
    throw new Error(`Failed to update user: ${await patchRes.text()}`);
  }
  
  console.log('Successfully updated Clerk public_metadata to ADMIN!');
}

main().catch(console.error);
