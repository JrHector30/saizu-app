import React, { useState, useRef } from 'react';
import { useSuitcase } from '../context/SuitcaseContext';
import { Sun, Shirt, Briefcase, Heart, Umbrella, Dumbbell, Watch, Anchor, ShoppingBag, Package, Star, Moon, Coffee, Scissors, Camera, Glasses, X, Check, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export const ICONS_MAP = {
  Sun, Shirt, Briefcase, Heart, Umbrella, Dumbbell, Watch, Anchor, ShoppingBag, Package, Star, Moon, Coffee, Scissors, Camera, Glasses
};

const ProfilesSidebar = () => {
  const { profilesList, activeProfileId, setActiveProfileId, createNewProfile, deleteProfile, viewingFriend } = useSuitcase();
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Shirt');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const name = newProfileName.trim();
    if (name) {
      createNewProfile(name, selectedIcon);
    }
    setIsCreating(false);
    setNewProfileName('');
    setSelectedIcon('Shirt');
  };

  const cancelCreation = () => {
    setIsCreating(false);
    setNewProfileName('');
    setSelectedIcon('Shirt');
  };

  const handleDelete = (e, id) => {
    e.stopPropagation(); // Avoid selecting it when deleting
    deleteProfile(id);
  };

  return (
    <div className={`profiles-sidebar glass-panel-dark ${isExpanded ? 'expanded' : ''} ${isCollapsed ? 'collapsed' : ''}`}>

      {/* ===== VERSIÓN PC: sidebar vertical ===== */}
      <div className="sidebar-desktop">

        {/* Botón colapsar/expandir */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setIsCollapsed(prev => !prev)}
          title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Título — solo visible cuando expandido */}
        {!isCollapsed && (
          <h2 className="sidebar-title">
            {viewingFriend
              ? `Armario de ${viewingFriend.profile_name || viewingFriend.saizu_id}`
              : 'Mis Outfits'}
          </h2>
        )}

        <div className="profiles-list">
          {profilesList.map(profile => {
            const IconComponent = ICONS_MAP[profile.icon] || ICONS_MAP['Package'];
            return (
              <div
                key={profile.id}
                className={`profile-btn ${activeProfileId === profile.id ? 'active' : ''}`}
                onClick={() => setActiveProfileId(profile.id)}
                title={profile.profile_name}
              >
                <IconComponent size={18} opacity={activeProfileId === profile.id ? 1 : 0.6} />
                {!isCollapsed && (
                  <>
                    <span className="profile-name">{profile.profile_name}</span>
                    {activeProfileId !== profile.id && !viewingFriend && (
                      <button
                        className="delete-profile-btn"
                        onClick={(e) => handleDelete(e, profile.id)}
                        title="Eliminar"
                      >✕</button>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {!viewingFriend && !isCollapsed && (
            isCreating ? (
              <div className="profile-create-form glassmorphism-create" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ej. Verano..."
                    value={newProfileName}
                    onChange={e => setNewProfileName(e.target.value)}
                    className="inline-create-input"
                    style={{ flex: 1, padding: '0.5rem', marginBottom: 0 }}
                  />
                  <button type="button" onClick={handleCreateSubmit} className="confirm-btn mini" style={{ padding: '0 0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}><Check size={16}/></button>
                  <button type="button" onClick={cancelCreation} className="cancel-btn mini" style={{ padding: '0 0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}><X size={16}/></button>
                </div>
                <div className="icon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {Object.keys(ICONS_MAP).map(iconKey => {
                    const IconComp = ICONS_MAP[iconKey];
                    return (
                      <button key={iconKey} type="button" onClick={() => setSelectedIcon(iconKey)} className={`icon-picker-btn ${selectedIcon === iconKey ? 'selected' : ''}`}>
                        <IconComp size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button className="new-profile-btn" onClick={() => setIsCreating(true)}>
                + Nuevo Perfil
              </button>
            )
          )}

          {!viewingFriend && isCollapsed && (
            <button
              className="new-profile-btn collapsed-add"
              onClick={() => { setIsCollapsed(false); setIsCreating(true); }}
              title="Nuevo Perfil"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* ===== VERSIÓN MÓVIL: drawer desde arriba ===== */}
      <div className="sidebar-mobile">
        <div
          className="sidebar-topbar"
          onClick={() => setIsExpanded(prev => !prev)}
        >
          <div className="sidebar-topbar-left">
            {activeProfileId && !isExpanded ? (
              (() => {
                const active = profilesList.find(p => p.id === activeProfileId);
                const IconComponent = active ? (ICONS_MAP[active.icon] || ICONS_MAP['Package']) : null;
                return active ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                    {IconComponent && <IconComponent size={16} />}
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{active.profile_name}</span>
                  </div>
                ) : null;
              })()
            ) : (
              <h2 className="sidebar-title">
                {viewingFriend
                  ? `Armario de ${viewingFriend.profile_name || viewingFriend.saizu_id}`
                  : 'Mis Outfits'}
              </h2>
            )}
          </div>
          <ChevronDown
            size={20}
            color="#fff"
            className={`sidebar-chevron ${isExpanded ? 'rotated' : ''}`}
          />
        </div>

        <div className="sidebar-drawer-content">
          <div className="profiles-list">
            {profilesList.map(profile => {
              const IconComponent = ICONS_MAP[profile.icon] || ICONS_MAP['Package'];
              return (
                <div
                  key={profile.id}
                  className={`profile-btn ${activeProfileId === profile.id ? 'active' : ''}`}
                  onClick={() => { setActiveProfileId(profile.id); setIsExpanded(false); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <IconComponent size={18} opacity={activeProfileId === profile.id ? 1 : 0.6} />
                    <span className="profile-name">{profile.profile_name}</span>
                  </div>
                  {activeProfileId !== profile.id && !viewingFriend && (
                    <button className="delete-profile-btn" onClick={(e) => handleDelete(e, profile.id)} title="Eliminar Perfil">✕</button>
                  )}
                </div>
              );
            })}

            {!viewingFriend && (
              isCreating ? (
                <div className="profile-create-form glassmorphism-create" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" autoFocus placeholder="Ej. Verano..." value={newProfileName} onChange={e => setNewProfileName(e.target.value)} className="inline-create-input" style={{ flex: 1, padding: '0.5rem', marginBottom: 0 }} />
                    <button type="button" onClick={handleCreateSubmit} className="confirm-btn mini" style={{ padding: '0 0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}><Check size={16}/></button>
                    <button type="button" onClick={cancelCreation} className="cancel-btn mini" style={{ padding: '0 0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}><X size={16}/></button>
                  </div>
                  <div className="icon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {Object.keys(ICONS_MAP).map(iconKey => {
                      const IconComp = ICONS_MAP[iconKey];
                      return (
                        <button key={iconKey} type="button" onClick={() => setSelectedIcon(iconKey)} className={`icon-picker-btn ${selectedIcon === iconKey ? 'selected' : ''}`}>
                          <IconComp size={18} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <button className="new-profile-btn" onClick={() => setIsCreating(true)}>+ Nuevo Perfil</button>
              )
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProfilesSidebar;
