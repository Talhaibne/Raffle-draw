import { useState, useCallback } from 'react';
import { Prize, DrawResult, DrawHistoryEntry, Category, GroupSize } from '@/types/raffle';

const DEFAULT_CATEGORIES: Category[] = ['A', 'B', 'C'];

export function useRaffleState() {
  const [tickets, setTickets] = useState<string[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [currentResults, setCurrentResults] = useState<DrawResult[]>([]);
  const [history, setHistory] = useState<DrawHistoryEntry[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const addTickets = useCallback((newTickets: string[]) => {
    setTickets(prev => {
      const existingSet = new Set(prev);
      const uniqueNew = newTickets.filter(t => !existingSet.has(t));
      return [...prev, ...uniqueNew];
    });
  }, []);

  const addTicketRange = useCallback((start: number, end: number) => {
    const rangeTickets: string[] = [];
    for (let i = start; i <= end; i++) {
      rangeTickets.push(i.toString());
    }
    addTickets(rangeTickets);
  }, [addTickets]);

  const removeTickets = useCallback((ticketsToRemove: string[]) => {
    setTickets(prev => prev.filter(t => !ticketsToRemove.includes(t)));
  }, []);

  const clearTickets = useCallback(() => {
    setTickets([]);
  }, []);

  // Category management
  const addCategory = useCallback((name: string) => {
    const trimmed = name.trim().toUpperCase();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed]);
      return true;
    }
    return false;
  }, [categories]);

  const deleteCategory = useCallback((name: string) => {
    // Only allow deletion if no prizes exist in this category
    const hasPrizes = prizes.some(p => p.category === name);
    if (!hasPrizes) {
      setCategories(prev => prev.filter(c => c !== name));
      return true;
    }
    return false;
  }, [prizes]);

  const addPrize = useCallback((name: string, category: Category) => {
    const newPrize: Prize = {
      id: crypto.randomUUID(),
      name,
      category,
      isAssigned: false,
    };
    setPrizes(prev => [...prev, newPrize]);
  }, []);

  const addBulkPrizes = useCallback((prizesData: Array<{ name: string; category: Category }>) => {
    const newPrizes: Prize[] = prizesData.map(p => ({
      id: crypto.randomUUID(),
      name: p.name,
      category: p.category,
      isAssigned: false,
    }));
    setPrizes(prev => [...prev, ...newPrizes]);
    return newPrizes.length;
  }, []);

  const updatePrize = useCallback((id: string, name: string, category: Category) => {
    setPrizes(prev => prev.map(p => 
      p.id === id ? { ...p, name, category } : p
    ));
  }, []);

  const deletePrize = useCallback((id: string) => {
    setPrizes(prev => prev.filter(p => p.id !== id));
  }, []);

  const getAvailablePrizes = useCallback((category: Category) => {
    return prizes.filter(p => p.category === category && !p.isAssigned);
  }, [prizes]);

  const getPrizesByCategory = useCallback((category: Category) => {
    return prizes.filter(p => p.category === category);
  }, [prizes]);

  const executeDraw = useCallback(async (
    category: Category,
    groupSize: GroupSize,
    onAnimationTick?: (shuffledTickets: string[]) => void
  ): Promise<DrawResult[]> => {
    const availablePrizes = getAvailablePrizes(category);
    
    if (tickets.length < groupSize || availablePrizes.length < groupSize) {
      return [];
    }

    setIsDrawing(true);

    // Animation phase - shuffle display for 2.5 seconds
    const animationDuration = 2500;
    const tickInterval = 80;
    const ticks = animationDuration / tickInterval;

    for (let i = 0; i < ticks; i++) {
      await new Promise(resolve => setTimeout(resolve, tickInterval));
      if (onAnimationTick) {
        // Generate random tickets for display during animation
        const shuffled = [...tickets]
          .sort(() => Math.random() - 0.5)
          .slice(0, groupSize);
        onAnimationTick(shuffled);
      }
    }

    // Actual random selection using crypto
    const selectedTickets: string[] = [];
    const ticketPool = [...tickets];
    
    for (let i = 0; i < groupSize; i++) {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      const randomIndex = randomArray[0] % ticketPool.length;
      selectedTickets.push(ticketPool[randomIndex]);
      ticketPool.splice(randomIndex, 1);
    }

    // Assign prizes
    const results: DrawResult[] = selectedTickets.map((ticket, index) => {
      const prize = availablePrizes[index];
      return {
        id: crypto.randomUUID(),
        ticketNumber: ticket,
        prize: { ...prize, isAssigned: true, assignedTo: ticket },
        category,
        timestamp: new Date(),
      };
    });

    // Update state
    removeTickets(selectedTickets);
    setPrizes(prev => prev.map(p => {
      const assigned = results.find(r => r.prize.id === p.id);
      if (assigned) {
        return { ...p, isAssigned: true, assignedTo: assigned.ticketNumber };
      }
      return p;
    }));

    const historyEntry: DrawHistoryEntry = {
      id: crypto.randomUUID(),
      results,
      category,
      groupSize,
      timestamp: new Date(),
    };

    setCurrentResults(results);
    setHistory(prev => [historyEntry, ...prev]);
    setIsDrawing(false);

    return results;
  }, [tickets, getAvailablePrizes, removeTickets]);

  const resetAll = useCallback(() => {
    setTickets([]);
    setPrizes([]);
    setCategories([...DEFAULT_CATEGORIES]);
    setCurrentResults([]);
    setHistory([]);
    setIsDrawing(false);
  }, []);

  const clearCurrentResults = useCallback(() => {
    setCurrentResults([]);
  }, []);

  return {
    tickets,
    prizes,
    categories,
    currentResults,
    history,
    isDrawing,
    addTickets,
    addTicketRange,
    removeTickets,
    clearTickets,
    addCategory,
    deleteCategory,
    addPrize,
    addBulkPrizes,
    updatePrize,
    deletePrize,
    getAvailablePrizes,
    getPrizesByCategory,
    executeDraw,
    resetAll,
    clearCurrentResults,
  };
}
