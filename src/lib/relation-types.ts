export const relationTypes = [
  ["Famille", ["Père", "Mère", "Parent", "Frère", "Sœur", "Fils", "Fille", "Enfant", "Grand-père", "Grand-mère", "Petit-fils", "Petite-fille", "Oncle", "Tante", "Cousin", "Cousine", "Neveu", "Nièce", "Beau-père", "Belle-mère", "Beau-frère", "Belle-sœur"]],
  ["Amour", ["Copain", "Copine", "Partenaire", "Mari", "Femme", "Fiancé", "Fiancée", "Ex-partenaire"]],
  ["Personnel", ["Ami", "Amie", "Meilleur ami", "Meilleure amie", "Voisin", "Voisine", "Connaissance", "Mentor", "Mentee"]],
  ["Professionnel", ["Collègue", "Manager", "Client", "Cliente", "Partenaire professionnel", "Fournisseur", "Investisseur", "Contact professionnel"]],
] as const;

export function relationTypeOptions() {
  return relationTypes.flatMap(([, options]) => options);
}
