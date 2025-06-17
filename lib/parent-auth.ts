/**
 * Parent Dashboard PIN Authentication System
 * Separate security layer from Clerk auth for dashboard access
 */

import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export interface PinSetupData {
  parentClerkUserId: string;
  pin: string;
}

export interface PinVerificationResult {
  success: boolean;
  requiresSetup?: boolean;
  isLocked?: boolean;
  remainingAttempts?: number;
  lockoutUntil?: Date;
}

/**
 * Set up PIN for first-time dashboard access
 */
export async function setupDashboardPin(data: PinSetupData): Promise<boolean> {
  try {
    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(data.pin)) {
      throw new Error('PIN must be exactly 4 digits');
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(data.pin, 12);

    // Create or update PIN record
    await prisma.parentDashboardAccess.upsert({
      where: { parentClerkUserId: data.parentClerkUserId },
      create: {
        parentClerkUserId: data.parentClerkUserId,
        pinHash,
        pinCreatedAt: new Date(),
        failedAttempts: 0,
      },
      update: {
        pinHash,
        pinChangedAt: new Date(),
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    return true;
  } catch (error) {
    console.error('PIN setup error:', error);
    return false;
  }
}

/**
 * Verify PIN for dashboard access
 */
export async function verifyDashboardPin(
  parentClerkUserId: string,
  pin: string
): Promise<PinVerificationResult> {
  try {
    // Get PIN record
    const pinRecord = await prisma.parentDashboardAccess.findUnique({
      where: { parentClerkUserId },
    });

    // No PIN set up yet
    if (!pinRecord) {
      return { success: false, requiresSetup: true };
    }

    // Check if currently locked
    if (pinRecord.lockedUntil && pinRecord.lockedUntil > new Date()) {
      return {
        success: false,
        isLocked: true,
        lockoutUntil: pinRecord.lockedUntil,
      };
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      return {
        success: false,
        remainingAttempts: 3 - pinRecord.failedAttempts,
      };
    }

    // Verify PIN
    const isValid = await bcrypt.compare(pin, pinRecord.pinHash);

    if (isValid) {
      // Reset failed attempts and update last access
      await prisma.parentDashboardAccess.update({
        where: { parentClerkUserId },
        data: {
          failedAttempts: 0,
          lastSuccessfulAccess: new Date(),
          lockedUntil: null,
        },
      });

      return { success: true };
    } else {
      // Increment failed attempts
      const newFailedAttempts = pinRecord.failedAttempts + 1;
      const maxAttempts = 5;
      const isNowLocked = newFailedAttempts >= maxAttempts;

      await prisma.parentDashboardAccess.update({
        where: { parentClerkUserId },
        data: {
          failedAttempts: newFailedAttempts,
          lockedUntil: isNowLocked
            ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes lockout
            : null,
        },
      });

      return {
        success: false,
        isLocked: isNowLocked,
        remainingAttempts: Math.max(0, maxAttempts - newFailedAttempts),
        lockoutUntil: isNowLocked
          ? new Date(Date.now() + 15 * 60 * 1000)
          : undefined,
      };
    }
  } catch (error) {
    console.error('PIN verification error:', error);
    return { success: false };
  }
}

/**
 * Check if user needs to set up PIN
 */
export async function needsPinSetup(
  parentClerkUserId: string
): Promise<boolean> {
  try {
    const pinRecord = await prisma.parentDashboardAccess.findUnique({
      where: { parentClerkUserId },
    });

    return !pinRecord;
  } catch (error) {
    console.error('PIN setup check error:', error);
    return true; // Default to requiring setup if error
  }
}

/**
 * Change existing PIN
 */
export async function changeDashboardPin(
  parentClerkUserId: string,
  currentPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify current PIN first
    const verification = await verifyDashboardPin(
      parentClerkUserId,
      currentPin
    );
    if (!verification.success) {
      return { success: false, error: 'Current PIN is incorrect' };
    }

    // Validate new PIN format
    if (!/^\d{4}$/.test(newPin)) {
      return { success: false, error: 'New PIN must be exactly 4 digits' };
    }

    // Don't allow same PIN
    if (currentPin === newPin) {
      return {
        success: false,
        error: 'New PIN must be different from current PIN',
      };
    }

    // Hash new PIN
    const pinHash = await bcrypt.hash(newPin, 12);

    // Update PIN
    await prisma.parentDashboardAccess.update({
      where: { parentClerkUserId },
      data: {
        pinHash,
        pinChangedAt: new Date(),
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('PIN change error:', error);
    return { success: false, error: 'Failed to change PIN' };
  }
}

/**
 * Reset PIN via email (for forgot PIN scenario)
 */
export async function requestPinReset(
  parentClerkUserId: string
): Promise<boolean> {
  try {
    // Generate temporary reset token
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store reset token (you'll need to add this to schema)
    await prisma.parentDashboardAccess.update({
      where: { parentClerkUserId },
      data: {
        resetToken,
        resetTokenExpires: resetExpires,
      },
    });

    // TODO: Send reset email with token
    // This would integrate with your email system

    return true;
  } catch (error) {
    console.error('PIN reset request error:', error);
    return false;
  }
}
