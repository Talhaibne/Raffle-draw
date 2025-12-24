import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { History, Download, FileText, Clock, Trash2, User } from 'lucide-react';
import { DrawHistoryEntry, Category, TicketOwner } from '@/types/raffle';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DrawHistoryProps {
  history: DrawHistoryEntry[];
  onReset: () => void;
  getOwnerByTicket: (ticketNumber: string) => TicketOwner | undefined;
}

const categoryColors: Record<Category, string> = {
  A: 'bg-category-a text-category-a-foreground',
  B: 'bg-category-b text-category-b-foreground',
  C: 'bg-category-c text-category-c-foreground',
};

const getCategoryColor = (category: string) => {
  if (categoryColors[category]) {
    return categoryColors[category];
  }
  const hue = (category.charCodeAt(0) * 137) % 360;
  return `bg-[hsl(${hue},70%,50%)] text-white`;
};

export function DrawHistory({ history, onReset, getOwnerByTicket }: DrawHistoryProps) {
  const exportToCSV = () => {
    if (history.length === 0) return;

    const rows = [['Draw #', 'Timestamp', 'Category', 'Ticket Number', 'Owner Name', 'Prize Name']];
    
    history.forEach((entry, drawIndex) => {
      entry.results.forEach((result) => {
        const owner = getOwnerByTicket(result.ticketNumber);
        rows.push([
          (history.length - drawIndex).toString(),
          format(entry.timestamp, 'yyyy-MM-dd HH:mm:ss'),
          result.category,
          result.ticketNumber,
          owner?.name || '-',
          result.prize.name,
        ]);
      });
    });

    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `raffle-results-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (history.length === 0) return;

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Raffle Draw Results', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`, 14, 30);

    const tableData = history.flatMap((entry, drawIndex) =>
      entry.results.map((result) => {
        const owner = getOwnerByTicket(result.ticketNumber);
        return [
          history.length - drawIndex,
          format(entry.timestamp, 'MMM d, HH:mm'),
          `Category ${result.category}`,
          result.ticketNumber,
          owner?.name || '-',
          result.prize.name,
        ];
      })
    );

    autoTable(doc, {
      head: [['Draw #', 'Time', 'Category', 'Ticket', 'Owner', 'Prize']],
      body: tableData,
      startY: 38,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`raffle-results-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.pdf`);
  };

  const totalWinners = history.reduce((acc, entry) => acc + entry.results.length, 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Draw History
          <Badge variant="secondary" className="ml-auto">
            {totalWinners} winners
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={history.length === 0}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={history.length === 0}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={history.length === 0}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* History List */}
        <ScrollArea className="h-[400px]">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <History className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No draws yet</p>
              <p className="text-xs text-muted-foreground/70">Results will appear here</p>
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{format(entry.timestamp, 'MMM d, yyyy h:mm a')}</span>
                    <Badge className={cn('text-xs', getCategoryColor(entry.category))}>
                      Cat {entry.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {entry.groupSize} drawn
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {entry.results.map((result) => {
                      const owner = getOwnerByTicket(result.ticketNumber);
                      return (
                        <div
                          key={result.id}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">#{result.ticketNumber}</span>
                            {owner && (
                              <span className="flex items-center gap-1 text-xs text-primary">
                                <User className="h-3 w-3" />
                                {owner.name}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground truncate max-w-[40%]">
                            {result.prize.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {index < history.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
