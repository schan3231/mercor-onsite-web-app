import "@testing-library/jest-dom";

// Mock next/navigation globally so client components that call useRouter don't throw.
// useRouter is a jest.fn() so tests can call .mockReturnValue() on it.
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));
