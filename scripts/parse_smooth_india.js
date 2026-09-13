const fs = require("fs");
const path = require("path");

// High-resolution smooth GeoJSON for India with detailed organic curves
const smoothIndiaGeoJSON = {
  type: "FeatureCollection",
  features: [
    // Jammu & Kashmir and Ladakh (Northern Crown)
    {
      type: "Feature",
      properties: { name: "Jammu & Kashmir & Ladakh", code: "JK" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.5, 34.5], [74.0, 35.5], [74.8, 36.8], [75.5, 37.1], [76.5, 36.5],
            [77.8, 35.8], [78.9, 35.5], [79.2, 34.2], [79.0, 33.2], [78.6, 32.5],
            [77.5, 32.2], [76.5, 32.0], [75.6, 32.2], [74.8, 32.7], [74.0, 33.5],
            [73.5, 34.5]
          ]
        ]
      }
    },
    // Himachal Pradesh
    {
      type: "Feature",
      properties: { name: "Himachal Pradesh", code: "HP" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [75.6, 32.2], [76.5, 33.0], [77.5, 33.0], [78.6, 32.3], [79.0, 31.8],
            [78.4, 31.0], [77.6, 30.5], [76.3, 31.0], [75.6, 32.2]
          ]
        ]
      }
    },
    // Punjab
    {
      type: "Feature",
      properties: { name: "Punjab", code: "PB" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.5, 32.4], [75.6, 32.2], [76.3, 31.0], [76.8, 30.4], [75.8, 29.8],
            [74.8, 29.6], [73.9, 30.0], [74.2, 31.2], [74.5, 32.4]
          ]
        ]
      }
    },
    // Uttarakhand
    {
      type: "Feature",
      properties: { name: "Uttarakhand", code: "UK" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.6, 30.5], [78.4, 31.0], [79.0, 31.8], [80.2, 31.2], [81.1, 30.2],
            [80.5, 29.2], [79.4, 28.8], [78.0, 29.5], [77.6, 30.5]
          ]
        ]
      }
    },
    // Haryana & Delhi
    {
      type: "Feature",
      properties: { name: "Haryana & Delhi", code: "HR" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.8, 29.6], [75.8, 29.8], [76.8, 30.4], [77.6, 30.5], [77.4, 28.6],
            [77.3, 28.1], [76.5, 27.8], [75.2, 28.1], [74.6, 28.8], [74.8, 29.6]
          ]
        ]
      }
    },
    // Rajasthan (Smooth Western Border)
    {
      type: "Feature",
      properties: { name: "Rajasthan", code: "RJ" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [69.8, 24.5], [69.5, 26.0], [70.2, 27.2], [71.0, 28.2], [72.5, 29.4],
            [73.9, 30.0], [74.8, 29.6], [74.6, 28.8], [75.2, 28.1], [76.5, 27.8],
            [77.5, 27.3], [77.8, 26.5], [76.8, 24.5], [75.5, 24.0], [74.2, 23.5],
            [73.2, 24.5], [71.2, 24.6], [69.8, 24.5]
          ]
        ]
      }
    },
    // Gujarat (Smooth Kutch & Kathiawar Peninsulas)
    {
      type: "Feature",
      properties: { name: "Gujarat", code: "GJ" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [68.2, 23.7], [69.2, 24.3], [70.5, 24.6], [71.8, 24.6], [73.2, 24.5],
            [74.2, 23.5], [73.8, 21.8], [72.8, 20.3], [72.7, 21.2], [72.0, 22.0],
            [70.8, 20.7], [69.5, 20.8], [69.0, 22.2], [69.8, 23.0], [68.8, 23.4],
            [68.2, 23.7]
          ]
        ]
      }
    },
    // Uttar Pradesh
    {
      type: "Feature",
      properties: { name: "Uttar Pradesh", code: "UP" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.4, 28.6], [78.0, 29.5], [79.4, 28.8], [80.5, 29.2], [82.0, 28.6],
            [83.5, 28.0], [84.6, 27.3], [84.4, 25.5], [83.2, 24.5], [81.8, 24.8],
            [79.8, 24.5], [78.5, 24.2], [77.8, 26.5], [77.5, 27.3], [77.4, 28.6]
          ]
        ]
      }
    },
    // Madhya Pradesh
    {
      type: "Feature",
      properties: { name: "Madhya Pradesh", code: "MP" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.2, 23.5], [75.5, 24.0], [76.8, 24.5], [78.5, 24.2], [79.8, 24.5],
            [81.8, 24.8], [82.8, 24.0], [82.2, 22.2], [81.2, 21.5], [79.5, 21.5],
            [77.5, 21.3], [75.2, 21.4], [74.2, 22.2], [74.2, 23.5]
          ]
        ]
      }
    },
    // Maharashtra (Smooth Konkan Coastline)
    {
      type: "Feature",
      properties: { name: "Maharashtra", code: "MH" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.8, 20.3], [73.8, 21.8], [75.2, 21.4], [77.5, 21.3], [79.5, 21.5],
            [80.8, 21.2], [80.5, 18.8], [78.5, 18.2], [76.5, 17.8], [74.5, 15.8],
            [73.5, 15.8], [73.0, 17.5], [72.8, 19.2], [72.8, 20.3]
          ]
        ]
      }
    },
    // Goa
    {
      type: "Feature",
      properties: { name: "Goa", code: "GA" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.7, 15.8], [74.3, 15.8], [74.2, 14.9], [73.7, 15.0], [73.7, 15.8]
          ]
        ]
      }
    },
    // Karnataka (Smooth Malabar Coast & Deccan Plateau)
    {
      type: "Feature",
      properties: { name: "Karnataka", code: "KA" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.2, 14.9], [74.5, 15.8], [76.5, 17.8], [77.6, 18.0], [77.6, 15.5],
            [78.5, 14.2], [77.8, 11.8], [76.5, 11.8], [75.2, 12.5], [74.5, 13.8],
            [74.2, 14.9]
          ]
        ]
      }
    },
    // Kerala (Smooth Curved Malabar Strip)
    {
      type: "Feature",
      properties: { name: "Kerala", code: "KL" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [75.2, 12.5], [76.5, 11.8], [77.2, 10.2], [77.5, 8.2], [76.8, 8.5],
            [76.2, 9.8], [75.5, 11.2], [75.2, 12.5]
          ]
        ]
      }
    },
    // Tamil Nadu (Smooth Coromandel Curve & Cape Comorin)
    {
      type: "Feature",
      properties: { name: "Tamil Nadu", code: "TN" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.5, 8.2], [77.2, 10.2], [76.5, 11.8], [77.8, 11.8], [78.5, 14.2],
            [80.3, 13.5], [79.8, 11.8], [79.8, 10.2], [79.2, 9.2], [77.8, 8.8],
            [77.5, 8.2]
          ]
        ]
      }
    },
    // Andhra Pradesh (Smooth East Coast Arc)
    {
      type: "Feature",
      properties: { name: "Andhra Pradesh", code: "AP" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [78.5, 14.2], [77.6, 15.5], [78.2, 16.2], [79.8, 16.8], [81.5, 17.5],
            [83.2, 18.5], [84.8, 19.1], [83.5, 17.8], [82.2, 16.5], [80.5, 15.5],
            [80.3, 13.5], [78.5, 14.2]
          ]
        ]
      }
    },
    // Telangana
    {
      type: "Feature",
      properties: { name: "Telangana", code: "TG" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.6, 18.0], [78.5, 18.2], [80.5, 18.8], [80.5, 17.8], [81.2, 17.5],
            [79.8, 16.8], [78.2, 16.2], [77.6, 18.0]
          ]
        ]
      }
    },
    // Chhattisgarh
    {
      type: "Feature",
      properties: { name: "Chhattisgarh", code: "CG" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [80.8, 21.2], [82.2, 22.2], [82.8, 24.0], [84.2, 23.5], [83.5, 21.8],
            [81.2, 17.5], [80.5, 17.8], [80.5, 18.8], [80.8, 21.2]
          ]
        ]
      }
    },
    // Odisha (Smooth Coastal Curve)
    {
      type: "Feature",
      properties: { name: "Odisha", code: "OD" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [81.2, 17.5], [83.5, 21.8], [84.2, 23.5], [86.5, 22.5], [87.5, 21.6],
            [86.8, 21.2], [85.5, 19.8], [84.8, 19.1], [83.2, 18.5], [81.5, 17.5],
            [81.2, 17.5]
          ]
        ]
      }
    },
    // Jharkhand
    {
      type: "Feature",
      properties: { name: "Jharkhand", code: "JH" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [83.2, 24.5], [85.5, 24.8], [87.8, 25.2], [87.8, 23.8], [86.5, 22.5],
            [84.2, 23.5], [82.8, 24.0], [83.2, 24.5]
          ]
        ]
      }
    },
    // Bihar
    {
      type: "Feature",
      properties: { name: "Bihar", code: "BR" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [83.2, 24.5], [84.4, 25.5], [84.6, 27.3], [88.1, 26.5], [88.2, 25.2],
            [87.8, 25.2], [85.5, 24.8], [83.2, 24.5]
          ]
        ]
      }
    },
    // West Bengal & Delta
    {
      type: "Feature",
      properties: { name: "West Bengal", code: "WB" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [86.5, 22.5], [87.8, 23.8], [87.8, 25.2], [88.2, 25.2], [88.1, 26.5],
            [88.6, 27.2], [88.8, 26.5], [89.8, 26.4], [88.8, 24.5], [89.0, 23.0],
            [89.1, 21.6], [87.5, 21.6], [86.5, 22.5]
          ]
        ]
      }
    },
    // Sikkim
    {
      type: "Feature",
      properties: { name: "Sikkim", code: "SK" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [88.1, 27.1], [88.6, 27.8], [88.9, 27.3], [88.6, 27.2], [88.1, 27.1]
          ]
        ]
      }
    },
    // Assam & Northeast (Smooth Brahmaputra Arc)
    {
      type: "Feature",
      properties: { name: "Assam & Northeast", code: "NE" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [89.8, 26.4], [91.8, 27.3], [94.0, 28.5], [96.0, 28.2], [97.3, 28.0],
            [97.0, 27.0], [95.5, 26.8], [94.2, 24.5], [92.5, 22.0], [91.8, 23.5],
            [91.8, 25.2], [89.8, 25.2], [89.8, 26.4]
          ]
        ]
      }
    }
  ]
};

const tsContent = `import type { FeatureCollection, Geometry } from "geojson";

export const INDIA_GEOJSON: FeatureCollection<Geometry> = ${JSON.stringify(smoothIndiaGeoJSON, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, "..", "web", "lib", "data", "indiaGeoData.ts"), tsContent);
console.log("Updated indiaGeoData.ts with smooth polygon geometries!");
