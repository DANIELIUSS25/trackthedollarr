import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoadingState } from "./components/LoadingState";

const Landing = lazy(() => import("./pages/Landing").then((m) => ({ default: m.Landing })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const DollarStrength = lazy(() => import("./pages/DollarStrength").then((m) => ({ default: m.DollarStrength })));
const Debt = lazy(() => import("./pages/Debt").then((m) => ({ default: m.Debt })));
const Inflation = lazy(() => import("./pages/Inflation").then((m) => ({ default: m.Inflation })));
const Rates = lazy(() => import("./pages/Rates").then((m) => ({ default: m.Rates })));
const MoneySupply = lazy(() => import("./pages/MoneySupply").then((m) => ({ default: m.MoneySupply })));
const DefenseSpending = lazy(() => import("./pages/DefenseSpending").then((m) => ({ default: m.DefenseSpending })));
const ForeignAssistance = lazy(() => import("./pages/ForeignAssistance").then((m) => ({ default: m.ForeignAssistance })));
const MonetaryExpansionProxy = lazy(() => import("./pages/MonetaryExpansionProxy").then((m) => ({ default: m.MonetaryExpansionProxy })));
const WarSpendingProxy = lazy(() => import("./pages/WarSpendingProxy").then((m) => ({ default: m.WarSpendingProxy })));
const Methodology = lazy(() => import("./pages/Methodology").then((m) => ({ default: m.Methodology })));
const SourceHealth = lazy(() => import("./pages/SourceHealth").then((m) => ({ default: m.SourceHealth })));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dollar-strength" element={<DollarStrength />} />
            <Route path="debt" element={<Debt />} />
            <Route path="inflation" element={<Inflation />} />
            <Route path="rates" element={<Rates />} />
            <Route path="money-supply" element={<MoneySupply />} />
            <Route path="defense-spending" element={<DefenseSpending />} />
            <Route path="foreign-assistance" element={<ForeignAssistance />} />
            <Route path="monetary-expansion-proxy" element={<MonetaryExpansionProxy />} />
            <Route path="war-spending-proxy" element={<WarSpendingProxy />} />
            <Route path="methodology" element={<Methodology />} />
            <Route path="source-health" element={<SourceHealth />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
