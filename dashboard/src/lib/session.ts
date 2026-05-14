import { cookies } from 'next/headers';

type SessionData = {
  userId: string;
  role: string;
  [key: string]: unknown;
};

// Configurações de segurança para o cookie
const cookieName = 'app_session';
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 1 semana
};

export async function createSession(sessionData: SessionData) {
  const cookieStore = await cookies();
  // Em um ambiente real, você deve criptografar/assinar (ex: usando jose ou iron-session)
  // o sessionData antes de salvar no cookie. Aqui estamos apenas simulando o armazenamento.
  const encryptedSessionData = Buffer.from(JSON.stringify(sessionData)).toString('base64');
  
  cookieStore.set(cookieName, encryptedSessionData, cookieOptions);
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(cookieName);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const decryptedData = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    return JSON.parse(decryptedData) as SessionData;
  } catch (error) {
    console.error('Erro ao decodificar a sessão:', error);
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}
