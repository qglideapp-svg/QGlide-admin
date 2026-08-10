import { authenticatedFetch } from './apiClient';


const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

// Fetch support tickets with optional filter
export const fetchSupportTickets = async (filter = 'open') => {
  try {
    // Build URL with status parameter
    let url = `${API_BASE_URL}/admin-support-tickets-list`;
    if (filter !== 'all') {
      const statusParam = filter === 'closed' ? 'resolved' : filter;
      url += `?status=${statusParam}`;
    }

    console.log('🚀 FETCH SUPPORT TICKETS REQUEST:', {
      '🔗 API': url,
      '📊 Filter': filter,
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 FETCH SUPPORT TICKETS HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 RAW SUPPORT TICKETS API RESPONSE:', JSON.stringify(data, null, 2));
    
    // Parse API response - check multiple possible structures
    let ticketsArray = [];
    
    if (Array.isArray(data)) {
      ticketsArray = data;
      console.log('✅ Found tickets as direct array');
    } else if (data.data && Array.isArray(data.data.tickets)) {
      ticketsArray = data.data.tickets;
      console.log('✅ Found tickets in data.data.tickets');
    } else if (data.tickets && Array.isArray(data.tickets)) {
      ticketsArray = data.tickets;
      console.log('✅ Found tickets in data.tickets');
    } else if (data.data && Array.isArray(data.data)) {
      ticketsArray = data.data;
      console.log('✅ Found tickets in data.data');
    } else if (data.results && Array.isArray(data.results)) {
      ticketsArray = data.results;
      console.log('✅ Found tickets in data.results');
    } else {
      console.log('❌ No tickets array found in response');
      console.log('Available keys:', Object.keys(data));
    }

    // Transform API tickets to match UI format
    const transformedTickets = ticketsArray.map(transformTicketData);
    
    console.log('🔍 SUPPORT TICKETS DEBUG:', {
      '📡 Raw Response': data,
      '🔍 Response Type': typeof data,
      '📊 Is Object': typeof data === 'object',
      '🔢 Response Keys': Object.keys(data || {}),
      '📝 Tickets Array': ticketsArray,
      '📏 Tickets Length': ticketsArray.length,
      '🔍 First Ticket': ticketsArray[0] || 'No tickets',
      '⚙️ Transformed Tickets': transformedTickets,
      '📊 Filter Applied': filter
    });
    
    return transformedTickets;
  } catch (error) {
    console.error('❌ FETCH SUPPORT TICKETS ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    // Return empty array on error to prevent UI breakage
    return [];
  }
};

// Fetch details for a specific ticket
export const fetchTicketDetails = async (ticketId) => {
  try {
    console.log('🚀 FETCH TICKET DETAILS REQUEST:', {
      '🔗 API': `${API_BASE_URL}/admin-support-ticket-details`,
      '🆔 Ticket ID': ticketId,
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await authenticatedFetch(`${API_BASE_URL}/admin-support-ticket-details?ticket_id=${ticketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 FETCH TICKET DETAILS HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 RAW TICKET DETAILS RESPONSE:', JSON.stringify(data, null, 2));
    console.log('🔍 RESPONSE STRUCTURE ANALYSIS:', {
      '📊 Has Success': !!data.success,
      '📊 Success Value': data.success,
      '📊 Has Data': !!data.data,
      '📊 Data Keys': data.data ? Object.keys(data.data) : 'No data',
      '📊 Has Ticket': !!(data.data && data.data.ticket),
      '📊 Ticket Keys': data.data && data.data.ticket ? Object.keys(data.data.ticket) : 'No ticket',
      '📊 Has Conversation': !!(data.data && data.data.ticket && data.data.ticket.conversation),
      '📊 Conversation Length': data.data && data.data.ticket && data.data.ticket.conversation ? data.data.ticket.conversation.length : 0
    });
    
    // TEMPORARY: Let's see the EXACT structure
    console.log('🚨 DEBUGGING - FULL RESPONSE:', data);
    console.log('🚨 DEBUGGING - DATA OBJECT:', data.data);
    if (data.data) {
      console.log('🚨 DEBUGGING - DATA KEYS:', Object.keys(data.data));
      if (data.data.ticket) {
        console.log('🚨 DEBUGGING - TICKET OBJECT:', data.data.ticket);
        console.log('🚨 DEBUGGING - TICKET KEYS:', Object.keys(data.data.ticket));
      }
    }
    
    // Extract ticket from response - try multiple possible structures
    let ticketData = null;
    
    if (data.success && data.data && data.data.ticket) {
      ticketData = data.data.ticket;
      
      // IMPORTANT: Messages are at data.messages, not inside ticket object
      if (data.data.messages && Array.isArray(data.data.messages)) {
        ticketData.messages = data.data.messages;
        console.log('✅ MESSAGES ATTACHED FROM data.messages:', data.data.messages.length, 'messages');
      }
      
      console.log('✅ TICKET DETAILS EXTRACTED SUCCESSFULLY:', {
        '📊 Ticket Data': ticketData,
        '🔍 Ticket ID': ticketData.id,
        '📝 Ticket Title': ticketData.title || ticketData.subject,
        '👤 Requester': ticketData.requester || ticketData.user?.name,
        '📊 Status': ticketData.status,
        '💬 Messages Length': ticketData.messages ? ticketData.messages.length : 0,
        '💬 Messages': ticketData.messages
      });
    } else if (data.data && data.data.id) {
      // Direct ticket data structure
      ticketData = data.data;
      console.log('✅ TICKET DETAILS EXTRACTED (DIRECT STRUCTURE):', {
        '📊 Ticket Data': ticketData,
        '🔍 Ticket ID': ticketData.id,
        '📝 Ticket Title': ticketData.title,
        '👤 Requester': ticketData.requester,
        '📊 Status': ticketData.status,
        '💬 Conversation Length': ticketData.conversation ? ticketData.conversation.length : 0,
        '💬 Conversation': ticketData.conversation
      });
    } else if (data.id) {
      // Ticket data at root level
      ticketData = data;
      console.log('✅ TICKET DETAILS EXTRACTED (ROOT LEVEL):', {
        '📊 Ticket Data': ticketData,
        '🔍 Ticket ID': ticketData.id,
        '📝 Ticket Title': ticketData.title,
        '👤 Requester': ticketData.requester,
        '📊 Status': ticketData.status,
        '💬 Conversation Length': ticketData.conversation ? ticketData.conversation.length : 0,
        '💬 Conversation': ticketData.conversation
      });
    }
    
    if (ticketData) {
      return transformTicketData(ticketData);
    }
    
    console.log('❌ INVALID TICKET DETAILS RESPONSE STRUCTURE:', {
      '📊 Raw Data': data,
      '🔍 Success': data.success,
      '🔍 Has Data': !!data.data,
      '🔍 Has Ticket': !!data.data?.ticket
    });
    
    throw new Error('Invalid response structure');
  } catch (error) {
    console.error('❌ FETCH TICKET DETAILS ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    throw error;
  }
};

// Send a message in a ticket conversation
export const sendMessage = async (ticketId, content, isInternalNote = false) => {
  try {
    console.log('🚀 SEND MESSAGE REQUEST:', {
      '🔗 API': `${API_BASE_URL}/admin-reply-ticket`,
      '🆔 Ticket ID': ticketId,
      '📝 Message Content': content,
      '🔍 Is Internal Note': isInternalNote,
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await authenticatedFetch(`${API_BASE_URL}/admin-reply-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        message: content,
        is_internal_note: isInternalNote
      })
    });

    console.log('📡 SEND MESSAGE HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 SEND MESSAGE RESPONSE:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ SEND MESSAGE ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    throw error;
  }
};

// Mark a ticket as resolved
export const markAsResolved = async (ticketId, priority) => {
  try {
    console.log('🚀 MARK AS RESOLVED REQUEST:', {
      '🔗 API': `${API_BASE_URL}/admin-update-ticket-status`,
      '🆔 Ticket ID': ticketId,
      '📊 Status': 'resolved',
      '📊 Priority': priority,
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await authenticatedFetch(`${API_BASE_URL}/admin-update-ticket-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        status: 'resolved',
        priority: priority
      })
    });

    console.log('📡 MARK AS RESOLVED HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 MARK AS RESOLVED RESPONSE:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ MARK AS RESOLVED ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    throw error;
  }
};

// Mark a ticket as pending
export const markAsPending = async (ticketId, priority) => {
  try {
    console.log('🚀 MARK AS PENDING REQUEST:', {
      '🔗 API': `${API_BASE_URL}/admin-update-ticket-status`,
      '🆔 Ticket ID': ticketId,
      '📊 Status': 'pending',
      '📊 Priority': priority,
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await authenticatedFetch(`${API_BASE_URL}/admin-update-ticket-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        status: 'pending',
        priority: priority
      })
    });

    console.log('📡 MARK AS PENDING HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 MARK AS PENDING RESPONSE:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ MARK AS PENDING ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    throw error;
  }
};

// Transform ticket data from API format to UI format
export const transformTicketData = (apiTicket) => {
  // Handle different conversation field names
  let conversation = [];
  if (apiTicket.conversation && Array.isArray(apiTicket.conversation)) {
    conversation = apiTicket.conversation;
  } else if (apiTicket.messages && Array.isArray(apiTicket.messages)) {
    conversation = apiTicket.messages;
  } else if (apiTicket.chat_history && Array.isArray(apiTicket.chat_history)) {
    conversation = apiTicket.chat_history;
  } else if (apiTicket.replies && Array.isArray(apiTicket.replies)) {
    conversation = apiTicket.replies;
  }
  
  console.log('🔄 TRANSFORMING TICKET DATA:', {
    '📊 Original Ticket': apiTicket,
    '💬 Conversation Field': conversation,
    '💬 Conversation Length': conversation.length,
    '💬 First Message': conversation[0] || 'No messages'
  });

  // Log if conversation is empty
  if (conversation.length === 0) {
    console.log('⚠️ EMPTY CONVERSATION - No messages found in API response');
    console.log('📊 Available fields in apiTicket:', Object.keys(apiTicket));
  }

  // Transform messages from API format to UI format
  // API format: { sender_type: "user"/"admin", sender_name: "...", message: "...", created_at: "..." }
  // UI format: { sender: "user"/"admin", senderName: "...", message: "...", timestamp: number }
  conversation = conversation.map((msg, index) => {
    console.log('🔄 TRANSFORMING MESSAGE:', {
      '📊 Original Message': msg,
      '🔍 Sender Type': msg.sender_type,
      '🔍 Sender Name': msg.sender_name,
      '🔍 Message Content': msg.message,
      '🔍 Created At': msg.created_at
    });

    const senderType = msg.sender_type || msg.sender || 'user';
    const derivedSenderName = msg.sender_name
      || msg.senderName
      || (senderType === 'user' ? (apiTicket.user?.name || apiTicket.requester || 'User') : 'Admin User');

    const transformedMsg = {
      id: msg.id || index + 1,
      sender: senderType,
      senderName: derivedSenderName,
      message: msg.message || '',
      timestamp: msg.created_at ? new Date(msg.created_at).getTime() : (msg.timestamp || Date.now())
    };

    console.log('✅ TRANSFORMED MESSAGE:', {
      '📊 Transformed Message': transformedMsg,
      '🔍 Final Sender': transformedMsg.sender,
      '🔍 Final Sender Name': transformedMsg.senderName
    });

    return transformedMsg;
  });

  const transformedTicket = {
    id: apiTicket.id || apiTicket.ticket_id || apiTicket.support_id || '',
    title: apiTicket.title || apiTicket.subject || apiTicket.issue_title || 'No Title',
    requester: apiTicket.requester || apiTicket.user?.name || apiTicket.user_name || apiTicket.customer_name || '',
    status: apiTicket.status || 'open',
    priority: apiTicket.priority || 'medium',
    createdAt: apiTicket.created_at || apiTicket.createdAt || apiTicket.date || null,
    date: apiTicket.created_at ? new Date(apiTicket.created_at).toLocaleDateString() : 
          apiTicket.date || new Date().toLocaleDateString(),
    timestamp: apiTicket.created_at ? new Date(apiTicket.created_at).getTime() : 
               apiTicket.timestamp || Date.now(),
    assignedAgent: apiTicket.assigned_agent || apiTicket.agent_name || 'Admin',
    conversation: conversation
  };
  
  console.log('✅ TRANSFORMED TICKET DATA:', {
    '📊 Transformed Ticket': transformedTicket,
    '💬 Final Conversation Length': transformedTicket.conversation.length,
    '💬 Transformed Conversation': transformedTicket.conversation
  });
  
  return transformedTicket;
};

