import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Check, CheckCheck, Clock, Trash2, Reply, Copy, Star,
  Forward, ListTodo, CalendarPlus, Gavel, Pin,
  Flag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { companiesApi, meetingsApi, messagingApi, projectsApi } from '../services/api';

// ── Statut du message ────────────────────────────────────────────────────────
function StatusIcon({ status }) {
  if (status === 'sending')   return <Clock size={12} />;
  if (status === 'sent')      return <Check size={12} />;
  if (status === 'delivered') return <CheckCheck size={12} />;
  if (status === 'read')      return <CheckCheck size={12} style={{ color: '#53bdeb' }} />;
  return null;
}

const dialogStyles = {
  backdrop: { position: 'fixed', inset: 0, zIndex: 10000, display: 'grid', placeItems: 'center', padding: 16, background: '#0f172a88' },
  dialog: { display: 'grid', gap: 14, width: 'min(440px, 100%)', maxHeight: '90vh', overflow: 'auto', padding: 22, borderRadius: 12, background: '#fff', color: '#0f172a', boxShadow: '0 20px 60px #0003' },
  label: { display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 },
  input: { width: '100%', boxSizing: 'border-box', padding: 10, border: '1px solid #cbd5e1', borderRadius: 7, font: 'inherit', background: '#fff' },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  cancel: { padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 7, background: '#fff', cursor: 'pointer' },
  submit: { padding: '9px 12px', border: 0, borderRadius: 7, background: '#2563eb', color: '#fff', cursor: 'pointer' },
};

// ── Réactions disponibles ────────────────────────────────────────────────────
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

// ── Menu "Transformer en…" ────────────────────────────────────────────────────
function TransformMenu({ msg, role, onTransform, onClose }) {
  const items = [
    { icon: ListTodo, label: 'Transformer en tâche', action: 'task', roles: ['superAdmin', 'adminSociete', 'manager', 'chefProjet'] },
    { icon: Gavel, label: 'Transformer en décision', action: 'decision', roles: ['superAdmin', 'adminSociete', 'manager'] },
    { icon: CalendarPlus, label: "Ajouter à l'ordre du jour", action: 'meeting', roles: ['superAdmin', 'adminSociete', 'manager', 'chefProjet'] },
    { icon: Pin, label: 'Épingler le message', action: 'pin' },
    { icon: Forward, label: 'Transférer', action: 'forward' },
    { icon: Flag, label: 'Signaler', action: 'report' },
  ];
  return (
    <div className="transform-menu" onClick={e => e.stopPropagation()}>
      <div className="transform-menu-backdrop" onClick={onClose} />
      <div className="transform-menu-popup">
        <div className="transform-menu-title">Actions sur ce message</div>
        {items.filter(item => !item.roles || item.roles.includes(role)).map(item => (
          <button
            key={item.action}
            className="transform-menu-item"
            onClick={() => { onTransform(item.action, msg); onClose(); }}
          >
            <item.icon size={15} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Bulle de message principale ───────────────────────────────────────────────
export default function MessageBubble({ msg, isMine, onDelete, contact, convId }) {
  const {
    currentUser, conversations, openConversation,
    setReplyingTo, toggleStarMessage, pinMessage, addReaction, setMessagingError,
    appSettings,
  } = useApp();
  const [showActions, setShowActions]     = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [transformNotif, setTransformNotif] = useState(null);
  const [actionDialog, setActionDialog] = useState(null);
  const [actionForm, setActionForm] = useState({});
  const [actionOptions, setActionOptions] = useState({ companies: [], meetings: [], projects: [] });
  const [actionLoading, setActionLoading] = useState(false);
  const [loadImage, setLoadImage] = useState(false);

  const time = msg.time ? format(new Date(msg.time), 'HH:mm') : '';
  const network = navigator.connection;
  const wifiConnection = network?.type === 'wifi' || network?.type === 'ethernet'
    || (!network?.type && !network?.effectiveType);
  const autoLoadImage = appSettings.chat.mediaAutoDownload
    && !appSettings.chat.reduceDataUsage
    && (wifiConnection ? appSettings.chat.wifiAutoDownload : appSettings.chat.mobileAutoDownload);

  useEffect(() => {
    if (!actionDialog) return;
    let cancelled = false;
    const loadOptions = async () => {
      try {
        const role = currentUser?.role;
        const requests = [
          meetingsApi.list({ page_size: 200 }),
          projectsApi.list({ page_size: 200 }),
          ...(role === 'superAdmin' ? [companiesApi.list({ page_size: 200 })] : []),
        ];
        const responses = await Promise.all(requests);
        if (cancelled) return;
        setActionOptions({
          meetings: Array.isArray(responses[0].data) ? responses[0].data : responses[0].data?.results || [],
          projects: Array.isArray(responses[1].data) ? responses[1].data : responses[1].data?.results || [],
          companies: role === 'superAdmin'
            ? (Array.isArray(responses[2].data) ? responses[2].data : responses[2].data?.results || [])
            : [],
        });
      } catch (error) {
        if (!cancelled) setMessagingError(error.response?.data?.detail || 'Impossible de charger les choix disponibles.');
      }
    };
    loadOptions();
    return () => { cancelled = true; };
  }, [actionDialog, currentUser?.role, setMessagingError]);

  // Message système
  if (msg.type === 'system') {
    return <div className="msg-system"><span>{msg.text}</span></div>;
  }

  const handleCopy = () => {
    if (!msg.text) return;
    navigator.clipboard.writeText(msg.text)
      .then(() => setShowActions(false))
      .catch(error => setMessagingError(`Impossible de copier le message : ${error.message}`));
  };
  const handleReply  = () => { setReplyingTo({ id: msg.id, text: msg.text, senderName: isMine ? 'Vous' : contact?.name || 'Contact' }); setShowActions(false); };
  const handleStar   = () => { toggleStarMessage(convId, msg.id); setShowActions(false); };
  const handleDelete = () => { onDelete(msg.id); setShowActions(false); };

  const handleReaction = (emoji) => {
    if (addReaction) addReaction(convId, msg.id, emoji);
    setShowReactions(false);
    setShowActions(false);
  };

  const handleTransform = async (action) => {
    if (action === 'pin') {
      const pinned = await pinMessage(convId, msg.id);
      if (pinned) setTransformNotif('Message épinglé');
    } else {
      setActionForm({
        title: msg.text?.slice(0, 300) || msg.attachment_name || `Message ${msg.id}`,
        company_id: currentUser?.companyId || '',
        project_id: '',
        meeting_id: '',
        conversation_id: '',
        reason: 'other',
        details: '',
      });
      setActionDialog(action);
    }
    setTimeout(() => setTransformNotif(null), 2500);
  };

  const submitMessageAction = async (event) => {
    event.preventDefault();
    setActionLoading(true);
    try {
      let endpointAction;
      let payload;
      if (actionDialog === 'forward') {
        endpointAction = 'forward';
        payload = { conversation_id: actionForm.conversation_id };
      } else if (actionDialog === 'report') {
        endpointAction = 'report';
        payload = { reason: actionForm.reason, details: actionForm.details };
      } else {
        endpointAction = 'convert';
        payload = {
          target_type: actionDialog === 'meeting' ? 'agenda_item' : actionDialog,
          title: actionForm.title,
        };
        if (currentUser?.role === 'superAdmin') payload.company_id = actionForm.company_id;
        if (actionDialog === 'meeting') payload.meeting_id = actionForm.meeting_id;
        if (actionDialog === 'task' && actionForm.project_id) payload.project_id = actionForm.project_id;
      }
      const { data } = await messagingApi.messageAction(msg.id, endpointAction, payload);
      if (actionDialog === 'forward') {
        await openConversation(actionForm.conversation_id);
        setTransformNotif('Message transféré');
      } else if (actionDialog === 'report') {
        setTransformNotif('Signalement enregistré');
      } else {
        const labels = { task: 'Tâche créée', decision: 'Décision créée', meeting: 'Point ajouté à l’ordre du jour' };
        setTransformNotif(`${labels[actionDialog]} (${data.ref || data.id})`);
      }
      setActionDialog(null);
      setMessagingError('');
      setTimeout(() => setTransformNotif(null), 3500);
    } catch (error) {
      setMessagingError(error.response?.data?.detail || 'Cette action a échoué.');
    } finally {
      setActionLoading(false);
    }
  };

  // Rendu réactions existantes sur ce message
  const reactions = msg.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([, count]) => count > 0);

  return (
    <div
      className={`msg-row ${isMine ? 'mine' : 'theirs'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
    >
      {/* Avatar (groupes / contact tiers) */}
      {!isMine && contact && !contact.isGroup && (
        <img
          src={contact.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact.name)}`}
          alt={contact.name}
          className="avatar avatar-xs msg-avatar"
        />
      )}

      <div className="msg-bubble-wrap">

        {/* ── Actions au survol ── */}
        {showActions && (
          <div className={`msg-actions ${isMine ? 'actions-left' : 'actions-right'}`}>
            {/* Réactions rapides */}
            <div className="msg-reaction-trigger">
              <button
                className="msg-action-btn"
                title="Réagir"
                onClick={() => setShowReactions(v => !v)}
              >😊</button>
              {showReactions && (
                <div className="msg-reaction-picker">
                  {QUICK_REACTIONS.map(e => (
                    <button key={e} className="msg-reaction-emoji" onClick={() => handleReaction(e)}>{e}</button>
                  ))}
                </div>
              )}
            </div>
            <button className="msg-action-btn" title="Répondre"  onClick={handleReply}><Reply size={14} /></button>
            <button className="msg-action-btn" title="Copier" onClick={handleCopy} disabled={!msg.text}><Copy size={14} /></button>
            <button
              className="msg-action-btn"
              title={msg.starred ? 'Retirer l\'étoile' : 'Étoiler'}
              onClick={handleStar}
            >
              <Star size={14} style={{ fill: msg.starred ? 'var(--wa-green)' : 'none', color: msg.starred ? 'var(--wa-green)' : undefined }} />
            </button>
            <button className="msg-action-btn" title="Plus d\'actions" onClick={() => setShowTransform(v => !v)}>
              ···
            </button>
            {isMine && (
              <button className="msg-action-btn danger" title="Supprimer" onClick={handleDelete}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}

        {/* ── Menu Transformer en… ── */}
        {showTransform && (
          <TransformMenu
            msg={msg}
            role={currentUser?.role}
            onTransform={handleTransform}
            onClose={() => setShowTransform(false)}
          />
        )}

        {actionDialog && (
          <div style={dialogStyles.backdrop} onClick={() => setActionDialog(null)}>
            <form style={dialogStyles.dialog} onSubmit={submitMessageAction} onClick={event => event.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>{{
                task: 'Transformer en tâche',
                decision: 'Transformer en décision',
                meeting: "Ajouter à l'ordre du jour",
                forward: 'Transférer le message',
                report: 'Signaler le message',
              }[actionDialog]}</h3>
              {actionDialog === 'forward' && (
                <label style={dialogStyles.label}>Conversation destinataire
                  <select required value={actionForm.conversation_id} onChange={event => setActionForm(form => ({ ...form, conversation_id: event.target.value }))} style={dialogStyles.input}>
                    <option value="">Choisir une conversation…</option>
                    {conversations.filter(item => String(item.id) !== String(convId)).map(item => (
                      <option key={item.id} value={item.id}>{item.name || item.contact?.name || `Conversation ${item.id}`}</option>
                    ))}
                  </select>
                </label>
              )}
              {actionDialog === 'report' && (
                <>
                  <label style={dialogStyles.label}>Motif
                    <select value={actionForm.reason} onChange={event => setActionForm(form => ({ ...form, reason: event.target.value }))} style={dialogStyles.input}>
                      <option value="spam">Spam</option><option value="harassment">Harcèlement</option>
                      <option value="inappropriate">Contenu inapproprié</option><option value="other">Autre</option>
                    </select>
                  </label>
                  <label style={dialogStyles.label}>Détails (facultatif)
                    <textarea maxLength={500} value={actionForm.details} onChange={event => setActionForm(form => ({ ...form, details: event.target.value }))} style={dialogStyles.input} />
                  </label>
                </>
              )}
              {['task', 'decision', 'meeting'].includes(actionDialog) && (
                <>
                  {currentUser?.role === 'superAdmin' && (
                    <label style={dialogStyles.label}>Société cible
                      <select required value={actionForm.company_id} onChange={event => setActionForm(form => ({ ...form, company_id: event.target.value }))} style={dialogStyles.input}>
                        <option value="">Choisir une société…</option>
                        {actionOptions.companies.filter(company => company.status === 'active').map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label style={dialogStyles.label}>Titre
                    <input required maxLength={300} value={actionForm.title} onChange={event => setActionForm(form => ({ ...form, title: event.target.value }))} style={dialogStyles.input} />
                  </label>
                  {actionDialog === 'task' && ['chefProjet', 'manager'].includes(currentUser?.role) && (
                    <label style={dialogStyles.label}>Projet{currentUser?.role === 'chefProjet' ? ' *' : ' (facultatif)'}
                      <select required={currentUser?.role === 'chefProjet'} value={actionForm.project_id} onChange={event => setActionForm(form => ({ ...form, project_id: event.target.value }))} style={dialogStyles.input}>
                        <option value="">Aucun projet</option>
                        {actionOptions.projects.filter(project => currentUser?.role !== 'manager' || project.department === currentUser.departmentId).map(project => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {actionDialog === 'meeting' && (
                    <label style={dialogStyles.label}>Réunion
                      <select required value={actionForm.meeting_id} onChange={event => setActionForm(form => ({ ...form, meeting_id: event.target.value }))} style={dialogStyles.input}>
                        <option value="">Choisir une réunion…</option>
                        {actionOptions.meetings.filter(meeting =>
                          currentUser?.role === 'superAdmin'
                            ? String(meeting.company) === String(actionForm.company_id)
                            : true
                        ).map(meeting => <option key={meeting.id} value={meeting.id}>{meeting.title}</option>)}
                      </select>
                    </label>
                  )}
                </>
              )}
              <div style={dialogStyles.buttons}>
                <button type="button" onClick={() => setActionDialog(null)} style={dialogStyles.cancel}>Annuler</button>
                <button type="submit" disabled={actionLoading} style={dialogStyles.submit}>
                  {actionLoading ? 'En cours…' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Bulle ── */}
        <div className={`msg-bubble ${isMine ? 'bubble-out' : 'bubble-in'} ${msg.pinned ? 'pinned' : ''}`}>
          {/* Nom expéditeur dans les groupes */}
          {!isMine && contact?.isGroup && (
            <span className="msg-sender-name" style={{ color: stringToColor(contact.id || '') }}>
              {contact.name}
            </span>
          )}

          {/* Message cité */}
          {msg.forwardedFrom && <span className="msg-sender-name">Message transféré</span>}
          {msg.replyTo && (
            <div className="msg-reply-preview">
              <div className="msg-reply-bar" />
              <span className="msg-reply-text">{msg.replyTo.text}</span>
            </div>
          )}

          {/* Texte avec @mentions surlignées */}
          {msg.type === 'text' && (
            <p className="msg-text">
              {renderTextWithMentions(msg.text)}
              {msg.starred && <Star size={10} style={{ display:'inline', marginLeft:4, fill:'var(--wa-green)', color:'var(--wa-green)', verticalAlign:'middle' }} />}
              {msg.pinned && <Pin size={10} style={{ display:'inline', marginLeft:4, color:'#f59e0b', verticalAlign:'middle' }} />}
            </p>
          )}

          {msg.type === 'image' && (
            <div className="msg-media">
              {autoLoadImage || loadImage ? (
                <img src={msg.url} alt="Image" className="msg-image" />
              ) : (
                <button
                  type="button"
                  className="msg-media-load"
                  onClick={() => setLoadImage(true)}
                >
                  Charger l’image · {msg.attachment_name || 'Image'}
                </button>
              )}
              {msg.text && <p className="msg-caption">{msg.text}</p>}
            </div>
          )}

          {msg.type === 'audio' && (
            <div className="msg-audio">
              {msg.url
                ? <audio controls preload="metadata" src={msg.url} aria-label="Message audio" />
                : <span>Audio indisponible</span>}
            </div>
          )}

          {msg.type === 'video' && (
            <video controls preload="metadata" src={msg.url} className="msg-video">
              Votre navigateur ne prend pas en charge la lecture vidéo.
            </video>
          )}

          {msg.type === 'document' && (
            <a className="msg-document" href={msg.url} target="_blank" rel="noreferrer">
              <div className="msg-doc-icon">📄</div>
              <div className="msg-doc-info">
                <span className="msg-doc-name">{msg.attachment_name || 'Document'}</span>
                <span className="msg-doc-size">Ouvrir le fichier</span>
              </div>
            </a>
          )}

          {!!msg.conversions?.length && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
              {msg.conversions.map(conversion => (
                <span key={`${conversion.type}-${conversion.id}`} style={{ fontSize: 11, color: '#475569' }}>
                  {conversion.type === 'agenda_item' ? "Ordre du jour" : conversion.type === 'task' ? 'Tâche' : 'Décision'} #{conversion.id}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="msg-footer">
            <span className="msg-time">{time}</span>
            {isMine && <span className="msg-status-icon"><StatusIcon status={msg.status} /></span>}
          </div>
        </div>

        {/* ── Réactions affichées ── */}
        {reactionEntries.length > 0 && (
          <div className={`msg-reactions-bar ${isMine ? 'mine' : ''}`}>
            {reactionEntries.map(([emoji, count]) => (
              <button key={emoji} className="msg-reaction-chip" onClick={() => handleReaction(emoji)}>
                {emoji} {count > 1 && <span>{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* ── Notification transformation ── */}
        {transformNotif && (
          <div className="msg-transform-notif">{transformNotif}</div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderTextWithMentions(text) {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="msg-mention">{part}</span>
      : part
  );
}

function stringToColor(str) {
  const colors = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
