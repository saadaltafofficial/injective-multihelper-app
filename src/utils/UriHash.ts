import axios from 'axios';
import crypto from 'crypto';


async function generateUriHash(uri: string): Promise<string | null> {
  try {
    const response = await axios.get(uri, { responseType: 'arraybuffer' });
    const documentContent = response.data;

    const hash = crypto.createHash('sha256').update(documentContent).digest('hex');

    return hash;
  } catch (error) {
    console.error('Error fetching the document or generating hash:', error);
    return null;
  }
}

const uri = 'https://gateway.pinata.cloud/ipfs/QmaUJzvr7DBRqS5i2Q1R5VdK32sph9JmhRTqSmL1pxPPCE';

generateUriHash(uri).then((hash) => {
  if (hash) {
    console.log('SHA-256 Hash:', hash);
  }
});
