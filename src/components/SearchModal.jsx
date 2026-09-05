import { useState, useEffect, useRef } from 'react';
import { X, Search, MessageCircle, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';

export default function SearchModal() {
  const { contacts, conversations, messages, setShowSearch, openConversation, createConversation } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getContact = (id) => contacts.find((c) => c.id === id);

  // Recherche dans les contacts
  const matchedContacts = query.trim()
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          (c.phone || '').includes(query)
      )
    : [];

  // Recherche dans les messages
  const matchedMessages = query.trim()
    ? Object.entries(messages).flatMap(([convId, msgs]) =>
        msgs
          .filter(
            (m) =>
              m.type === 'text' &&
              m.text.toLowerCase().includes(query.toLowerCase())
          )
          .map((m) => ({ ...m, convId }))
      )
    : [];

  const handleSelectContact = (contact) => {
    createConversation(contact.id);
    setShowSearch(false);
  };

  const handleSelectMessage = (msg) => {
    openConversation(msg.convId);
    setShowSearch(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setShowSearch(false)}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <button className="icon-btn" onClick={() => setShowSearch(false)}>
            <X size={20} />
          </button>
          <div className="search-modal-input-wrap">
            <Search size={16} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher dans WhatsApp"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-modal-input"
            />
            {query && (
              <button className="icon-btn" onClick={() => setQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="search-results">
          {!query.trim() && (
            <div className="search-placeholder">
              <Search size={48} className="search-placeholder-icon" />
              <p>Rechercher des messages, contacts et plus</p>
            </div>
          )}

          {/* Contacts */}
          {matchedContacts.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">
                <User size={14} /> Contacts
              </div>
              {matchedContacts.map((c) => (
                <button
                  key={c.id}
                  className="search-result-item"
                  onClick={() => handleSelectContact(c)}
                >
                  <img
                    src={c.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`}
                    alt={c.name}
                    className="avatar avatar-sm"
                  />
                  <div className="search-result-body">
                    <span className="search-result-name">{c.name}</span>
                    <span className="search-result-sub">{c.phone}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {matchedMessages.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">
                <MessageCircle size={14} /> Messages
              </div>
              {matchedMessages.slice(0, 20).map((m) => {
                const conv = conversations.find((c) => c.id === m.convId);
                const contact = conv ? getContact(conv.contactId) : null;
                const highlighted = m.text.replace(
                  new RegExp(`(${query})`, 'gi'),
                  '<mark>$1</mark>'
                );
                return (
                  <button
                    key={m.id}
                    className="search-result-item"
                    onClick={() => handleSelectMessage(m)}
                  >
                    <img
                      src={
                        contact?.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact?.name || '?')}`
                      }
                      alt={contact?.name}
                      className="avatar avatar-sm"
                    />
                    <div className="search-result-body">
                      <span className="search-result-name">{contact?.name || 'Inconnu'}</span>
                      <span
                        className="search-result-preview"
                        dangerouslySetInnerHTML={{ __html: highlighted }}
                      />
                    </div>
                    <span className="search-result-time">
                      {format(new Date(m.time), 'HH:mm')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Aucun résultat */}
          {query.trim() &&
            matchedContacts.length === 0 &&
            matchedMessages.length === 0 && (
              <div className="search-no-results">
                <p>Aucun résultat pour « {query} »</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
