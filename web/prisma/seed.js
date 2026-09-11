const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Neon database with sample APIx flight fares...");

  const routes = [
    { origin: "DEL", destination: "BOM", basePrice: 4800 },
    { origin: "DEL", destination: "BLR", basePrice: 5400 },
    { origin: "BOM", destination: "BLR", basePrice: 3900 },
    { origin: "DEL", destination: "CCU", basePrice: 4200 },
    { origin: "BLR", destination: "HYD", basePrice: 2800 },
    { origin: "MAA", destination: "DEL", basePrice: 5100 },
  ];

  const carriers = [
    { name: "IndiGo", code: "6E", source: "indigo", sourceType: "airline" },
    { name: "Air India", code: "AI", source: "airindia", sourceType: "airline" },
    { name: "MakeMyTrip", code: "6E", source: "makemytrip", sourceType: "ota" },
    { name: "EaseMyTrip", code: "AI", source: "easemytrip", sourceType: "ota" },
  ];

  const today = new Date();
  const faresToInsert = [];

  // Generate fares for 30 advance purchase days
  for (let advanceDays = 0; advanceDays <= 30; advanceDays += 2) {
    const travelDate = new Date(today);
    travelDate.setDate(today.getDate() + advanceDays);

    for (const route of routes) {
      for (const carrier of carriers) {
        // Price escalates as advance purchase days decrease
        const escalationFactor = 1 + (30 - advanceDays) * 0.025;
        const randomVariation = 0.9 + Math.random() * 0.2;
        const totalFare = Math.round(route.basePrice * escalationFactor * randomVariation);
        const baseFare = Math.round(totalFare * 0.82);
        const taxes = totalFare - baseFare;
        const isOutlier = Math.random() < 0.03;

        faresToInsert.push({
          route_origin: route.origin,
          route_destination: route.destination,
          travel_date: travelDate,
          advance_purchase_days: advanceDays,
          source: carrier.source,
          source_type: carrier.sourceType,
          carrier: carrier.name,
          flight_number: `${carrier.code}-${100 + Math.floor(Math.random() * 800)}`,
          fare_class: "Economy",
          base_fare: baseFare,
          taxes_and_fees: taxes,
          total_fare: isOutlier ? totalFare * 2.5 : totalFare,
          currency: "INR",
          is_outlier: isOutlier,
          scraped_at: today,
        });
      }
    }
  }

  // Clear existing fares and insert sample batch
  await prisma.fare.deleteMany({});
  await prisma.fare.createMany({ data: faresToInsert });

  console.log(`Successfully seeded ${faresToInsert.length} fare records into Neon DB!`);

  // Seed sample Index values
  const indexValuesToInsert = [];
  for (let i = 30; i >= 0; i--) {
    const indexDate = new Date(today);
    indexDate.setDate(today.getDate() - i);

    indexValuesToInsert.push({
      date: indexDate,
      origin: null,
      destination: null,
      frequency: "daily",
      index_value: 100 + (30 - i) * 0.4 + (Math.random() * 4 - 2),
      pct_change: (Math.random() * 2 - 1).toFixed(2),
    });
  }

  await prisma.indexValue.deleteMany({});
  await prisma.indexValue.createMany({ data: indexValuesToInsert });

  console.log(`Successfully seeded ${indexValuesToInsert.length} daily index values into Neon DB!`);
}

main()
  .catch((e) => {
    console.error("Error seeding Neon DB:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
 