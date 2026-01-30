
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StorageService } from '../store';
import { translations } from '../translations';
import { User, ChatMessage, LangType } from '../types';

interface DirectMessagesProps {
  currentUser: User;
  lang: LangType;
}

const DirectMessages: React.FC<DirectMessagesProps> = ({ currentUser, lang }) => {
  const t = translations[lang];
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allUsers = useMemo(() => StorageService.getUsers(), []);
  const allCurrentSubjects = useMemo(() => StorageService.getAllAvailableSubjects(), []);
  
  // Contacts relevant to current user with subject search support
  const availableContacts = useMemo(() => {
    let filtered = allUsers.filter(u => u.id !== currentUser.id);
    
    // Students can see teachers and admins
    if (currentUser.role === 'student') {
      filtered = filtered.filter(u => u.role === 'teacher' || u.role === 'admin' || u.role === 'director');
    }
    
    // Enhanced search filter including subjects
    if (searchContact.trim()) {
      const searchTerms = searchContact.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
      
      filtered = filtered.filter(u => {
        const matchesName = u.fullName.toLowerCase().includes(searchContact.toLowerCase());
        const matchesEmail = u.email.toLowerCase().includes(searchContact.toLowerCase());
        
        // Check if any of the teacher's subjects match the search terms
        const matchesSubject = u.subjects?.some(subj => 
          searchTerms.some(term => subj.toLowerCase().includes(term))
        );
        
        return matchesName || matchesEmail || matchesSubject;
      });
    }
    
    return filtered;
  }, [allUsers, currentUser, searchContact]);

  const subjectSuggestions = useMemo(() => {
    if (!searchContact.trim()) return [];
    const lastTerm = searchContact.split(',').pop()?.trim().toLowerCase() || '';
    if (!lastTerm) return [];
    return allCurrentSubjects.filter(s => s.toLowerCase().includes(lastTerm)).slice(0, 5);
  }, [searchContact, allCurrentSubjects]);

  useEffect(() => {
    if (selectedContact) {
      const chatHistory = StorageService.getDirectMessages(currentUser.id, selectedContact.id);
      setMessages(chatHistory);
    }
  }, [selectedContact, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !messageText.trim()) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      receiverId: selectedContact.id,
      text: messageText,
      timestamp: Date.now(),
      read: false
    };

    StorageService.sendDirectMessage(newMessage);
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
  };

  const addSuggestion = (suggestion: string) => {
    const terms = searchContact.split(',').map(t => t.trim());
    terms.pop();
    terms.push(suggestion);
    setSearchContact(terms.join(', ') + ', ');
    setShowSuggestions(false);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] glass-card rounded-[3rem] shadow-2xl border border-muted/10 overflow-hidden animate-in fade-in duration-500">
      {/* Contact List */}
      <div className="w-1/3 border-r border-muted/10 flex flex-col bg-surface/30 backdrop-blur-xl">
        <div className="p-6 border-b border-muted/10">
          <h3 className="text-lg font-black text-textMain uppercase tracking-widest mb-4">{t.contacts}</h3>
          <div className="relative">
            <span className="absolute left-4 top-4 text-muted opacity-50">🔍</span>
            <input 
              value={searchContact}
              onChange={(e) => {
                setSearchContact(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={lang === 'en' ? 'Search name or subject...' : 'Поиск по имени или предмету...'}
              className="w-full bg-primary/5 border border-muted/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-textMain outline-none focus:border-accent transition-all font-black placeholder:text-textMain/40"
            />
            {showSuggestions && subjectSuggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-surface border border-muted/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {subjectSuggestions.map(s => (
                  <button 
                    key={s} 
                    onClick={() => addSuggestion(s)}
                    className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-textMain hover:bg-accent hover:text-white transition-colors border-b border-muted/5 last:border-0"
                  >
                    💡 {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {availableContacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`w-full flex items-center p-6 hover:bg-primary/5 transition-all border-b border-muted/5 ${selectedContact?.id === contact.id ? 'bg-accent/10 border-l-4 border-l-accent' : ''}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-xl mr-4 shadow-lg group-hover:scale-110 transition-transform">
                {contact.fullName.charAt(0)}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-black text-textMain text-sm truncate tracking-tight">{contact.fullName}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[8px] text-accent font-black uppercase tracking-widest bg-accent/5 px-2 py-0.5 rounded-full">{t[contact.role]}</span>
                  {contact.subjects?.slice(0, 2).map(subj => (
                    <span key={subj} className="text-[8px] text-primary font-bold bg-primary/5 px-2 py-0.5 rounded-full truncate max-w-[80px]">{subj}</span>
                  ))}
                  {contact.subjects && contact.subjects.length > 2 && <span className="text-[8px] text-muted font-bold">+{contact.subjects.length - 2}</span>}
                </div>
              </div>
            </button>
          ))}
          {availableContacts.length === 0 && (
            <div className="p-12 text-center text-muted font-black uppercase tracking-[0.2em] text-[10px] opacity-40">{t.no_data}</div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-surface/10">
        {selectedContact ? (
          <>
            <div className="p-6 bg-surface/40 backdrop-blur-xl border-b border-muted/10 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-xl mr-4 shadow-xl">
                  {selectedContact.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-textMain text-md tracking-tight leading-none mb-1">{selectedContact.fullName}</h4>
                  <div className="flex flex-wrap gap-2">
                    <p className="text-[9px] text-accent font-black uppercase tracking-[0.2em]">{t[selectedContact.role]}</p>
                    {selectedContact.subjects?.map(s => (
                      <span key={s} className="text-[9px] text-primary font-bold opacity-60 tracking-tight">• {s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] px-6 py-4 rounded-[2rem] shadow-xl ${
                    msg.senderId === currentUser.id 
                      ? 'bg-accent text-white rounded-tr-none' 
                      : 'bg-surface text-textMain rounded-tl-none border border-muted/10'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                    <p className={`text-[9px] mt-2 text-right font-black uppercase tracking-widest ${msg.senderId === currentUser.id ? 'text-white/40' : 'text-muted/40'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-surface/40 backdrop-blur-xl border-t border-muted/10 flex space-x-4">
              <input 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t.type_message}
                className="flex-1 bg-surface border border-muted/10 rounded-2xl px-6 py-4 text-sm text-textMain outline-none focus:border-accent transition-all font-black placeholder:text-textMain/40"
              />
              <button 
                type="submit" 
                disabled={!messageText.trim()}
                className="bg-accent text-white p-4 rounded-2xl hover:brightness-110 disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-xl shadow-accent/20 active:scale-95 neo-button"
              >
                <svg className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
            <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-5xl mb-6 grayscale">
              ✉️
            </div>
            <h4 className="text-xl font-black text-textMain mb-2 uppercase tracking-tighter">{t.select_contact}</h4>
            <p className="text-muted font-bold text-xs max-w-xs uppercase tracking-widest leading-relaxed">{t.chat_placeholder}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
