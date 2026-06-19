"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCw } from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      code="500"
      title="Une erreur est survenue"
      description="La page n'a pas pu être chargée correctement. Vous pouvez relancer l'affichage ou revenir à l'accueil."
      actions={
        <>
          <Button variant="outline" onClick={() => unstable_retry()}>
            <RotateCw />
            Réessayer
          </Button>
          <Link href="/" className={cn(buttonVariants())}>
            <Home />
            Accueil
          </Link>
        </>
      }
    />
  );
}
