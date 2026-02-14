import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@supabase/supabase-js';

/**
 * Ensure a user exists in the public.users table
 * This is a fallback in case the database trigger fails
 * @param user - Supabase auth user object
 * @returns The user ID
 */
export async function ensureUserExists(user: User): Promise<string> {
  try {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    
    // If user doesn't exist, create them
    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: user.id,
        email: user.email!,
        fullName: user.user_metadata?.full_name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      });
      
      console.log(`Created user in database: ${user.email}`);
    }
    
    return user.id;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    // Return user ID anyway - the trigger should have handled it
    return user.id;
  }
}

/**
 * Update user profile information
 * @param userId - User ID
 * @param updates - Partial user data to update
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    fullName?: string;
    avatarUrl?: string;
  }
) {
  try {
    await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error };
  }
}
