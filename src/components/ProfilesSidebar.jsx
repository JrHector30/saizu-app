import React, { useState, useRef } from 'react';
import { useSuitcase } from '../context/SuitcaseContext';
import { Sun, Shirt, Briefcase, Heart, Umbrella, Dumbbell, Watch, Anchor, ShoppingBag, Package, Star, Moon, Coffee, Scissors, Camera, Glasses, X, Check } from 'lucide-react';

export const ICONS_MAP = {
  Sun, Shirt, Briefcase, Heart, Umbrella, Dumbbell, Watch, Anchor, ShoppingBag, Package, Star, Moon, Coffee, Scissors, Camera, Glasses
};

const ProfilesSidebar = () => {
  const { profilesList, activeProfileId, setActiveProfileId, createNewProfile, deleteProfile, viewingFriend } = useSuitcase();
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Shirt');

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
    <div className="profiles-sidebar glass-panel-dark">
      <h2 className="sidebar-title">
        {viewingFriend ? `Armario de ${viewingFriend.profile_name || viewingFriend.saizu_id}` : 'Mis Outfits'}
      </h2>
      
      <div className="profiles-list">
        {profilesList.map(profile => {
          const IconComponent = ICONS_MAP[profile.icon] || ICONS_MAP['Package'];
          return (
            <div 
              key={profile.id} 
              className={`profile-btn ${activeProfileId === profile.id ? 'active' : ''}`}
              onClick={() => setActiveProfileId(profile.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <IconComponent size={18} opacity={activeProfileId === profile.id ? 1 : 0.6} />
                <span className="profile-name">{profile.profile_name}</span>
              </div>
              {activeProfileId !== profile.id && !viewingFriend && (
                <button className="delete-profile-btn" onClick={(e) => handleDelete(e, profile.id)} title="Eliminar Perfil">
                  ✕
                </button>
              )}
            </div>
          );
        })}

        {!viewingFriend && (
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
                    <button 
                      key={iconKey}
                      type="button"
                      onClick={() => setSelectedIcon(iconKey)}
                      className={`icon-picker-btn ${selectedIcon === iconKey ? 'selected' : ''}`}
                    >
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
      </div>
    </div>
  );
};

export default ProfilesSidebar;
