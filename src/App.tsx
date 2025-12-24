import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import TicketOwners from "./pages/TicketOwners";
import NotFound from "./pages/NotFound";
import { useTicketOwners } from "@/hooks/useTicketOwners";

const queryClient = new QueryClient();

function AppContent() {
  const ticketOwnersState = useTicketOwners();

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <Index
              getOwnerByTicket={ticketOwnersState.getOwnerByTicket}
              getAllTicketsFromOwners={ticketOwnersState.getAllTicketsFromOwners}
            />
          }
        />
        <Route
          path="/ticket-owners"
          element={
            <TicketOwners
              owners={ticketOwnersState.owners}
              onAddOwner={ticketOwnersState.addOwner}
              onUpdateOwner={ticketOwnersState.updateOwner}
              onDeleteOwner={ticketOwnersState.deleteOwner}
              onAddBulkOwners={ticketOwnersState.addBulkOwners}
              onResetOwners={ticketOwnersState.resetOwners}
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
