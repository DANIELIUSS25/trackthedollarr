import { logger } from "../../../core/logging/logger";
import { getEnv } from "../../../core/config/env";
import { SafeHttpClient } from "../../../core/http/safe-http-client";
import { SourceSlug } from "../../../core/types";
import { BeaAdapter } from "../adapters/bea-adapter";
import { BlsAdapter } from "../adapters/bls-adapter";
import { FederalReserveAdapter } from "../adapters/federal-reserve-adapter";
import { FredAdapter } from "../adapters/fred-adapter";
import { ForeignAssistanceAdapter } from "../adapters/foreign-assistance-adapter";
import { SourceAdapter } from "../adapters/base-adapter";
import { TreasuryFiscalDataAdapter } from "../adapters/treasury-adapter";
import { UsaSpendingAdapter } from "../adapters/usaspending-adapter";

export class SourceRegistry {
  private readonly adapters = new Map<SourceSlug, SourceAdapter>();

  constructor() {
    const dependencies = {
      env: getEnv(),
      logger,
      http: new SafeHttpClient()
    };

    const adapterInstances: SourceAdapter[] = [
      new FredAdapter(dependencies),
      new TreasuryFiscalDataAdapter(dependencies),
      new FederalReserveAdapter(dependencies),
      new UsaSpendingAdapter(dependencies),
      new ForeignAssistanceAdapter(dependencies),
      new BlsAdapter(dependencies),
      new BeaAdapter(dependencies)
    ];

    for (const adapter of adapterInstances) {
      this.adapters.set(adapter.sourceSlug, adapter);
    }
  }

  getAll(): SourceAdapter[] {
    return [...this.adapters.values()];
  }

  get(sourceSlug: SourceSlug): SourceAdapter {
    const adapter = this.adapters.get(sourceSlug);

    if (!adapter) {
      throw new Error(`Unknown source adapter: ${sourceSlug}`);
    }

    return adapter;
  }
}
