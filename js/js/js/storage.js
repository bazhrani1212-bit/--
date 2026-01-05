export function loadState(storageKey){
  const raw = localStorage.getItem(storageKey);
  if(!raw) return null;
  try{ return JSON.parse(raw); } catch { return null; }
}

export function saveState(storageKey, state){
  localStorage.setItem(storageKey, JSON.stringify(state));
}

export function bumpLocalVisits(key){
  const v = parseInt(localStorage.getItem(key) || "0", 10) + 1;
  localStorage.setItem(key, String(v));
  return v;
}
