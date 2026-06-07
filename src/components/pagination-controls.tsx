"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

type PaginationControlsProps = {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  pageParamName?: string;
};

export function PaginationControls({ totalItems, itemsPerPage, currentPage, pageParamName = "page" }: PaginationControlsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Ne pas afficher la pagination s'il n'y a qu'une seule page
  if (totalPages <= 1) return null;

  // Créer une nouvelle URL avec le numéro de page
  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set(pageParamName, pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Générer les numéros de page à afficher
  const generatePageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 7; // Nombre maximum de pages visibles

    if (totalPages <= maxVisible) {
      // Afficher toutes les pages si le total est petit
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Toujours afficher la première page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      // Pages autour de la page courante
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Toujours afficher la dernière page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="mt-6 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} sur {totalPages} · {totalItems} résultat{totalItems !== 1 ? "s" : ""}
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={currentPage > 1 ? createPageURL(currentPage - 1) : "#"}
              text="Précédent"
              aria-disabled={currentPage === 1}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {pageNumbers.map((page, index) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink href={createPageURL(page)} isActive={currentPage === page}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href={currentPage < totalPages ? createPageURL(currentPage + 1) : "#"}
              text="Suivant"
              aria-disabled={currentPage === totalPages}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
