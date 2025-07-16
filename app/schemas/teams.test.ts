import { describe, expect, test } from "vitest";
import { z } from "zod";
import { teamSchema } from "./teams";

describe("schemas/teams", () => {
  describe("create", () => {
    test("should be valid", () => {
      const fixtures: z.input<typeof teamSchema>[] = [
        {
          name: "My Team",
          slug: "my-team",
        },
        {
          name: "A",
          slug: "a",
        },
        {
          name: "Team with longer name",
          slug: "team-123-abc",
        },
        {
          name: "Another Team",
          slug: "slug-with-numbers-123",
        },
      ];

      for (const fixture of fixtures) {
        expect(teamSchema.safeParse(fixture).success).toBeTruthy();
      }
    });

    test("should be invalid", () => {
      const fixtures: [z.input<typeof teamSchema>, string[]][] = [
        [
          {
            name: "",
            slug: "my-team",
          },
          ["Team name is required"],
        ],
        [
          {
            name: "My Team",
            slug: "",
          },
          ["Team slug is required"],
        ],
        [
          {
            name: "My Team",
            slug: "My-Team",
          },
          ["Slug can only contain lowercase letters, numbers, and hyphens"],
        ],
        [
          {
            name: "My Team",
            slug: "my_team",
          },
          ["Slug can only contain lowercase letters, numbers, and hyphens"],
        ],
        [
          {
            name: "My Team",
            slug: "my team",
          },
          ["Slug can only contain lowercase letters, numbers, and hyphens"],
        ],
        [
          {
            name: "My Team",
            slug: "my@team",
          },
          ["Slug can only contain lowercase letters, numbers, and hyphens"],
        ],
      ];

      for (const [fixture, errors] of fixtures) {
        const res = teamSchema.safeParse(fixture);

        expect(res.success).toBeFalsy();

        if (!res.success) {
          const errorMessages = res.error.issues.map((issue) => issue.message);
          expect(errorMessages).toEqual(errors);
        }
      }
    });
  });
});
