import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Logo } from "@/components/Logo";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <Logo href="/" />
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
