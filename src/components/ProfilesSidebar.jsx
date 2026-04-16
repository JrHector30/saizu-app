import React, { useState } from 'react';
import { useSuitcase } from '../context/SuitcaseContext';

const ProfilesSidebar = () => {
  const { profilesList, activeProfileId, setActiveProfileId, createNewProfile, deleteProfile } = useSuitcase();
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const name = newProfileName.trim();
    if (name) {
      createNewProfile(name);
    }
    setIsCreating(false);
    setNewProfileName('');
  };

  const handleDelete = (e, id) => {
    e.stopPropagation(); // Avoid selecting it when deleting
    deleteProfile(id);
  };

  return (
    <div className="profiles-sidebar glass-panel-dark">
      <h2 className="sidebar-title">Mis Outfits</h2>
      
      <div className="profiles-list">
        {profilesList.map(profile => (
          <div 
            key={profile.id} 
            className={`profile-btn ${activeProfileId === profile.id ? 'active' : ''}`}
            onClick={() => setActiveProfileId(profile.id)}
          >
            <span className="profile-name">{profile.profile_name}</span>
            {activeProfileId !== profile.id && (
              <button className="delete-profile-btn" onClick={(e) => handleDelete(e, profile.id)} title="Eliminar Perfil">
                ✕
              </button>
            )}
          </div>
        ))}

        {isCreating ? (
          <form className="profile-create-form" onSubmit={handleCreateSubmit}>
            <input 
              type="text" 
              autoFocus 
              placeholder="Ej. Verano..." 
              value={newProfileName}
              onChange={e => setNewProfileName(e.target.value)}
              onBlur={() => setIsCreating(false)} // Si quita el cursor, cancela
              className="inline-create-input"
            />
          </form>
        ) : (
          <button className="new-profile-btn" onClick={() => setIsCreating(true)}>
            + Nuevo Perfil
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilesSidebar;
