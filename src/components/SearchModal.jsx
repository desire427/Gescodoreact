import { useState, useEffect, useRef } from 'react';
import { X, Search, MessageCircle, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { messagingApi } from '../services/api';
import { format } from 'date-fns';

export default function SearchModal() {
  const {
    currentUser, contacts, conversations, setShowSearch, openConversation, createConversation,
  } = useApp();
  const [query, setQuery] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [attachmentsOnly, setAttachmentsOnly] = useState(false);
  const [matchedMessages, setMatchedMessages] = useState([]);
  const { setMessagingError } = useApp();
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

  useEffect(() => {
    const hasFilters = authorId || dateFrom || dateTo || attachmentsOnly;
    if (query.trim().length < 2 && !hasFilters) {
      setMatchedMessages([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      messagingApi.searchMessages({
        q: query.trim(),
        ...(authorId ? { sender: authorId } : {}),
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
        ...(attachmentsOnly ? { attachment: true } : {}),
      })
        .then(({ data }) => {
          if (!cancelled) setMatchedMessages(data.results);
        })
        .catch(error => {
          if (!cancelled) setMessagingError(error?.response?.data?.detail || error.message);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, authorId, dateFrom, dateTo, attachmentsOnly, setMessagingError]);

  const handleSelectContact = (contact) => {
    createConversation(contact.id);
    setShowSearch(false);
  };

  const handleSelectMessage = (msg) => {
    openConversation(msg.conversationId);
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
              placeholder="Rechercher dans la messagerie"
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 18px 12px' }}>
          <select aria-label="Filtrer par auteur" value={authorId} onChange={event => setAuthorId(event.target.value)} style={filterStyle}>
            <option value="">Tous les auteurs</option>
            {currentUser?.id != null && <option value={currentUser.id}>Moi</option>}
            {contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
          </select>
          <label style={dateFilterStyle}>Du <input type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} /></label>
          <label style={dateFilterStyle}>Au <input type="date" value={dateTo} onChange={event => setDateTo(event.target.value)} /></label>
          <label style={dateFilterStyle}>
            <input type="checkbox" checked={attachmentsOnly} onChange={event => setAttachmentsOnly(event.target.checked)} />
            Pièces jointes
          </label>
        </div>

        <div className="search-results">
          {!query.trim() && !authorId && !dateFrom && !dateTo && !attachmentsOnly && (
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
                const conv = conversations.find((c) => String(c.id) === String(m.conversationId));
                const contact = conv ? getContact(conv.contactId) : null;
                const highlighted = query.trim()
                  ? highlightQuery(m.text || m.attachment_name || '', query)
                  : (m.text || m.attachment_name || 'Pièce jointe');
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
                      <span className="search-result-preview">{highlighted}</span>
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
          {(query.trim() || authorId || dateFrom || dateTo || attachmentsOnly) &&
            matchedContacts.length === 0 &&
            matchedMessages.length === 0 && (
              <div className="search-no-results">
                <p>{query.trim() ? `Aucun résultat pour « ${query} »` : 'Aucun message ne correspond à ces filtres.'}</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

const filterStyle = { padding: '7px 9px', border: '1px solid #cbd5e1', borderRadius: 7, background: 'var(--wa-panel, #fff)' };
const dateFilterStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 };

function highlightQuery(text, query) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.split(new RegExp(`(${escaped})`, 'gi')).map((part, index) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={index}>{part}</mark>
      : part
  );
}
