export class Option<T> {
  some: T;
  isSome: bool;

  constructor(some: T, exist: bool) {
    this.some = some;
    this.isSome = exist;
  }
}
