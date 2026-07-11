/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHANNEL_USERNAME: string;
  readonly VITE_MOCK_MODE: string;
  readonly VITE_SKIP_ONBOARDING: string;
  readonly VITE_API_URL: string;
  readonly VITE_BASE_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}