/**
 * API Test Helper
 *
 * Manual testing script for API endpoints.
 * Usage: npm run test-api
 *
 * Note: Start the dev server first with `npm run dev`
 */

const BASE_URL = "http://localhost:3000";

// Sample quiz response for testing
const sampleQuiz = {
  goals: ["stylish", "lowEffortHighPayoff"],
  nicheTarget: 3,
  effort: "few_fast",
  budget: "30_75",
  genderPref: "dont_care",
  resemblanceTarget: 4,
  universes: ["movie", "tv"],
  era: "90s",
  boundaries: {
    noSkinToneChange: true,
    avoidCultureSpecific: false,
    avoidReligious: false,
    avoidPolitical: false,
    avoidFacePaint: false,
    avoidWigs: false,
    avoidControversial: false,
  },
  practical: {
    mustBeComfortable: true,
    mustSurviveCrowdedBar: true,
    needsPockets: false,
    indoorOnly: false,
  },
};

async function testRecommend() {
  console.log("🧪 Testing POST /api/recommend...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sampleQuiz),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Request failed:", response.status);
      console.error(JSON.stringify(data, null, 2));
      return null;
    }

    console.log("✅ Success!");
    console.log("   Mode:", data.meta?.mode);
    console.log("   Dataset Version:", data.meta?.datasetVersion);
    console.log("   Relaxations:", data.meta?.relaxationsApplied || "none");
    console.log("\n   Recommendations:");

    for (const rec of data.recommendations) {
      console.log(`   - ${rec.title} (${rec.difficulty})`);
      console.log(`     Why: ${rec.whyItMatches[0]}`);
    }

    return data;
  } catch (error) {
    console.error("❌ Request error:", error);
    return null;
  }
}

async function testMoreLikeThis(costumeId: string) {
  console.log(`\n🧪 Testing POST /api/more-like-this (${costumeId})...\n`);

  try {
    const response = await fetch(`${BASE_URL}/api/more-like-this`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedCostumeId: costumeId,
        quiz: sampleQuiz,
        direction: "weirder",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("⚠️  Request returned:", response.status);
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    console.log("✅ Success!");
    console.log("   Similar costumes:");

    for (const rec of data.recommendations) {
      console.log(`   - ${rec.title}`);
    }
  } catch (error) {
    console.error("❌ Request error:", error);
  }
}

async function testInvalidRequest() {
  console.log("\n🧪 Testing invalid request handling...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goals: [] }), // Invalid: goals needs 1-2 items
    });

    const data = await response.json();

    if (response.status === 400) {
      console.log("✅ Correctly rejected invalid request");
      console.log("   Error:", data.error);
    } else {
      console.log("⚠️  Unexpected response:", response.status);
    }
  } catch (error) {
    console.error("❌ Request error:", error);
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("API Test Suite");
  console.log("=".repeat(50));
  console.log(`\nTarget: ${BASE_URL}`);
  console.log("Make sure the dev server is running!\n");

  // Test recommend endpoint
  const result = await testRecommend();

  // Test more-like-this if we got results
  if (result?.recommendations?.[0]) {
    await testMoreLikeThis(result.recommendations[0].costumeId);
  }

  // Test error handling
  await testInvalidRequest();

  console.log("\n" + "=".repeat(50));
  console.log("Tests complete!");
  console.log("=".repeat(50));
}

main().catch(console.error);

