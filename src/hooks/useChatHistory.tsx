import { useState, useEffect } from 'react';
// import { supabase } from '@/integrations/supabase/client';
// import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Message {
  id: string;
  content: string;
  is_user: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export const useChatHistory = () => {
  // const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);

  // Load all conversations for the user
  const loadConversations = async () => {
    // if (!user) return;
    
    // setLoading(true);
    // try {
    //   const { data, error } = await supabase
    //     .from('conversations')
    //     .select('*')
    //     .eq('user_id', user.id)
    //     .order('updated_at', { ascending: false });

    //   if (error) throw error;
    //   setConversations(data || []);
    // } catch (error) {
    //   console.error('Error loading conversations:', error);
    //   toast.error('Failed to load chat history');
    // } finally {
    //   setLoading(false);
    // }
  };

  // Load messages for a specific conversation
  const loadMessages = async (conversationId: string) => {
    // if (!user) return [];
    
    // try {
    //   const { data, error } = await supabase
    //     .from('messages')
    //     .select('*')
    //     .eq('conversation_id', conversationId)
    //     .order('created_at', { ascending: true });

    //   if (error) throw error;
    //   return data || [];
    // } catch (error) {
    //   console.error('Error loading messages:', error);
    //   toast.error('Failed to load messages');
    //   return [];
    // }
    return [];
  };

  // Create a new conversation
  const createConversation = async (title: string) => {
    // if (!user) return null;
    
    // try {
    //   const { data, error } = await supabase
    //     .from('conversations')
    //     .insert([
    //       {
    //         user_id: user.id,
    //         title: title.slice(0, 50) // Limit title length
    //       }
    //     ])
    //     .select()
    //     .single();

    //   if (error) throw error;
      
    //   const newConversation = data;
    //   setConversations(prev => [newConversation, ...prev]);
    //   setCurrentConversation(newConversation);
    //   return newConversation;
    // } catch (error) {
    //   console.error('Error creating conversation:', error);
    //   toast.error('Failed to create conversation');
    //   return null;
    // }
    return null;
  };

  // Save a message to the current conversation
  const saveMessage = async (content: string, isUser: boolean, conversationId?: string) => {
    // if (!user) return null;
    
    // let targetConversationId = conversationId || currentConversation?.id;
    
    // // If no conversation exists, create one
    // if (!targetConversationId) {
    //   const firstWords = content.split(' ').slice(0, 5).join(' ');
    //   const conversation = await createConversation(firstWords);
    //   if (!conversation) return null;
    //   targetConversationId = conversation.id;
    // }
    
    // try {
    //   const { data, error } = await supabase
    //     .from('messages')
    //     .insert([
    //       {
    //         conversation_id: targetConversationId,
    //         content,
    //         is_user: isUser
    //       }
    //     ])
    //     .select()
    //     .single();

    //   if (error) throw error;

    //   // Update conversation's updated_at timestamp
    //   await supabase
    //     .from('conversations')
    //     .update({ updated_at: new Date().toISOString() })
    //     .eq('id', targetConversationId);

    //   // Refresh conversations list to reflect new timestamp
    //   loadConversations();
      
    //   return data;
    // } catch (error) {
    //   console.error('Error saving message:', error);
    //   toast.error('Failed to save message');
    //   return null;
    // }
    return null;
  };

  // Select a conversation and load its messages
  const selectConversation = async (conversation: Conversation) => {
    // setCurrentConversation(conversation);
    // const messages = await loadMessages(conversation.id);
    // setCurrentConversation(prev => prev ? { ...prev, messages } : null);
  };

  // Delete a conversation
  const deleteConversation = async (conversationId: string) => {
    // if (!user) return;
    
    // try {
    //   const { error } = await supabase
    //     .from('conversations')
    //     .delete()
    //     .eq('id', conversationId)
    //     .eq('user_id', user.id);

    //   if (error) throw error;
      
    //   setConversations(prev => prev.filter(c => c.id !== conversationId));
    //   if (currentConversation?.id === conversationId) {
    //     setCurrentConversation(null);
    //   }
    //   toast.success('Conversation deleted');
    // } catch (error) {
    //   console.error('Error deleting conversation:', error);
    //   toast.error('Failed to delete conversation');
    // }
  };

  // Start a new conversation
  const startNewConversation = () => {
    // setCurrentConversation(null);
  };

  // Load conversations when user changes
  useEffect(() => {
    // if (user) {
    //   loadConversations();
    // } else {
    //   setConversations([]);
    //   setCurrentConversation(null);
    // }
  }, []);

  return {
    conversations,
    currentConversation,
    loading,
    createConversation,
    saveMessage,
    selectConversation,
    deleteConversation,
    startNewConversation,
    loadConversations
  };
};