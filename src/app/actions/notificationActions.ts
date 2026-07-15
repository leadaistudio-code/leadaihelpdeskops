"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NotificationType } from "@prisma/client";
import { getSessionUser } from "@/lib/auth-utils";
import { sendEmail, notificationEmailHtml } from "@/lib/email";

// Create a notification for a user. Safe to call from other server actions;
// never throws into the caller's critical path (best-effort).
export async function notify(
  userId: string | null | undefined,
  data: { title: string; body?: string; type?: NotificationType; link?: string }
) {
  if (!userId) return;
  try {
    await prisma.notification.create({
      data: {
        userId,
        title: data.title,
        body: data.body,
        type: data.type ?? "GENERAL",
        link: data.link,
      },
    });

    // Best-effort email, honoring the recipient's preference.
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailNotifications: true },
    });
    if (recipient?.email && recipient.emailNotifications) {
      await sendEmail({
        to: recipient.email,
        subject: data.title,
        html: notificationEmailHtml(data.title, data.body, data.link),
        text: data.body ?? data.title,
      });
    }
  } catch (e) {
    console.error("notify failed:", e);
  }
}

export async function getMyNotifications(limit = 15) {
  const user = await getSessionUser();
  if (!user) return { items: [], unread: 0 };

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return {
    items: items.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    unread,
  };
}

export async function markNotificationRead(id: string) {
  const user = await getSessionUser();
  if (!user) return;
  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });
  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const user = await getSessionUser();
  if (!user) return;
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/");
}

export async function notifyGroup(
  groupId: string | null | undefined,
  data: { title: string; body?: string; type?: NotificationType; link?: string }
) {
  if (!groupId) return;
  try {
    const group = await prisma.assignmentGroup.findUnique({
      where: { id: groupId },
      include: { members: { select: { id: true } } },
    });
    if (!group) return;
    
    // Notify all members asynchronously
    await Promise.all(
      group.members.map(member => notify(member.id, data))
    );
  } catch (e) {
    console.error("notifyGroup failed:", e);
  }
}
