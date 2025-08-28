const jwt = require('jsonwebtoken');

const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE0OTljMTU0Y2NjOGEyNWUyNGQ4ZGU4YjFhOWY4NDVhZWZiNmYzY2EiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxNDg1NDQyNjA5MTQtZnZhbm02NHRwc3FnZXYyZTNxbjFnNWE3cmllN3FlaWouYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIxNDg1NDQyNjA5MTQtaDlzOTA3YnJkdW51M2I5NTY1OTlwN3J1czlzdTZyOW4uYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDEyMTg5NzYxODM3NzQ4NTM0MjAiLCJlbWFpbCI6InZhaWJoYXZzaHJpdmFzdGF2YTYzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiUmlzaHUgU2hyaXZhc3RhdmEiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS2hQTXNzMDA4RnlmYkZnd3NmcUc4cmVic3B6SHRmcjlMMEh4LXJ4OGVHLTFaMWZxT1c9czk2LWMiLCJnaXZlbl9uYW1lIjoiUmlzaHUiLCJmYW1pbHlfbmFtZSI6IlNocml2YXN0YXZhIiwiaWF0IjoxNzU2MzA4NjA3LCJleHAiOjE3NTYzMTIyMDd9.kzSx2IRGDR1CQ_FCHdh2_HF-6nqkSSnrYlqKdvB0eHQQpAn-S-32nYPJYXpj-Zk0jGWvQ67TEtpgwAD5xy-g9y9Toxf69_too0R67SXv9c16ngayAAD0YN-T8kNx0HSGcUkOFjUNWiFu9roGO5xnyqLVqmA8m2U71t_jcuF6vnxACR_SnlcsxhCgxk6T1_pVKSmnVQqynHRfOUjTzlq_RGA4WVp_lsECdRVJY1zRsR6";

// Decode without verification to see the payload
const decoded = jwt.decode(token, { complete: true });

console.log('🔍 Token Analysis\n');

console.log('📋 Header:');
console.log(JSON.stringify(decoded.header, null, 2));

console.log('\n📋 Payload:');
console.log(JSON.stringify(decoded.payload, null, 2));

console.log('\n🔧 Configuration Check:');
console.log('Token audience (aud):', decoded.payload.aud);
console.log('Your configured Client ID:', process.env.GOOGLE_CLIENT_ID || 'Not found in environment');

console.log('\n❌ Issue Found:');
if (decoded.payload.aud !== process.env.GOOGLE_CLIENT_ID) {
  console.log('The token audience does not match your configured Google Client ID!');
  console.log('\n🔧 Solutions:');
  console.log('1. Update your .env file with the correct GOOGLE_CLIENT_ID:');
  console.log(`   GOOGLE_CLIENT_ID=${decoded.payload.aud}`);
  console.log('\n2. Or update your frontend to use the correct Client ID:');
  console.log(`   Use: ${process.env.GOOGLE_CLIENT_ID}`);
  console.log(`   Instead of: ${decoded.payload.aud}`);
} else {
  console.log('✅ Token audience matches your configured Client ID');
}

console.log('\n📝 Token Details:');
console.log('- Issuer:', decoded.payload.iss);
console.log('- Subject (User ID):', decoded.payload.sub);
console.log('- Email:', decoded.payload.email);
console.log('- Email Verified:', decoded.payload.email_verified);
console.log('- Name:', decoded.payload.name);
console.log('- Issued At:', new Date(decoded.payload.iat * 1000).toISOString());
console.log('- Expires At:', new Date(decoded.payload.exp * 1000).toISOString());

const now = Math.floor(Date.now() / 1000);
if (decoded.payload.exp < now) {
  console.log('\n⚠️  WARNING: This token has expired!');
  console.log('You need a fresh token from your frontend.');
} else {
  console.log('\n✅ Token is not expired');
}
