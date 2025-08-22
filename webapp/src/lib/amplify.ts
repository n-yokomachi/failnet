import { Amplify } from 'aws-amplify';

// Amplify outputs.json is only available in local development
// In Amplify Hosting, backend resources are connected automatically
try {
  const outputs = await import('../../amplify_outputs.json');
  Amplify.configure(outputs.default);
} catch (error) {
  console.log('amplify_outputs.json not found - using Amplify Hosting auto-configuration');
}