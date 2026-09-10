import { config } from "dotenv";
config({ path: ".env.local" });

const BARCOS: [string, string][] = [
  ["CAMBORI", "710000586"],
  ["DONA ILVA", "710002698"],
  ["IBIZA", "710000959"],
  ["MARIA CLARA", "710019030"],
  ["KOPESCA", "710877298"],
  ["KOWALSKI V", "710809198"],
  ["KR III", "710005245"],
  ["NATAL PESCA VII", "710000799"],
  ["OULED SI MOHAND", "710000136"],
  ["NATAL PESCA IX", "710000812"],
  ["RIO JAPURA", "108000317"],
  ["RIO POTENGI", "710001955"],
  ["TUNASA I", "710000811"],
  ["LEAL SANTOS 7", "710000175"],
  ["MARLIN II", "710000138"],
  ["NETUNO S", "710002915"],
  ["TRANSMAR I", "710000004"],
  ["AZTECA III", "710005123"],
  ["GUADALAJARA", "710714091"],
  ["ROMULO", "710000375"],
  ["FILHO DA PROMESSA", "710003694"],
  ["STA PAULINA", "700000123"],
  ["MARBELLA I", "710199012"],
];

async function main() {
  const { pool } = await import("../lib/db");

  let criados = 0;
  for (const [nome, mmsi] of BARCOS) {
    const existente = await pool.query("SELECT id FROM barcos WHERE mmsi = $1", [mmsi]);
    if (existente.rows.length > 0) {
      console.log(`Pulado (MMSI já cadastrado): ${nome} (${mmsi})`);
      continue;
    }
    await pool.query("INSERT INTO barcos (nome, mmsi) VALUES ($1, $2)", [nome, mmsi]);
    criados++;
  }
  console.log(`${criados} barcos criados.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
