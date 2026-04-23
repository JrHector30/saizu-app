import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSuitcase } from '../context/SuitcaseContext';
import { User, Copy, UserPlus, Users, LogOut, Check, Pencil, X, Bell } from 'lucide-react';

const UserMenu = () => {
  const { profile, refreshProfile } = useAuth();
  const { setViewingFriend, viewingFriend } = useSuitcase();

  const [isOpen, setIsOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [friendId, setFriendId] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [localProfileName, setLocalProfileName] = useState('');
  const [acceptedFriends, setAcceptedFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // --- NOTIFICACIONES ---
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const loadNotifications = useCallback(async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('owner_id', profile.owner_id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) setNotifications(data || []);
    } catch (err) {
      console.error('loadNotifications error:', err);
    }
  }, [profile]);

  // Cargar notificaciones al montar y suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!profile) return;
    loadNotifications();

    const channel = supabase
      .channel(`notifications:${profile.owner_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `owner_id=eq.${profile.owner_id}`
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [profile, loadNotifications]);

  const markAllAsRead = async () => {
    if (!profile || unreadCount === 0) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('owner_id', profile.owner_id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleBellOpen = () => {
    setIsBellOpen(prev => !prev);
    setIsOpen(false);
    if (!isBellOpen) markAllAsRead();
  };

  // --- PERFIL Y AMIGOS ---
  useEffect(() => {
    if (profile?.profile_name) setLocalProfileName(profile.profile_name);
  }, [profile?.profile_name]);

  useEffect(() => {
    if (isOpen && profile) loadFriends();
  }, [isOpen, profile]);

  const loadFriends = async () => {
    if (!profile) return;
    try {
      const { data: asRequester } = await supabase
        .from('friendships').select('*').eq('requester_id', profile.owner_id);
      const { data: asReceiver } = await supabase
        .from('friendships').select('*').eq('receiver_id', profile.owner_id);

      const all = [...(asRequester || []), ...(asReceiver || [])];
      const accepted = all.filter(f => f.status === 'accepted');
      const pending = all.filter(f => f.status === 'pending' && f.receiver_id === profile.owner_id);

      const friendIds = accepted.map(f =>
        f.requester_id === profile.owner_id ? f.receiver_id : f.requester_id
      );

      if (friendIds.length > 0) {
        const { data: friendProfiles } = await supabase
          .from('user_profiles')
          .select('owner_id, saizu_id, profile_name, outfit_mode')
          .in('owner_id', friendIds);
        setAcceptedFriends(friendProfiles || []);
      } else {
        setAcceptedFriends([]);
      }

      const pendingIds = pending.map(f => f.requester_id);
      if (pendingIds.length > 0) {
        const { data: pendingProfiles } = await supabase
          .from('user_profiles')
          .select('owner_id, saizu_id, profile_name, outfit_mode')
          .in('owner_id', pendingIds);
        setPendingRequests(pendingProfiles || []);
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      console.error('loadFriends error:', err);
    }
  };

  const saveDisplayName = async () => {
    if (!profile || !editNameValue.trim()) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ profile_name: editNameValue.trim() })
        .eq('owner_id', profile.owner_id);
      if (error) throw error;
      setLocalProfileName(editNameValue.trim());
      setIsEditingName(false);
      await refreshProfile();
    } catch (e) {
      console.error('saveDisplayName error:', e);
      alert('Error al guardar: ' + e.message);
    }
  };

  const handleCopyId = () => {
    if (profile?.saizu_id) {
      navigator.clipboard.writeText(profile.saizu_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();
    if (!friendId.trim()) return;
    try {
      const { data: targetProfile, error: targetError } = await supabase
        .from('user_profiles').select('*').eq('saizu_id', friendId.trim()).single();

      if (targetError || !targetProfile) return alert("Usuario no encontrado.");
      if (targetProfile.owner_id === profile.owner_id) return alert("No puedes agregarte a ti mismo.");

      const { error } = await supabase.from('friendships').insert({
        requester_id: profile.owner_id,
        receiver_id: targetProfile.owner_id,
        status: 'pending'
      });
      if (error) throw error;

      // Crear notificación para el receptor
      await supabase.from('notifications').insert({
        owner_id: targetProfile.owner_id,
        type: 'friend_request',
        from_user_id: profile.owner_id,
        from_name: localProfileName || 'Alguien',
        message: `${localProfileName || 'Alguien'} te ha enviado una solicitud de amistad.`
      });

      setFriendId('');
      alert("Solicitud enviada");
    } catch (err) {
      console.error(err);
      alert("No se pudo enviar la solicitud, quizá ya existe.");
    }
  };

  const acceptRequest = async (requesterUuid, requesterName) => {
    try {
      const { error } = await supabase.from('friendships')
        .update({ status: 'accepted' })
        .eq('requester_id', requesterUuid)
        .eq('receiver_id', profile.owner_id);
      if (error) throw error;

      // Notificar al que envió la solicitud que fue aceptada
      await supabase.from('notifications').insert({
        owner_id: requesterUuid,
        type: 'friend_accepted',
        from_user_id: profile.owner_id,
        from_name: localProfileName || 'Alguien',
        message: `¡${localProfileName || 'Alguien'} aceptó tu solicitud! Ya puedes ver su armario.`
      });

      await loadFriends();
    } catch (err) {
      console.error('acceptRequest error:', err);
    }
  };

  // Icono según tipo de notificación
  const getNotifIcon = (type) => {
    if (type === 'friend_request') return '👋';
    if (type === 'friend_accepted') return '🤝';
    if (type === 'wardrobe_updated') return '👕';
    return '🔔';
  };

  const popoverStyle = {
    position: 'fixed',
    top: '60px',
    right: '1rem',
    width: 'min(300px, calc(100vw - 2rem))',
    maxHeight: '80dvh',
    overflowY: 'auto',
    background: 'rgba(15, 15, 15, 0.75)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '1.5rem',
    color: '#fff',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    zIndex: 200
  };

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 200, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

      {/* ---- CAMPANA ---- */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleBellOpen}
          style={{
            width: '45px', height: '45px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }}
        >
          <Bell size={20} />
          {/* Badge contador */}
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: '-4px', right: '-4px',
              background: '#e8000d',
              color: '#fff',
              borderRadius: '50%',
              width: '18px', height: '18px',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #000'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>

        {/* Panel notificaciones */}
        {isBellOpen && (
          <div style={{ ...popoverStyle, right: '0', position: 'absolute', top: '55px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                🔔 NOTIFICACIONES
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    notifications.forEach(n => deleteNotification(n.id));
                  }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Borrar todo
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '1rem 0' }}>
                Sin notificaciones nuevas
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    style={{
                      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                      background: n.is_read ? 'transparent' : 'rgba(232,0,13,0.08)',
                      border: `1px solid ${n.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(232,0,13,0.2)'}`,
                      borderRadius: '10px', padding: '0.75rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{getNotifIcon(n.type)}</span>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{n.message}</span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                        {new Date(n.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '0', flexShrink: 0 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- BOTÓN PERFIL ---- */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setIsOpen(!isOpen); setIsBellOpen(false); }}
          style={{
            width: '45px', height: '45px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }}
        >
          <User size={20} />
        </button>

        {/* Popover perfil */}
        {isOpen && (
          <div style={{ ...popoverStyle, right: '0', position: 'absolute', top: '55px' }}>

            <div style={{ textAlign: 'center' }}>
              {isEditingName ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'center' }}>
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={e => setEditNameValue(e.target.value)}
                    placeholder="Tu Nombre"
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: '#fff', padding: '0.2rem 0.5rem', textAlign: 'center', width: '120px' }}
                    autoFocus
                  />
                  <button onClick={saveDisplayName} style={{ background: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}><Check size={14} /></button>
                  <button onClick={() => setIsEditingName(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{localProfileName || 'Sin Nombre'}</span>
                  <button onClick={() => { setEditNameValue(localProfileName || ''); setIsEditingName(true); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    <Pencil size={14} />
                  </button>
                </div>
              )}

              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>MI CÓDIGO SAIZU</p>
              <div onClick={handleCopyId} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ margin: 0, letterSpacing: '2px', fontFamily: 'monospace' }}>{profile?.saizu_id || '------'}</h3>
                {copied ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

            <form onSubmit={sendFriendRequest} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Ej. SAI-A1B2"
                value={friendId}
                onChange={e => setFriendId(e.target.value.toUpperCase())}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'monospace' }}
              />
              <button type="submit" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '0 0.8rem', color: '#fff', cursor: 'pointer' }}>
                <UserPlus size={18} />
              </button>
            </form>

            {pendingRequests.length > 0 && (
              <div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>SOLICITUDES</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pendingRequests.map(p => (
                    <div key={p.owner_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.9rem' }}>{p.profile_name || 'Sin Nombre'}</span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{p.saizu_id}</span>
                      </div>
                      <button onClick={() => acceptRequest(p.owner_id, p.profile_name)} style={{ background: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Aceptar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={14} /> MIS AMIGOS
              </p>
              {acceptedFriends.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>No has agregado amigos aún.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {acceptedFriends.map(friend => (
                    <button
                      key={friend.owner_id}
                      onClick={() => {
                        setViewingFriend({ id: friend.owner_id, saizu_id: friend.saizu_id, profile_name: friend.profile_name, mode: friend.outfit_mode });
                        setIsOpen(false);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: viewingFriend?.id === friend.owner_id ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                        padding: '0.75rem', color: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{friend.profile_name || 'Sin Nombre'}</span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{friend.saizu_id}</span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>Modo: {friend.outfit_mode}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
                padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', width: '100%'
              }}
            >
              <LogOut size={16} /> Cerrar Sesión
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

export default UserMenu;
