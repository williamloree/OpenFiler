import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { Dashboard } from "./dashboard";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <Dashboard
      userName={session.user.name ?? session.user.email}
      userEmail={session.user.email}
    />
  );
}
