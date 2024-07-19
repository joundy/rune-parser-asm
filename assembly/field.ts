@final
@unmanaged
export class Field {
  static BODY: u8 = 0;
  static FLAGS: u8 = 2;
  static RUNE: u8 = 4;
  static PREMINE: u8 = 6;
  static CAP: u8 = 8;
  static AMOUNT: u8 = 10;
  static HEIGHTSTART: u8 = 12;
  static HEIGHTEND: u8 = 14;
  static OFFSETSTART: u8 = 16;
  static OFFSETEND: u8 = 18;
  static MINT: u8 = 20;
  static POINTER: u8 = 22;
  static CENOTAPH: u8 = 126;

  static DIVISIBILITY: u8 = 1;
  static SPACERS: u8 = 3;
  static SYMBOL: u8 = 5;
  static NOP: u8 = 127;
  constructor() {}
}
