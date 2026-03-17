import { AuthType, Frequency, MetricKind, SourceKind, ValueType } from "@prisma/client";

import { SourceSlug } from "../../../core/types";

export type MethodologyNoteSeed = {
  slug: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  disclosure?: string;
  limitations?: string;
  tags: string[];
};

export type SeriesSeed = {
  slug: string;
  sourceCode: string;
  name: string;
  description: string;
  unit: string;
  frequency: Frequency;
  category: string;
  valueType: ValueType;
  sourcePageUrl: string;
  tags: string[];
  methodologyNoteSlug?: string;
  staleAfterHours?: number;
  metadata?: Record<string, unknown>;
};

export type DatasetSeed = {
  slug: string;
  name: string;
  description: string;
  category: string;
  apiPath?: string;
  sourcePageUrl: string;
  updateFrequency: Frequency;
  valueType: ValueType;
  staleAfterHours?: number;
  expectedLatencyHours?: number;
  tags: string[];
  methodologyNoteSlug?: string;
  metadata?: Record<string, unknown>;
  series: SeriesSeed[];
};

export type DataSourceSeed = {
  slug: SourceSlug;
  name: string;
  kind: SourceKind;
  baseUrl: string;
  authType: AuthType;
  timeoutMs: number;
  rateLimitPerMinute?: number;
  updateFrequency?: Frequency;
  expectedLatencyHours?: number;
  staleAfterHours?: number;
  tags: string[];
  metadata?: Record<string, unknown>;
  datasets: DatasetSeed[];
};

export type DerivedMetricDefinitionSeed = {
  slug: string;
  name: string;
  description: string;
  category: string;
  kind: MetricKind;
  unit: string;
  frequency: Frequency;
  formula: string;
  dependencies: string[];
  isProxy?: boolean;
  displayWarning?: string;
  tags: string[];
  methodologyNoteSlug?: string;
  metadata?: Record<string, unknown>;
};

export const methodologyNotes: MethodologyNoteSeed[] = [
  {
    slug: "money-printing-proxy",
    title: "Monetary Expansion Proxy Methodology",
    summary:
      "Composite proxy based on official balance sheet, reserve, money-stock, and debt-growth signals. It is not an official money-printing counter.",
    contentMarkdown: [
      "This proxy combines changes in Federal Reserve total assets, reserve balances, M2, and federal debt acceleration.",
      "Each component is normalized as a z-score over a rolling lookback window and weighted into a 0-100 composite.",
      "The score is designed to show policy and liquidity expansion pressure, not literal currency printing."
    ].join("\n\n"),
    disclosure: "Proxy metric. Derived from official public source series.",
    limitations:
      "M2, reserve balances, and Fed assets move for multiple reasons. The metric should be treated as directional context rather than a direct accounting measure.",
    tags: ["proxy", "monetary", "methodology"]
  },
  {
    slug: "war-spending-proxy",
    title: "War Spending Proxy Methodology",
    summary:
      "Composite proxy based on Department of Defense obligations, defense award mix, and identifiable security-assistance flows. It is not an official war-spending counter.",
    contentMarkdown: [
      "The proxy blends annualized growth in DoD obligations, contract-heavy award categories, and publicly identifiable security assistance flows.",
      "It is intended to indicate expansion in defense and conflict-adjacent fiscal pressure visible in public data.",
      "No direct attribution to a specific conflict is made unless the source data itself explicitly identifies it."
    ].join("\n\n"),
    disclosure: "Proxy metric. Derived from official public source series and category filters.",
    limitations:
      "USAspending and foreign assistance categories reflect accounting taxonomies, not battlefield attribution. Some relevant spending is classified, delayed, or categorized differently over time.",
    tags: ["proxy", "defense", "geopolitics", "methodology"]
  },
  {
    slug: "fiscal-data-limitations",
    title: "Treasury Fiscal Data Notes",
    summary:
      "Debt and cash figures come from Treasury fiscal datasets and can be revised, reclassified, or subject to reporting lags.",
    contentMarkdown:
      "Debt to the Penny is daily and authoritative for public debt totals. Daily Treasury Statement and Monthly Treasury Statement figures can revise and should be interpreted using their own publication cadence and accounting context.",
    limitations: "Do not combine daily and monthly datasets without respecting their native cadence and revision behavior.",
    tags: ["treasury", "debt", "methodology"]
  },
  {
    slug: "usaspending-limitations",
    title: "USAspending Notes",
    summary:
      "USAspending is valuable for obligation and award trend analysis, but availability depends on reporting timeliness and taxonomy stability.",
    contentMarkdown:
      "Award and agency aggregates can lag execution. Category definitions and upstream reporting behavior may change across fiscal years.",
    limitations: "Contract-heavy categories should be treated as public spending signals, not full cash outlay equivalents.",
    tags: ["usaspending", "defense", "methodology"]
  },
  {
    slug: "foreign-assistance-limitations",
    title: "Foreign Assistance Public Data Notes",
    summary:
      "Foreign assistance datasets can identify public security-related aid categories, but they are not a complete ledger of all geopolitical or military support.",
    contentMarkdown:
      "The platform uses official open-data summaries and sector filters to estimate publicly identifiable security assistance flows. Classified, indirect, or differently labeled support may not be visible.",
    limitations: "Category filtering is methodology-backed and transparent, but still inferential.",
    tags: ["foreign-assistance", "methodology"]
  },
  {
    slug: "inflation-context-notes",
    title: "Inflation Context Notes",
    summary:
      "Inflation context blends BLS CPI with other macro series. CPI is the official price index input; deltas and annualized changes are derived.",
    contentMarkdown:
      "Inflation context endpoints use official CPI series and derived rates of change. Derived changes are clearly marked and should not be mistaken for raw source values.",
    tags: ["bls", "inflation", "methodology"]
  }
];

export const dataSources: DataSourceSeed[] = [
  {
    slug: "fred",
    name: "FRED",
    kind: SourceKind.FRED,
    baseUrl: "https://api.stlouisfed.org",
    authType: AuthType.QUERY_API_KEY,
    timeoutMs: 15_000,
    rateLimitPerMinute: 60,
    updateFrequency: Frequency.DAILY,
    expectedLatencyHours: 24,
    staleAfterHours: 72,
    tags: ["macro", "rates", "dollar"],
    datasets: [
      {
        slug: "core-macro",
        name: "Core Macro Indicators",
        description: "Dollar, rates, inflation expectation, and money stock series pulled from FRED.",
        category: "macro",
        apiPath: "/fred/series/observations",
        sourcePageUrl: "https://fred.stlouisfed.org",
        updateFrequency: Frequency.DAILY,
        valueType: ValueType.NUMERIC,
        staleAfterHours: 72,
        expectedLatencyHours: 24,
        tags: ["dollar", "rates", "money-supply"],
        series: [
          {
            slug: "dollar-broad-index",
            sourceCode: "DTWEXBGS",
            name: "Broad Trade Weighted U.S. Dollar Index",
            description: "Trade-weighted broad dollar index for goods and services.",
            unit: "index",
            frequency: Frequency.DAILY,
            category: "dollar",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://fred.stlouisfed.org/series/DTWEXBGS",
            tags: ["dollar", "trade-weighted"]
          },
          {
            slug: "m2-money-stock",
            sourceCode: "M2SL",
            name: "M2 Money Stock",
            description: "M2 money stock level published via FRED.",
            unit: "billions_usd",
            frequency: Frequency.MONTHLY,
            category: "money-supply",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://fred.stlouisfed.org/series/M2SL",
            tags: ["money-supply", "monetary"]
          },
          {
            slug: "effective-fed-funds-rate",
            sourceCode: "DFF",
            name: "Effective Federal Funds Rate",
            description: "Daily effective federal funds rate.",
            unit: "percent",
            frequency: Frequency.DAILY,
            category: "rates",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://fred.stlouisfed.org/series/DFF",
            tags: ["rates", "fed"]
          },
          {
            slug: "treasury-2y-yield",
            sourceCode: "DGS2",
            name: "Market Yield on U.S. Treasury Securities at 2-Year Constant Maturity",
            description: "Daily 2-year Treasury constant maturity yield.",
            unit: "percent",
            frequency: Frequency.DAILY,
            category: "rates",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://fred.stlouisfed.org/series/DGS2",
            tags: ["rates", "treasury"]
          },
          {
            slug: "treasury-10y-yield",
            sourceCode: "DGS10",
            name: "Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity",
            description: "Daily 10-year Treasury constant maturity yield.",
            unit: "percent",
            frequency: Frequency.DAILY,
            category: "rates",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://fred.stlouisfed.org/series/DGS10",
            tags: ["rates", "treasury"]
          },
          {
            slug: "breakeven-inflation-5y",
            sourceCode: "T5YIE",
            name: "5-Year Breakeven Inflation Rate",
            description: "Daily 5-year breakeven inflation rate context series.",
            unit: "percent",
            frequency: Frequency.DAILY,
            category: "inflation",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://fred.stlouisfed.org/series/T5YIE",
            tags: ["inflation", "expectations"]
          }
        ]
      }
    ]
  },
  {
    slug: "treasury-fiscal-data",
    name: "U.S. Treasury Fiscal Data",
    kind: SourceKind.TREASURY_FISCAL_DATA,
    baseUrl: "https://api.fiscaldata.treasury.gov/services/api/fiscal_service",
    authType: AuthType.NONE,
    timeoutMs: 15_000,
    updateFrequency: Frequency.DAILY,
    expectedLatencyHours: 24,
    staleAfterHours: 48,
    tags: ["treasury", "debt", "fiscal"],
    datasets: [
      {
        slug: "debt-to-the-penny",
        name: "Debt to the Penny",
        description: "Daily public debt totals from Treasury Debt to the Penny.",
        category: "debt",
        apiPath: "/v2/accounting/od/debt_to_penny",
        sourcePageUrl:
          "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny",
        updateFrequency: Frequency.DAILY,
        valueType: ValueType.NUMERIC,
        staleAfterHours: 36,
        expectedLatencyHours: 24,
        tags: ["debt", "treasury"],
        methodologyNoteSlug: "fiscal-data-limitations",
        series: [
          {
            slug: "total-public-debt-outstanding",
            sourceCode: "tot_pub_debt_out_amt",
            name: "Total Public Debt Outstanding",
            description: "Daily total public debt outstanding.",
            unit: "usd",
            frequency: Frequency.DAILY,
            category: "debt",
            valueType: ValueType.NUMERIC,
            sourcePageUrl:
              "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny",
            tags: ["debt", "treasury"],
            methodologyNoteSlug: "fiscal-data-limitations"
          },
          {
            slug: "debt-held-by-public",
            sourceCode: "debt_held_public_amt",
            name: "Debt Held by the Public",
            description: "Daily debt held by the public.",
            unit: "usd",
            frequency: Frequency.DAILY,
            category: "debt",
            valueType: ValueType.NUMERIC,
            sourcePageUrl:
              "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny",
            tags: ["debt", "treasury"],
            methodologyNoteSlug: "fiscal-data-limitations"
          },
          {
            slug: "intragovernmental-holdings",
            sourceCode: "intragov_hold_amt",
            name: "Intragovernmental Holdings",
            description: "Daily intragovernmental holdings.",
            unit: "usd",
            frequency: Frequency.DAILY,
            category: "debt",
            valueType: ValueType.NUMERIC,
            sourcePageUrl:
              "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny",
            tags: ["debt", "treasury"],
            methodologyNoteSlug: "fiscal-data-limitations"
          }
        ]
      },
      {
        slug: "daily-treasury-statement",
        name: "Daily Treasury Statement",
        description: "Treasury cash balance context from the Daily Treasury Statement.",
        category: "fiscal-liquidity",
        apiPath: "/v1/accounting/dts/dts_table_1",
        sourcePageUrl:
          "https://fiscaldata.treasury.gov/datasets/daily-treasury-statement/operating-cash-balance",
        updateFrequency: Frequency.DAILY,
        valueType: ValueType.NUMERIC,
        staleAfterHours: 36,
        expectedLatencyHours: 24,
        tags: ["treasury", "liquidity"],
        methodologyNoteSlug: "fiscal-data-limitations",
        series: [
          {
            slug: "treasury-general-account-balance",
            sourceCode: "tga_open_today_bal",
            name: "Treasury General Account Balance",
            description: "Treasury General Account balance from DTS Table 1 operating cash balance.",
            unit: "usd_millions",
            frequency: Frequency.DAILY,
            category: "fiscal-liquidity",
            valueType: ValueType.NUMERIC,
            sourcePageUrl:
              "https://fiscaldata.treasury.gov/datasets/daily-treasury-statement/operating-cash-balance",
            tags: ["treasury", "tga"],
            methodologyNoteSlug: "fiscal-data-limitations",
            metadata: {
              accountType: "Treasury General Account (TGA) Closing Balance",
              fieldCandidates: ["open_today_bal", "close_today_bal"]
            }
          }
        ]
      },
      {
        slug: "monthly-treasury-statement",
        name: "Monthly Treasury Statement",
        description: "Monthly receipts, outlays, and deficit context from Treasury MTS Table 1.",
        category: "fiscal-balance",
        apiPath: "/v1/accounting/mts/mts_table_1",
        sourcePageUrl:
          "https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/receipts-and-outlays",
        updateFrequency: Frequency.MONTHLY,
        valueType: ValueType.NUMERIC,
        staleAfterHours: 96,
        expectedLatencyHours: 72,
        tags: ["treasury", "receipts", "outlays", "deficit"],
        methodologyNoteSlug: "fiscal-data-limitations",
        series: [
          {
            slug: "monthly-treasury-receipts",
            sourceCode: "current_month_gross_rcpt_amt",
            name: "Monthly Treasury Receipts",
            description: "Monthly gross receipts from Treasury MTS Table 1.",
            unit: "usd_millions",
            frequency: Frequency.MONTHLY,
            category: "fiscal-balance",
            valueType: ValueType.NUMERIC,
            sourcePageUrl:
              "https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/receipts-and-outlays",
            tags: ["treasury", "receipts"],
            methodologyNoteSlug: "fiscal-data-limitations",
            metadata: {
              classificationIncludes: ["total receipts", "gross receipts"],
              fieldCandidates: ["current_month_gross_rcpt_amt"]
            }
          },
          {
            slug: "monthly-treasury-outlays",
            sourceCode: "current_month_outly_amt",
            name: "Monthly Treasury Outlays",
            description: "Monthly outlays from Treasury MTS Table 1.",
            unit: "usd_millions",
            frequency: Frequency.MONTHLY,
            category: "fiscal-balance",
            valueType: ValueType.NUMERIC,
            sourcePageUrl:
              "https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/receipts-and-outlays",
            tags: ["treasury", "outlays"],
            methodologyNoteSlug: "fiscal-data-limitations",
            metadata: {
              classificationIncludes: ["total outlays", "net outlays"],
              fieldCandidates: ["current_month_outly_amt"]
            }
          },
          {
            slug: "monthly-treasury-deficit",
            sourceCode: "current_month_deficit_surplus_amt",
            name: "Monthly Treasury Deficit / Surplus",
            description: "Monthly Treasury deficit or surplus from MTS Table 1.",
            unit: "usd_millions",
            frequency: Frequency.MONTHLY,
            category: "fiscal-balance",
            valueType: ValueType.NUMERIC,
            sourcePageUrl:
              "https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/receipts-and-outlays",
            tags: ["treasury", "deficit"],
            methodologyNoteSlug: "fiscal-data-limitations",
            metadata: {
              classificationIncludes: ["deficit/surplus", "surplus (+) or deficit (-)"],
              fieldCandidates: ["current_month_deficit_surplus_amt"]
            }
          }
        ]
      }
    ]
  },
  {
    slug: "federal-reserve",
    name: "Federal Reserve Board",
    kind: SourceKind.FEDERAL_RESERVE,
    baseUrl: "https://www.federalreserve.gov",
    authType: AuthType.NONE,
    timeoutMs: 15_000,
    updateFrequency: Frequency.WEEKLY,
    expectedLatencyHours: 168,
    staleAfterHours: 240,
    tags: ["federal-reserve", "balance-sheet", "reserves"],
    datasets: [
      {
        slug: "balance-sheet-and-reserves",
        name: "Balance Sheet and Reserve Context",
        description: "Federal Reserve balance sheet and reserve balance context with DDP-first and FRED-mirror fallback support.",
        category: "monetary",
        sourcePageUrl: "https://www.federalreserve.gov/releases/h41/",
        updateFrequency: Frequency.WEEKLY,
        valueType: ValueType.NUMERIC,
        staleAfterHours: 240,
        expectedLatencyHours: 168,
        tags: ["fed", "balance-sheet"],
        methodologyNoteSlug: "money-printing-proxy",
        series: [
          {
            slug: "fed-total-assets",
            sourceCode: "WALCL",
            name: "Federal Reserve Total Assets",
            description: "Total assets of the Federal Reserve Banks.",
            unit: "usd_millions",
            frequency: Frequency.WEEKLY,
            category: "monetary",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://www.federalreserve.gov/releases/h41/",
            tags: ["fed", "balance-sheet", "liquidity"],
            methodologyNoteSlug: "money-printing-proxy",
            metadata: {
              fredMirrorSeriesId: "WALCL"
            }
          },
          {
            slug: "reserve-balances",
            sourceCode: "WRESBAL",
            name: "Reserve Balances with Federal Reserve Banks",
            description: "Depository institution reserve balances with Federal Reserve Banks.",
            unit: "usd_millions",
            frequency: Frequency.WEEKLY,
            category: "monetary",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://www.federalreserve.gov/releases/h41/",
            tags: ["fed", "reserves", "liquidity"],
            methodologyNoteSlug: "money-printing-proxy",
            metadata: {
              fredMirrorSeriesId: "WRESBAL"
            }
          }
        ]
      }
    ]
  },
  {
    slug: "usaspending",
    name: "USAspending",
    kind: SourceKind.USASPENDING,
    baseUrl: "https://api.usaspending.gov",
    authType: AuthType.NONE,
    timeoutMs: 20_000,
    updateFrequency: Frequency.DAILY,
    expectedLatencyHours: 72,
    staleAfterHours: 168,
    tags: ["defense", "awards", "obligations"],
    datasets: [
      {
        slug: "dod-budgetary-resources",
        name: "DoD Budgetary Resources",
        description: "Department of Defense budgetary resources, obligations, and outlays by fiscal year.",
        category: "defense-spending",
        apiPath: "/api/v2/agency/097/budgetary_resources/",
        sourcePageUrl: "https://api.usaspending.gov/docs/endpoints",
        updateFrequency: Frequency.ANNUAL,
        valueType: ValueType.NUMERIC,
        staleAfterHours: 168,
        expectedLatencyHours: 72,
        tags: ["defense", "obligations", "outlays"],
        methodologyNoteSlug: "usaspending-limitations",
        metadata: {
          topTierAgencyCode: "097"
        },
        series: [
          {
            slug: "dod-budgetary-resources",
            sourceCode: "agency_budgetary_resources",
            name: "DoD Budgetary Resources",
            description: "Department of Defense budgetary resources by fiscal year.",
            unit: "usd",
            frequency: Frequency.ANNUAL,
            category: "defense-spending",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://api.usaspending.gov/docs/endpoints",
            tags: ["defense", "budgetary-resources"],
            methodologyNoteSlug: "usaspending-limitations"
          },
          {
            slug: "dod-total-obligations",
            sourceCode: "agency_total_obligated",
            name: "DoD Total Obligations",
            description: "Department of Defense total obligations by fiscal year.",
            unit: "usd",
            frequency: Frequency.ANNUAL,
            category: "defense-spending",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://api.usaspending.gov/docs/endpoints",
            tags: ["defense", "obligations"],
            methodologyNoteSlug: "usaspending-limitations"
          },
          {
            slug: "dod-total-outlays",
            sourceCode: "agency_total_outlayed",
            name: "DoD Total Outlays",
            description: "Department of Defense total outlays by fiscal year.",
            unit: "usd",
            frequency: Frequency.ANNUAL,
            category: "defense-spending",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://api.usaspending.gov/docs/endpoints",
            tags: ["defense", "outlays"],
            methodologyNoteSlug: "usaspending-limitations"
          }
        ]
      },
      {
        slug: "dod-awards",
        name: "DoD Award Activity",
        description: "Department of Defense obligations and transaction counts, including contract-heavy award categories.",
        category: "defense-spending",
        apiPath: "/api/v2/agency/097/awards/",
        sourcePageUrl: "https://api.usaspending.gov/docs/endpoints",
        updateFrequency: Frequency.ANNUAL,
        valueType: ValueType.NUMERIC,
        staleAfterHours: 168,
        expectedLatencyHours: 72,
        tags: ["defense", "awards"],
        methodologyNoteSlug: "usaspending-limitations",
        metadata: {
          topTierAgencyCode: "097"
        },
        series: [
          {
            slug: "dod-award-obligations",
            sourceCode: "obligations",
            name: "DoD Award Obligations",
            description: "Department of Defense award obligations by fiscal year.",
            unit: "usd",
            frequency: Frequency.ANNUAL,
            category: "defense-spending",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://api.usaspending.gov/docs/endpoints",
            tags: ["defense", "awards"],
            methodologyNoteSlug: "usaspending-limitations"
          },
          {
            slug: "dod-award-transaction-count",
            sourceCode: "transaction_count",
            name: "DoD Award Transaction Count",
            description: "Department of Defense award transaction count by fiscal year.",
            unit: "count",
            frequency: Frequency.ANNUAL,
            category: "defense-spending",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://api.usaspending.gov/docs/endpoints",
            tags: ["defense", "awards"],
            methodologyNoteSlug: "usaspending-limitations"
          },
          {
            slug: "dod-contract-obligations",
            sourceCode: "Contract",
            name: "DoD Contract Obligations",
            description: "DoD obligations attributed to contract award categories.",
            unit: "usd",
            frequency: Frequency.ANNUAL,
            category: "defense-spending",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://api.usaspending.gov/docs/endpoints",
            tags: ["defense", "contracts"],
            methodologyNoteSlug: "usaspending-limitations"
          },
          {
            slug: "dod-grant-obligations",
            sourceCode: "Grant",
            name: "DoD Grant Obligations",
            description: "DoD obligations attributed to grant award categories.",
            unit: "usd",
            frequency: Frequency.ANNUAL,
            category: "defense-spending",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://api.usaspending.gov/docs/endpoints",
            tags: ["defense", "grants"],
            methodologyNoteSlug: "usaspending-limitations"
          }
        ]
      }
    ]
  },
  {
    slug: "foreign-assistance",
    name: "ForeignAssistance.gov / USAID Open Data",
    kind: SourceKind.FOREIGN_ASSISTANCE,
    baseUrl: "https://data.usaid.gov",
    authType: AuthType.NONE,
    timeoutMs: 20_000,
    updateFrequency: Frequency.ANNUAL,
    expectedLatencyHours: 168,
    staleAfterHours: 336,
    tags: ["foreign-assistance", "security-assistance"],
    datasets: [
      {
        slug: "foreign-assistance-country-summary",
        name: "Foreign Assistance Country Summary",
        description: "Country-level public foreign assistance summary data used for yearly aggregates and country breakdown payloads.",
        category: "foreign-assistance",
        apiPath: "/resource/k87i-9i5x.json",
        sourcePageUrl: "https://www.foreignassistance.gov/data",
        updateFrequency: Frequency.ANNUAL,
        valueType: ValueType.JSON,
        staleAfterHours: 336,
        expectedLatencyHours: 168,
        tags: ["foreign-assistance", "country"],
        methodologyNoteSlug: "foreign-assistance-limitations",
        metadata: {
          datasetId: "k87i-9i5x"
        },
        series: [
          {
            slug: "foreign-assistance-total-obligations",
            sourceCode: "total_obligations",
            name: "Foreign Assistance Total Obligations",
            description: "Yearly public foreign assistance obligations across all visible categories.",
            unit: "usd",
            frequency: Frequency.ANNUAL,
            category: "foreign-assistance",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://www.foreignassistance.gov/data",
            tags: ["foreign-assistance", "obligations"],
            methodologyNoteSlug: "foreign-assistance-limitations"
          },
          {
            slug: "foreign-assistance-total-disbursements",
            sourceCode: "total_disbursements",
            name: "Foreign Assistance Total Disbursements",
            description: "Yearly public foreign assistance disbursements across all visible categories.",
            unit: "usd",
            frequency: Frequency.ANNUAL,
            category: "foreign-assistance",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://www.foreignassistance.gov/data",
            tags: ["foreign-assistance", "disbursements"],
            methodologyNoteSlug: "foreign-assistance-limitations"
          },
          {
            slug: "foreign-assistance-country-summary",
            sourceCode: "country_breakdown",
            name: "Foreign Assistance Country Breakdown",
            description: "Yearly country breakdown snapshot for public foreign assistance.",
            unit: "json",
            frequency: Frequency.ANNUAL,
            category: "foreign-assistance",
            valueType: ValueType.JSON,
            sourcePageUrl: "https://www.foreignassistance.gov/data",
            tags: ["foreign-assistance", "country", "breakdown"],
            methodologyNoteSlug: "foreign-assistance-limitations"
          }
        ]
      },
      {
        slug: "foreign-assistance-sector-summary",
        name: "Foreign Assistance Sector Summary",
        description: "Sector-level foreign assistance summary data used to identify security-related aid categories.",
        category: "foreign-assistance",
        apiPath: "/resource/csuw-56ue.json",
        sourcePageUrl: "https://www.foreignassistance.gov/data",
        updateFrequency: Frequency.ANNUAL,
        valueType: ValueType.JSON,
        staleAfterHours: 336,
        expectedLatencyHours: 168,
        tags: ["foreign-assistance", "sector", "security-assistance"],
        methodologyNoteSlug: "foreign-assistance-limitations",
        metadata: {
          datasetId: "csuw-56ue"
        },
        series: [
          {
            slug: "security-assistance-obligations",
            sourceCode: "security_obligations",
            name: "Security Assistance Obligations",
            description: "Yearly obligations in publicly identifiable security-related assistance categories.",
            unit: "usd",
            frequency: Frequency.ANNUAL,
            category: "foreign-assistance",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://www.foreignassistance.gov/data",
            tags: ["security-assistance", "obligations"],
            methodologyNoteSlug: "foreign-assistance-limitations"
          },
          {
            slug: "security-assistance-disbursements",
            sourceCode: "security_disbursements",
            name: "Security Assistance Disbursements",
            description: "Yearly disbursements in publicly identifiable security-related assistance categories.",
            unit: "usd",
            frequency: Frequency.ANNUAL,
            category: "foreign-assistance",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://www.foreignassistance.gov/data",
            tags: ["security-assistance", "disbursements"],
            methodologyNoteSlug: "foreign-assistance-limitations"
          },
          {
            slug: "security-assistance-sector-summary",
            sourceCode: "security_sector_breakdown",
            name: "Security Assistance Sector Breakdown",
            description: "Yearly breakdown snapshot of security-related assistance sectors.",
            unit: "json",
            frequency: Frequency.ANNUAL,
            category: "foreign-assistance",
            valueType: ValueType.JSON,
            sourcePageUrl: "https://www.foreignassistance.gov/data",
            tags: ["security-assistance", "sector", "breakdown"],
            methodologyNoteSlug: "foreign-assistance-limitations"
          }
        ]
      }
    ]
  },
  {
    slug: "bls",
    name: "Bureau of Labor Statistics",
    kind: SourceKind.BLS,
    baseUrl: "https://api.bls.gov",
    authType: AuthType.NONE,
    timeoutMs: 15_000,
    updateFrequency: Frequency.MONTHLY,
    expectedLatencyHours: 72,
    staleAfterHours: 240,
    tags: ["inflation", "cpi"],
    datasets: [
      {
        slug: "consumer-price-index",
        name: "Consumer Price Index",
        description: "Official CPI series from the BLS public API.",
        category: "inflation",
        apiPath: "/publicAPI/v2/timeseries/data/",
        sourcePageUrl: "https://www.bls.gov/developers/api_faqs.htm",
        updateFrequency: Frequency.MONTHLY,
        valueType: ValueType.NUMERIC,
        staleAfterHours: 240,
        expectedLatencyHours: 72,
        tags: ["inflation", "cpi"],
        methodologyNoteSlug: "inflation-context-notes",
        series: [
          {
            slug: "cpi-all-items",
            sourceCode: "CUSR0000SA0",
            name: "CPI-U All Items, Seasonally Adjusted",
            description: "Consumer Price Index for All Urban Consumers, all items, seasonally adjusted.",
            unit: "index",
            frequency: Frequency.MONTHLY,
            category: "inflation",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://download.bls.gov/pub/time.series/cu/",
            tags: ["inflation", "cpi"],
            methodologyNoteSlug: "inflation-context-notes"
          },
          {
            slug: "core-cpi",
            sourceCode: "CUSR0000SA0L1E",
            name: "Core CPI, Seasonally Adjusted",
            description: "Consumer Price Index excluding food and energy, seasonally adjusted.",
            unit: "index",
            frequency: Frequency.MONTHLY,
            category: "inflation",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://download.bls.gov/pub/time.series/cu/",
            tags: ["inflation", "core-cpi"],
            methodologyNoteSlug: "inflation-context-notes"
          }
        ]
      }
    ]
  },
  {
    slug: "bea",
    name: "Bureau of Economic Analysis",
    kind: SourceKind.BEA,
    baseUrl: "https://apps.bea.gov",
    authType: AuthType.QUERY_API_KEY,
    timeoutMs: 15_000,
    updateFrequency: Frequency.QUARTERLY,
    expectedLatencyHours: 168,
    staleAfterHours: 720,
    tags: ["gdp", "macro-context"],
    datasets: [
      {
        slug: "gdp-context",
        name: "GDP Context",
        description: "Quarterly GDP context from BEA NIPA tables.",
        category: "macro",
        apiPath: "/api/data",
        sourcePageUrl: "https://apps.bea.gov/API/docs/index.htm",
        updateFrequency: Frequency.QUARTERLY,
        valueType: ValueType.NUMERIC,
        staleAfterHours: 720,
        expectedLatencyHours: 168,
        tags: ["gdp", "macro"],
        series: [
          {
            slug: "nominal-gdp",
            sourceCode: "T10105-1",
            name: "Nominal GDP",
            description: "Gross domestic product from BEA NIPA Table 1.1.5 line 1.",
            unit: "billions_usd_annual_rate",
            frequency: Frequency.QUARTERLY,
            category: "macro",
            valueType: ValueType.NUMERIC,
            sourcePageUrl: "https://apps.bea.gov/API/docs/index.htm",
            tags: ["gdp", "macro"]
          }
        ]
      }
    ]
  }
];

export const derivedMetricDefinitions: DerivedMetricDefinitionSeed[] = [
  {
    slug: "debt-growth-velocity",
    name: "Debt Growth Velocity",
    description: "Rate-of-change acceleration in public debt outstanding.",
    category: "debt",
    kind: MetricKind.VELOCITY,
    unit: "percent",
    frequency: Frequency.DAILY,
    formula: "((30d debt change / prior 30d debt change) - 1) * 100, bounded and smoothed",
    dependencies: ["total-public-debt-outstanding"],
    tags: ["debt", "velocity"]
  },
  {
    slug: "dollar-strength-zscore",
    name: "Dollar Strength Z-Score",
    description: "Standardized position of the broad dollar index over a rolling lookback.",
    category: "dollar",
    kind: MetricKind.Z_SCORE,
    unit: "zscore",
    frequency: Frequency.DAILY,
    formula: "(latest dollar index - rolling mean) / rolling std dev",
    dependencies: ["dollar-broad-index"],
    tags: ["dollar", "standardized"]
  },
  {
    slug: "monetary-expansion-proxy",
    name: "Monetary Expansion Proxy",
    description:
      "Composite proxy score combining balance sheet growth, reserve balances, M2 growth, and debt acceleration.",
    category: "monetary",
    kind: MetricKind.COMPOSITE_PROXY,
    unit: "score_0_100",
    frequency: Frequency.WEEKLY,
    formula:
      "Weighted composite of z-scored changes in Fed total assets, reserve balances, M2, and debt growth velocity.",
    dependencies: [
      "fed-total-assets",
      "reserve-balances",
      "m2-money-stock",
      "debt-growth-velocity"
    ],
    isProxy: true,
    displayWarning:
      "This is a methodology-backed proxy, not an official money-printing counter.",
    methodologyNoteSlug: "money-printing-proxy",
    tags: ["proxy", "monetary", "liquidity"]
  },
  {
    slug: "war-spending-proxy",
    name: "War Spending Proxy",
    description:
      "Composite proxy score combining defense obligations, contract-heavy award activity, and public security-assistance flows.",
    category: "geopolitics",
    kind: MetricKind.COMPOSITE_PROXY,
    unit: "score_0_100",
    frequency: Frequency.ANNUAL,
    formula:
      "Weighted composite of DoD obligation growth, contract share, and security assistance growth.",
    dependencies: [
      "dod-total-obligations",
      "dod-contract-obligations",
      "security-assistance-obligations"
    ],
    isProxy: true,
    displayWarning:
      "This is a methodology-backed proxy, not an official war-spending counter.",
    methodologyNoteSlug: "war-spending-proxy",
    tags: ["proxy", "defense", "geopolitics"]
  }
];
