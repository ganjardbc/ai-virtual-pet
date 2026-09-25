export interface Random {
  next(): number;
}

function requireRandomValue(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('Random values must be finite numbers from 0 (inclusive) to 1 (exclusive).');
  }

  return value;
}

export class SystemRandom implements Random {
  next(): number {
    return Math.random();
  }
}

export class SequenceRandom implements Random {
  private index = 0;

  constructor(private readonly values: readonly number[]) {
    values.forEach(requireRandomValue);
  }

  next(): number {
    const value = this.values[this.index];

    if (value === undefined) {
      throw new RangeError('Deterministic random sequence is exhausted.');
    }

    this.index += 1;
    return value;
  }
}

/** Deterministic seeded PRNG (mulberry32) for reproducible long-running scenarios. */
export class SeededRandom implements Random {
  private stateValue: number;

  constructor(seed: number) {
    if (!Number.isInteger(seed)) {
      throw new RangeError('Random seed must be an integer.');
    }

    this.stateValue = seed >>> 0;
  }

  next(): number {
    this.stateValue = (this.stateValue + 0x6d2b79f5) >>> 0;
    let value = this.stateValue;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  }
}
