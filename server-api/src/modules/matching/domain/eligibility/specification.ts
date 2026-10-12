/** Specification pattern (docs/ARCHITECTURE.md §9.2): composable, side-effect-free rules. */
export abstract class Specification<T, C = unknown> {
  abstract readonly name: string;
  abstract isSatisfiedBy(candidate: T, context: C): boolean;

  and(other: Specification<T, C>): Specification<T, C> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T, C>): Specification<T, C> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T, C> {
    return new NotSpecification(this);
  }
}

class AndSpecification<T, C> extends Specification<T, C> {
  readonly name: string;
  constructor(private readonly a: Specification<T, C>, private readonly b: Specification<T, C>) {
    super();
    this.name = `(${a.name} AND ${b.name})`;
  }
  isSatisfiedBy(x: T, c: C) {
    return this.a.isSatisfiedBy(x, c) && this.b.isSatisfiedBy(x, c);
  }
}

class OrSpecification<T, C> extends Specification<T, C> {
  readonly name: string;
  constructor(private readonly a: Specification<T, C>, private readonly b: Specification<T, C>) {
    super();
    this.name = `(${a.name} OR ${b.name})`;
  }
  isSatisfiedBy(x: T, c: C) {
    return this.a.isSatisfiedBy(x, c) || this.b.isSatisfiedBy(x, c);
  }
}

class NotSpecification<T, C> extends Specification<T, C> {
  readonly name: string;
  constructor(private readonly a: Specification<T, C>) {
    super();
    this.name = `NOT ${a.name}`;
  }
  isSatisfiedBy(x: T, c: C) {
    return !this.a.isSatisfiedBy(x, c);
  }
}
