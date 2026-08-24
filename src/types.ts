export interface User {
  id: string; // Document ID
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Event {
  id: string; // Document ID / Share Code (custom string in SQL)
  dbId?: number; // Real database ID (SQL auto-increment)
  organizerId: string;
  brideName: string;
  date: string;
  time?: string;
  location?: string;
  theme?: string;
  createdAt: any;
  updatedAt: any;
  isPremium?: boolean;
  guestCount?: number;
  confirmedGuestCount?: number;
  hasPendingPayment?: boolean;
}

export interface Gift {
  id: string; // Document ID
  eventId: string;
  name: string;
  category?: string;
  imageUrl?: string;
  status: 'available' | 'chosen';
  isSuggested?: boolean;
  chosenByGuestEmail?: string;
  chosenByGuestName?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string; // Document ID
  eventId: string;
  guestName: string;
  guestEmail?: string;
  message: string;
  createdAt: any;
}

export interface Guest {
  id: number;
  festa_id: number;
  nome: string;
  email: string;
  telefone?: string;
  convite_enviado: boolean;
  presenca_confirmada?: boolean;
  criado_em: any;
}
