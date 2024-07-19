import { u128 } from "as-bignum/assembly";

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
