const PREFIX = 'ft_';

function getKey(key) {
  return `${PREFIX}${key}`;
}

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(getKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(getKey(key), JSON.stringify(value));
    saveBackup();
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(getKey(key));
  } catch {
    // ignore
  }
}

// Export all app data as JSON string
export function exportAllData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX) && !key.startsWith(`${PREFIX}backup-`)) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key));
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

// Import data from JSON string
export function importAllData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith(PREFIX)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Clear all app data
export function clearAllData() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) keys.push(key);
  }
  keys.forEach(k => localStorage.removeItem(k));
}

// Auto-backup: saves a daily snapshot, keeps last 7 days
let backupThrottleTimer = null;
function saveBackup() {
  if (backupThrottleTimer) return;
  if (localStorage.getItem('ft_auto-backup') === 'off') return;
  backupThrottleTimer = setTimeout(() => {
    backupThrottleTimer = null;
    try {
      const today = new Date().toISOString().split('T')[0];
      const backupKey = `${PREFIX}backup-${today}`;
      const snapshot = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX) && !key.startsWith(`${PREFIX}backup-`)) {
          try {
            snapshot[key] = JSON.parse(localStorage.getItem(key));
          } catch {
            snapshot[key] = localStorage.getItem(key);
          }
        }
      }
      localStorage.setItem(backupKey, JSON.stringify(snapshot));
      pruneOldBackups();
    } catch {
      // ignore backup failures
    }
  }, 5000);
}

function pruneOldBackups() {
  const backupPrefix = `${PREFIX}backup-`;
  const backupKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(backupPrefix)) {
      backupKeys.push(key);
    }
  }
  backupKeys.sort();
  while (backupKeys.length > 7) {
    localStorage.removeItem(backupKeys.shift());
  }
}

// Get list of available backup dates
export function getBackupDates() {
  const backupPrefix = `${PREFIX}backup-`;
  const dates = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(backupPrefix)) {
      dates.push(key.replace(backupPrefix, ''));
    }
  }
  return dates.sort().reverse();
}

// Restore from a backup date
export function restoreBackup(date) {
  try {
    const backupKey = `${PREFIX}backup-${date}`;
    const raw = localStorage.getItem(backupKey);
    if (!raw) return false;
    const snapshot = JSON.parse(raw);
    // Clear current non-backup data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX) && !key.startsWith(`${PREFIX}backup-`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    // Restore
    for (const [key, value] of Object.entries(snapshot)) {
      if (key.startsWith(PREFIX)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Get days since last export (stored in ft_last-export)
export function getLastExportDate() {
  return load('last-export', null);
}

export function markExported() {
  localStorage.setItem(getKey('last-export'), JSON.stringify(new Date().toISOString().split('T')[0]));
}
