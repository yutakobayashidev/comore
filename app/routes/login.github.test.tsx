import { describe, expect, it } from "vitest";
import { loader } from "~/routes/login.github";
import type { LoaderFunctionArgs } from "react-router";

describe("~/routes/login.github", () => {
  const createMockArgs = (
    overrides?: Partial<LoaderFunctionArgs>,
  ): LoaderFunctionArgs => ({
    params: {},
    request: new Request("https://localhost:5173/login/github"),
    context: {
      cloudflare: {
        env: {
          GITHUB_CLIENT_ID: "test-client-id",
          GITHUB_CLIENT_SECRET: "test-client-secret",
        },
      },
    },
    ...overrides,
  });

  describe("loader", () => {
    it("redirects to GitHub OAuth URL with proper state cookie", async () => {
      const mockArgs = createMockArgs();
      const response = await loader(mockArgs);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(302);

      const location = response.headers.get("Location");
      expect(location).toBeTruthy();
      expect(location).toContain("https://github.com/login/oauth/authorize");
      expect(location).toContain("client_id=test-client-id");

      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain("github_oauth_state=");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("SameSite=Lax");
      expect(setCookie).toContain("Max-Age=600");
    });

    it("includes Secure flag in production environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const mockArgs = createMockArgs();
      const response = await loader(mockArgs);

      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain("; Secure");

      process.env.NODE_ENV = originalEnv;
    });

    it("does not include Secure flag in development environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const mockArgs = createMockArgs();
      const response = await loader(mockArgs);

      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).not.toContain("; Secure");

      process.env.NODE_ENV = originalEnv;
    });

    it("generates unique state values for each request", async () => {
      const mockArgs = createMockArgs();

      const response1 = await loader(mockArgs);
      const response2 = await loader(mockArgs);

      const state1 = response1.headers
        .get("Set-Cookie")
        ?.match(/github_oauth_state=([^;]+)/)?.[1];
      const state2 = response2.headers
        .get("Set-Cookie")
        ?.match(/github_oauth_state=([^;]+)/)?.[1];

      expect(state1).toBeTruthy();
      expect(state2).toBeTruthy();
      expect(state1).not.toBe(state2);
    });

    it("uses different client ID from environment", async () => {
      const mockArgs = createMockArgs({
        context: {
          cloudflare: {
            env: {
              GITHUB_CLIENT_ID: "different-client-id",
              GITHUB_CLIENT_SECRET: "different-client-secret",
            },
          },
        },
      });

      const response = await loader(mockArgs);
      const location = response.headers.get("Location");

      expect(location).toContain("client_id=different-client-id");
    });

    it("handles request from different origins", async () => {
      const mockArgs = createMockArgs({
        request: new Request("https://example.com/login/github"),
      });

      const response = await loader(mockArgs);

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toContain(
        "https://github.com/login/oauth/authorize",
      );
    });

    it("sets proper cookie attributes", async () => {
      const mockArgs = createMockArgs();
      const response = await loader(mockArgs);

      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toMatch(/Path=\//);
      expect(setCookie).toMatch(/Max-Age=600/);
      expect(setCookie).toMatch(/HttpOnly/);
      expect(setCookie).toMatch(/SameSite=Lax/);
    });
  });
});
