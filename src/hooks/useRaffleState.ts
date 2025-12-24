import { create } from 'zustand';
import {
  Prize,
  DrawResult,
  DrawHistoryEntry,
  Category,
  GroupSize,
  TicketOwner,
} from '@/types/raffle';

const DEFAULT_CATEGORIES: Category[] = ['A', 'B', 'C'];

interface RaffleState {
  // ------------------- STATE -------------------
  tickets: string[];
  prizes: Prize[];
  categories: Category[];
  owners: TicketOwner[];
  currentResults: DrawResult[];
  history: DrawHistoryEntry[];
  isDrawing: boolean;

  // ------------------- OWNERS -------------------
  addOwner: (name: string, ticketNumbers: string[]) => TicketOwner;
  updateOwner: (id: string, name: string, ticketNumbers: string[]) => void;
  deleteOwner: (id: string) => void;
  addBulkOwners: (data: { name: string; ticketNumbers: string[] }[]) => number;
  resetOwners: () => void;
  getOwnerByTicket: (ticket: string) => TicketOwner | undefined;
  getAllTicketsFromOwners: () => string[];

  // ------------------- TICKETS -------------------
  addTickets: (tickets: string[]) => void;
  addTicketRange: (start: number, end: number) => void;
  removeTickets: (ticketsToRemove: string[]) => void;
  clearTickets: () => void;

  // ------------------- CATEGORIES -------------------
  addCategory: (name: string) => boolean;
  deleteCategory: (name: string) => boolean;

  // ------------------- PRIZES -------------------
  addPrize: (name: string, category: Category) => void;
  addBulkPrizes: (data: { name: string; category: Category }[]) => number;
  updatePrize: (id: string, name: string, category: Category) => void;
  deletePrize: (id: string) => void;
  getAvailablePrizes: (category: Category) => Prize[];
  getPrizesByCategory: (category: Category) => Prize[];

  // ------------------- DRAW -------------------
  executeDraw: (
    category: Category,
    groupSize: GroupSize,
    onAnimationTick?: (tickets: string[]) => void
  ) => Promise<DrawResult[]>;

  clearCurrentResults: () => void;

  // ------------------- RESET -------------------
  resetAll: () => void;
}

export const useRaffleState = create<RaffleState>((set, get) => ({
  // ------------------- INITIAL STATE -------------------
  tickets: [],
  prizes: [],
  categories: DEFAULT_CATEGORIES,
  owners: [],
  currentResults: [],
  history: [],
  isDrawing: false,

  // ------------------- OWNERS -------------------
  addOwner: (name, ticketNumbers) => {
    const owner: TicketOwner = {
      id: crypto.randomUUID(),
      name,
      ticketNumbers,
    };
    set(state => ({ owners: [...state.owners, owner] }));
    return owner;
  },

  updateOwner: (id, name, ticketNumbers) =>
    set(state => ({
      owners: state.owners.map(o =>
        o.id === id ? { ...o, name, ticketNumbers } : o
      ),
    })),

  deleteOwner: id =>
    set(state => ({
      owners: state.owners.filter(o => o.id !== id),
    })),

  addBulkOwners: data => {
    const newOwners: TicketOwner[] = data.map(d => ({
      id: crypto.randomUUID(),
      name: d.name,
      ticketNumbers: d.ticketNumbers,
    }));
    set(state => ({ owners: [...state.owners, ...newOwners] }));
    return newOwners.length;
  },

  resetOwners: () => set({ owners: [] }),

  getOwnerByTicket: ticket =>
    get().owners.find(o => o.ticketNumbers.includes(ticket)),

  getAllTicketsFromOwners: () =>
    Array.from(new Set(get().owners.flatMap(o => o.ticketNumbers))),

  // ------------------- TICKETS -------------------
  addTickets: newTickets =>
    set(state => ({
      tickets: [...new Set([...state.tickets, ...newTickets])],
    })),

  addTicketRange: (start, end) => {
    const range = Array.from(
      { length: end - start + 1 },
      (_, i) => (start + i).toString()
    );
    get().addTickets(range);
  },

  removeTickets: ticketsToRemove =>
    set(state => ({
      tickets: state.tickets.filter(t => !ticketsToRemove.includes(t)),
    })),

  clearTickets: () => set({ tickets: [] }),

  // ------------------- CATEGORIES -------------------
  addCategory: name => {
    const trimmed = name.trim().toUpperCase();
    if (!trimmed || get().categories.includes(trimmed)) return false;
    set(state => ({ categories: [...state.categories, trimmed] }));
    return true;
  },

  deleteCategory: name => {
    const hasPrizes = get().prizes.some(p => p.category === name);
    if (hasPrizes) return false;
    set(state => ({
      categories: state.categories.filter(c => c !== name),
    }));
    return true;
  },

  // ------------------- PRIZES -------------------
  addPrize: (name, category) => {
    const prize: Prize = {
      id: crypto.randomUUID(),
      name,
      category,
      isAssigned: false,
    };
    set(state => ({ prizes: [...state.prizes, prize] }));
  },

  addBulkPrizes: data => {
    const newPrizes: Prize[] = data.map(p => ({
      id: crypto.randomUUID(),
      name: p.name,
      category: p.category,
      isAssigned: false,
    }));
    set(state => ({ prizes: [...state.prizes, ...newPrizes] }));
    return newPrizes.length;
  },

  updatePrize: (id, name, category) =>
    set(state => ({
      prizes: state.prizes.map(p =>
        p.id === id ? { ...p, name, category } : p
      ),
    })),

  deletePrize: id =>
    set(state => ({
      prizes: state.prizes.filter(p => p.id !== id),
    })),

  getAvailablePrizes: category =>
    get().prizes.filter(p => p.category === category && !p.isAssigned),

  getPrizesByCategory: category =>
    get().prizes.filter(p => p.category === category),

  // ------------------- DRAW -------------------
  executeDraw: async (category, groupSize, onAnimationTick) => {
    const { tickets, prizes } = get();
    const availablePrizes = prizes.filter(
      p => p.category === category && !p.isAssigned
    );

    if (tickets.length < groupSize || availablePrizes.length < groupSize) {
      return [];
    }

    set({ isDrawing: true });

    // Animation phase
    const animationDuration = 2500;
    const tickInterval = 80;
    const ticks = animationDuration / tickInterval;

    for (let i = 0; i < ticks; i++) {
      await new Promise(res => setTimeout(res, tickInterval));
      if (onAnimationTick) {
        const shuffled = [...tickets]
          .sort(() => Math.random() - 0.5)
          .slice(0, groupSize);
        onAnimationTick(shuffled);
      }
    }

    // Secure random draw
    const ticketPool = [...tickets];
    const selected: string[] = [];

    for (let i = 0; i < groupSize; i++) {
      const rand = new Uint32Array(1);
      crypto.getRandomValues(rand);
      const index = rand[0] % ticketPool.length;
      selected.push(ticketPool[index]);
      ticketPool.splice(index, 1);
    }

    const results: DrawResult[] = selected.map((ticket, i) => ({
      id: crypto.randomUUID(),
      ticketNumber: ticket,
      prize: {
        ...availablePrizes[i],
        isAssigned: true,
        assignedTo: ticket,
      },
      category,
      timestamp: new Date(),
    }));

    set(state => ({
      tickets: state.tickets.filter(t => !selected.includes(t)),
      prizes: state.prizes.map(p => {
        const match = results.find(r => r.prize.id === p.id);
        return match
          ? { ...p, isAssigned: true, assignedTo: match.ticketNumber }
          : p;
      }),
      currentResults: results,
      history: [
        {
          id: crypto.randomUUID(),
          results,
          category,
          groupSize,
          timestamp: new Date(),
        },
        ...state.history,
      ],
      isDrawing: false,
    }));

    return results;
  },

  clearCurrentResults: () => set({ currentResults: [] }),

  // ------------------- RESET -------------------
  resetAll: () =>
    set({
      tickets: [],
      prizes: [],
      owners: [],
      categories: DEFAULT_CATEGORIES,
      currentResults: [],
      history: [],
      isDrawing: false,
    }),
}));
