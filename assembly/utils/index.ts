import { u128 } from "as-bignum/assembly";
import { Box } from "./box";

export function fieldToU128(data: Array<u128>): u128 {
  if (data.length === 0) return u128.from(0);
  return data[0];
}

export function fieldToName(data: u128): string {
  const TWENTY_SIX = u128.from(26);

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

export function readULEB128ToU128(buf: Box, to: u128): usize {
  const slice = buf.sliceFrom(0);
  let shift: i32 = 0;
  let result: u128 = u128.from(0);
  let byte: u8 = 0;
  if (slice.len === 0) {
    return 0;
  }
  while (true) {
    byte = load<u8>(slice.start);
    if (slice.len === 0) return usize.MAX_VALUE;
    slice.shrinkFront(1);

    //@ts-ignore
    result |= u128.from(byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }
  to.hi = result.hi;
  to.lo = result.lo;
  return slice.start - buf.start;
}

export * from "./box";
export * from "./hex";
