const fs = require("node:fs/promises");
async function importSql(connection, filename) {
  let delimiter = ";",
    buffer = "";
  const text = await fs.readFile(filename, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*--/.test(line) || !line.trim()) continue;
    const change = line.match(/^\s*DELIMITER\s+(\S+)/i);
    if (change) {
      delimiter = change[1];
      continue;
    }
    buffer += `${line}\n`;
    if (buffer.trimEnd().endsWith(delimiter)) {
      const statement = buffer.trimEnd().slice(0, -delimiter.length).trim();
      if (statement) await connection.query(statement);
      buffer = "";
    }
  }
  if (buffer.trim()) throw new Error("Sentencia SQL sin terminar.");
}
module.exports = importSql;
