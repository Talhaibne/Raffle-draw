import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gift, Plus, Trash2, Edit2, Check, X, Upload, Tags } from 'lucide-react';
import { Prize, Category } from '@/types/raffle';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface PrizeManagementProps {
  prizes: Prize[];
  categories: Category[];
  onAddPrize: (name: string, category: Category) => void;
  onAddBulkPrizes: (prizes: Array<{ name: string; category: Category }>) => number;
  onUpdatePrize: (id: string, name: string, category: Category) => void;
  onDeletePrize: (id: string) => void;
  onAddCategory: (name: string) => boolean;
  onDeleteCategory: (name: string) => boolean;
  getPrizesByCategory: (category: Category) => Prize[];
}

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  A: { bg: 'bg-category-a/20', fg: 'text-category-a' },
  B: { bg: 'bg-category-b/20', fg: 'text-category-b' },
  C: { bg: 'bg-category-c/20', fg: 'text-category-c' },
};

const getColorForCategory = (category: string) => {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  const hue = (category.charCodeAt(0) * 137) % 360;
  return { bg: `bg-[hsl(${hue},70%,50%)]/20`, fg: `text-[hsl(${hue},70%,40%)]` };
};

export function PrizeManagement({
  prizes, categories, onAddPrize, onAddBulkPrizes, onUpdatePrize, onDeletePrize,
  onAddCategory, onDeleteCategory, getPrizesByCategory,
}: PrizeManagementProps) {
  const [newPrizeName, setNewPrizeName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0] || 'A');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('A');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPrize = () => {
    if (newPrizeName.trim()) {
      onAddPrize(newPrizeName.trim(), selectedCategory);
      setNewPrizeName('');
      toast.success('Prize added');
    }
  };

  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      complete: (results) => {
        const prizesData: Array<{ name: string; category: Category }> = [];
        results.data.forEach((row: unknown) => {
          const rowArray = row as string[];
          if (rowArray.length >= 1) {
            const name = rowArray[0]?.trim();
            const category = rowArray[1]?.trim().toUpperCase() || selectedCategory;
            if (name) {
              if (!categories.includes(category)) onAddCategory(category);
              prizesData.push({ name, category });
            }
          }
        });
        if (prizesData.length > 0) {
          const added = onAddBulkPrizes(prizesData);
          toast.success(`Imported ${added} prizes`);
        } else {
          toast.error('No valid prizes found');
        }
      },
      error: () => toast.error('Failed to parse CSV'),
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const success = onAddCategory(newCategoryName.trim());
      if (success) { toast.success(`Category added`); setNewCategoryName(''); }
      else toast.error('Category already exists');
    }
  };

  const getCategoryCount = (category: Category) => {
    const categoryPrizes = getPrizesByCategory(category);
    return { total: categoryPrizes.length, available: categoryPrizes.filter(p => !p.isAssigned).length };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Prize Management
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowCategoryManager(!showCategoryManager)}>
            <Tags className="h-4 w-4 mr-1" />Categories
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCategoryManager && (
          <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
            <div className="text-sm font-medium">Manage Categories</div>
            <div className="flex gap-2">
              <Input placeholder="New category" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} className="flex-1" />
              <Button onClick={handleAddCategory} size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const colors = getColorForCategory(cat);
                const count = getCategoryCount(cat);
                return (
                  <Badge key={cat} className={`${colors.bg} ${colors.fg} border-0 pr-1`}>
                    {cat} ({count.total})
                    {count.total === 0 && <Button size="icon" variant="ghost" className="h-4 w-4 ml-1" onClick={() => onDeleteCategory(cat)}><X className="h-3 w-3" /></Button>}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Input placeholder="Prize name" value={newPrizeName} onChange={(e) => setNewPrizeName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPrize()} className="flex-1" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={handleAddPrize} size="icon"><Plus className="h-4 w-4" /></Button>
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleBulkImport} className="hidden" />
          <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />Import Prizes from CSV
          </Button>
          <p className="text-xs text-muted-foreground mt-1">CSV format: prize_name, category</p>
        </div>
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="w-full flex">
            {categories.map((cat) => {
              const count = getCategoryCount(cat);
              return <TabsTrigger key={cat} value={cat} className="flex-1">{cat} ({count.available}/{count.total})</TabsTrigger>;
            })}
          </TabsList>
          {categories.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-4">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-4">
                  {getPrizesByCategory(cat).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No prizes</div>
                  ) : getPrizesByCategory(cat).map((prize) => (
                    <div key={prize.id} className={`flex items-center justify-between p-2 rounded-lg border ${prize.isAssigned ? 'bg-muted/50 opacity-60' : 'bg-card'}`}>
                      {editingId === prize.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                          <Select value={editCategory} onValueChange={setEditCategory}>
                            <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { onUpdatePrize(editingId, editName.trim(), editCategory); setEditingId(null); }}><Check className="h-4 w-4 text-green-500" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getColorForCategory(cat).bg} ${getColorForCategory(cat).fg} border-0`}>{cat}</Badge>
                            <span className={prize.isAssigned ? 'line-through' : ''}>{prize.name}</span>
                            {prize.isAssigned && <Badge variant="outline" className="text-xs">→ #{prize.assignedTo}</Badge>}
                          </div>
                          {!prize.isAssigned && (
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(prize.id); setEditName(prize.name); setEditCategory(prize.category); }}><Edit2 className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDeletePrize(prize.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
