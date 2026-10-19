import { lazy, Suspense } from "react";
import LoadingScreen from "@/components/loading-screen";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
const NotFound = lazy(() => import("@/pages/not-found"));
const Auth = lazy(() => import("@/pages/auth"));
const Welcome = lazy(() => import("@/pages/welcome"));
const AutofillSuggestions = lazy(() => import("@/pages/autofill-suggestions"));
const EnhancedBrowse = lazy(() => import("@/pages/enhanced-browse"));
const Settings = lazy(() => import("@/pages/settings"));
const EnhancedAuth = lazy(() => import("@/pages/enhanced-auth"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const Home = lazy(() => import("@/pages/home"));
const Browse = lazy(() => import("@/pages/browse"));
const MyBooks = lazy(() => import("@/pages/my-books"));
const Referrals = lazy(() => import("@/pages/referrals"));
const EnhancedProfile = lazy(() => import("@/pages/enhanced-profile"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const EarningsPage = lazy(() => import("@/pages/earnings"));
const HowItWorks = lazy(() => import("@/pages/how-it-works"));
const Downloads = lazy(() => import("@/pages/downloads"));
const MyWishlist = lazy(() => import("@/pages/my-wishlist"));
const BrandAmbassadorPage = lazy(() => import("@/pages/brand-ambassador"));
const SchoolsPage = lazy(() => import("@/pages/schools"));
const AppLayout = lazy(() => import("@/components/layout/app-layout"));
import { getCurrentUser } from "@/lib/auth";

const BulkUploadPage = lazy(() => import("@/pages/bulk-upload-page"));

function AuthenticatedApp() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/browse" component={EnhancedBrowse} />
        <Route path="/hubs" component={SchoolsPage} />
        <Route path="/schools" component={SchoolsPage} />
        <Route path="/bulk-upload" component={BulkUploadPage} />
        <Route path="/bulk-books" component={BulkUploadPage} />
        <Route path="/my-books" component={MyBooks} />
        <Route path="/earnings" component={EarningsPage} />
        <Route path="/history" component={EarningsPage} />
        <Route path="/referrals" component={Referrals} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/profile" component={EnhancedProfile} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/downloads" component={Downloads} />
        <Route path="/my-wishlist" component={MyWishlist} />
        <Route path="/brand-ambassador" component={BrandAmbassadorPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  const { data: authData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => getCurrentUser(),
    retry: false,
  });

  if (isLoading) return <LoadingScreen />;

  if (error || !authData?.user) {
    return (
      <Switch>
        <Route path="/auth" component={EnhancedAuth} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/downloads" component={Downloads} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/hubs">
          <AppLayout><SchoolsPage /></AppLayout>
        </Route>
        <Route path="/schools">
          <AppLayout><SchoolsPage /></AppLayout>
        </Route>
        <Route path="/browse">
          <AppLayout><EnhancedBrowse /></AppLayout>
        </Route>
        <Route path="/bulk-upload">
          <AppLayout><BulkUploadPage /></AppLayout>
        </Route>
        <Route path="/my-books">
          <AppLayout><MyBooks /></AppLayout>
        </Route>
        <Route component={Welcome} />
      </Switch>
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<LoadingScreen />}>
          <Router />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
