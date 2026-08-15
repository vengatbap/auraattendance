/**
 * Authoritative MoneyService for Aura Payroll.
 * Uses exact integer arithmetic (BigInt) scaled to 2 decimal places (cents)
 * to prevent any floating-point precision loss.
 */
export class MoneyService {
  private static SCALE = BigInt(100); // 2 decimal places

  /**
   * Converts a decimal string (e.g. "10.50", "5") to BigInt cents.
   */
  private static toCents(amount: string): bigint {
    if (!amount) return BigInt(0);
    
    // Remove any commas and trim
    const cleanAmount = amount.replace(/,/g, "").trim();
    
    // Handle negatives
    const isNegative = cleanAmount.startsWith("-");
    const numStr = isNegative ? cleanAmount.substring(1) : cleanAmount;

    if (!/^\d+(\.\d{1,2})?$/.test(numStr)) {
      throw new Error(`Invalid money format: ${amount}`);
    }

    const [whole, fraction = ""] = numStr.split(".");
    const paddedFraction = fraction.padEnd(2, "0");
    
    const cents = BigInt(whole + paddedFraction);
    return isNegative ? -cents : cents;
  }

  /**
   * Converts BigInt cents back to a decimal string (e.g. BigInt() -> "10.50")
   */
  private static fromCents(cents: bigint): string {
    const isNegative = cents < BigInt(0);
    const absCents = isNegative ? -cents : cents;
    
    const str = absCents.toString().padStart(3, "0");
    const whole = str.substring(0, str.length - 2);
    const fraction = str.substring(str.length - 2);
    
    return `${isNegative ? "-" : ""}${whole}.${fraction}`;
  }

  static add(a: string, b: string): string {
    const sum = this.toCents(a) + this.toCents(b);
    return this.fromCents(sum);
  }

  static subtract(a: string, b: string): string {
    const diff = this.toCents(a) - this.toCents(b);
    return this.fromCents(diff);
  }

  /**
   * Multiply a money amount by a standard number multiplier (e.g., fractional days or rate).
   * Result is rounded half-up to 2 decimal places.
   */
  static multiply(money: string, multiplier: number | string): string {
    const cents = this.toCents(money);
    
    // Convert multiplier to a fixed precision scaled BigInt to avoid float issues
    // Let's use 6 decimal places for the multiplier precision
    const MULTIPLIER_SCALE = BigInt(1000000);
    const multStr = multiplier.toString();
    
    let mWhole = "0", mFrac = "0";
    if (multStr.includes(".")) {
      [mWhole, mFrac] = multStr.split(".");
    } else {
      mWhole = multStr;
    }
    
    const paddedMFrac = mFrac.padEnd(6, "0").substring(0, 6);
    const mBig = BigInt(mWhole + paddedMFrac);
    
    // cents * mBig / MULTIPLIER_SCALE
    // To round half up: (cents * mBig + (MULTIPLIER_SCALE / BigInt(2))) / MULTIPLIER_SCALE
    
    const product = cents * mBig;
    const isNegative = product < BigInt(0);
    const absProduct = isNegative ? -product : product;
    
    const halfScale = MULTIPLIER_SCALE / BigInt(2);
    const roundedAbsProduct = (absProduct + halfScale) / MULTIPLIER_SCALE;
    
    const finalCents = isNegative ? -roundedAbsProduct : roundedAbsProduct;
    return this.fromCents(finalCents);
  }

  /**
   * Divides a money amount by a standard number (e.g., getting daily rate from monthly salary).
   * Result is rounded half-up to 2 decimal places.
   */
  static divide(money: string, divisor: number | string): string {
    if (divisor.toString() === "0") throw new Error("Division by zero");
    
    const cents = this.toCents(money);
    
    const DIVISOR_SCALE = BigInt(1000000);
    const divStr = divisor.toString();
    
    let dWhole = "0", dFrac = "0";
    if (divStr.includes(".")) {
      [dWhole, dFrac] = divStr.split(".");
    } else {
      dWhole = divStr;
    }
    
    const paddedDFrac = dFrac.padEnd(6, "0").substring(0, 6);
    const dBig = BigInt(dWhole + paddedDFrac);
    
    if (dBig === BigInt(0)) throw new Error("Division by zero");

    // cents * DIVISOR_SCALE / dBig
    // To round half up:
    const scaledCents = cents * DIVISOR_SCALE;
    const isNegative = (scaledCents < BigInt(0)) !== (dBig < BigInt(0));
    
    const absScaledCents = scaledCents < BigInt(0) ? -scaledCents : scaledCents;
    const absDBig = dBig < BigInt(0) ? -dBig : dBig;
    
    const halfDivisor = absDBig / BigInt(2);
    const roundedAbsQuotient = (absScaledCents + halfDivisor) / absDBig;
    
    const finalCents = isNegative ? -roundedAbsQuotient : roundedAbsQuotient;
    return this.fromCents(finalCents);
  }
}
