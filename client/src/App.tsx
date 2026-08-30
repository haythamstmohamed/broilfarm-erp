import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import DashboardLayout from "./components/DashboardLayout";

// Lazy-loaded domain pages for performance and code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FarmsPage = lazy(() => import("./pages/FarmsPage"));
const CyclesPage = lazy(() => import("./pages/CyclesPage"));
const HousingPage = lazy(() => import("./pages/HousingPage"));
const FeedStockPage = lazy(() => import("./pages/FeedStockPage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const WorkersPage = lazy(() => import("./pages/WorkersPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const OperationsPage = lazy(() => import("./pages/OperationsPage"));
const HealthPage = lazy(() => import("./pages/HealthPage"));
const GrowthPage = lazy(() => import("./pages/GrowthPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const AccessPage = lazy(() => import("./pages/AccessPage"));

function PageLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 text-muted-foreground">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium">جارٍ تحميل الصفحة…</p>
    </div>
  );
}

function Router() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoadingFallback />}>
        <Switch>
          <Route path={"/"} component={Dashboard} />
          <Route path={"/farms"} component={FarmsPage} />
          <Route path={"/cycles"} component={CyclesPage} />
          <Route path={"/housing"} component={HousingPage} />
          <Route path={"/feed-stock"} component={FeedStockPage} />
          <Route path={"/expenses"} component={ExpensesPage} />
          <Route path={"/workers"} component={WorkersPage} />
          <Route path={"/sales"} component={SalesPage} />
          <Route path={"/operations"} component={OperationsPage} />
          <Route path={"/health"} component={HealthPage} />
          <Route path={"/growth"} component={GrowthPage} />
          <Route path={"/reports"} component={ReportsPage} />
          <Route path={"/access"} component={AccessPage} />
          <Route path={"/404"} component={NotFound} />
          <Route component={Dashboard} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <WorkspaceProvider>
            <Toaster />
            <Router />
          </WorkspaceProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
