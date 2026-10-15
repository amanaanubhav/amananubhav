/**
 * The only client module that reads process.env.
 * Literal NEXT_PUBLIC_* accesses so Next inlines them at build time; legacy VITE_* names
 * are bridged in next.config.ts.
 */
export const clientEnv = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  emailjs: {
    serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
    templateToAman: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_TO_AMAN,
    templateToVisitor: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_TO_VISITOR,
    publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
  },
} as const satisfies {
  firebase: Record<
    'apiKey' | 'authDomain' | 'projectId' | 'storageBucket' | 'messagingSenderId' | 'appId',
    string | undefined
  >;
  emailjs: Record<'serviceId' | 'templateToAman' | 'templateToVisitor' | 'publicKey', string | undefined>;
};

export type ClientEnv = typeof clientEnv;
