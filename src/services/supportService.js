// Mock data for support tickets
const mockTickets = [
  {
    id: 'TKT-001',
    title: 'Unable to complete payment',
    requester: 'John Doe',
    status: 'open',
    priority: 'high',
    date: '2024-10-14',
    timestamp: new Date('2024-10-14T10:30:00').getTime(),
    assignedAgent: 'Admin',
    conversation: [
      {
        id: 1,
        sender: 'user',
        senderName: 'John Doe',
        message: 'I tried to pay for my ride but the payment kept failing. Can you help?',
        timestamp: new Date('2024-10-14T10:30:00').getTime(),
      },
      {
        id: 2,
        sender: 'admin',
        senderName: 'Support Team',
        message: 'Hello John, I can help you with that. Can you tell me which payment method you were using?',
        timestamp: new Date('2024-10-14T10:35:00').getTime(),
      },
      {
        id: 3,
        sender: 'user',
        senderName: 'John Doe',
        message: 'I was using my credit card ending in 4532',
        timestamp: new Date('2024-10-14T10:38:00').getTime(),
      },
    ],
  },
  {
    id: 'TKT-002',
    title: 'Driver was rude during trip',
    requester: 'Sarah Johnson',
    status: 'open',
    priority: 'medium',
    date: '2024-10-14',
    timestamp: new Date('2024-10-14T09:15:00').getTime(),
    assignedAgent: 'Admin',
    conversation: [
      {
        id: 1,
        sender: 'user',
        senderName: 'Sarah Johnson',
        message: 'My driver was very unprofessional and rude. I want to file a formal complaint.',
        timestamp: new Date('2024-10-14T09:15:00').getTime(),
      },
    ],
  },
  {
    id: 'TKT-003',
    title: 'Wrong pickup location',
    requester: 'Mike Chen',
    status: 'open',
    priority: 'low',
    date: '2024-10-13',
    timestamp: new Date('2024-10-13T16:45:00').getTime(),
    assignedAgent: 'Admin',
    conversation: [
      {
        id: 1,
        sender: 'user',
        senderName: 'Mike Chen',
        message: 'The driver went to the wrong pickup location even though I entered the correct address.',
        timestamp: new Date('2024-10-13T16:45:00').getTime(),
      },
      {
        id: 2,
        sender: 'admin',
        senderName: 'Support Team',
        message: 'I apologize for the inconvenience. Let me look into this for you.',
        timestamp: new Date('2024-10-13T16:50:00').getTime(),
      },
    ],
  },
  {
    id: 'TKT-004',
    title: 'Refund request for cancelled ride',
    requester: 'Emily Davis',
    status: 'resolved',
    priority: 'medium',
    date: '2024-10-12',
    timestamp: new Date('2024-10-12T14:20:00').getTime(),
    assignedAgent: 'Admin',
    conversation: [
      {
        id: 1,
        sender: 'user',
        senderName: 'Emily Davis',
        message: 'I was charged for a ride that got cancelled. Can I get a refund?',
        timestamp: new Date('2024-10-12T14:20:00').getTime(),
      },
      {
        id: 2,
        sender: 'admin',
        senderName: 'Support Team',
        message: 'I can see the charge. Let me process your refund right away.',
        timestamp: new Date('2024-10-12T14:25:00').getTime(),
      },
      {
        id: 3,
        sender: 'admin',
        senderName: 'Support Team',
        message: 'Your refund has been processed. You should see it in 3-5 business days.',
        timestamp: new Date('2024-10-12T14:30:00').getTime(),
      },
    ],
  },
  {
    id: 'TKT-005',
    title: 'App keeps crashing',
    requester: 'Robert Brown',
    status: 'pending',
    priority: 'high',
    date: '2024-10-13',
    timestamp: new Date('2024-10-13T11:00:00').getTime(),
    assignedAgent: 'Admin',
    conversation: [
      {
        id: 1,
        sender: 'user',
        senderName: 'Robert Brown',
        message: 'The app crashes every time I try to book a ride. This is very frustrating!',
        timestamp: new Date('2024-10-13T11:00:00').getTime(),
      },
      {
        id: 2,
        sender: 'admin',
        senderName: 'Support Team',
        message: 'I understand your frustration. Can you tell me what device and OS version you are using?',
        timestamp: new Date('2024-10-13T11:05:00').getTime(),
      },
    ],
  },
];

// Fetch support tickets with optional filter
export const fetchSupportTickets = async (filter = 'open') => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  if (filter === 'all') {
    return mockTickets;
  }
  
  return mockTickets.filter(ticket => ticket.status === filter);
};

// Fetch details for a specific ticket
export const fetchTicketDetails = async (ticketId) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  
  const ticket = mockTickets.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  
  return ticket;
};

// Send a message in a ticket conversation
export const sendMessage = async (ticketId, content) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const ticket = mockTickets.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  
  const newMessage = {
    id: ticket.conversation.length + 1,
    sender: 'admin',
    senderName: 'Support Team',
    message: content,
    timestamp: Date.now(),
  };
  
  ticket.conversation.push(newMessage);
  
  return newMessage;
};

// Mark a ticket as resolved
export const markAsResolved = async (ticketId) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const ticket = mockTickets.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  
  ticket.status = 'resolved';
  
  return ticket;
};

