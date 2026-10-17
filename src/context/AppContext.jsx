import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { BASE_URL, messagingApi, meetingsApi } from '../services/api';

const AppContext = createContext(null);

function errorMessage(error) {
  return error?.response?.data?.detail || error?.message || 'Une erreur de messagerie est survenue.';
}

function playNotificationTone(frequency = 880) {
  if (typeof AudioContext === 'undefined') return;
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.04, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.16);
  oscillator.onended = () => audioContext.close();
}

function groupStatuses(rows) {
  return rows.reduce((groups, item) => {
    const key = String(item.userId);
    let group = groups.find(status => String(status.userId) === key);
    if (!group) {
      group = {
        id: `status-${key}`,
        userId: item.userId,
        userName: item.userName,
        avatar: item.avatar,
        items: [],
      };
      groups.push(group);
    }
    group.items.push({
      id: item.id,
      type: item.type,
      content: item.content,
      bg: item.bg,
      url: item.url,
      time: item.time,
      viewed: item.viewed,
    });
    return groups;
  }, []);
}

function mergeStatus(previous, item) {
  const key = String(item.userId);
  const next = [...previous];
  const index = next.findIndex(group => String(group.userId) === key);
  const statusItem = {
    id: item.id, type: item.type, content: item.content, bg: item.bg,
    url: item.url, time: item.time, viewed: item.viewed,
  };
  if (index === -1) {
    next.push({
      id: `status-${key}`, userId: item.userId, userName: item.userName,
      avatar: item.avatar, items: [statusItem],
    });
  } else {
    next[index] = { ...next[index], items: [...next[index].items, statusItem] };
  }
  return next;
}

function toFormData(data) {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) value.forEach(item => form.append(key, item));
    else form.append(key, value);
  });
  return form;
}

function normalizeConversation(conversation) {
  return {
    ...conversation,
    contactId: conversation.contactId ?? conversation.id,
    avatar: conversation.avatarUrl || conversation.avatar || null,
    isGroup: conversation.isGroup ?? conversation.kind !== 'direct',
    about: conversation.about || '',
    online: false,
    members: conversation.members || [],
    admins: conversation.admins || [],
  };
}

function normalizeMeeting(meeting) {
  return {
    ...meeting,
    companyId: meeting.company ?? null,
    departmentId: meeting.department ?? null,
    projectId: meeting.project ?? null,
    organizerId: meeting.organizer ?? null,
    presidentId: meeting.president ?? null,
    secretaryId: meeting.secretary ?? null,
    pvStatus: meeting.pv_status ?? null,
    pvRef: meeting.pv_ref ?? '',
    scheduledAt: meeting.scheduled_at ? new Date(meeting.scheduled_at) : null,
    createdAt: meeting.created_at ? new Date(meeting.created_at) : null,
    conductLog: meeting.conduct_log || [],
    agenda: (meeting.agenda || []).map(point => ({ ...point, dueDate: point.due_date || null })),
    participants: (meeting.participants || []).map(participant => ({
      ...participant,
      userId: participant.user,
      response: participant.response,
      presence: participant.presence,
    })),
  };
}

export function AppProvider({ children }) {
  const {
    currentUser: authenticatedUser,
    updateAuthenticatedUser,
  } = useAuth();
  // ─── Données ────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(authenticatedUser);
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [statuses, setStatuses] = useState([]);
  const [calls, setCalls] = useState([]);
  const [starredMessages, setStarredMessages] = useState([]);
  const [blockedContacts, setBlockedContacts] = useState([]);
  const [groupInvitations, setGroupInvitations] = useState([]);
  const [messagingError, setMessagingError] = useState('');
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const socketRef = useRef(null);
  const activeConversationRef = useRef(null);
  const conversationsRef = useRef([]);
  const appSettingsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // ─── Réunions ────────────────────────────────────────────────────────────────
  const [meetings, setMeetings] = useState([]);
  // Messages par réunion (fil de discussion interne)
  const [meetingMessages, setMeetingMessages] = useState(
    () => ({})
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
  const [typingUsers, setTypingUsers] = useState({});

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
      wifiAutoDownload: true, mobileAutoDownload: false, reduceDataUsage: false,
    },
    language: 'Français',
  });
  appSettingsRef.current = appSettings;

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    const sizes = { Petit: '12.5px', Moyen: '14.2px', Grand: '17px' };
    document.documentElement.style.setProperty(
      '--chat-font-size',
      sizes[appSettings.chat.fontSize] || sizes.Moyen,
    );
  }, [appSettings.chat.fontSize]);

  useEffect(() => {
    setCurrentUser({
      ...authenticatedUser,
      online: true,
      lastSeen: authenticatedUser.lastLogin || null,
    });
  }, [authenticatedUser]);

  useEffect(() => {
    if (!authenticatedUser?.id) return undefined;
    let cancelled = false;
    const load = async () => {
      const results = await Promise.allSettled([
        messagingApi.contacts(),
        messagingApi.conversations({ archived: 'all' }),
        messagingApi.starredMessages(),
        messagingApi.statuses(),
        messagingApi.calls(),
        messagingApi.preferences(),
        messagingApi.blocked(),
      ]);
      if (cancelled) return;
      const [contactResult, conversationResult, starredResult, statusResult, callResult, preferenceResult, blockedResult] = results;
      const failures = [];
      if (contactResult.status === 'fulfilled') setContacts(contactResult.value.data);
      else failures.push(contactResult.reason);
      if (conversationResult.status === 'fulfilled') {
        setConversations(conversationResult.value.data.map(normalizeConversation));
      }
      else failures.push(conversationResult.reason);
      if (starredResult.status === 'fulfilled') setStarredMessages(starredResult.value.data);
      else failures.push(starredResult.reason);
      if (statusResult.status === 'fulfilled') setStatuses(groupStatuses(statusResult.value.data));
      else failures.push(statusResult.reason);
      if (callResult.status === 'fulfilled') setCalls(callResult.value.data);
      else failures.push(callResult.reason);
      if (preferenceResult.status === 'fulfilled' && preferenceResult.value.data) {
        const preferences = preferenceResult.value.data;
        setAppSettings(previous => ({
          ...previous,
          notifications: { ...previous.notifications, ...preferences.notifications },
          privacy: { ...previous.privacy, ...preferences.privacy },
          chat: { ...previous.chat, ...preferences.chat },
          language: preferences.language || previous.language,
        }));
      } else if (preferenceResult.status === 'rejected') failures.push(preferenceResult.reason);
      if (blockedResult.status === 'fulfilled') setBlockedContacts(blockedResult.value.data);
      else failures.push(blockedResult.reason);
      if (failures.length) {
        setMessagingError(failures.map(errorMessage).join(' '));
      } else {
        setMessagingError('');
      }
    };
    load();
    return () => { cancelled = true; };
  }, [authenticatedUser?.id, setAppSettings]);

  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (!authenticatedUser?.id) return undefined;
    let disposed = false;
    let retryTimer;
    let socket;
    const scheduleReconnect = () => {
      if (disposed || retryTimer) return;
      reconnectAttemptsRef.current += 1;
      const delay = Math.min(1000 * (2 ** Math.min(reconnectAttemptsRef.current, 5)), 30000);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connect();
      }, delay);
    };
    const connect = async () => {
      try {
        const { data } = await messagingApi.websocketTicket();
        if (disposed) return;
        const endpoint = new URL(BASE_URL);
        endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:';
        endpoint.pathname = `${endpoint.pathname.replace(/\/$/, '')}/ws/messaging/`;
        endpoint.search = new URLSearchParams({ ticket: data.ticket }).toString();
        socket = new WebSocket(endpoint);
        socketRef.current = socket;
        socket.onopen = () => {
          reconnectAttemptsRef.current = 0;
        };
        socket.onmessage = ({ data: raw }) => {
          const event = JSON.parse(raw);
          if (event.type === 'typing') {
            const key = String(event.conversation_id);
            setTypingUsers(previous => ({
              ...previous,
              [key]: event.is_typing
                ? [...new Set([...(previous[key] || []), event.user_id])]
                : (previous[key] || []).filter(id => id !== event.user_id),
            }));
          } else if (event.type === 'message.created') {
            const key = String(event.conversation_id);
            const conversation = conversationsRef.current.find(item => String(item.id) === key);
            const isGroup = conversation?.isGroup || ['group', 'channel'].includes(conversation?.kind);
            const settings = appSettingsRef.current;
            const notifications = settings.notifications;
            const shouldNotify = isGroup ? notifications.group_notif : notifications.msg_notif;
            if (shouldNotify && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
              const title = isGroup ? conversation?.name || 'Nouveau message de groupe' : event.message.senderName;
              const notification = new Notification(title || 'Nouveau message', {
                body: notifications.msg_preview ? event.message.text || 'Média reçu' : 'Vous avez reçu un nouveau message.',
                tag: `kab-message-${key}`,
              });
              notification.onclick = () => {
                window.focus();
                setActiveConversationId(event.conversation_id);
                notification.close();
              };
              const soundEnabled = isGroup ? notifications.group_sound : notifications.msg_sound;
              const vibrateEnabled = isGroup ? notifications.group_vibrate : notifications.msg_vibrate;
              if (vibrateEnabled && navigator.vibrate) navigator.vibrate([120, 60, 120]);
              if (soundEnabled && typeof AudioContext !== 'undefined') {
                try {
                  playNotificationTone();
                } catch (error) {
                  setMessagingError(errorMessage(error));
                }
              }
            }
            setMessages(previous => {
              const existing = previous[key] || [];
              if (existing.some(message => message.id === event.message.id)) return previous;
              return { ...previous, [key]: [...existing, event.message] };
            });
            setConversations(previous => previous.map(conversation =>
              String(conversation.id) === key
                ? {
                    ...conversation,
                    lastMessage: event.message,
                    unread: String(activeConversationRef.current) === key
                      ? 0 : (conversation.unread || 0) + 1,
                  }
                : conversation
            ));
            if (String(activeConversationRef.current) === key && settings.privacy.readReceipts) {
              messagingApi.messageAction(event.message.id, 'read').catch(error => {
                setMessagingError(errorMessage(error));
              });
            }
          } else if (event.type === 'message.deleted') {
            const key = String(event.conversation_id);
            setMessages(previous => ({
              ...previous,
              [key]: (previous[key] || []).filter(message => message.id !== event.message_id),
            }));
          } else if (event.type === 'message.updated') {
            const key = String(event.conversation_id);
            setMessages(previous => ({
              ...previous,
              [key]: (previous[key] || []).map(message =>
                message.id === event.message_id
                  ? { ...message, pinned: event.pinned }
                  : event.message?.id === message.id ? event.message : message
              ),
            }));
          } else if (event.type === 'receipts.updated') {
            const key = String(event.conversation_id);
            const statuses = new Map(event.messages.map(item => [item.message_id, item.status]));
            setMessages(previous => ({
              ...previous,
              [key]: (previous[key] || []).map(message =>
                statuses.has(message.id) ? { ...message, status: statuses.get(message.id) } : message
              ),
            }));
            setConversations(previous => previous.map(conversation =>
              String(conversation.id) === key && statuses.has(conversation.lastMessage?.id)
                ? {
                    ...conversation,
                    lastMessage: {
                      ...conversation.lastMessage,
                      status: statuses.get(conversation.lastMessage.id),
                    },
                  }
                : conversation
            ));
          } else if (event.type === 'status.created') {
            setStatuses(previous => mergeStatus(previous, event.status));
          } else if (event.type === 'group.invitation') {
            setGroupInvitations(previous => previous.some(item => item.id === event.invitation.id)
              ? previous
              : [event.invitation, ...previous]);
          } else if (event.type === 'group.member_joined') {
            const key = String(event.conversation_id);
            setConversations(previous => previous.map(conversation => String(conversation.id) === key
              ? { ...conversation, members: [...new Set([...(conversation.members || []), event.user_id])] }
              : conversation));
          } else if (event.type === 'call.incoming') {
            setIncomingCall({ ...event.call, caller: event.caller });
            setCalls(previous => [event.call, ...previous]);
            const notifications = appSettingsRef.current.notifications;
            if (notifications.call_notif && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification('Appel entrant', {
                body: `Appel de ${event.caller?.name || 'un collaborateur'}`,
                tag: `kab-call-${event.call.id}`,
              });
              notification.onclick = () => {
                window.focus();
                notification.close();
              };
              if (notifications.call_vibrate && navigator.vibrate) navigator.vibrate([250, 100, 250]);
              if (notifications.call_ringtone) {
                try {
                  playNotificationTone(660);
                } catch (error) {
                  setMessagingError(errorMessage(error));
                }
              }
            }
          }
        };
        socket.onclose = () => {
          scheduleReconnect();
        };
        socket.onerror = () => socket.close();
      } catch (error) {
        if (!disposed) {
          setMessagingError(errorMessage(error));
          scheduleReconnect();
        }
      }
    };
    connect();
    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      socket?.close();
      socketRef.current = null;
    };
  }, [authenticatedUser?.id]);

  useEffect(() => {
    if (!authenticatedUser?.id) {
      setMeetings([]);
      return undefined;
    }
    let cancelled = false;
    meetingsApi.list({ page_size: 200 })
      .then(({ data }) => {
        if (cancelled) return;
        const rows = Array.isArray(data) ? data : data?.results || [];
        setMeetings(rows.map(normalizeMeeting));
      })
      .catch(error => {
        if (!cancelled) setMessagingError(errorMessage(error));
      });
    return () => { cancelled = true; };
  }, [authenticatedUser?.id]);

  const updateAppSettings = useCallback((section, updates) => {
    const patch = typeof updates === 'function' ? updates(appSettings[section]) : updates;
    const nextValue = patch && typeof patch === 'object' && !Array.isArray(patch)
      ? { ...appSettings[section], ...patch }
      : patch;
    setAppSettings((prev) => ({
      ...prev,
      [section]: nextValue,
    }));
    appSettingsRef.current = { ...appSettingsRef.current, [section]: nextValue };
    messagingApi.updatePreferences({ [section]: nextValue })
      .catch(error => setMessagingError(errorMessage(error)));
  }, [appSettings, setAppSettings]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getContact = useCallback(
    (contactId) => {
      const person = contacts.find(c => String(c.id) === String(contactId));
      if (person) return person;
      const group = conversations.find(c =>
        String(c.id) === String(contactId) && c.isGroup
      );
      return group ? {
        id: group.id,
        name: group.name,
        about: group.about,
        avatar: group.avatar,
        isGroup: true,
        members: group.members || [],
        admins: group.admins || [],
        channelType: group.channelType,
        announcersOnly: group.channelType === 'annonce',
      } : undefined;
    },
    [contacts, conversations]
  );
  const getConversation = useCallback(
    (convId) => conversations.find(c => String(c.id) === String(convId)),
    [conversations]
  );
  const getMessages = useCallback(
    (convId) => messages[convId] || [],
    [messages]
  );

  // ─── Messages ───────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (convId, text, type = 'text', replyTo = null, attachment = null) => {
      if (!text.trim() && type === 'text') return;
      try {
        const payload = attachment
          ? toFormData({
              text,
              kind: type,
              reply_to: replyTo?.id,
              attachment,
            })
          : { text, kind: type, reply_to: replyTo?.id };
        const { data: newMsg } = await messagingApi.sendMessage(convId, payload);
        const key = String(convId);
        setMessages(previous => {
          const existing = previous[key] || [];
          return existing.some(message => message.id === newMsg.id)
            ? previous
            : { ...previous, [key]: [...existing, newMsg] };
        });
        setConversations(previous => previous.map(conversation =>
          String(conversation.id) === key
            ? { ...conversation, lastMessage: newMsg, unread: 0 }
            : conversation
        ));
        setMessagingError('');
        return newMsg;
      } catch (error) {
        setMessagingError(errorMessage(error));
        return null;
      }
    },
    []
  );

  const deleteMessage = useCallback(async (convId, msgId) => {
    try {
      await messagingApi.deleteMessage(msgId);
      const key = String(convId);
      setMessages(previous => ({
        ...previous,
        [key]: (previous[key] || []).filter(message => message.id !== msgId),
      }));
      setMessagingError('');
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, []);

  const toggleStarMessage = useCallback(async (convId, msgId) => {
    try {
      const { data } = await messagingApi.messageAction(msgId, 'star');
      setMessages(previous => ({
        ...previous,
        [String(convId)]: (previous[String(convId)] || []).map(message =>
          message.id === msgId ? { ...message, starred: data.starred } : message
        ),
      }));
      setStarredMessages(previous => data.starred
        ? [...previous, {
            convId, msgId,
            message: (messages[String(convId)] || []).find(message => message.id === msgId),
          }]
        : previous.filter(item => item.msgId !== msgId));
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, [messages]);

  // ─── Conversations ──────────────────────────────────────────────────────────
  const openConversation = useCallback(async (convId) => {
    setActiveConversationId(convId);
    setShowContactInfo(false);
    setReplyingTo(null);
    setConversations(previous => previous.map(conversation =>
      String(conversation.id) === String(convId)
        ? { ...conversation, unread: 0 }
        : conversation
    ));
    try {
      const { data } = await messagingApi.messages(convId);
      setMessages(previous => ({ ...previous, [String(convId)]: data }));
      setTypingUsers(previous => ({ ...previous, [String(convId)]: [] }));
      setMessagingError('');
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, []);

  const createConversation = useCallback(
    async (contactId) => {
      const existing = conversations.find(c => String(c.contactId) === String(contactId));
      if (existing) {
        if (existing.archived) await messagingApi.updateConversation(existing.id, { archived: false });
        setConversations(previous => previous.map(conversation =>
          conversation.id === existing.id ? { ...conversation, archived: false } : conversation
        ));
        await openConversation(existing.id);
        return existing;
      }
      try {
        const { data } = await messagingApi.createConversation({
          kind: 'direct', contact_id: contactId,
        });
        setConversations(previous => [
          normalizeConversation(data),
          ...previous.filter(conversation => conversation.id !== data.id),
        ]);
        setMessagingError('');
        await openConversation(data.id);
        return data;
      } catch (error) {
        setMessagingError(errorMessage(error));
        return null;
      }
    },
    [conversations, openConversation]
  );

  const updateConversationPreference = useCallback(async (convId, key) => {
    const conversation = conversations.find(item => String(item.id) === String(convId));
    if (!conversation) return false;
    const value = !conversation[key];
    try {
      await messagingApi.updateConversation(convId, { [key]: value });
      setConversations(previous => previous.map(item =>
        String(item.id) === String(convId) ? { ...item, [key]: value } : item
      ));
      return true;
    } catch (error) {
      setMessagingError(errorMessage(error));
      return false;
    }
  }, [conversations]);

  const togglePin = useCallback((convId) => {
    updateConversationPreference(convId, 'pinned');
  }, [updateConversationPreference]);

  const toggleMute = useCallback((convId) => {
    updateConversationPreference(convId, 'muted');
  }, [updateConversationPreference]);

  const archiveConversation = useCallback(async (convId) => {
    const archived = await updateConversationPreference(convId, 'archived');
    if (archived) {
      setActiveConversationId(current => String(current) === String(convId) ? null : current);
    }
  }, [updateConversationPreference]);

  const deleteConversation = useCallback(async (convId) => {
    try {
      await messagingApi.leaveConversation(convId);
      setConversations(previous => previous.filter(
        conversation => String(conversation.id) !== String(convId)
      ));
      setMessages(previous => {
        const next = { ...previous };
        delete next[String(convId)];
        return next;
      });
      setActiveConversationId(current => String(current) === String(convId) ? null : current);
      setMessagingError('');
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, []);

  // ─── Statuts ────────────────────────────────────────────────────────────────
  const addStatus = useCallback(async (text, bg, image = null) => {
    try {
      const payload = image
        ? toFormData({ content: text, background: bg, image })
        : { content: text, background: bg };
      const { data } = await messagingApi.createStatus(payload);
      setStatuses(previous => mergeStatus(previous, data));
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, []);

  const markStatusViewed = useCallback(async (statusId, itemId) => {
    try {
      await messagingApi.viewStatus(itemId);
      setStatuses(previous => previous.map(group =>
        group.id === statusId
          ? { ...group, items: group.items.map(item =>
              item.id === itemId ? { ...item, viewed: true } : item
            ) }
          : group
      ));
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, []);

  // ─── Profil ─────────────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    try {
      const { avatarFile, ...fields } = updates;
      const payload = avatarFile
        ? toFormData({ ...fields, avatar: avatarFile })
        : fields;
      const { data } = await messagingApi.updateProfile(payload);
      const profile = {
        ...data,
        avatar: data.avatar ? new URL(data.avatar, BASE_URL).href : null,
      };
      setCurrentUser(previous => ({ ...previous, ...profile }));
      updateAuthenticatedUser(profile);
      setContacts(previous => previous.map(contact =>
        String(contact.id) === String(profile.id)
          ? { ...contact, name: profile.name, email: profile.email, phone: profile.phone, about: profile.about, avatar: profile.avatar }
          : contact
      ));
      setMessagingError('');
      return profile;
    } catch (error) {
      setMessagingError(errorMessage(error));
      throw error;
    }
  }, [updateAuthenticatedUser]);

  // ─── Groupes ─────────────────────────────────────────────────────────────────
  const createGroup = useCallback(async (name, memberIds, avatarDataUrl = null, channelType = 'standard') => {
    try {
      const avatar = avatarDataUrl
        ? new File([await (await fetch(avatarDataUrl)).blob()], 'group-avatar.png', { type: 'image/png' })
        : undefined;
      const payload = avatar
        ? toFormData({
            kind: channelType === 'standard' ? 'group' : 'channel',
            name, member_ids: memberIds, channel_type: channelType, avatar,
          })
        : {
            kind: channelType === 'standard' ? 'group' : 'channel',
            name, member_ids: memberIds, channel_type: channelType,
          };
      const { data } = await messagingApi.createConversation(payload);
      const conversation = normalizeConversation(data);
      setConversations(previous => [conversation, ...previous]);
      setMessagingError(data.pending_invitations
        ? `Groupe créé. ${data.pending_invitations} invitation(s) envoyée(s) au superadministrateur.`
        : '');
      await openConversation(conversation.id);
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, [openConversation]);

  const updateGroup = useCallback(async (groupId, updates) => {
    try {
      const payload = { name: updates.name, description: updates.about };
      if (updates.avatar?.startsWith('data:')) {
        payload.avatar = new File([await (await fetch(updates.avatar)).blob()], 'group-avatar.png', { type: 'image/png' });
      }
      const { data } = await messagingApi.updateConversation(
        groupId,
        payload.avatar ? toFormData(payload) : payload
      );
      const updated = normalizeConversation(data);
      setConversations(previous => previous.map(conversation =>
        conversation.id === updated.id ? { ...conversation, ...updated } : conversation
      ));
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const { data } = await messagingApi.conversations({ archived: 'all' });
      setConversations(data.map(normalizeConversation));
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, []);

  const refreshGroupInvitations = useCallback(async () => {
    if (authenticatedUser?.role !== 'superAdmin') return;
    try {
      const { data } = await messagingApi.groupInvitations();
      setGroupInvitations(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, [authenticatedUser?.role]);

  useEffect(() => {
    if (authenticatedUser?.role !== 'superAdmin') {
      setGroupInvitations([]);
      return undefined;
    }
    refreshGroupInvitations();
    const timer = window.setInterval(refreshGroupInvitations, 30000);
    return () => window.clearInterval(timer);
  }, [authenticatedUser?.role, refreshGroupInvitations]);

  const respondGroupInvitation = useCallback(async (invitation, decision) => {
    try {
      await messagingApi.respondGroupInvitation(invitation.id, decision);
      setGroupInvitations(previous => previous.filter(item => item.id !== invitation.id));
      if (decision === 'accept') {
        await refreshConversations();
        await openConversation(invitation.conversation_id);
      }
      setMessagingError('');
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, [openConversation, refreshConversations]);

  const addGroupMember = useCallback(async (groupId, contactId) => {
    try {
      const { data } = await messagingApi.addMember(groupId, contactId);
      await refreshConversations();
      if (data?.detail) setMessagingError(data.detail);
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, [refreshConversations]);

  const removeGroupMember = useCallback(async (groupId, contactId) => {
    try {
      await messagingApi.removeMember(groupId, contactId);
      await refreshConversations();
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, [refreshConversations]);

  const leaveGroup = useCallback((groupId) => {
    deleteConversation(groupId);
    setShowContactInfo(false);
  }, [deleteConversation]);

  const setGroupAdmin = useCallback(async (groupId, contactId, isAdmin) => {
    try {
      await messagingApi.updateMember(groupId, contactId, isAdmin ? 'admin' : 'member');
      await refreshConversations();
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, [refreshConversations]);

  const promoteToAdmin = useCallback((groupId, contactId) => {
    setGroupAdmin(groupId, contactId, true);
  }, [setGroupAdmin]);

  const demoteAdmin = useCallback((groupId, contactId) => {
    setGroupAdmin(groupId, contactId, false);
  }, [setGroupAdmin]);
  // ─── Réactions ──────────────────────────────────────────────────────────────
  const addReaction = useCallback(async (convId, msgId, emoji) => {
    try {
      const { data } = await messagingApi.messageAction(msgId, 'react', { emoji });
      setMessages(previous => ({
        ...previous,
        [String(convId)]: (previous[String(convId)] || []).map(message =>
          message.id === msgId ? { ...message, reactions: data.reactions } : message
        ),
      }));
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, []);

  // ─── Épinglage message ───────────────────────────────────────────────────────
  const pinMessage = useCallback(async (convId, msgId) => {
    try {
      const { data } = await messagingApi.messageAction(msgId, 'pin');
      setMessages(previous => ({
        ...previous,
        [String(convId)]: (previous[String(convId)] || []).map(message =>
          message.id === msgId ? { ...message, pinned: data.pinned } : message
        ),
      }));
      return true;
    } catch (error) {
      setMessagingError(errorMessage(error));
      return false;
    }
  }, []);

  // ─── Brouillons ──────────────────────────────────────────────────────────────
  const [drafts, setDrafts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`wa_drafts_${authenticatedUser?.id}`) || '{}');
    } catch {
      return {};
    }
  });
  const saveDraft = useCallback((convId, text) => {
    setDrafts(previous => {
      const next = text.trim()
        ? { ...previous, [convId]: text }
        : (({ [convId]: _, ...rest }) => rest)(previous);
      try {
        localStorage.setItem(`wa_drafts_${authenticatedUser.id}`, JSON.stringify(next));
      } catch (error) {
        setMessagingError(errorMessage(error));
      }
      return next;
    });
  }, [authenticatedUser?.id]);
  const getDraft = useCallback((convId) => drafts[convId] || '', [drafts]);

  // ─── Création canal/groupe structuré ─────────────────────────────────────────
  const createChannel = useCallback(async (name, type, memberIds, options = {}) => {
    try {
      const { data } = await messagingApi.createConversation({
        kind: 'channel',
        name,
        member_ids: memberIds,
        channel_type: type,
        description: options.about || '',
      });
      const channel = normalizeConversation(data);
      setConversations(previous => [channel, ...previous]);
      await openConversation(channel.id);
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, [openConversation]);

  const sendTyping = useCallback((conversationId, isTyping) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        conversation_id: conversationId,
        is_typing: isTyping,
      }));
    }
  }, []);

  // ─── Actions Réunions ────────────────────────────────────────────────────────
  const createMeeting = useCallback(async (data) => {
    const companyId = data.companyId || authenticatedUser?.companyId;
    if (!companyId) throw new Error('Votre compte doit être rattaché à une société pour créer une réunion.');
    const payload = {
      title: data.title,
      type: data.type,
      company: Number(companyId),
      department: data.departmentId ? Number(data.departmentId) : null,
      organizer: authenticatedUser?.id ? Number(authenticatedUser.id) : null,
      president: data.presidentId ? Number(data.presidentId) : null,
      secretary: data.secretaryId ? Number(data.secretaryId) : null,
      scheduled_at: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
      duration: Number(data.duration) || 60,
      location: data.location || '',
      link: data.link || '',
      participant_ids: (data.participantIds || []).map(Number),
      agenda_items: (data.agenda || []).filter(point => point.title?.trim()).map((point, index) => ({
        order: index + 1, title: point.title.trim(), notes: point.notes || '',
      })),
    };
    const { data: result } = await meetingsApi.create(payload);
    const newMeeting = normalizeMeeting(result);
    setMeetings(prev => [newMeeting, ...prev.filter(meeting => meeting.id !== newMeeting.id)]);
    setMeetingMessages(prev => ({ ...prev, [newMeeting.id]: [] }));
    setActiveMeetingId(newMeeting.id);
    return newMeeting;
  }, [authenticatedUser?.companyId, authenticatedUser?.id]);

  const updateMeeting = useCallback(async (id, updates) => {
    const fields = {
      title: 'title', type: 'type', companyId: 'company', departmentId: 'department',
      projectId: 'project', organizerId: 'organizer', presidentId: 'president',
      secretaryId: 'secretary', scheduledAt: 'scheduled_at', duration: 'duration',
      location: 'location', link: 'link', pvStatus: 'pv_status', pvRef: 'pv_ref',
      status: 'status', conductLog: 'conduct_log',
    };
    const payload = Object.fromEntries(Object.entries(updates)
      .filter(([key]) => fields[key])
      .map(([key, value]) => [fields[key], key === 'scheduledAt' && value ? new Date(value).toISOString() : value]));
    const { data } = await meetingsApi.update(id, payload);
    const updated = normalizeMeeting(data);
    setMeetings(prev => prev.map(meeting => meeting.id === updated.id ? updated : meeting));
    return updated;
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

  const blockContact = useCallback(async (contactId) => {
    try {
      const { data } = await messagingApi.toggleBlocked(contactId);
      setBlockedContacts(previous => data.blocked
        ? [...previous, contactId]
        : previous.filter(id => String(id) !== String(contactId)));
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, []);

  const isBlocked = useCallback(
    (contactId) => blockedContacts.includes(contactId),
    [blockedContacts]
  );

  // ─── Appels ─────────────────────────────────────────────────────────────────
  const addCall = useCallback(async (contactId, callType) => {
    const contact = getContact(contactId);
    if (contact?.isGroup) {
      setMessagingError('Les appels WebRTC de groupe ne sont pas encore disponibles. Lancez un appel individuel.');
      return;
    }
    try {
      const { data } = await messagingApi.createCall({
        contact_id: contactId,
        kind: callType === 'video' ? 'video' : 'voice',
      });
      setCalls(previous => [data, ...previous]);
      setActiveCall({ ...data, contact, direction: 'outgoing' });
      setMessagingError('');
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, [getContact]);

  const answerCall = useCallback(async () => {
    if (!incomingCall) return;
    try {
      const { data } = await messagingApi.updateCall(incomingCall.id, 'accept');
      setActiveCall({
        ...data,
        contact: incomingCall.caller,
        direction: 'incoming',
      });
      setIncomingCall(null);
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, [incomingCall]);

  const dismissIncomingCall = useCallback(async (action = 'decline') => {
    if (!incomingCall) return;
    try {
      const { data } = await messagingApi.updateCall(incomingCall.id, action);
      setCalls(previous => previous.map(call => call.id === data.id ? data : call));
      setIncomingCall(null);
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, [incomingCall]);

  const finishCall = useCallback(async () => {
    if (!activeCall) return;
    try {
      const { data } = await messagingApi.updateCall(activeCall.id, 'end');
      setCalls(previous => previous.map(call => call.id === data.id ? data : call));
      setActiveCall(null);
    } catch (error) {
      setMessagingError(errorMessage(error));
    }
  }, [activeCall]);

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
      groupInvitations, respondGroupInvitation,
      createChannel,
      blockContact, isBlocked,
      addCall, activeCall, incomingCall, answerCall, dismissIncomingCall, finishCall,
      addReaction, pinMessage,
      typingUsers, sendTyping, messagingError, setMessagingError,
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
