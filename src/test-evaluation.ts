import axios from "axios";

interface TestCase {
  question: string;
  expectedAnswerContains: string;
  expectedLink?: string;
}

const testCases: TestCase[] = [
  {
    question:
      "The question asks to use gpt-3.5-turbo-0125 model but the ai-proxy provided by Anand sir only supports gpt-4o-mini. So should we just use gpt-4o-mini or use the OpenAI API for gpt3.5 turbo?",
    expectedAnswerContains: "gpt-3.5-turbo-0125",
    expectedLink:
      "https://discourse.onlinedegree.iitm.ac.in/t/ga5-question-8-clarification/155939"
  },
  {
    question:
      "If a student scores 10/10 on GA4 as well as a bonus, how would it appear on the dashboard?",
    expectedAnswerContains: "110",
    expectedLink:
      "https://discourse.onlinedegree.iitm.ac.in/t/ga4-data-sourcing-discussion-thread-tds-jan-2025/165959"
  },
  {
    question:
      "I know Docker but have not used Podman before. Should I use Docker for this course?",
    expectedAnswerContains: "Podman",
    expectedLink: "https://tds.s-anand.net/#/docker"
  },
  {
    question: "When is the TDS Sep 2025 end-term exam?",
    expectedAnswerContains: "don't know",
    expectedLink: undefined
  }
];

const testApiEndpoint = async (baseUrl: string): Promise<void> => {
  console.log(`\n=== Testing API at ${baseUrl} ===`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n--- Test Case ${i + 1} ---`);
    console.log(`Question: ${testCase.question}`);

    try {
      const response = await axios.post(
        `${baseUrl}/api/`,
        { question: testCase.question },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000
        }
      );

      if (response.status === 200) {
        const result = response.data;
        console.log(`Answer: ${result.answer || "No answer"}`);
        console.log(`Links: ${JSON.stringify(result.links || [])}`);

        // Check expectations
        const answer = (result.answer || "").toLowerCase();
        if (answer.includes(testCase.expectedAnswerContains.toLowerCase())) {
          console.log("✅ Answer contains expected content");
        } else {
          console.log("❌ Answer missing expected content");
        }

        if (testCase.expectedLink) {
          const linksText = JSON.stringify(result.links || []);
          if (linksText.includes(testCase.expectedLink)) {
            console.log("✅ Expected link found");
          } else {
            console.log("❌ Expected link missing");
          }
        }
      } else {
        console.log(`❌ Request failed with status ${response.status}`);
        console.log(`Response: ${response.data}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(`❌ Request failed: ${error.message}`);
        if (error.response) {
          console.log(`Status: ${error.response.status}`);
          console.log(`Data: ${JSON.stringify(error.response.data)}`);
        }
      } else {
        console.log(`❌ Error: ${error}`);
      }
    }
  }
};

const main = async (): Promise<void> => {
  // Test locally first
  console.log("Testing local API...");
  await testApiEndpoint("http://localhost:5005");

  // Then test deployed version
  const deployedUrl = process.argv[2];
  if (deployedUrl) {
    console.log(`\nTesting deployed API at ${deployedUrl}...`);
    await testApiEndpoint(deployedUrl);
  } else {
    console.log("\nTo test deployed API, run: npm test <deployed-url>");
  }
};

main().catch(console.error);
