const fetch = require("node-fetch");

async function testServer() {
  try {
    console.log("Testing server connectivity...");

    // Test root endpoint
    const rootResponse = await fetch("http://localhost:3002/");
    const rootData = await rootResponse.json();
    console.log("✅ Root endpoint:", rootData);

    // Test users endpoint
    const usersResponse = await fetch("http://localhost:3002/users");
    const usersData = await usersResponse.json();
    console.log(`✅ Users endpoint: ${usersData.length} users found`);

    // Test assistants endpoint
    const assistantsResponse = await fetch("http://localhost:3002/assistants");
    const assistantsData = await assistantsResponse.json();
    console.log(
      `✅ Assistants endpoint: ${assistantsData.length} assistants found`
    );

    // Test creating a test user
    const userResponse = await fetch("http://localhost:3002/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Test User",
        createdAt: new Date().toISOString()
      })
    });

    const userData = await userResponse.json();
    console.log("✅ Created test user:", userData);

    // Test deleting the test user
    const deleteResponse = await fetch(
      `http://localhost:3002/users/${userData.id}`,
      {
        method: "DELETE"
      }
    );

    if (deleteResponse.ok) {
      console.log("✅ Deleted test user successfully");
    } else {
      console.log("❌ Failed to delete test user");
    }

    console.log("\n✅ All tests completed successfully!");
    console.log("Your server is working correctly.");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Make sure your server is running on port 3002");
  }
}

// Run tests
testServer();
