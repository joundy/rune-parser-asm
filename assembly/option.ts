export class Option<T> {
  some: T;
  exist: bool;

  constructor(some: T, exist: bool) {
    this.some = some;
    this.exist = exist;
  }
}
