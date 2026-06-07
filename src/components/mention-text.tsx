import Link from "next/link";
import { cn } from "@/lib/utils";

type MentionPerson = { id: string; firstName: string; lastName: string };

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function MentionText({ text, people, className }: { text: string; people: MentionPerson[]; className?: string }) {
  const firstNameCounts = new Map<string, number>();
  for (const person of people) {
    const key = person.firstName.toLocaleLowerCase("fr");
    firstNameCounts.set(key, (firstNameCounts.get(key) ?? 0) + 1);
  }

  const aliases = people.flatMap(person => {
    const fullName = `${person.firstName} ${person.lastName}`.trim();
    const names = [{ name: fullName, person }];
    if (firstNameCounts.get(person.firstName.toLocaleLowerCase("fr")) === 1 && fullName !== person.firstName) {
      names.push({ name: person.firstName, person });
    }
    return names;
  }).sort((a, b) => b.name.length - a.name.length);

  if (!aliases.length || !text.includes("@")) {
    return <p className={cn("whitespace-pre-wrap", className)}>{text}</p>;
  }

  const peopleByAlias = new Map(aliases.map(alias => [alias.name.toLocaleLowerCase("fr"), alias.person]));
  const pattern = new RegExp(`@(${aliases.map(alias => escapeRegex(alias.name)).join("|")})(?=$|[\\s,.;:!?\\)])`, "giu");
  const parts = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index;
    if (index > cursor) parts.push(text.slice(cursor, index));
    const person = peopleByAlias.get(match[1].toLocaleLowerCase("fr"));
    parts.push(person
      ? <Link key={`${index}-${person.id}`} href={`/contacts/${person.id}`} className="rounded-[4px] bg-primary/10 px-1 py-0.5 font-medium text-foreground underline decoration-primary/50 underline-offset-2 transition-colors hover:bg-primary/20 hover:decoration-primary dark:bg-primary/20 dark:hover:bg-primary/30">{match[0]}</Link>
      : match[0]);
    cursor = index + match[0].length;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return <p className={cn("whitespace-pre-wrap", className)}>{parts}</p>;
}
