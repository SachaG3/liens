import { readFile, writeFile } from "node:fs/promises";

const output = new URL("../src/data/name-days.fr.json", import.meta.url);
const optionsOutput = new URL("../src/data/name-day-options.fr.json", import.meta.url);
const existing = JSON.parse(await readFile(output, "utf8"));
const calendar = {};
const options = [];
const year = 2025;

for (let month = 1; month <= 12; month++) {
  const days = new Date(year, month, 0).getDate();
  for (let day = 1; day <= days; day += 8) {
    await Promise.all(Array.from({ length: Math.min(8, days - day + 1) }, async (_, offset) => {
      const currentDay = day + offset;
      const response = await fetch(`https://nominis.cef.fr/json/nominis.php?jour=${currentDay}&mois=${month}&annee=${year}`);
      if (!response.ok) throw new Error(`Nominis indisponible pour ${currentDay}/${month}`);
      const data = await response.json();
      const prenoms = data?.response?.prenoms ?? {};
      const names = [...Object.keys(prenoms.majeurs ?? {}), ...Object.keys(prenoms.derives ?? {})];
      const date = `${String(month).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`;
      const primaryNames = Object.keys(prenoms.majeurs ?? {});
      const fallbackSaints = Object.keys(data?.response?.saints?.majeurs ?? {});
      for (const name of primaryNames.length ? primaryNames : fallbackSaints.slice(0, 1)) {
        options.push({ name, value: `${normalizeName(name)}|${date}`, date });
      }
      for (const name of names) {
        const normalized = normalizeName(name);
        if (normalized && !calendar[normalized]) calendar[normalized] = date;
      }
    }));
  }
}

// Existing curated choices stay authoritative when a name has several feast days.
Object.assign(calendar, existing);
const sorted = Object.fromEntries(Object.entries(calendar).sort(([left], [right]) => left.localeCompare(right, "fr")));
const sortedOptions = options.sort((left, right) => left.date.localeCompare(right.date) || left.name.localeCompare(right.name, "fr"));
await writeFile(output, `${JSON.stringify(sorted, null, 2)}\n`);
await writeFile(optionsOutput, `${JSON.stringify(sortedOptions, null, 2)}\n`);
console.log(`${Object.keys(sorted).length} prénoms automatiques, ${sortedOptions.length} fêtes manuelles, ${new Set(sortedOptions.map(option => option.date)).size} jours couverts.`);

function normalizeName(value) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().split(/[\s-]/)[0].replace(/[^a-z]/g, "");
}
