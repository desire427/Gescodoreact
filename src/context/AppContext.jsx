import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  currentUser as initialCurrentUser,
  contacts as initialContacts,
  initialMessages,
  initialConversations,
  initialStatuses,
  initialCalls,
  meetings as initialMeetings,
} from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ─── Données ────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('wa_profile');
      return saved ? { ...initialCurrentUser, ...JSON.parse(saved) } : initialCurrentUser;
    } catch { return initialCurrentUser; }
  });
  const [contacts, setContacts] = useState(initialContacts);
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState(initialMessages);
  const [statuses, setStatuses] = useState(initialStatuses);
  const [calls, setCalls] = useState(initialCalls);
  const [starredMessages, setStarredMessages] = useState([]);
  const [blockedContacts, setBlockedContacts] = useState([]);

  // ─── Réunions ────────────────────────────────────────────────────────────────
  const [meetings, setMeetings] = useState(initialMeetings);
  // Messages par réunion (fil de discussion interne)
  const [meetingMessages, setMeetingMessages] = useState(
    () => Object.fromEntries(initialMeetings.map(m => [m.id, []]))
  );
  // Réunion active (vue MeetingRoom)
  const [activeMeetingId, setActiveMeetingId] = useState(null);

  // ─── Navigation ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('chats');
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showArchivedChats, setShowArchivedChats] = useState(false);
  const [showStatusViewer, setShowStatusViewer] = useState(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showStarredMessages, setShowStarredMessages] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // message en cours de réponse

  // ─── Thème (persisté) ───────────────────────────────────────────────────────
  const [darkMode, setDarkModeRaw] = useLocalStorage('wa_dark', false);
  const setDarkMode = (v) => setDarkModeRaw(v);

  // ─── Paramètres globaux (persistés) ─────────────────────────────────────────
  const [appSettings, setAppSettings] = useLocalStorage('wa_settings', {
    notifications: {
      msg_notif: true, msg_sound: true, msg_vibrate: false, msg_preview: true,
      group_notif: true, group_sound: true, group_vibrate: false,
      call_notif: true, call_ringtone: true, call_vibrate: true,
    },
    privacy: {
      lastSeen: 'Mes contacts', profilePhoto: 'Mes contacts',
      about: 'Mes contacts', groups: 'Mes contacts', status: 'Mes contacts',
      readReceipts: true, onlineStatus: true,
    },
    chat: {
      fontSize: 'Moyen', enterToSend: true, mediaAutoDownload: true,
    },
    language: 'Français',
  });

  const updateAppSettings = useCallback((section, updates) => {
    setAppSettings((prev) => ({
      ...prev,
      [section]: typeof updates === 'function'
        ? updates(prev[section])
        : { ...prev[section], ...updates },
    }));
  }, [setAppSettings]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getContact = useCallback(
    (contactId) => contacts.find((c) => c.id === contactId),
    [contacts]
  );
  const getConversation = useCallback(
    (convId) => conversations.find((c) => c.id === convId),
    [conversations]
  );
  const getMessages = useCallback(
    (convId) => messages[convId] || [],
    [messages]
  );

  // ─── Messages ───────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (convId, text, type = 'text', replyTo = null) => {
      if (!text.trim() && type === 'text') return;
      const newMsg = {
        id: `m${Date.now()}`,
        senderId: 'me',
        text,
        time: new Date(),
        status: 'sent',
        type,
        replyTo: replyTo || null,
        starred: false,
      };
      setMessages((prev) => ({
        ...prev,
        [convId]: [...(prev[convId] || []), newMsg],
      }));
      setConversations((prev) =>
        prev.map((c) => c.id === convId ? { ...c, lastMessage: newMsg, unread: 0 } : c)
      );
      // Réponse simulée
      const contact = getContact(conversations.find((c) => c.id === convId)?.contactId);
      if (contact && !contact.isGroup) {
        const responses = ['😊', 'Ah oui !', 'Je vois 👍', "D'accord !", 'C\'est noté 📝', 'Merci !', '👌', 'Super 🎉'];
        setTimeout(() => {
          const replyMsg = {
            id: `m${Date.now()}`,
            senderId: contact.id,
            text: responses[Math.floor(Math.random() * responses.length)],
            time: new Date(),
            status: 'delivered',
            type: 'text',
            starred: false,
          };
          setMessages((prev) => ({
            ...prev,
            [convId]: [...(prev[convId] || []), replyMsg],
          }));
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? { ...c, lastMessage: replyMsg, unread: c.id !== activeConversationId ? (c.unread || 0) + 1 : 0 }
                : c
            )
          );
        }, 1000 + Math.random() * 2000);
      }
    },
    [conversations, getContact, activeConversationId]
  );

  const deleteMessage = useCallback((convId, msgId) => {
    setMessages((prev) => ({
      ...prev,
      [convId]: (prev[convId] || []).filter((m) => m.id !== msgId),
    }));
  }, []);

  const toggleStarMessage = useCallback((convId, msgId) => {
    setMessages((prev) => ({
      ...prev,
      [convId]: (prev[convId] || []).map((m) =>
        m.id === msgId ? { ...m, starred: !m.starred } : m
      ),
    }));
    setStarredMessages((prev) => {
      const exists = prev.find((s) => s.msgId === msgId);
      if (exists) return prev.filter((s) => s.msgId !== msgId);
      return [...prev, { convId, msgId }];
    });
  }, []);

  // ─── Conversations ──────────────────────────────────────────────────────────
  const openConversation = useCallback((convId) => {
    setActiveConversationId(convId);
    setShowContactInfo(false);
    setReplyingTo(null);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread: 0 } : c))
    );
    setMessages((prev) => ({
      ...prev,
      [convId]: (prev[convId] || []).map((m) =>
        m.senderId !== 'me' && m.status !== 'read' ? { ...m, status: 'read' } : m
      ),
    }));
  }, []);

  const createConversation = useCallback(
    (contactId) => {
      const existing = conversations.find((c) => c.contactId === contactId);
      if (existing) { openConversation(existing.id); return; }
      const newConv = { id: contactId, contactId, unread: 0, pinned: false, muted: false, archived: false, lastMessage: null };
      setConversations((prev) => [newConv, ...prev]);
      setMessages((prev) => ({ ...prev, [contactId]: [] }));
      openConversation(contactId);
    },
    [conversations, openConversation]
  );

  const togglePin = useCallback((convId) => {
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, pinned: !c.pinned } : c));
  }, []);

  const toggleMute = useCallback((convId) => {
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, muted: !c.muted } : c));
  }, []);

  const archiveConversation = useCallback((convId) => {
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, archived: !c.archived } : c));
    setActiveConversationId(null);
  }, []);

  const deleteConversation = useCallback((convId) => {
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    setMessages((prev) => { const n = { ...prev }; delete n[convId]; return n; });
    setActiveConversationId(null);
  }, []);

  // ─── Statuts ────────────────────────────────────────────────────────────────
  const addStatus = useCallback((text, bg) => {
    const newItem = { id: `si${Date.now()}`, type: 'text', content: text, bg, time: new Date(), viewed: false };
    setStatuses((prev) => {
      const my = prev.find((s) => s.userId === 'me');
      if (my) return prev.map((s) => s.userId === 'me' ? { ...s, items: [...s.items, newItem] } : s);
      return [{ id: `s${Date.now()}`, userId: 'me', items: [newItem] }, ...prev];
    });
  }, []);

  const markStatusViewed = useCallback((statusId, itemId) => {
    setStatuses((prev) =>
      prev.map((s) =>
        s.id === statusId
          ? { ...s, items: s.items.map((item) => item.id === itemId ? { ...item, viewed: true } : item) }
          : s
      )
    );
  }, []);

  // ─── Profil ─────────────────────────────────────────────────────────────────
  const updateProfile = useCallback((updates) => {
    setCurrentUser((prev) => {
      const next = { ...prev, ...updates };
      try { localStorage.setItem('wa_profile', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // ─── Groupes ─────────────────────────────────────────────────────────────────
  const createGroup = useCallback((name, memberIds, avatarDataUrl = null) => {
    const groupId = `g${Date.now()}`;
    const newGroup = {
      id: groupId,
      name,
      phone: null,
      avatar: avatarDataUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=128C7E`,
      about: `Groupe · ${memberIds.length + 1} participants`,
      online: false,
      isGroup: true,
      members: [...memberIds, 'me'],
      admins: ['me'],
      createdAt: new Date(),
      createdBy: 'me',
    };
    const newConv = {
      id: groupId,
      contactId: groupId,
      unread: 0,
      pinned: false,
      muted: false,
      archived: false,
      lastMessage: null,
    };
    setContacts((prev) => [...prev, newGroup]);
    setConversations((prev) => [newConv, ...prev]);
    setMessages((prev) => ({ ...prev, [groupId]: [] }));
    openConversation(groupId);
  }, [openConversation]);

  const updateGroup = useCallback((groupId, updates) => {
    setContacts((prev) =>
      prev.map((c) => c.id === groupId ? { ...c, ...updates } : c)
    );
  }, []);

  const addGroupMember = useCallback((groupId, contactId) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === groupId && c.isGroup
          ? { ...c, members: [...(c.members || []), contactId] }
          : c
      )
    );
  }, []);

  const removeGroupMember = useCallback((groupId, contactId) => {
    // Retire le membre de la liste
    setContacts((prev) =>
      prev.map((c) =>
        c.id === groupId && c.isGroup
          ? {
              ...c,
              members: (c.members || []).filter((m) => m !== contactId),
              admins: (c.admins || []).filter((a) => a !== contactId),
            }
          : c
      )
    );
    // Ajoute un message système dans le groupe pour notifier
    const removedContact = contacts.find((c) => c.id === contactId);
    const systemMsg = {
      id: `sys${Date.now()}`,
      senderId: 'system',
      text: `${removedContact?.name || 'Un membre'} a été retiré du groupe.`,
      time: new Date(),
      status: 'read',
      type: 'system',
      starred: false,
    };
    setMessages((prev) => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), systemMsg],
    }));
    setConversations((prev) =>
      prev.map((c) => c.id === groupId ? { ...c, lastMessage: systemMsg } : c)
    );
  }, [contacts]);

  // Quitter un groupe soi-même
  const leaveGroup = useCallback((groupId) => {
    // Message système dans le groupe
    const systemMsg = {
      id: `sys${Date.now()}`,
      senderId: 'system',
      text: 'Vous avez quitté le groupe.',
      time: new Date(),
      status: 'read',
      type: 'system',
      starred: false,
    };
    // Retirer 'me' des membres et admins
    setContacts((prev) =>
      prev.map((c) =>
        c.id === groupId && c.isGroup
          ? {
              ...c,
              members: (c.members || []).filter((m) => m !== 'me'),
              admins: (c.admins || []).filter((a) => a !== 'me'),
            }
          : c
      )
    );
    // Supprimer la conversation et les messages de la vue
    setConversations((prev) => prev.filter((c) => c.id !== groupId));
    setMessages((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    // Fermer si la conv était ouverte
    setActiveConversationId((prev) => (prev === groupId ? null : prev));
    setShowContactInfo(false);
  }, []);

  const promoteToAdmin = useCallback((groupId, contactId) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === groupId && c.isGroup
          ? { ...c, admins: [...new Set([...(c.admins || []), contactId])] }
          : c
      )
    );
  }, []);

  const demoteAdmin = useCallback((groupId, contactId) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === groupId && c.isGroup
          ? { ...c, admins: (c.admins || []).filter((a) => a !== contactId) }
          : c
      )
    );
  }, []);
  // ─── Réactions ──────────────────────────────────────────────────────────────
  const addReaction = useCallback((convId, msgId, emoji) => {
    setMessages((prev) => ({
      ...prev,
      [convId]: (prev[convId] || []).map((m) => {
        if (m.id !== msgId) return m;
        const reactions = { ...(m.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...m, reactions };
      }),
    }));
  }, []);

  // ─── Épinglage message ───────────────────────────────────────────────────────
  const pinMessage = useCallback((convId, msgId) => {
    setMessages((prev) => ({
      ...prev,
      [convId]: (prev[convId] || []).map((m) =>
        m.id === msgId ? { ...m, pinned: !m.pinned } : m
      ),
    }));
  }, []);

  // ─── Brouillons ──────────────────────────────────────────────────────────────
  const [drafts, setDrafts] = useState({});
  const saveDraft = useCallback((convId, text) => {
    setDrafts(prev => text.trim() ? { ...prev, [convId]: text } : (({ [convId]: _, ...rest }) => rest)(prev));
  }, []);
  const getDraft = useCallback((convId) => drafts[convId] || '', [drafts]);

  // ─── Création canal/groupe structuré ─────────────────────────────────────────
  const createChannel = useCallback((name, type, memberIds, options = {}) => {
    // type: 'service' | 'direction' | 'projet' | 'annonce' | 'standard'
    const channelId = `ch${Date.now()}`;
    const newChannel = {
      id: channelId,
      name,
      phone: null,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=128C7E`,
      about: options.about || `${type === 'annonce' ? 'Canal annonce' : 'Groupe'} · ${memberIds.length + 1} participants`,
      online: false,
      isGroup: true,
      channelType: type,          // 'service' | 'direction' | 'projet' | 'annonce' | 'standard'
      announcersOnly: type === 'annonce',  // seuls les admins peuvent écrire
      members: [...memberIds, 'me'],
      admins: ['me'],
      createdAt: new Date(),
      createdBy: 'me',
      ...options,
    };
    const newConv = { id: channelId, contactId: channelId, unread: 0, pinned: false, muted: false, archived: false, lastMessage: null };
    setContacts(prev => [...prev, newChannel]);
    setConversations(prev => [newConv, ...prev]);
    setMessages(prev => ({ ...prev, [channelId]: [] }));
    openConversation(channelId);
  }, [openConversation]);

  // ─── Actions Réunions ────────────────────────────────────────────────────────
  const createMeeting = useCallback((data) => {
    const id = `reu_${Date.now()}`;
    const ref = `REU-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const newMeeting = {
      id, ref,
      status: 'planned',
      pvStatus: null, pvRef: null,
      decisionIds: [], taskIds: [],
      conductLog: [],
      createdAt: new Date(),
      participants: (data.participantIds || []).map(uid => ({ userId: uid, response: 'present', presence: null })),
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
    };
    setMeetings(prev => [newMeeting, ...prev]);
    setMeetingMessages(prev => ({ ...prev, [id]: [] }));
    setActiveMeetingId(id);
    return newMeeting;
  }, []);

  const updateMeeting = useCallback((id, updates) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const getMeeting = useCallback((id) => meetings.find(m => m.id === id), [meetings]);

  const getMeetingMessages = useCallback((id) => meetingMessages[id] || [], [meetingMessages]);

  const sendMeetingMessage = useCallback((meetingId, text, senderId = 'me') => {
    if (!text.trim()) return;
    const msg = {
      id: `mm${Date.now()}`,
      senderId,
      text,
      time: new Date(),
      status: 'sent',
      type: 'text',
      starred: false,
    };
    setMeetingMessages(prev => ({
      ...prev,
      [meetingId]: [...(prev[meetingId] || []), msg],
    }));
    setMeetings(prev => prev.map(m =>
      m.id === meetingId ? { ...m, lastMessage: msg } : m
    ));
  }, []);

  // Transformer une réunion en projet
  const meetingToProject = useCallback((meetingId) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return null;
    // Retourne les données pré-remplies pour créer un projet
    return {
      name: meeting.title,
      description: `Projet issu de la réunion ${meeting.ref} du ${new Date(meeting.scheduledAt).toLocaleDateString('fr-FR')}`,
      companyId: meeting.companyId,
      departmentId: meeting.departmentId,
      members: meeting.participants.map(p => p.userId),
      tags: ['réunion', meeting.type],
      milestones: (meeting.conductLog || [])
        .filter(l => l.type === 'decision')
        .map(d => ({ id: `ms_${Date.now()}_${Math.random()}`, label: d.title, done: false, dueDate: null })),
      fromMeetingId: meetingId,
      fromMeetingRef: meeting.ref,
    };
  }, [meetings]);

  const blockContact = useCallback((contactId) => {
    setBlockedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  }, []);

  const isBlocked = useCallback(
    (contactId) => blockedContacts.includes(contactId),
    [blockedContacts]
  );

  // ─── Appels ─────────────────────────────────────────────────────────────────
  const addCall = useCallback((contactId, callType, type = 'outgoing') => {
    setCalls((prev) => [{
      id: `c${Date.now()}`, contactId, type, callType,
      duration: null, time: new Date(), missed: false,
    }, ...prev]);
  }, []);

  // ─── Tri conversations ───────────────────────────────────────────────────────
  const sortedConversations = [...conversations]
    .filter((c) => showArchivedChats ? c.archived : !c.archived)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.lastMessage?.time || 0) - new Date(a.lastMessage?.time || 0);
    });

  const archivedCount = conversations.filter((c) => c.archived).length;
  const totalUnread = conversations.filter((c) => !c.archived).reduce((acc, c) => acc + (c.unread || 0), 0);

  return (
    <AppContext.Provider value={{
      currentUser, contacts, conversations: sortedConversations,
      allConversations: conversations, messages, statuses, calls,
      archivedCount, totalUnread, starredMessages, blockedContacts,
      activeTab, setActiveTab,
      activeConversationId, setActiveConversationId,
      showContactInfo, setShowContactInfo,
      showSettings, setShowSettings,
      showNewChat, setShowNewChat,
      showNewGroup, setShowNewGroup,
      showSearch, setShowSearch,
      showArchivedChats, setShowArchivedChats,
      showStatusViewer, setShowStatusViewer,
      showProfileEditor, setShowProfileEditor,
      showStarredMessages, setShowStarredMessages,
      replyingTo, setReplyingTo,
      darkMode, setDarkMode,
      appSettings, updateAppSettings,
      getContact, getConversation, getMessages,
      sendMessage, deleteMessage, toggleStarMessage,
      openConversation, createConversation,
      togglePin, toggleMute, archiveConversation, deleteConversation,
      addStatus, markStatusViewed,
      updateProfile,
      createGroup, updateGroup, addGroupMember, removeGroupMember, leaveGroup, promoteToAdmin, demoteAdmin,
      createChannel,
      blockContact, isBlocked,
      addCall,
      addReaction, pinMessage,
      saveDraft, getDraft,
      // Réunions
      meetings, activeMeetingId, setActiveMeetingId,
      createMeeting, updateMeeting, getMeeting,
      getMeetingMessages, sendMeetingMessage, meetingToProject,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
