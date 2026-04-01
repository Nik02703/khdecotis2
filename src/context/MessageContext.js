'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const stored = localStorage.getItem('khd_messages');
    if (stored) setMessages(JSON.parse(stored));

    fetch('/api/messages')
      .then(res => res.json())
      .then(data => {
        if(data && Array.isArray(data) && !data[0]?.error) {
          setMessages(data);
          localStorage.setItem('khd_messages', JSON.stringify(data));
        }
      })
      .catch(err => console.warn('Failed to load global messages', err));
  }, []);

  const addMessage = (msgParams) => {
    const newMessage = {
      ...msgParams,
      id: `msg_${Date.now()}`,
      date: new Date().toISOString(),
      status: 'unread'
    };
    
    setMessages(prev => {
      const updated = [newMessage, ...prev];
      localStorage.setItem('khd_messages', JSON.stringify(updated));
      return updated;
    });

    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMessage)
    }).catch(e => console.error("Global message push failed", e));

    return newMessage;
  };

  const markAsRead = (id) => {
    setMessages(prev => {
      const updated = prev.map(msg => msg.id === id ? { ...msg, status: 'read' } : msg);
      localStorage.setItem('khd_messages', JSON.stringify(updated));
      return updated;
    });

    fetch(`/api/messages?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'read' })
    }).catch(e => console.error("Message sync error:", e));
  };

  const deleteMessage = (id) => {
    setMessages(prev => {
      const updated = prev.filter(msg => msg.id !== id);
      localStorage.setItem('khd_messages', JSON.stringify(updated));
      return updated;
    });

    fetch(`/api/messages?id=${id}`, { method: 'DELETE' })
      .catch(e => console.error("Global deletion failure", e));
  };

  return (
    <MessageContext.Provider value={{ messages, isMounted, addMessage, markAsRead, deleteMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) throw new Error("useMessages must be used within MessageProvider");
  return context;
};
