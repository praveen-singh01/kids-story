const jwt = require('jsonwebtoken');

// Generate a mock Google ID token for testing
function generateMockGoogleIdToken() {
  const payload = {
    iss: 'https://accounts.google.com',
    aud: '148544260914-8os836806lhpegqv7gnmuqi71q1he8e4.apps.googleusercontent.com',
    sub: '123456789012345678901',
    email: 'testuser@gmail.com',
    email_verified: true,
    name: 'Test User',
    picture: 'https://lh3.googleusercontent.com/a/default-user',
    given_name: 'Test',
    family_name: 'User',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  // Note: This won't work with real Google verification because we don't have Google's private key
  // But it shows the proper JWT structure
  const token = jwt.sign(payload, 'mock-secret', { algorithm: 'HS256' });
  
  console.log('🔑 Mock Google ID Token (for structure reference):');
  console.log(token);
  console.log('\n📋 Decoded Payload:');
  console.log(JSON.stringify(payload, null, 2));
  
  return token;
}

// Generate a properly formatted but invalid token
function generateProperlyFormattedInvalidToken() {
  const header = Buffer.from(JSON.stringify({
    alg: 'RS256',
    kid: 'mock-key-id',
    typ: 'JWT'
  })).toString('base64url');
  
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://accounts.google.com',
    aud: '148544260914-8os836806lhpegqv7gnmuqi71q1he8e4.apps.googleusercontent.com',
    sub: '123456789012345678901',
    email: 'testuser@gmail.com',
    email_verified: true,
    name: 'Test User',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url');
  
  const signature = 'mock-signature-that-wont-verify';
  
  const token = `${header}.${payload}.${signature}`;
  
  console.log('\n🎯 Properly Formatted Test Token (will fail verification):');
  console.log(token);
  
  return token;
}

console.log('🧪 Google ID Token Generator for Testing\n');

const mockToken = generateMockGoogleIdToken();
const testToken = generateProperlyFormattedInvalidToken();

console.log('\n📝 How to use these tokens:');
console.log('1. The first token shows proper JWT structure but uses HS256');
console.log('2. The second token has proper Google format but invalid signature');
console.log('3. Both will fail Google verification (expected)');
console.log('4. But they should return proper 401/400 errors, not 500');

console.log('\n🔧 Test with curl:');
console.log(`curl -X POST http://localhost:3000/api/v1/auth/google \\
  -H "Content-Type: application/json" \\
  -d '{
    "idToken": "${testToken}"
  }'`);

console.log('\n⚠️  Note: For real testing, you need an actual Google ID token from:');
console.log('- Google OAuth Playground: https://developers.google.com/oauthplayground/');
console.log('- Frontend Google Sign-In implementation');
console.log('- gcloud auth print-identity-token (if configured)');
