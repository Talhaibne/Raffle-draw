import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Users, Plus, Trash2, Upload, Download, Edit2, Save, X } from 'lucide-react';
import { TicketOwner } from '@/types/raffle';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface TicketOwnersProps {
  owners: TicketOwner[];
  onAddOwner: (name: string, ticketNumbers: string[]) => TicketOwner;
  onUpdateOwner: (id: string, name: string, ticketNumbers: string[]) => void;
  onDeleteOwner: (id: string) => void;
  onAddBulkOwners: (data: Array<{ name: string; ticketNumbers: string[] }>) => number;
  onResetOwners: () => void;
}

export function TicketOwnersPage({
  owners,
  onAddOwner,
  onUpdateOwner,
  onDeleteOwner,
  onAddBulkOwners,
  onResetOwners,
}: TicketOwnersProps) {
  const [newName, setNewName] = useState('');
  const [newTickets, setNewTickets] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTickets, setEditTickets] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAddOwner = () => {
    if (!newName.trim()) {
      toast({ title: 'Error', description: 'Please enter a name', variant: 'destructive' });
      return;
    }
    if (!newTickets.trim()) {
      toast({ title: 'Error', description: 'Please enter at least one ticket number', variant: 'destructive' });
      return;
    }

    const ticketNumbers = newTickets.split(',').map(t => t.trim()).filter(t => t);
    onAddOwner(newName, ticketNumbers);
    setNewName('');
    setNewTickets('');
    toast({ title: 'Success', description: 'Owner added successfully' });
  };

  const handleStartEdit = (owner: TicketOwner) => {
    setEditingId(owner.id);
    setEditName(owner.name);
    setEditTickets(owner.ticketNumbers.join(', '));
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const ticketNumbers = editTickets.split(',').map(t => t.trim()).filter(t => t);
    onUpdateOwner(editingId, editName, ticketNumbers);
    setEditingId(null);
    toast({ title: 'Success', description: 'Owner updated successfully' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data: Array<{ name: string; ticketNumbers: string[] }> = [];

        results.data.forEach((row: any) => {
          const name = row.name || row.Name || row.NAME || '';
          const tickets = row.tickets || row.Tickets || row.TICKETS || row.ticket_numbers || '';

          if (name.trim()) {
            data.push({
              name: name.trim(),
              ticketNumbers: tickets.split(',').map((t: string) => t.trim()).filter((t: string) => t),
            });
          }
        });

        if (data.length > 0) {
          const count = onAddBulkOwners(data);
          toast({ title: 'Success', description: `Imported ${count} owners` });
        } else {
          toast({ title: 'Error', description: 'No valid data found in CSV', variant: 'destructive' });
        }
      },
      error: () => {
        toast({ title: 'Error', description: 'Failed to parse CSV file', variant: 'destructive' });
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'name,tickets\nJohn Doe,"1,2,3,4,5"\nJane Smith,"10,11,12"';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ticket-owners-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalTickets = owners.reduce((acc, o) => acc + o.ticketNumbers.length, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Ticket Owners</h1>
              <p className="text-sm text-muted-foreground">
                Manage person-to-ticket mappings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {owners.length} owners • {totalTickets} tickets
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={owners.length === 0}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Owners?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all ticket owner mappings. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onResetOwners} className="bg-destructive text-destructive-foreground">
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Owner Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Owner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="Enter person's name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ticket Numbers</label>
                <Input
                  placeholder="e.g., 1, 2, 3, 4, 5"
                  value={newTickets}
                  onChange={(e) => setNewTickets(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple tickets with commas
                </p>
              </div>
              <Button onClick={handleAddOwner} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Owner
              </Button>

              <Separator />

              {/* Bulk Import */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Bulk Import</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-1" />
                    Template
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Owners Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Owner List</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {owners.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Users className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">No owners added yet</p>
                    <p className="text-xs">Add owners manually or import from CSV</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Ticket Numbers</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {owners.map((owner) => (
                        <TableRow key={owner.id}>
                          <TableCell>
                            {editingId === owner.id ? (
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              <span className="font-medium">{owner.name}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === owner.id ? (
                              <Input
                                value={editTickets}
                                onChange={(e) => setEditTickets(e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {owner.ticketNumbers.slice(0, 10).map((t) => (
                                  <Badge key={t} variant="secondary" className="text-xs">
                                    {t}
                                  </Badge>
                                ))}
                                {owner.ticketNumbers.length > 10 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{owner.ticketNumbers.length - 10} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {editingId === owner.id ? (
                                <>
                                  <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleStartEdit(owner)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => onDeleteOwner(owner.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TicketOwnersPage;
