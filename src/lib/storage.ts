import { ChatSession, RoutineProduct, UserProfile } from '@/types';

const KEYS = {
  SESSIONS: 'skinsight_sessions',
  ROUTINE: 'skinsight_routine',
  PROFILE: 'skinsight_profile',
  ACTIVE_SESSION: 'skinsight_active_session',
};

export function getSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEYS.SESSIONS) || '[]'); }
  catch { return []; }
}

export function saveSession(session: ChatSession): void {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.unshift(session);
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions.slice(0, 20)));
}

export function deleteSession(id: string): void {
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(getSessions().filter(s => s.id !== id)));
}

export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEYS.ACTIVE_SESSION);
}

export function setActiveSessionId(id: string): void {
  localStorage.setItem(KEYS.ACTIVE_SESSION, id);
}

export function getRoutine(): RoutineProduct[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEYS.ROUTINE) || '[]'); }
  catch { return []; }
}

export function saveRoutine(routine: RoutineProduct[]): void {
  localStorage.setItem(KEYS.ROUTINE, JSON.stringify(routine));
}

export function getProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

export function clearAll(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
