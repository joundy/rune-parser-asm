import { u128 } from "as-bignum/assembly";
import { Box } from "metashrew-as/assembly/utils/box";
import { JSONEncoder } from "assemblyscript-json/assembly";
import { readULEB128ToU128 } from "./leb128";
import { Field } from "./field";
import { Flag } from "./flag";
import { fieldToU128, fieldToName } from "./utils";
import { Edict } from "./edicts";
import { RuneId } from "./runeId";
import { Option } from "./option";

// TODO:
// - change option with others solutions
// - tests, validate edge cases
// - write the data into repos
class Runestone {
  fields: Map<u64, Array<u128>>;
  edictsRaw: Array<StaticArray<u128>>;

  constructor(
    fields: Map<u64, Array<u128>>,
    edictsRaw: Array<StaticArray<u128>>,
  ) {
    this.fields = fields;
    this.edictsRaw = edictsRaw;
  }

  static fromBuffer(buffer: ArrayBuffer): Runestone {
    const input = Box.from(buffer);

    const fields = new Map<u64, Array<u128>>();
    const edictsRaw = new Array<StaticArray<u128>>(0);

    while (input.len > 0) {
      const fieldKeyHeap = u128.from(0);
      const size = readULEB128ToU128(input, fieldKeyHeap);
      if (size === usize.MAX_VALUE) return changetype<Runestone>(0);

      input.shrinkFront(size);

      const fieldKey = fieldKeyHeap.lo;
      if (fieldKey === 0) {
        while (input.len > 0) {
          const edict = new StaticArray<u128>(4);
          for (let i = 0; i < 4; i++) {
            const edictInt = u128.from(0);
            const size = readULEB128ToU128(input, edictInt);
            if (usize.MAX_VALUE === size) return changetype<Runestone>(0);
            input.shrinkFront(size);
            edict[i] = edictInt;
          }
          edictsRaw.push(edict);
        }
      } else {
        const value = u128.from(0);
        const size = readULEB128ToU128(input, value);
        if (usize.MAX_VALUE === size) return changetype<Runestone>(0);
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

    return new Runestone(fields, edictsRaw);
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

  get isEtching(): bool {
    return this.getFlag(Flag.ETCHING);
  }

  get isTerms(): bool {
    return this.getFlag(Flag.TERMS);
  }

  get rune(): Option<string> {
    const runeValue = this.getFieldValueU128(Field.RUNE);
    if (!runeValue.exist) {
      return new Option("", false);
    }
    return new Option(fieldToName(runeValue.some), true);
  }

  get premine(): Option<u128> {
    return this.getFieldValueU128(Field.PREMINE);
  }

  get cap(): Option<u128> {
    return this.getFieldValueU128(Field.CAP);
  }

  get amount(): Option<u128> {
    return this.getFieldValueU128(Field.AMOUNT);
  }

  get heightStart(): Option<u128> {
    return this.getFieldValueU128(Field.HEIGHTSTART);
  }

  get heightEnd(): Option<u128> {
    return this.getFieldValueU128(Field.HEIGHTEND);
  }

  get offsetStart(): Option<u128> {
    return this.getFieldValueU128(Field.OFFSETSTART);
  }

  get offsetEnd(): Option<u128> {
    return this.getFieldValueU128(Field.OFFSETEND);
  }

  get isMint(): bool {
    return this.fields.has(Field.MINT);
  }

  get mint(): Option<RuneId> {
    if (!this.isMint) {
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

  get pointer(): Option<u32> {
    return this.getFieldValue<u32>(Field.POINTER);
  }

  get divisibility(): Option<u8> {
    return this.getFieldValue<u8>(Field.DIVISIBILITY);
  }

  get spacers(): Option<u32> {
    return this.getFieldValue<u32>(Field.SPACERS);
  }

  get edicts(): Array<Edict> {
    return Edict.fromDeltaSeries(this.edictsRaw);
  }

  get symbol(): Option<string> {
    const symbolValue = this.getFieldValue<u32>(Field.SYMBOL);
    if (!symbolValue.exist) {
      return new Option("", false);
    }
    const symbol = String.fromCodePoint(symbolValue.some);
    return new Option(symbol, true);
  }

  inspectJson(): string {
    const encoder = new JSONEncoder();
    encoder.pushObject(null);
    if (this.pointer.exist) {
      encoder.setInteger("pointer", this.pointer.some);
    }
    if (this.mint.exist) {
      encoder.pushObject("mint");
      encoder.setInteger("block", this.mint.some.block);
      encoder.setInteger("tx", this.mint.some.tx);
      encoder.popObject();
    }

    if (this.isEtching) {
      encoder.pushObject("etching");
      if (this.divisibility.exist) {
        encoder.setInteger("divisibility", this.divisibility.some);
      }
      if (this.premine.exist) {
        encoder.setString("premine", this.premine.some.toString());
      }
      if (this.rune.exist) {
        encoder.setString("rune", this.rune.some);
      }
      if (this.spacers.exist) {
        encoder.setInteger("spacers", this.spacers.some);
      }
      if (this.symbol.exist) {
        encoder.setString("symbol", this.symbol.some);
      }

      if (this.isTerms) {
        encoder.pushObject("terms");

        if (this.amount.exist) {
          encoder.setString("amount", this.amount.some.toString());
        }
        if (this.cap.exist) {
          encoder.setString("cap", this.cap.some.toString());
        }
        if (this.heightStart.exist) {
          encoder.setString("height_start", this.heightStart.some.toString());
        }
        if (this.heightEnd.exist) {
          encoder.setString("height_end", this.heightEnd.some.toString());
        }
        if (this.offsetStart.exist) {
          encoder.setString("offset_start", this.offsetStart.some.toString());
        }
        if (this.offsetEnd.exist) {
          encoder.setString("offset_end", this.offsetEnd.some.toString());
        }

        encoder.popObject();
      }

      if (this.edicts.length > 0) {
        encoder.pushArray("edicts");

        for (let i: i32 = 0; i < this.edicts.length; i++) {
          const edict = this.edicts[i];
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
  const rune = Runestone.fromBuffer(buffer);
  return rune.inspectJson();
}
