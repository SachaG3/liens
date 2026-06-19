"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="fr">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#faf8f5",
          color: "#302d29",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <main style={{ maxWidth: 460, textAlign: "center" }}>
          <p style={{ margin: 0, color: "#7a746c", fontSize: 14, fontWeight: 700 }}>500</p>
          <h1 style={{ margin: "12px 0 0", fontSize: 32, lineHeight: 1.1 }}>
            {"Liens ne peut pas s'afficher"}
          </h1>
          <p style={{ margin: "14px 0 0", color: "#6b655d", lineHeight: 1.6 }}>
            {"Une erreur critique a interrompu le chargement de l'application."}
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              minHeight: 44,
              marginTop: 28,
              border: 0,
              borderRadius: 8,
              padding: "0 18px",
              background: "#302d29",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
