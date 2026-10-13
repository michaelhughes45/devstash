import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { HomeNav } from "@/components/homepage/HomeNav";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <>
      <HomeNav signedIn={false} anchorBase="/" />
      {/* pt-28 clears the fixed 64px nav */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-28 pb-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </>
  );
}
