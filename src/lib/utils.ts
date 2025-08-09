import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { mnemonicToAccount } from 'viem/accounts';
import { APP_BUTTON_TEXT, APP_DESCRIPTION, APP_ICON_URL, APP_NAME, APP_OG_IMAGE_URL, APP_PRIMARY_CATEGORY, APP_SPLASH_BACKGROUND_COLOR, APP_TAGS, APP_URL, APP_WEBHOOK_URL } from './constants';
import { APP_SPLASH_URL } from './constants';

type MiniAppManifest = {
  account_association?: {
    header: string;
    payload: string;
    signature?: string;
  };
  miniapp: {
    version: string;
    name: string;
    icon_url: string;
    home_url: string;
    image_url?: string;
    button_title?: string;
    splash_image_url?: string;
    splash_background_color?: string;
    webhook_url?: string;
    description?: string;
    primary_category?: string;
    tags?: string[];
  };
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSecretEnvVars() {
  const seedPhrase = process.env.SEED_PHRASE;
  const fid = process.env.FID;
  
  if (!seedPhrase || !fid) {
    return null;
  }

  return { seedPhrase, fid };
}

export function getMiniAppEmbedMetadata(ogImageUrl?: string) {
  return {
    version: "1",
    imageUrl: ogImageUrl ?? APP_OG_IMAGE_URL,
    button: {
      title: APP_BUTTON_TEXT,
      action: {
        type: "launch_miniapp",
        name: `Tag`,
        url: APP_URL,
        splashImageUrl: APP_SPLASH_URL,
        iconUrl: APP_ICON_URL,
        splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
        description: APP_DESCRIPTION,
        primaryCategory: APP_PRIMARY_CATEGORY,
        tags: APP_TAGS,
      },
    },
  };
}

export async function getFarcasterMetadata(): Promise<MiniAppManifest> {
  // First check for MINI_APP_METADATA in .env and use that if it exists
  if (process.env.MINI_APP_METADATA) {
    try {
      const metadata = JSON.parse(process.env.MINI_APP_METADATA);
      console.log('Using pre-signed mini app metadata from environment');
      return metadata;
    } catch (error) {
      console.warn('Failed to parse MINI_APP_METADATA from environment:', error);
    }
  }

  if (!APP_URL) {
    throw new Error('NEXT_PUBLIC_URL not configured');
  }

  // Get the domain from the URL (without https:// prefix)
  const domain = new URL(APP_URL).hostname;
  console.log('Using domain for manifest:', domain);

  const secretEnvVars = getSecretEnvVars();
  if (!secretEnvVars) {
    console.warn('No seed phrase or FID found in environment variables -- generating unsigned metadata');
  }

  let accountAssociation;
  if (secretEnvVars) {
    // Generate account from seed phrase
    const account = mnemonicToAccount(secretEnvVars.seedPhrase);
    const custodyAddress = account.address;

    const header = {
      fid: parseInt(secretEnvVars.fid),
      type: 'custody',
      key: custodyAddress,
    };
    const encodedHeader = Buffer.from(JSON.stringify(header), 'utf-8').toString('base64');

    const payload = {
      domain
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');

    const signature = await account.signMessage({ 
      message: `${encodedHeader}.${encodedPayload}`
    });
    const encodedSignature = Buffer.from(signature, 'utf-8').toString('base64url');

    accountAssociation = {
      header: encodedHeader,
      payload: encodedPayload,
      signature: encodedSignature
    };
  }

  return {
    account_association: accountAssociation || {
      header: "farcaster-domain-verification",
      payload: new URL(APP_URL).hostname
    },
    miniapp: {
      version: "1.0.0",
      name: APP_NAME ?? "Tag Game",
      icon_url: APP_ICON_URL,
      home_url: APP_URL,
      image_url: APP_OG_IMAGE_URL,
      button_title: APP_BUTTON_TEXT ?? "Launch Mini App",
      splash_image_url: APP_SPLASH_URL,
      splash_background_color: APP_SPLASH_BACKGROUND_COLOR,
      webhook_url: APP_WEBHOOK_URL,
      description: APP_DESCRIPTION,
      primary_category: APP_PRIMARY_CATEGORY,
      tags: APP_TAGS,
    },
  };
}
