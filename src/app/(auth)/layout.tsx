import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers } from "lucide-react";

import { auth } from "@/auth";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-violet-600 text-white">
          <Layers className="size-4" />
        </div>
        <span className="text-lg font-semibold">DevStash</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
