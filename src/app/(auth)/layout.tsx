import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brand } from "@/components/brand";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getUser()) redirect("/");
  return <main className="relative grid min-h-screen bg-background lg:grid-cols-[1fr_1.1fr]"><div className="absolute right-5 top-5 z-10"><ThemeToggle/></div><section className="flex items-center justify-center p-6 lg:p-12"><div className="w-full max-w-[360px]">{children}</div></section><aside className="relative hidden overflow-hidden border-l bg-foreground text-background lg:flex lg:flex-col lg:justify-between lg:p-14"><div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_30%),radial-gradient(circle_at_80%_60%,white_0,transparent_25%)]"/><Brand inverse className="relative"/><blockquote className="relative max-w-xl text-3xl font-medium leading-tight tracking-tight">Les relations importantes ne devraient pas dépendre de votre mémoire.</blockquote><p className="relative text-sm text-background/55">Privé. Auto-hébergé. Pensé pour les humains.</p></aside></main>;
}
