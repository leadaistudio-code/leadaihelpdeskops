// Flip a Windows PE executable from the CONSOLE subsystem (3) to GUI (2) so it
// runs without allocating a console window — no flash, lives in the tray.
const fs = require("fs");

const file = process.argv[2];
if (!file) {
  console.error("usage: node patch-gui.cjs <exe>");
  process.exit(1);
}

const fd = fs.openSync(file, "r+");
try {
  const dword = Buffer.alloc(4);
  fs.readSync(fd, dword, 0, 4, 0x3c); // e_lfanew → PE header offset
  const pe = dword.readUInt32LE(0);
  // Subsystem is a WORD at offset 68 of the Optional Header.
  // Optional Header starts at pe + 4 (PE sig) + 20 (COFF file header).
  const subsystemOffset = pe + 4 + 20 + 68;
  const word = Buffer.alloc(2);
  fs.readSync(fd, word, 0, 2, subsystemOffset);
  const current = word.readUInt16LE(0);
  if (current === 3) {
    fs.writeSync(fd, Buffer.from([0x02, 0x00]), 0, 2, subsystemOffset);
    console.log("Patched subsystem CONSOLE(3) → GUI(2): no console window.");
  } else {
    console.log(`Subsystem already ${current} (2=GUI). No change.`);
  }
} finally {
  fs.closeSync(fd);
}
