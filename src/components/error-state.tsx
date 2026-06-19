import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Home, SearchX } from "lucide-react";
import { Brand } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  code: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function ErrorState({ code, title, description, actions }: ErrorStateProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-lg text-center">
        <Brand className="mb-12 justify-center" />
        <div className="mx-auto mb-7 grid size-16 place-items-center rounded-full border bg-card shadow-xs">
          <SearchX className="size-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">{code}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
        <div className="mt-8 flex flex-col-reverse justify-center gap-2 sm:flex-row">
          {actions ?? (
            <>
              <Link href="/contacts" className={cn(buttonVariants({ variant: "outline" }))}>
                <ArrowLeft />
                Carnet
              </Link>
              <Link href="/" className={cn(buttonVariants())}>
                <Home />
                Accueil
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
