const fs = require("fs");
const path = require("path");

// Detailed simplified GeoJSON for Indian States & Union Territories
const indiaGeoJSON = {
  type: "FeatureCollection",
  features: [
    // Jammu & Kashmir and Ladakh
    {
      type: "Feature",
      properties: { name: "Jammu & Kashmir & Ladakh", code: "JK" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.8, 34.8], [74.5, 37.0], [77.0, 35.6], [78.8, 35.5], [79.2, 34.2],
            [78.6, 32.5], [77.5, 32.2], [76.5, 32.0], [75.5, 32.3], [74.8, 32.7],
            [73.8, 34.8]
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
            [75.6, 32.4], [76.5, 32.9], [77.6, 32.9], [78.6, 32.3], [78.6, 31.2],
            [77.6, 30.5], [76.3, 31.0], [75.6, 32.4]
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
            [74.5, 32.4], [75.8, 32.5], [76.6, 31.4], [76.8, 30.4], [75.2, 29.8],
            [73.9, 30.0], [74.5, 32.4]
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
            [77.6, 31.4], [78.8, 31.4], [80.4, 30.4], [81.0, 29.8], [79.8, 28.8],
            [77.8, 30.4], [77.6, 31.4]
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
            [74.5, 30.0], [76.8, 30.5], [77.6, 30.4], [77.4, 28.2], [76.2, 27.7],
            [74.7, 28.3], [74.5, 30.0]
          ]
        ]
      }
    },
    // Rajasthan
    {
      type: "Feature",
      properties: { name: "Rajasthan", code: "RJ" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [70.0, 24.5], [69.6, 26.2], [70.5, 27.8], [72.0, 29.2], [73.9, 30.0],
            [74.7, 28.3], [76.2, 27.7], [77.2, 27.5], [77.8, 26.8], [76.8, 24.5],
            [74.5, 23.5], [73.2, 24.5], [71.0, 24.6], [70.0, 24.5]
          ]
        ]
      }
    },
    // Gujarat
    {
      type: "Feature",
      properties: { name: "Gujarat", code: "GJ" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [68.2, 23.7], [70.0, 24.6], [71.5, 24.6], [73.2, 24.5], [74.3, 23.0],
            [73.8, 21.0], [72.8, 20.3], [72.7, 21.5], [71.5, 20.8], [69.2, 22.4],
            [70.2, 23.2], [68.5, 23.6], [68.2, 23.7]
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
            [77.4, 28.2], [77.8, 30.4], [79.8, 28.8], [81.0, 29.8], [83.0, 28.2],
            [84.6, 27.3], [84.4, 25.0], [83.0, 24.0], [81.5, 24.6], [78.5, 24.2],
            [77.8, 26.8], [77.2, 27.5], [77.4, 28.2]
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
            [74.3, 23.0], [76.8, 24.5], [78.5, 24.2], [81.5, 24.6], [82.8, 24.0],
            [82.2, 21.8], [80.5, 21.5], [78.2, 21.3], [74.5, 21.5], [74.3, 23.0]
          ]
        ]
      }
    },
    // Maharashtra
    {
      type: "Feature",
      properties: { name: "Maharashtra", code: "MH" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.8, 20.3], [73.8, 21.0], [74.5, 21.5], [78.2, 21.3], [80.5, 21.5],
            [80.8, 18.8], [77.6, 18.0], [75.8, 17.5], [73.5, 15.8], [73.0, 18.0],
            [72.8, 20.3]
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
    // Karnataka
    {
      type: "Feature",
      properties: { name: "Karnataka", code: "KA" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.2, 14.9], [75.8, 17.5], [77.6, 18.0], [77.6, 14.5], [78.5, 13.8],
            [77.8, 11.6], [76.5, 11.8], [75.0, 12.8], [74.5, 14.0], [74.2, 14.9]
          ]
        ]
      }
    },
    // Kerala
    {
      type: "Feature",
      properties: { name: "Kerala", code: "KL" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [75.0, 12.8], [76.5, 11.8], [77.2, 10.2], [77.5, 8.2], [76.8, 8.5],
            [76.2, 9.9], [75.0, 12.8]
          ]
        ]
      }
    },
    // Tamil Nadu
    {
      type: "Feature",
      properties: { name: "Tamil Nadu", code: "TN" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.5, 8.2], [77.2, 10.2], [76.5, 11.8], [77.8, 11.6], [78.5, 13.8],
            [80.3, 13.5], [79.8, 11.9], [79.8, 9.2], [78.2, 9.0], [77.5, 8.2]
          ]
        ]
      }
    },
    // Andhra Pradesh
    {
      type: "Feature",
      properties: { name: "Andhra Pradesh", code: "AP" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [78.5, 13.8], [77.6, 14.5], [78.2, 16.0], [80.2, 16.8], [81.5, 17.5],
            [83.5, 18.8], [84.8, 19.1], [83.3, 17.7], [81.8, 15.8], [80.3, 13.5],
            [78.5, 13.8]
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
            [77.6, 18.0], [80.8, 18.8], [80.5, 17.8], [81.2, 17.5], [80.2, 16.8],
            [78.2, 16.0], [77.6, 18.0]
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
            [80.5, 21.5], [82.2, 21.8], [82.8, 24.0], [84.2, 23.5], [83.5, 21.5],
            [81.2, 17.5], [80.5, 17.8], [80.8, 18.8], [80.5, 21.5]
          ]
        ]
      }
    },
    // Odisha
    {
      type: "Feature",
      properties: { name: "Odisha", code: "OD" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [81.2, 17.5], [83.5, 21.5], [84.2, 23.5], [86.5, 22.5], [87.5, 21.6],
            [86.9, 21.4], [85.8, 19.8], [84.8, 19.1], [83.5, 18.8], [81.5, 17.5],
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
            [83.5, 24.2], [85.5, 24.8], [87.8, 25.2], [87.8, 23.8], [86.5, 22.5],
            [84.2, 23.5], [82.8, 24.0], [83.5, 24.2]
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
            [83.0, 24.0], [84.4, 25.0], [84.6, 27.3], [88.1, 26.4], [88.2, 25.2],
            [87.8, 25.2], [85.5, 24.8], [83.5, 24.2], [83.0, 24.0]
          ]
        ]
      }
    },
    // West Bengal
    {
      type: "Feature",
      properties: { name: "West Bengal", code: "WB" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [86.5, 22.5], [87.8, 23.8], [87.8, 25.2], [88.2, 25.2], [88.1, 26.4],
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
    // Assam & Northeast
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

const outputPath = path.join(__dirname, "..", "web", "public", "india-geo.json");
fs.writeFileSync(outputPath, JSON.stringify(indiaGeoJSON, null, 2));
console.log("Successfully generated india-geo.json at", outputPath);
