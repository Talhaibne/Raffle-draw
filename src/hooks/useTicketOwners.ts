import { useState, useCallback, useRef } from 'react';
import { TicketOwner } from '@/types/raffle';

export function useTicketOwners() {
  const [owners, setOwners] = useState<TicketOwner[]>([]);
  const ownersRef = useRef<TicketOwner[]>([]);
  
  // Update ref whenever we update state
  const setOwnersWithRef = useCallback((updater: TicketOwner[] | ((prev: TicketOwner[]) => TicketOwner[])) => {
    setOwners(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      ownersRef.current = next;
      return next;
    });
  }, []);

  const addOwner = useCallback((name: string, ticketNumbers: string[]) => {
    const newOwner: TicketOwner = {
      id: crypto.randomUUID(),
      name: name.trim(),
      ticketNumbers: ticketNumbers.map(t => t.trim()).filter(t => t),
    };
    setOwnersWithRef(prev => [...prev, newOwner]);
    return newOwner;
  }, [setOwnersWithRef]);

  const updateOwner = useCallback((id: string, name: string, ticketNumbers: string[]) => {
    setOwnersWithRef(prev => prev.map(o =>
      o.id === id
        ? { ...o, name: name.trim(), ticketNumbers: ticketNumbers.map(t => t.trim()).filter(t => t) }
        : o
    ));
  }, [setOwnersWithRef]);

  const deleteOwner = useCallback((id: string) => {
    setOwnersWithRef(prev => prev.filter(o => o.id !== id));
  }, [setOwnersWithRef]);

  const getOwnerByTicket = useCallback((ticketNumber: string): TicketOwner | undefined => {
    return ownersRef.current.find(o => o.ticketNumbers.includes(ticketNumber));
  }, []);

  const getAllTicketsFromOwners = useCallback((): string[] => {
    return ownersRef.current.flatMap(o => o.ticketNumbers);
  }, []);

  const addBulkOwners = useCallback((data: Array<{ name: string; ticketNumbers: string[] }>) => {
    const newOwners: TicketOwner[] = data.map(d => ({
      id: crypto.randomUUID(),
      name: d.name.trim(),
      ticketNumbers: d.ticketNumbers.map(t => t.trim()).filter(t => t),
    }));
    setOwnersWithRef(prev => [...prev, ...newOwners]);
    return newOwners.length;
  }, [setOwnersWithRef]);

  const resetOwners = useCallback(() => {
    setOwnersWithRef([]);
  }, [setOwnersWithRef]);

  return {
    owners,
    addOwner,
    updateOwner,
    deleteOwner,
    getOwnerByTicket,
    getAllTicketsFromOwners,
    addBulkOwners,
    resetOwners,
  };
}
