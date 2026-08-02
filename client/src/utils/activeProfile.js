let activeProfile = null;

export function setActiveProfile(id) {
  activeProfile = id || null;
}

export function getActiveProfile() {
  return activeProfile;
}
