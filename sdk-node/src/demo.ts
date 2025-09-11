import { createClient } from './index';

const envId = 'cmexeoez80005pplcg3n1iklb';
const sdkKey = 'bb42147c-89e6-40ce-a0bb-52d53c2646fd';

const base = `http://localhost:3000/api/envs/${envId}`;

async function main() {
    const client = createClient({
        env: envId,
        snapshotUrl: `${base}/snapshot/preview`,
        sseUrl: `${base}/stream`,
        apiKey: sdkKey,
        attributesProvider: () => ({ userId: 'user_123', country: 'US', plan: 'pro' }),
    });

    await client.init();

    console.log('version:', client.currentVersion());
    console.log('newCheckout:', client.getVariant('newCheckout')); 
}

main();
