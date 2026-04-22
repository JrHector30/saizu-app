import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSuitcase } from '../context/SuitcaseContext';
import { User, Copy, UserPlus, Users, LogOut, Check, Pencil, X } from 'lucide-react';

const UserMenu = () => {
  const { profile, refreshProfile } = useAuth();
  const { setViewingFriend, viewingFriend } = useSuitcase();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [friendId, setFriendId] = useState('');

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [localProfileName, setLocalProfileName] = useState('');

  // Sincronizar localProfileName cuando cargue el profile
  useEffect(() => {
    if (profile?.profile_name) {
      setLocalProfileName(profile.profile_name);
    }
  }, [profile?.profile_name]);

  // Amigos reales de DB
  const [acceptedFriends, setAcceptedFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    if (isOpen && profile) {
      loadFriends();
    }
  }, [isOpen, profile]);

  const loadFriends = async () => {
    if (!profile) return;
    try {
      // Query 1: filas donde soy el solicitante
      const { data: asRequester, error: e1 } = await supabase
        .from('friendships')
        .select('*')
        .eq('requester_id', profile.owner_id);

      // Query 2: filas donde soy el receptor
      const { data: asReceiver, error: e2 } = await supabase
        .from('friendships')
        .select('*')
        .eq('receiver_id', profile.owner_id);

      if (e1 || e2) throw e1 || e2;

      const all = [...(asRequester || []), ...(asReceiver || [])];

      const accepted = all.filter(f => f.status === 'accepted');
      const pending = all.filter(f => f.status === 'pending' && f.receiver_id === profile.owner_id);

      // El amigo es siempre el que NO soy yo
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

      // Actualizar estado local inmediatamente
      setLocalProfileName(editNameValue.trim());
      setIsEditingName(false);

      // Forzar re-fetch del profile en AuthContext para sync global
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
      // Buscar el UUID del compa por el text ID (SAI-XXXX)
      const { data: targetProfile, error: targetError } = await supabase.from('user_profiles').select('*').eq('saizu_id', friendId.trim()).single();

      if (targetError || !targetProfile) {
        return alert("Usuario no encontrado.");
      }

      if (targetProfile.owner_id === profile.owner_id) {
        return alert("No puedes agregarte a ti mismo.");
      }

      const { error } = await supabase.from('friendships').insert({
        requester_id: profile.owner_id,
        receiver_id: targetProfile.owner_id,
        status: 'pending'
      });

      if (error) throw error;
      alert("Solicitud enviada");
      setFriendId('');
    } catch (err) {
      console.error(err);
      alert("No se pudo enviar la solicitud, quizá ya existe.");
    }
  };

  const acceptRequest = async (requesterUuid) => {
    try {
      const { error } = await supabase.from('friendships')
        .update({ status: 'accepted' })
        .eq('requester_id', requesterUuid)
        .eq('receiver_id', profile.owner_id);
      if (error) throw error;
      await loadFriends(); // Recargar lista sin refresh de página
    } catch (err) {
      console.error('acceptRequest error:', err);
    }
  };

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 200 }}>
      {/* Botón Circular Glass */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="user-menu-avatar"
        style={{
          width: '45px', height: '45px', borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease'
        }}
      >
        <User size={20} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div style={{
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
          display: 'flex', flexDirection: 'column', gap: '1.5rem',
          zIndex: 200
        }}>

          {/* Header ID */}
          <div style={{ textAlign: 'center' }}>
            {isEditingName ? (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'center' }}>
                <input
                  type="text"
                  value={editNameValue}
                  onChange={e => setEditNameValue(e.target.value)}
                  placeholder="Tu Nombre"
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px',
                    color: '#fff', padding: '0.2rem 0.5rem', textAlign: 'center', width: '120px'
                  }}
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
            <div
              onClick={handleCopyId}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <h3 style={{ margin: 0, letterSpacing: '2px', fontFamily: 'monospace' }}>{profile?.saizu_id || '------'}</h3>
              {copied ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

          {/* Agregar Amigo */}
          <form onSubmit={sendFriendRequest} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Ej. SAI-A1B2"
              value={friendId}
              onChange={e => setFriendId(e.target.value.toUpperCase())}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                fontFamily: 'monospace'
              }}
            />
            <button type="submit" style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
              padding: '0 0.8rem', color: '#fff', cursor: 'pointer'
            }}>
              <UserPlus size={18} />
            </button>
          </form>

          {/* Solicitudes Pendientes */}
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
                    <button onClick={() => acceptRequest(p.owner_id)} style={{ background: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Aceptar</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista Amigos */}
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
                    key={friend.id}
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

          {/* Cerrar Sesion */}
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', width: '100%'
            }}
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>

        </div>
      )}
    </div>
  );
};

export default UserMenu;
