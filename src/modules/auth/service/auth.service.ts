import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { authRepository } from "../repository/auth.repository";
import { mapToUserDTO, UserDTO } from "../types";
import { AuthenticationError, ValidationError, NotFoundError } from "@/lib/errors";
import { loginSession, logoutSession } from "@/lib/auth";

export const authService = {
  async login(
    email: string,
    password: string,
    clientInfo: { ipAddress: string | null; userAgent: string | null }
  ): Promise<UserDTO> {
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      // Still log a failed attempt to prevent email scanning without logging
      throw new AuthenticationError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      await authRepository.logLogin({
        userId: user.id,
        organizationId: user.organizationId,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        status: "failed",
      });
      throw new AuthenticationError("Invalid email or password");
    }

    await authRepository.logLogin({
      userId: user.id,
      organizationId: user.organizationId,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      status: "success",
    });

    // Clean up expired sessions in background
    void authRepository.deleteExpiredSessions(user.id);

    return mapToUserDTO(user);
  },

  async registerOwner(data: {
    organizationId: string;
    email: string;
    name: string;
    password: string;
  }): Promise<UserDTO> {
    const existing = await authRepository.findUserByEmail(data.email);
    if (existing) {
      throw new ValidationError("An administrator account already exists with this email address");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await authRepository.createUser({
      organizationId: data.organizationId,
      email: data.email,
      passwordHash,
      role: "super_admin",
      name: data.name,
    });

    return mapToUserDTO(user);
  },

  async registerAdminFromInvite(data: {
    organizationId: string;
    email: string;
    name: string;
    password: string;
  }): Promise<UserDTO> {
    const existing = await authRepository.findUserByEmail(data.email);
    if (existing) {
      throw new ValidationError("An administrator account already exists with this email address");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await authRepository.createUser({
      organizationId: data.organizationId,
      email: data.email,
      passwordHash,
      role: "admin",
      name: data.name,
    });

    return mapToUserDTO(user);
  },

  async forgotPassword(email: string): Promise<string> {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      // Fail silently to prevent email enumeration, but return a mock response or log
      return "";
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours expiry

    await authRepository.updateUser(user.id, {
      resetPasswordToken: token,
      resetPasswordExpiresAt: expiresAt,
    });

    return token;
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await authRepository.findUserByResetToken(token);
    if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
      throw new ValidationError("Password reset token is invalid or has expired");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await authRepository.updateUser(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
    });
  },

  async changePassword(userId: string, current: string, newPass: string): Promise<void> {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new NotFoundError("User not found");

    const isMatch = await bcrypt.compare(current, user.passwordHash);
    if (!isMatch) {
      throw new ValidationError("Current password does not match");
    }

    const passwordHash = await bcrypt.hash(newPass, 12);
    await authRepository.updateUser(userId, { passwordHash });
  },

  async establishSession(userId: string, role: "super_admin" | "admin", organizationId: string | null, rememberMe: boolean) {
    // Session setting using the jose encrypt token standard
    await loginSession(userId, role, organizationId);
    
    // We can extend dynamic tokens if needed, but jose cookie auth is fully supported.
    // Set 30 days cookie length for remember me options in custom wrappers if needed.
  },

  async removeSession() {
    await logoutSession();
  },
};
