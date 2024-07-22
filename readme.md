# Example parse rune buffer

```
import { main } from "./build/release.js";

const buffer = Buffer.from(
  "020704849eea9cdae5b6d5a1b4b5fc1e010103a8810105b8e90706ffffffffffefeef5ec97dc93afe9abb389d3010aa40308450ce7560ecead0110b58402129cdb02140b1416162100914e010a0100000a0100000a01",
  "hex",
);

console.log(main(buffer));

```

`yarn run asbuild && node index.js | jq`

output:

```
{
  "pointer": 33,
  "mint": {
    "block": 11,
    "tx": 22
  },
  "etching": {
    "divisibility": 1,
    "premine": "140282366920938463463374607431768211455",
    "rune": "THISISANEXAMPLERUNE",
    "spacers": 16552,
    "symbol": "💸",
    "terms": {
      "amount": "420",
      "cap": "69",
      "height_start": "11111",
      "height_end": "22222",
      "offset_start": "33333",
      "offset_end": "44444"
    },
    "edicts": [
      {
        "runeId": {
          "block": 10001,
          "tx": 1
        },
        "amount": "10",
        "output": "1"
      },
      {
        "runeId": {
          "block": 10001,
          "tx": 1
        },
        "amount": "10",
        "output": "1"
      },
      {
        "runeId": {
          "block": 10001,
          "tx": 1
        },
        "amount": "10",
        "output": "1"
      }
    ]
  }
}

```

## Credit

- https://github.com/sandshrewmetaprotocols
