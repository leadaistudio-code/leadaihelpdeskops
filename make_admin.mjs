import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'Aryannick9868@gmail.com';
  console.log(`Looking for user with email: ${email}`);
  
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`User not found, trying case-insensitive or maybe they haven't been created yet.`);
    const users = await prisma.user.findMany();
    console.log(`Total users in DB: ${users.length}`);
    const match = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (match) {
        user = match;
        console.log(`Found user with case-insensitive match: ${user.email}`);
    } else {
        // If still not found, we could try to create one, but maybe clerk syncs it later.
        console.log(`No user found with that email.`);
        return;
    }
  }

  console.log(`Updating role to ADMIN for user: ${user.email}`);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { 
      role: 'ADMIN',
      moduleAccess: ['SELF_SERVICE', 'DASHBOARD', 'CATALOG_ADMIN', 'CMDB', 'INCIDENTS'] 
    }
  });

  console.log('User updated successfully:', updated);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
