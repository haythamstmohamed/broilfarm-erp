import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/farms"} component={Home} />
        <Route path={"/cycles"} component={Home} />
        <Route path={"/housing"} component={Home} />
        <Route path={"/feed-stock"} component={Home} />
        <Route path={"/expenses"} component={Home} />
        <Route path={"/workers"} component={Home} />
        <Route path={"/sales"} component={Home} />
        <Route path={"/operations"} component={Home} />
        <Route path={"/health"} component={Home} />
        <Route path={"/growth"} component={Home} />
        <Route path={"/reports"} component={Home} />
        <Route path={"/access"} component={Home} />
        <Route path={"/404"} component={NotFound} />
        <Route component={Home} />
      </Switch>
    </DashboardLayout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
