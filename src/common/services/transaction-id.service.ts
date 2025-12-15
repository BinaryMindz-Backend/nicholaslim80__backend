import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';

@Injectable()
export class TransactionIdService {
  private prefix = 'TX'; // change as you like

  /**
   * Generates a ULID-based transaction id.
   * Example: TX_01H8Z3K8AJ1XK7T0G9ZV6MX2
   */
  generate(): string {
    // ulid() is time-sortable and collision-resistant for typical workloads
    return `${this.prefix}_${ulid()}`;
  }

  /**
   * Optionally allow custom prefix or separator
   */
  generateWithPrefix(prefix?: string): string {
    const p = prefix ?? this.prefix;
    return `${p}_${ulid()}`;
  }
}
