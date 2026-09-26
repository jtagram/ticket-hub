import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-cookie";
import { decodeJwtPayload } from "@/app/lib/decode-jwt";
import { Header } from "@/app/components/header";
import { HomeShell } from "@/app/components/home-shell";

interface InternalUserJwtPayload {
  email?: string;
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const payload = token
    ? decodeJwtPayload<InternalUserJwtPayload>(token)
    : null;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Header />
      <HomeShell informerEmail={payload?.email ?? ""} />
    </div>
  );
}
