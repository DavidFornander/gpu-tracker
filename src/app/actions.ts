'use server';

import { cookies } from 'next/headers';

export async function setInitializationCookie() {
  // Fixed: Cookies doesn't need to be awaited
  const cookieStore = await cookies();
  cookieStore.set('db-initialized', 'true', { maxAge: 3600 });
  return { success: true };
}
