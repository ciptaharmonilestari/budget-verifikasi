import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/shell/AppShell";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const unreadCount = await prisma.notification.count({
    where: {
      readAt: null,
      OR: [{ toUserId: user.id }, { toRole: user.role }, { toUserId: null, toRole: null }],
    },
  });

  return (
    <AppShell nav={user.nav} userName={user.name} userRole={user.role} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
