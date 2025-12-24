import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Ticket, Upload, Plus, Trash2, FileSpreadsheet, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface TicketManagementProps {
  tickets: string[];
  onAddTickets: (tickets: string[]) => void;
  onAddRange: (start: number, end: number) => void;
  onClearTickets: () => void;
  onImportFromOwners?: () => string[];
}

export function TicketManagement({
  tickets,
  onAddTickets,
  onAddRange,
  onClearTickets,
  onImportFromOwners,
}: TicketManagementProps) {
  const { toast } = useToast();
  const [bulkInput, setBulkInput] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkAdd = () => {
    if (!bulkInput.trim()) return;
    
    const newTickets = bulkInput
      .split(/[,\n\s]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    if (newTickets.length === 0) {
      toast({
        title: 'No tickets found',
        description: 'Please enter valid ticket numbers',
        variant: 'destructive',
      });
      return;
    }

    const existingSet = new Set(tickets);
    const duplicates = newTickets.filter(t => existingSet.has(t));
    const unique = newTickets.filter(t => !existingSet.has(t));

    onAddTickets(unique);
    setBulkInput('');

    toast({
      title: 'Tickets added',
      description: `Added ${unique.length} tickets${duplicates.length > 0 ? ` (${duplicates.length} duplicates skipped)` : ''}`,
    });
  };

  const handleRangeAdd = () => {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);

    if (isNaN(start) || isNaN(end)) {
      toast({
        title: 'Invalid range',
        description: 'Please enter valid numbers',
        variant: 'destructive',
      });
      return;
    }

    if (start > end) {
      toast({
        title: 'Invalid range',
        description: 'Start must be less than or equal to end',
        variant: 'destructive',
      });
      return;
    }

    if (end - start > 10000) {
      toast({
        title: 'Range too large',
        description: 'Maximum 10,000 tickets at once',
        variant: 'destructive',
      });
      return;
    }

    onAddRange(start, end);
    setRangeStart('');
    setRangeEnd('');

    toast({
      title: 'Tickets added',
      description: `Added range ${start} to ${end}`,
    });
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const csvTickets = results.data
          .flat()
          .map((v: any) => String(v).trim())
          .filter((v: string) => v.length > 0 && v !== 'ticket' && v !== 'number');

        if (csvTickets.length === 0) {
          toast({
            title: 'No tickets found',
            description: 'CSV file is empty or invalid',
            variant: 'destructive',
          });
          return;
        }

        onAddTickets(csvTickets);
        toast({
          title: 'CSV imported',
          description: `Imported ${csvTickets.length} tickets`,
        });
      },
      error: () => {
        toast({
          title: 'Import failed',
          description: 'Could not parse CSV file',
          variant: 'destructive',
        });
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ticket className="h-5 w-5 text-primary" />
          Ticket Management
          <Badge variant="secondary" className="ml-auto">
            {tickets.length} tickets
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Entry */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Bulk Entry</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter tickets (comma or newline separated)"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleBulkAdd} size="icon" variant="secondary">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Range Entry */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Range Entry</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Start"
              type="number"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="w-24"
            />
            <span className="flex items-center text-muted-foreground">to</span>
            <Input
              placeholder="End"
              type="number"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="w-24"
            />
            <Button onClick={handleRangeAdd} variant="secondary">
              Add Range
            </Button>
          </div>
        </div>

        {/* Import Options */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Import Tickets</Label>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            ref={fileInputRef}
            className="hidden"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              From CSV
            </Button>
            {onImportFromOwners && (
              <Button
                variant="outline"
                onClick={() => {
                  const ownerTickets = onImportFromOwners();
                  if (ownerTickets.length === 0) {
                    toast({
                      title: 'No tickets found',
                      description: 'No tickets registered in Ticket Owners',
                      variant: 'destructive',
                    });
                    return;
                  }
                  const existingSet = new Set(tickets);
                  const unique = ownerTickets.filter(t => !existingSet.has(t));
                  onAddTickets(unique);
                  toast({
                    title: 'Tickets imported',
                    description: `Added ${unique.length} tickets from owners${ownerTickets.length - unique.length > 0 ? ` (${ownerTickets.length - unique.length} duplicates skipped)` : ''}`,
                  });
                }}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                From Owners
              </Button>
            )}
          </div>
        </div>

        {/* Ticket Pool Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Ticket Pool</Label>
            {tickets.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearTickets}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          <ScrollArea className="h-32 rounded-md border bg-muted/30 p-2">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileSpreadsheet className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No tickets added yet</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {tickets.slice(0, 100).map((ticket) => (
                  <Badge key={ticket} variant="outline" className="text-xs">
                    {ticket}
                  </Badge>
                ))}
                {tickets.length > 100 && (
                  <Badge variant="secondary" className="text-xs">
                    +{tickets.length - 100} more
                  </Badge>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
