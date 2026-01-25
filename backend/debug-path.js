const path = require('path');
const fs = require('fs');

const filename = '1769354481101_e23bdde11029b3b9_photo_2020_11_28_09_35_12_jpg.jpg';
const uploadDir = path.join(process.cwd(), 'uploads');
const filePath = path.join(uploadDir, filename);
const absolutePath = path.resolve(filePath);

console.log('CWD:', process.cwd());
console.log('Upload Dir:', uploadDir);
console.log('File Path:', filePath);
console.log('Absolute Path:', absolutePath);

if (fs.existsSync(absolutePath)) {
    console.log('SUCCESS: File exists at absolute path');
    const stats = fs.statSync(absolutePath);
    console.log('File Size:', stats.size);
} else {
    console.log('FAILURE: File does NOT exist at absolute path');
}
