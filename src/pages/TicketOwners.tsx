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
import {
  Users,
  Plus,
  Trash2,
  Upload,
  Download,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import Papa from 'papaparse';

import { TicketOwner } from '@/types/raffle';
import { useToast } from '@/hooks/use-toast';
import { useRaffleState } from '@/hooks/useRaffleState';

const TicketOwnersPage = () => {
  const {
    owners,
    addOwner,
    updateOwner,
    deleteOwner,
    addBulkOwners,
    resetOwners,
  } = useRaffleState();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newName, setNewName] = useState('');
  const [newTickets, setNewTickets] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTickets, setEditTickets] = useState('');

  const handleAddOwner = () => {
    if (!newName.trim() || !newTickets.trim()) {
      toast({
        title: 'Error',
        description: 'Name and ticket numbers are required',
        variant: 'destructive',
      });
      return;
    }

    const ticketNumbers = newTickets
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    addOwner(newName.trim(), ticketNumbers);
    setNewName('');
    setNewTickets('');

    toast({ title: 'Owner added' });
  };

  const handleStartEdit = (owner: TicketOwner) => {
    setEditingId(owner.id);
    setEditName(owner.name);
    setEditTickets(owner.ticketNumbers.join(', '));
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const tickets = editTickets
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    updateOwner(editingId, editName.trim(), tickets);
    setEditingId(null);

    toast({ title: 'Owner updated' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: result => {
        const data = (result.data as any[])
          .map(row => ({
            name: row.name?.trim(),
            ticketNumbers: row.tickets
              ?.split(',')
              .map((t: string) => t.trim())
              .filter(Boolean),
          }))
          .filter(r => r.name && r.ticketNumbers?.length);

        if (data.length === 0) {
          toast({
            title: 'Invalid CSV',
            description: 'No valid rows found',
            variant: 'destructive',
          });
          return;
        }

        const count = addBulkOwners(data);
        toast({ title: `Imported ${count} owners` });
      },
    });

    e.target.value = '';
  };

  const downloadTemplate = () => {
    const csv = 'name,tickets\nJohn Doe,"1,2,3"\nJane Smith,"10,11"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ticket-owners-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalTickets = owners.reduce((sum, o) => sum + o.ticketNumbers.length, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ticket Owners</h1>
            <p className="text-sm text-muted-foreground">
              Manage ticket ownership
            </p>
          </div>

          <Badge variant="secondary">
            {owners.length} owners • {totalTickets} tickets
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Add Owner */}
          <Card>
            <CardHeader>
              <CardTitle>Add Owner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <Input
                placeholder="Tickets (1,2,3)"
                value={newTickets}
                onChange={e => setNewTickets(e.target.value)}
              />
              <Button onClick={handleAddOwner} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-1" />
                  Template
                </Button>
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

          {/* Owner List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Owner List</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                {owners.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    No owners added yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {owners.map(owner => (
                        <TableRow key={owner.id}>
                          <TableCell>
                            {editingId === owner.id ? (
                              <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                              />
                            ) : (
                              owner.name
                            )}
                          </TableCell>

                          <TableCell>
                            {editingId === owner.id ? (
                              <Input
                                value={editTickets}
                                onChange={e => setEditTickets(e.target.value)}
                              />
                            ) : (
                              owner.ticketNumbers.join(', ')
                            )}
                          </TableCell>

                          <TableCell className="flex gap-1">
                            {editingId === owner.id ? (
                              <>
                                <Button size="icon" onClick={handleSaveEdit}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingId(null)}
                                >
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
                                  className="text-destructive"
                                  onClick={() => deleteOwner(owner.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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
};

export default TicketOwnersPage;
