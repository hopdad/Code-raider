// Priority-ordered 4-digit code queue.
// Top section: most common real-world PINs (statistical frequency).
// In prod: replace TOP_CODES with a full sorted dataset loaded from disk
// (e.g. a filtered rockyou 4-digit list sorted by count descending).

const TOP_CODES = [
  '1234','0000','1111','1212','7777','1004','2000','4444','2222','6969',
  '9999','3333','5555','6666','1122','1313','8888','4321','2001','1010',
  '6868','2580','0987','1235','2468','0123','4567','8520','0007','1001',
  '0852','2143','3456','6789','0001','1000','1979','1982','1998','1990',
  '2468','1357','9876','2345','3579','7531','0002','0003','0004','0005',
  '1230','1231','1232','1233','0011','0022','0033','0044','0055','0069',
  '0099','0420','0911','1011','1100','1123','1221','1223','1314','1411',
  '1414','1500','1515','1600','1618','1620','1776','1800','1900','1911',
  '1919','1945','1955','1956','1957','1958','1959','2020','2021','2022',
];

function buildQueue() {
  const seen = new Set();
  const q    = [];
  // Seed with the priority list, skipping any accidental duplicates so the
  // final queue holds each of the 10,000 codes exactly once.
  for (const c of TOP_CODES) {
    if (!seen.has(c)) { seen.add(c); q.push(c); }
  }
  for (let i = 0; i <= 9999; i++) {
    const c = i.toString().padStart(4, '0');
    if (!seen.has(c)) { seen.add(c); q.push(c); }
  }
  return q;
}

// Immutable at runtime — built once on startup
const QUEUE = buildQueue();

module.exports = { QUEUE };
