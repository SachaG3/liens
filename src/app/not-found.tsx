import type { Metadata } from "next";
import { ErrorState } from "@/components/error-state";

export const metadata: Metadata = {
  title: "Page introuvable - Liens",
};

export default function NotFound() {
  return (
    <ErrorState
      code="404"
      title="Page introuvable"
      description="Cette page n'existe pas, a été déplacée, ou vous n'avez pas accès à cette ressource."
    />
  );
}
