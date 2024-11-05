import axios from 'axios';
import crypto from 'crypto';

// Function to fetch the document and compute the SHA-256 hash
async function generateUriHash(uri: string): Promise<string | null> {
  try {
    // Fetch the document from the URI
    const response = await axios.get(uri, { responseType: 'arraybuffer' });
    const documentContent = response.data;

    // Generate the SHA-256 hash of the document
    const hash = crypto.createHash('sha256').update(documentContent).digest('hex');

    return hash;
  } catch (error) {
    console.error('Error fetching the document or generating hash:', error);
    return null;
  }
}

// Example URI
const uri = 'https://gateway.pinata.cloud/ipfs/QmaUJzvr7DBRqS5i2Q1R5VdK32sph9JmhRTqSmL1pxPPCE';

generateUriHash(uri).then((hash) => {
  if (hash) {
    console.log('SHA-256 Hash:', hash);
  }
});
