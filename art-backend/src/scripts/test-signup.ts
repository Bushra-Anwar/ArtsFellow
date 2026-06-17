async function testSignup() {
  const email = "aqsaa5543@gmail.com";
  console.log(`Testing signup for existing email: ${email}`);

  try {
    const response = await fetch("http://localhost:5005/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        isLogin: false, // This means it's a signup attempt
      }),
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Body:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

testSignup();
