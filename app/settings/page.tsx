import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <SettingsForm
      currentName={session.user.name}
      currentEmail={session.user.email}
    />
  );
}
