// lib/auth/session.ts  (Let's rename the file for clarity)

import 'server-only';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET_KEY; // Ensure this is set in .env.local

// Define the structure of your user session from the JWT
export interface SessionPayload extends JwtPayload {
  id: string;
  userRole: 'branch_user' | 'head_office_approver' | 'system_admin';
  email:string
  branch_id?: string | null;

  // Add any other data you store in the token
}

// Renamed from useAuth to be clearer about its purpose
export async function getCurrentUser(): Promise<SessionPayload | null> {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

    const token = await (await cookies()).get('token')?.value

  if (!token) {
    return null;
  }

  try {
    // Verify and decode the token. The type assertion tells TS what to expect.
    const decoded = await jwt.verify(token, JWT_SECRET) as SessionPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}





