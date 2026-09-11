import { indexQuerySchema } from "@/lib/validators/index.schema";

describe("Index API Validation Schema", () => {
  it("defaults to daily frequency", () => {
    const parsed = indexQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.frequency).toBe("daily");
    }
  });

  it("accepts valid frequencies: daily, weekly, monthly", () => {
    ["daily", "weekly", "monthly"].forEach((freq) => {
      const parsed = indexQuerySchema.safeParse({ frequency: freq });
      expect(parsed.success).toBe(true);
    });
  });

  it("rejects unsupported frequencies", () => {
    const parsed = indexQuerySchema.safeParse({ frequency: "hourly" });
    expect(parsed.success).toBe(false);
  });
});
