import * as jose from "jose";

const SECRET = "hr-manager-super-secret-123-fallback";
const ALGORITHM = "HS256";

async function testJwt() {
  console.log("--- JWT Consistency Test ---");
  
  // 1. SIGN (Simulating API)
  const encodedSecret = new TextEncoder().encode(SECRET);
  const token = await new jose.SignJWT({
    companyCode: "AD1",
    role: "HR_ADMIN"
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(encodedSecret);
  
  console.log("Token Generated. Length:", token.length);

  // 2. VERIFY (Simulating Middleware)
  try {
    const { payload } = await jose.jwtVerify(token, encodedSecret, {
      algorithms: [ALGORITHM],
    });
    console.log("Verification SUCCESS!");
    console.log("Payload:", payload);
    
    if (payload.role === "HR_ADMIN") {
      console.log("Role check: PASSED");
    } else {
      console.log("Role check: FAILED");
    }
  } catch (error: any) {
    console.error("Verification FAILED:", error.message);
  }
}

testJwt();
