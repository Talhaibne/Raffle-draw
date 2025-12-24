import { TicketManagement } from '@/components/raffle/TicketManagement';
import { PrizeManagement } from '@/components/raffle/PrizeManagement';
import { DrawExecution } from '@/components/raffle/DrawExecution';
import { DrawHistory } from '@/components/raffle/DrawHistory';

import { useRaffleState } from '@/hooks/useRaffleState';
import { Button } from '@/components/ui/button';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { RotateCcw } from 'lucide-react';

const Index = () => {
  const raffle = useRaffleState();

  // ✅ MUST return string[]
  const handleImportFromOwners = (): string[] => {
    return raffle.getAllTicketsFromOwners();
  };

  return (
    <div className="bg-background p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Raffle Draw</h1>
          <p className="text-sm text-muted-foreground">
            Fair • Transparent • Exciting
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Everything?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all tickets, prizes, and draw history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={raffle.resetAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reset All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Main Content */}
      <div className="space-y-6">

        {/* Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TicketManagement
            tickets={raffle.tickets}
            onAddTickets={raffle.addTickets}
            onAddRange={raffle.addTicketRange}
            onClearTickets={raffle.clearTickets}
            onImportFromOwners={handleImportFromOwners}
          />

          <PrizeManagement
            prizes={raffle.prizes}
            categories={raffle.categories}
            onAddPrize={raffle.addPrize}
            onAddBulkPrizes={raffle.addBulkPrizes}
            onUpdatePrize={raffle.updatePrize}
            onDeletePrize={raffle.deletePrize}
            onAddCategory={raffle.addCategory}
            onDeleteCategory={raffle.deleteCategory}
            getPrizesByCategory={raffle.getPrizesByCategory}
          />
        </div>

        {/* Draw & History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DrawExecution
              tickets={raffle.tickets}
              categories={raffle.categories}
              getAvailablePrizes={raffle.getAvailablePrizes}
              isDrawing={raffle.isDrawing}
              currentResults={raffle.currentResults}
              onExecuteDraw={raffle.executeDraw}
              onClearResults={raffle.clearCurrentResults}
              getOwnerByTicket={raffle.getOwnerByTicket}
            />
          </div>

          <div className="lg:col-span-1">
            <DrawHistory
              history={raffle.history}
              onReset={raffle.resetAll}
              getOwnerByTicket={raffle.getOwnerByTicket}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
