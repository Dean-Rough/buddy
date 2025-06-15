import { beforeEach, vi } from 'vitest';

// Mock environment variables for testing
beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'postgres://test:test@localhost:5432/buddy_test');
  vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');
  vi.stubEnv('CARTESIA_API_KEY', 'sk_car_test_key');
  vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'pk_test_key');
  vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_secret');
  vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-32-chars-minimum-length');
  vi.stubEnv('ENCRYPTION_KEY', 'test-encryption-key-32-chars-min');
});

// Mock Next.js modules that might not be available in test environment
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useUser: () => ({ user: null, isSignedIn: false }),
  useAuth: () => ({ userId: null, isSignedIn: false }),
  SignIn: () => 'SignIn Component',
  SignUp: () => 'SignUp Component',
  UserButton: () => 'UserButton Component',
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    childProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    chatSession: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Global test utilities
global.fetch = vi.fn();

// Suppress console logs during tests unless specifically testing them
if (!process.env.DEBUG_TESTS) {
  vi.stubGlobal('console', {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });
}
