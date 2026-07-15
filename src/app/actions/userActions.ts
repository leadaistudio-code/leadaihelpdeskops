"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";
import { clerkClient } from "@clerk/nextjs/server";
import { logAudit } from "@/lib/audit";

// --- Current user's own profile ---

export async function getMyProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  return {
    name: user.name,
    email: user.email,
    jobTitle: user.jobTitle ?? "",
    emailNotifications: user.emailNotifications,
    role: user.role,
  };
}

export async function updateMyProfile(data: {
  name?: string;
  jobTitle?: string;
  emailNotifications?: boolean;
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name?.trim() || user.name,
      jobTitle: data.jobTitle?.trim() || null,
      emailNotifications: data.emailNotifications ?? user.emailNotifications,
    },
  });

  revalidatePath("/");
  return { ok: true };
}

// --- Admin user management ---

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") throw new Error("Admin access required");
  return user;
}

export async function getAllUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    where: { domain: await getActiveDomain() },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, department: true, jobTitle: true, moduleAccess: true },
  });
}

// Update a user's role. Clerk publicMetadata is the source of truth (the session
// sync reads from it), so we update Clerk first, then mirror to the DB.
export async function updateUserRole(userId: string, role: Role) {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("You can't change your own role");

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, role: true } });
  if (!target) throw new Error("User not found");

  let clerkSynced = false;
  try {
    const client = await clerkClient();
    const list = await client.users.getUserList({ emailAddress: [target.email] });
    const clerkUser = list.data[0];
    if (clerkUser) {
      await client.users.updateUserMetadata(clerkUser.id, { publicMetadata: { role } });
      clerkSynced = true;
    }
  } catch (e) {
    console.error("Clerk role sync failed:", e);
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  await logAudit({
    domain: admin.domain,
    action: "ROLE_CHANGE",
    entityType: "User",
    entityId: userId,
    entityLabel: target.name,
    summary: `Role changed ${target.role} → ${role}`,
    field: "role",
    oldValue: target.role,
    newValue: role,
    actor: { id: admin.id, name: admin.name, email: admin.email },
  });

  revalidatePath("/admin/users");
  return { ok: true, clerkSynced };
}

export async function updateUserModules(userId: string, modules: string[]) {
  const admin = await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, moduleAccess: true } });
  if (!target) throw new Error("User not found");

  let clerkSynced = false;
  try {
    const client = await clerkClient();
    const list = await client.users.getUserList({ emailAddress: [target.email] });
    const clerkUser = list.data[0];
    if (clerkUser) {
      // Preserve existing metadata, only update modules
      const currentMeta = clerkUser.publicMetadata || {};
      await client.users.updateUserMetadata(clerkUser.id, { publicMetadata: { ...currentMeta, modules } });
      clerkSynced = true;
    }
  } catch (e) {
    console.error("Clerk modules sync failed:", e);
  }

  await prisma.user.update({ where: { id: userId }, data: { moduleAccess: modules } });

  await logAudit({
    domain: admin.domain,
    action: "UPDATE",
    entityType: "User",
    entityId: userId,
    entityLabel: target.name,
    summary: `Module access updated`,
    field: "moduleAccess",
    oldValue: target.moduleAccess.join(", "),
    newValue: modules.join(", "),
    actor: { id: admin.id, name: admin.name, email: admin.email },
  });

  revalidatePath("/admin/users");
  return { ok: true, clerkSynced };
}
