import { main } from "./build/release.js";

const buffer = Buffer.from(
  "020704849eea9cdae5b6d5a1b4b5fc1e010103a8810105b8e90706ffffffffffefeef5ec97dc93afe9abb389d3010aa40308450ce7560ecead0110b58402129cdb02140b1416162100914e010a0100000a0100000a01",
  "hex",
);

console.log(main(buffer));
