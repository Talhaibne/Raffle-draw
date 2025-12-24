export type Category = string;

export type GroupSize = number;

export interface Prize {
  id: string;
  name: string;
  category: Category;
  isAssigned: boolean;
  assignedTo?: string;
}

export interface DrawResult {
  id: string;
  ticketNumber: string;
  prize: Prize;
  category: Category;
  timestamp: Date;
  ownerName?: string;
}

export interface DrawHistoryEntry {
  id: string;
  results: DrawResult[];
  category: Category;
  groupSize: GroupSize;
  timestamp: Date;
}

export interface TicketOwner {
  id: string;
  name: string;
  ticketNumbers: string[];
}
