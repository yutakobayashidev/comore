import { describe, expect, test } from "vitest";
import { z } from "zod";
import { socialLinksSchema } from "./social-links";

describe("schemas/social-links", () => {
  describe("create", () => {
    test("should be valid", () => {
      const fixtures: z.input<typeof socialLinksSchema>[] = [
        {
          websiteUrl: "https://example.com",
          twitterUsername: "username123",
          blueskyAddress: "@user.bsky.social",
          activityPubAddress: "@user@mastodon.social",
        },
        {
          websiteUrl: "",
          twitterUsername: "",
          blueskyAddress: "",
          activityPubAddress: "",
        },
        {
          websiteUrl: undefined,
          twitterUsername: undefined,
          blueskyAddress: undefined,
          activityPubAddress: undefined,
        },
        {
          websiteUrl: "https://test.io",
          twitterUsername: "test_user",
          blueskyAddress: "@test.bsky.social",
          activityPubAddress: "@test@example.social",
        },
      ];

      for (const fixture of fixtures) {
        expect(socialLinksSchema.safeParse(fixture).success).toBeTruthy();
      }
    });

    test("should be invalid", () => {
      const fixtures: [z.input<typeof socialLinksSchema>, string[]][] = [
        [
          {
            websiteUrl: "not-a-url",
          },
          ["Please enter a valid URL"],
        ],
        [
          {
            twitterUsername: "user@name",
          },
          ["Username can only contain letters, numbers, and underscores"],
        ],
        [
          {
            blueskyAddress: "user.bsky.social",
          },
          ["Please enter a valid Bluesky address (e.g., @username.bsky.social)"],
        ],
        [
          {
            activityPubAddress: "@username",
          },
          ["Please enter a valid ActivityPub address (e.g., @username@mastodon.social)"],
        ],
        [
          {
            activityPubAddress: "username@mastodon.social",
          },
          ["Please enter a valid ActivityPub address (e.g., @username@mastodon.social)"],
        ],
      ];

      for (const [fixture, errors] of fixtures) {
        const res = socialLinksSchema.safeParse(fixture);

        expect(res.success).toBeFalsy();

        if (!res.success) {
          expect(errors).toEqual(res.error.errors.map((e) => e.message));
        }
      }
    });
  });
});