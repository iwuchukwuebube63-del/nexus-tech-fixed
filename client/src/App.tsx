import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Invest from "./pages/Invest";
import Wallet from "./pages/Wallet";
import Invite from "./pages/Invite";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import AdminPanel from "./pages/AdminPanel";
import Income from "./pages/Income";
import Mine from "./pages/Mine";
import Profile from "./pages/Profile";
import BindCard from "./pages/BindCard";
import Deposit from "./pages/Deposit";
import { FloatingCustomerService } from "./components/FloatingCustomerService";
import { WelcomePopup } from "./components/WelcomePopup";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/invest"} component={Invest} />
      <Route path={"/wallet"} component={Wallet} />
      <Route path={"/invite"} component={Invite} />
      <Route path={"/deposit"} component={Deposit} />
      <Route path={"/withdraw"} component={Withdraw} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/income"} component={Income} />
      <Route path={"/mine"} component={Mine} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/bind-card"} component={BindCard} />
      <Route path={"/deposit/callback"} component={Deposit} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
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
          <FloatingCustomerService />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
