import type { Metadata } from "next";
import { LoginGate } from "@/components/LoginGate";
import { ProfileView } from "@/components/ProfileView";
import { getProfile } from "@/server/queries";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Профиль" };

export default async function ProfilePage() {
  const userId = await getUserId();
  if (!userId) return <LoginGate title="Профиль" next="/login?next=/profile" />;
  const profile = await getProfile(userId);
  if (!profile) return <LoginGate title="Профиль" next="/login?next=/profile" />;
  return (
    <ProfileView
      initialUser={profile.user}
      transactions={profile.transactions}
      withdrawals={profile.withdrawals}
      rank={profile.rank}
    />
  );
}
