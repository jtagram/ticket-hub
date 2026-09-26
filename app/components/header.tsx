import { LogoutButton } from "@/app/components/logout-button";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-black/[.08] bg-white px-6 dark:border-white/[.145] dark:bg-black">
      <span className="text-lg font-semibold text-black dark:text-zinc-50">
        Ticket Hub
      </span>
      <LogoutButton />
    </header>
  );
}
