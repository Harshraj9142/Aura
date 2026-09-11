import { faresQuerySchema } from "@/lib/validators/fares.schema";

describe("Fares API Validation Schema", () => {
  it("parses valid query parameters with defaults", () => {
    const parsed = faresQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(1);
      expect(parsed.data.limit).toBe(25);
      expect(parsed.data.sortBy).toBe("scraped_at");
      expect(parsed.data.sortOrder).toBe("desc");
    }
  });

  it("validates valid IATA codes for origin and destination", () => {
    const parsed = faresQuerySchema.safeParse({
      origin: "DEL",
      destination: "BOM",
      page: "2",
      limit: "50",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.origin).toBe("DEL");
      expect(parsed.data.destination).toBe("BOM");
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.limit).toBe(50);
    }
  });

  it("rejects invalid IATA codes", () => {
    const parsed = faresQuerySchema.safeParse({
      origin: "INVALID_CODE",
    });
    expect(parsed.success).toBe(false);
  });
});
