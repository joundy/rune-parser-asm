import { u128 } from "as-bignum/assembly";
import { JSONEncoder } from "assemblyscript-json/assembly";
import { Field } from "./field";
import { Flag } from "./flag";
import { fieldToU128, fieldToName, readULEB128ToU128, Box } from "./utils";
import { Edict } from "./edicts";
import { RuneId } from "./runeId";
import { Option } from "./option";

// TODO:
// - tests, validate edge cases
// - write the data into repos
class RunestoneParser {
  fields: Map<u64, Array<u128>>;
  edictsRaw: Array<StaticArray<u128>>;

  constructor(
    fields: Map<u64, Array<u128>>,
    edictsRaw: Array<StaticArray<u128>>,
  ) {
    this.fields = fields;
    this.edictsRaw = edictsRaw;
  }

  static fromBuffer(buffer: ArrayBuffer): RunestoneParser {
    const input = Box.from(buffer);

    const fields = new Map<u64, Array<u128>>();
    const edictsRaw = new Array<StaticArray<u128>>(0);

    while (input.len > 0) {
      const fieldKeyHeap = u128.from(0);
      const size = readULEB128ToU128(input, fieldKeyHeap);
      if (size === usize.MAX_VALUE) return changetype<RunestoneParser>(0);

      input.shrinkFront(size);

      const fieldKey = fieldKeyHeap.lo;
      if (fieldKey === 0) {
        while (input.len > 0) {
          const edict = new StaticArray<u128>(4);
          for (let i = 0; i < 4; i++) {
            const edictInt = u128.from(0);
            const size = readULEB128ToU128(input, edictInt);
            if (usize.MAX_VALUE === size) return changetype<RunestoneParser>(0);
            input.shrinkFront(size);
            edict[i] = edictInt;
          }
          edictsRaw.push(edict);
        }
      } else {
        const value = u128.from(0);
        const size = readULEB128ToU128(input, value);
        if (usize.MAX_VALUE === size) return changetype<RunestoneParser>(0);
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

    return new RunestoneParser(fields, edictsRaw);
  }

  private getFlag(position: u64): bool {
    if (!this.fields.has(Field.FLAGS)) return false;
    const flags = fieldToU128(this.fields.get(Field.FLAGS));
    //@ts-ignore
    return !u128.and(flags, u128.from(1) << (<i32>position)).isZero();
  }

  private getFieldValue<T>(field: u8): Option<T> {
    if (!this.fields.has(field)) {
      return new Option(<T>0, false);
    }
    const value = <T>this.fields.get(field)[0].lo;

    return new Option(value, true);
  }

  private getFieldValueU128(field: u8): Option<u128> {
    if (!this.fields.has(field)) {
      return new Option(u128.from(0), false);
    }
    const value = this.fields.get(field)[0];

    return new Option(value, true);
  }

  isEtching(): bool {
    return this.getFlag(Flag.ETCHING);
  }

  isTerms(): bool {
    return this.getFlag(Flag.TERMS);
  }

  getRune(): Option<string> {
    const runeValue = this.getFieldValueU128(Field.RUNE);
    if (!runeValue.isSome) {
      return new Option("", false);
    }
    return new Option(fieldToName(runeValue.some), true);
  }

  getPremine(): Option<u128> {
    return this.getFieldValueU128(Field.PREMINE);
  }

  getCap(): Option<u128> {
    return this.getFieldValueU128(Field.CAP);
  }

  getAmount(): Option<u128> {
    return this.getFieldValueU128(Field.AMOUNT);
  }

  getHeightStart(): Option<u128> {
    return this.getFieldValueU128(Field.HEIGHTSTART);
  }

  getHeightEnd(): Option<u128> {
    return this.getFieldValueU128(Field.HEIGHTEND);
  }

  getOffsetStart(): Option<u128> {
    return this.getFieldValueU128(Field.OFFSETSTART);
  }

  getOffsetEnd(): Option<u128> {
    return this.getFieldValueU128(Field.OFFSETEND);
  }

  getIsMint(): bool {
    return this.fields.has(Field.MINT);
  }

  getMint(): Option<RuneId> {
    if (!this.getIsMint()) {
      return new Option(changetype<RuneId>(0), false);
    }

    const mint = this.fields.get(Field.MINT);
    if (mint.length < 2) {
      // skip if the runeId is not valid
      return new Option(changetype<RuneId>(0), false);
    }
    const block = <u64>mint[0].lo;
    const tx = <u32>mint[1].lo;

    return new Option(new RuneId(block, tx), true);
  }

  getPointer(): Option<u32> {
    return this.getFieldValue<u32>(Field.POINTER);
  }

  getDivisibility(): Option<u8> {
    return this.getFieldValue<u8>(Field.DIVISIBILITY);
  }

  getSpacers(): Option<u32> {
    return this.getFieldValue<u32>(Field.SPACERS);
  }

  getEdicts(): Array<Edict> {
    return Edict.fromDeltaSeries(this.edictsRaw);
  }

  getSymbol(): Option<string> {
    const symbolValue = this.getFieldValue<u32>(Field.SYMBOL);
    if (!symbolValue.isSome) {
      return new Option("", false);
    }
    const symbol = String.fromCodePoint(symbolValue.some);
    return new Option(symbol, true);
  }

  inspectJson(): string {
    const encoder = new JSONEncoder();
    encoder.pushObject(null);
    const pointer = this.getPointer();
    if (pointer.isSome) {
      encoder.setInteger("pointer", pointer.some);
    }
    const mint = this.getMint();
    if (mint.isSome) {
      encoder.pushObject("mint");
      encoder.setInteger("block", mint.some.block);
      encoder.setInteger("tx", mint.some.tx);
      encoder.popObject();
    }

    if (this.isEtching()) {
      encoder.pushObject("etching");

      const divisibility = this.getDivisibility();
      if (divisibility.isSome) {
        encoder.setInteger("divisibility", divisibility.some);
      }
      const premine = this.getPremine();
      if (premine.isSome) {
        encoder.setString("premine", premine.some.toString());
      }
      const rune = this.getRune();
      if (rune.isSome) {
        encoder.setString("rune", rune.some);
      }
      const spacers = this.getSpacers();
      if (spacers.isSome) {
        encoder.setInteger("spacers", spacers.some);
      }
      const symbol = this.getSymbol();
      if (symbol.isSome) {
        encoder.setString("symbol", symbol.some);
      }

      if (this.isTerms()) {
        encoder.pushObject("terms");

        const amount = this.getAmount();
        if (amount.isSome) {
          encoder.setString("amount", amount.some.toString());
        }
        const cap = this.getCap();
        if (cap.isSome) {
          encoder.setString("cap", cap.some.toString());
        }
        const heightStart = this.getHeightStart();
        if (heightStart.isSome) {
          encoder.setString("height_start", heightStart.some.toString());
        }
        const heightEnd = this.getHeightEnd();
        if (heightEnd.isSome) {
          encoder.setString("height_end", heightEnd.some.toString());
        }
        const offsetStart = this.getOffsetStart();
        if (offsetStart.isSome) {
          encoder.setString("offset_start", offsetStart.some.toString());
        }
        const offsetEnd = this.getOffsetEnd();
        if (offsetEnd.isSome) {
          encoder.setString("offset_end", offsetEnd.some.toString());
        }

        encoder.popObject();
      }

      const edicts = this.getEdicts();
      if (edicts.length > 0) {
        encoder.pushArray("edicts");

        for (let i: i32 = 0; i < edicts.length; i++) {
          const edict = edicts[i];
          encoder.pushObject(null);

          encoder.pushObject("runeId");
          encoder.setInteger("block", edict.runeId.block);
          encoder.setInteger("tx", edict.runeId.tx);
          encoder.popObject();

          encoder.setString("amount", edict.amount.toString());
          encoder.setString("output", edict.output.toString());

          encoder.popObject();
        }

        encoder.popArray();
      }

      encoder.popObject();
    }
    encoder.popObject();

    const jsonString: string = encoder.toString();
    return jsonString;
  }
}

export function main(buffer: ArrayBuffer): string {
  const rune = RunestoneParser.fromBuffer(buffer);
  return rune.inspectJson();
}
