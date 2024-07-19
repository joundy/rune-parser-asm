import { u128 } from "as-bignum/assembly";
import { RuneId } from "./runeId";

export class Edict {
  public runeId: RuneId;
  public amount: u128;
  public output: u128;

  constructor(runeId: RuneId, amount: u128, output: u128) {
    this.runeId = runeId;
    this.amount = amount;
    this.output = output;
  }
  static zero(): Edict {
    return new Edict(new RuneId(0, 0), u128.from(0), u128.from(0));
  }
  static diff(previous: Edict, values: StaticArray<u128>): Edict {
    const block = <u64>values[0].lo;
    const tx = <u32>values[1].lo;

    return new Edict(
      new RuneId(
        previous.runeId.block + block,
        !values[0].isZero() ? tx : previous.runeId.tx + tx,
      ),
      values[2],
      values[3],
    );
  }
  static fromDeltaSeries(deltas: Array<StaticArray<u128>>): Array<Edict> {
    let last = Edict.zero();
    const result = new Array<Edict>(0);
    for (let i: i32 = 0; i < deltas.length; i++) {
      if (deltas[i].length < 2) {
        // skip, values length is not valid
        continue;
      }
      last = Edict.diff(last, deltas[i]);
      result.push(last);
    }
    return result;
  }
}
