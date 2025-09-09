#!/usr/bin/env node

/**
 * Script to upload local assets to S3 in the correct uploads/ folder structure
 * This fixes the issue where database URLs point to uploads/ but files don't exist there
 */

require('dotenv').config();
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const assetsPath = path.join(__dirname, '../Assets');

// File mappings: local filename -> S3 key
const fileMapping = {
  // Audio files
  'ElevenLabs_brahmin_and_crooks_-_hindi.mp3': 'uploads/audio/ElevenLabs_brahmin_and_crooks_-_hindi.mp3',
  'ElevenLabs_The_Brahmin_and_the_Crooks_english.mp3': 'uploads/audio/ElevenLabs_The_Brahmin_and_the_Crooks_english.mp3',
  'ElevenLabs_buddha_and_angulimala.mp3': 'uploads/audio/ElevenLabs_buddha_and_angulimala.mp3',
  'Buddha and Angulimala.mp3': 'uploads/audio/Buddha_and_Angulimala.mp3',
  
  // Image files
  'Hindi_bhraman.png': 'uploads/image/Hindi_bhraman.png',
  'English_bhramin.png': 'uploads/image/English_bhramin.png',
  'English_buddha (1).png': 'uploads/image/English_buddha.png',
  'Hindi.png': 'uploads/image/Hindi.png'
};

/**
 * Upload a single file to S3
 */
async function uploadFile(localFilename, s3Key) {
  const localPath = path.join(assetsPath, localFilename);
  
  // Check if local file exists
  if (!fs.existsSync(localPath)) {
    console.log(`❌ Local file not found: ${localFilename}`);
    return false;
  }
  
  try {
    // Read file
    const fileContent = fs.readFileSync(localPath);
    const fileStats = fs.statSync(localPath);
    
    // Determine content type
    const ext = path.extname(localFilename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    
    console.log(`📤 Uploading: ${localFilename} -> ${s3Key} (${(fileStats.size / 1024).toFixed(2)} KB)`);
    
    // Upload to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: 'max-age=31536000' // 1 year cache
      // Note: ACL removed because bucket doesn't allow ACLs
    };
    
    const result = await s3.upload(uploadParams).promise();
    console.log(`✅ Uploaded successfully: ${result.Location}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Upload failed for ${localFilename}:`, error.message);
    return false;
  }
}

/**
 * Main upload function
 */
async function uploadAllAssets() {
  console.log('🚀 Starting asset upload to S3...\n');
  console.log(`📁 Local assets path: ${assetsPath}`);
  console.log(`🪣 S3 bucket: ${bucketName}\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  // Upload each file
  for (const [localFilename, s3Key] of Object.entries(fileMapping)) {
    const success = await uploadFile(localFilename, s3Key);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log(''); // Empty line for readability
  }
  
  // Summary
  console.log('📊 Upload Summary:');
  console.log(`✅ Successful uploads: ${successCount}`);
  console.log(`❌ Failed uploads: ${failCount}`);
  console.log(`📁 Total files processed: ${Object.keys(fileMapping).length}`);
  
  if (failCount === 0) {
    console.log('\n🎉 All assets uploaded successfully!');
    console.log('🔗 Your CDN URLs should now work correctly.');
  } else {
    console.log('\n⚠️  Some uploads failed. Please check the errors above.');
  }
}

/**
 * Verify uploads by checking if files exist in S3
 */
async function verifyUploads() {
  console.log('\n🔍 Verifying uploads...\n');
  
  for (const [localFilename, s3Key] of Object.entries(fileMapping)) {
    try {
      await s3.headObject({ Bucket: bucketName, Key: s3Key }).promise();
      console.log(`✅ Verified: ${s3Key}`);
    } catch (error) {
      if (error.code === 'NotFound') {
        console.log(`❌ Missing: ${s3Key}`);
      } else {
        console.log(`⚠️  Error checking ${s3Key}: ${error.message}`);
      }
    }
  }
}

// Main execution
async function main() {
  try {
    await uploadAllAssets();
    await verifyUploads();
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⚠️  Upload interrupted by user');
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { uploadAllAssets, verifyUploads };
