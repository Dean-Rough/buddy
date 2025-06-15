import 'jest-extended';
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useUser: () => ({ user: null, isSignedIn: false, isLoaded: true }),
  useAuth: () => ({
    userId: null,
    isSignedIn: false,
    isLoaded: true,
    signOut: jest.fn(),
  }),
  useSignIn: () => ({
    isLoaded: true,
    signIn: {
      create: jest.fn(),
    },
    setActive: jest.fn(),
  }),
  useSignUp: () => ({
    isLoaded: true,
    signUp: {
      create: jest.fn(),
      prepareEmailAddressVerification: jest.fn(),
    },
  }),
  SignIn: () => 'SignIn Component',
  SignUp: () => 'SignUp Component',
  UserButton: () => 'UserButton Component',
}));

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    parent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    childAccount: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    child: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    safetyEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    parentNotification: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock environment variables
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/buddy_test';
process.env.OPENAI_API_KEY = 'sk-test-key';
process.env.CARTESIA_API_KEY = 'sk_car_test_key';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_key';
process.env.CLERK_SECRET_KEY = 'sk_test_secret';
process.env.NEXTAUTH_SECRET = 'test-secret-32-chars-minimum-length';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-min';

// Mock global fetch
global.fetch = jest.fn();

// Suppress console logs during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
