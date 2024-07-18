import { main } from "./build/release.js";

const buffer = Buffer.from(
  "020704e7f2c0b288eaea9fdbc8fc91bdad0101000390880205f1e3070690c8020ae80708dea3011601",
  "hex",
);

console.log(main(buffer));
