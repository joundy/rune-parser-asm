import { u128 } from "as-bignum/assembly";
import { Box } from "metashrew-as/assembly/utils/box";
import { readULEB128ToU128 } from "./leb128";
import { Field } from "./field";

export const TWENTY_SIX = u128.from(26);

export function padLeft(v: string, n: i32): string {
  let result = "";
  for (let i: i32 = 0; i < n - v.length; i++) {
    result += "0";
  }
  return result + v;
}

export function u128ToHex(v: u128): string {
  return padLeft(v.hi.toString(16), 16) + padLeft(v.lo.toString(16), 16);
}

export function fieldToName(data: u128): string {
  //@ts-ignore
  let v = data + u128.from(1);
  let str = "";
  while (!v.isZero()) {
    //@ts-ignore
    let y = (v % TWENTY_SIX).toU32();
    if (y == 0) y = 26;
    str = String.fromCharCode(64 + y) + str;
    v--;
    //@ts-ignore
    v = v / TWENTY_SIX;
  }
  return str;
}

let fields = new Map<u64, Array<u128>>();
let edicts = new Array<StaticArray<u128>>(0);

function parse(buffer: ArrayBuffer): void {
  const input = Box.from(buffer);

  while (input.len > 0) {
    const fieldKeyHeap = u128.from(0);
    const size = readULEB128ToU128(input, fieldKeyHeap);
    if (size === usize.MAX_VALUE) return;

    input.shrinkFront(size);

    const fieldKey = fieldKeyHeap.lo;
    if (fieldKey === 0) {
      while (input.len > 0) {
        const edict = new StaticArray<u128>(4);
        for (let i = 0; i < 4; i++) {
          const edictInt = u128.from(0);
          const size = readULEB128ToU128(input, edictInt);
          if (usize.MAX_VALUE === size) return;
          input.shrinkFront(size);
          edict[i] = edictInt;
        }
        edicts.push(edict);
      }
    } else {
      const value = u128.from(0);
      const size = readULEB128ToU128(input, value);
      if (usize.MAX_VALUE === size) return;
      input.shrinkFront(size);
      let field: Array<u128> = changetype<Array<u128>>(0);
      if (!fields.has(fieldKey)) {
        field = new Array<u128>(0);
        fields.set(fieldKey, field);
      } else {
        field = fields.get(fieldKey);
      }
      field.push(value);
    }
  }
}

export function inspect(): string {
  let result = "RunestoneMessage {\n";
  let fieldInts = fields.keys();
  for (let i = 0; i < fieldInts.length; i++) {
    result += "  " + fieldInts[i].toString(10) + ": [\n";
    const ary = fields.get(fieldInts[i]);
    for (let j = 0; j < ary.length; j++) {
      result += "    " + u128ToHex(ary[j]) + ",\n";
    }
    result += "  ]\n";
  }
  result += "  edicts: [";
  for (let i = 0; i < edicts.length; i++) {
    result += "    ";
    for (let j = 0; j < edicts[i].length; j++) {
      result += u128ToHex(edicts[i][j]);
    }
    if (i !== edicts.length - 1) result += ", ";
  }
  result += "]\n}";
  return result;
}

// DATA TO SAVE:
//

export function main(buffer: ArrayBuffer): string {
  parse(buffer);
  const nameU128 = fields.get(Field.RUNE)[0];
  const name = fieldToName(nameU128);
  return name;

  // return inspect();
}
