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
    if (key && key.startsWith(PREFIX)) {
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
