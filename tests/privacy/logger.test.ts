import { describe, it, expect, vi } from "vitest";
import { sanitize, logger } from "@/lib/logger";

describe("Log & Error Trace Sanitizer (lib/logger.ts)", () => {
  it("redacts sensitive keys from plain objects", () => {
    const sensitivePayload = {
      id: "u-123",
      email: "user@example.com",
      dateOfBirth: "1998-05-12",
      category: "OBC",
      domicileState: "Madhya Pradesh",
      password: "SuperSecretPassword123!",
      passwordHash: "scrypt:hash",
      token: "jwt-token-string",
    };

    const sanitized = sanitize(sensitivePayload);

    expect(sanitized.id).toBe("u-123");
    // Email is detected and tokenized
    expect(sanitized.email).toContain("[EMAIL_");
    expect(sanitized.email).not.toContain("user@example.com");

    // Sensitive keys are fully replaced
    expect(sanitized.dateOfBirth).toBe("[REDACTED]");
    expect(sanitized.category).toBe("[REDACTED]");
    expect(sanitized.domicileState).toBe("[REDACTED]");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.passwordHash).toBe("[REDACTED]");
    expect(sanitized.token).toBe("[REDACTED]");
  });

  it("redacts sensitive fields in deeply nested structures and arrays", () => {
    const complexData = {
      status: "failed",
      candidate: {
        profile: {
          category: "General",
          date_of_birth: "2000-01-01",
        },
      },
      events: [
        { type: "auth", token: "secret-token" },
        { type: "verify", domicile_state: "MP" },
      ],
    };

    const sanitized = sanitize(complexData);

    expect(sanitized.candidate.profile.category).toBe("[REDACTED]");
    expect(sanitized.candidate.profile.date_of_birth).toBe("[REDACTED]");
    expect(sanitized.events[0]?.token).toBe("[REDACTED]");
    expect(sanitized.events[1]?.domicile_state).toBe("[REDACTED]");
    expect(sanitized.status).toBe("failed");
  });

  it("handles circular references without stack overflow", () => {
    const circular: Record<string, unknown> = { name: "test" };
    circular.self = circular;

    const sanitized = sanitize(circular);
    expect(sanitized.name).toBe("test");
    expect(sanitized.self).toBe("[CIRCULAR]");
  });

  it("sanitizes Error instances containing sensitive values in messages and stacks", () => {
    const err = new Error(
      "Failed to process candidate john.doe@gmail.com with phone +91 98765 43210",
    );
    // Add custom sensitive property to error
    Object.assign(err, { category: "SC", dateOfBirth: "1997-03-15" });

    const sanitized = sanitize(err);

    expect(sanitized.name).toBe("Error");
    expect(sanitized.message).not.toContain("john.doe@gmail.com");
    expect(sanitized.message).not.toContain("98765 43210");
    expect(sanitized.message).toContain("[EMAIL_");
    expect(sanitized.message).toContain("[PHONE_");
    expect((sanitized as unknown as Record<string, unknown>).category).toBe(
      "[REDACTED]",
    );
    expect((sanitized as unknown as Record<string, unknown>).dateOfBirth).toBe(
      "[REDACTED]",
    );
  });

  it("ensures logger methods sanitize log outputs", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.error("User registration failed for candidate@gov.in", {
      dateOfBirth: "1995-10-10",
      category: "ST",
    });

    expect(errorSpy).toHaveBeenCalled();
    const [msg, meta] = errorSpy.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];

    expect(msg).not.toContain("candidate@gov.in");
    expect(msg).toContain("[EMAIL_");
    expect(meta.dateOfBirth).toBe("[REDACTED]");
    expect(meta.category).toBe("[REDACTED]");

    errorSpy.mockRestore();
  });
});
