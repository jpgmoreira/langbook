type BitMask = bigint;

export function setBit(mask: BitMask, bit: number): BitMask {
  return mask | (1n << BigInt(bit));
}

export function hasBit(mask: BitMask, bit: number): boolean {
  return (mask & (1n << BigInt(bit))) !== 0n;
}

export function clearBit(mask: BitMask, bit: number): BitMask {
  return mask & ~(1n << BigInt(bit));
}
