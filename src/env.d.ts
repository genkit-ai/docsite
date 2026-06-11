/// <reference types="astro/client" />

declare module 'virtual:starlight-blog/config' {
  import type { StarlightBlogConfig } from 'starlight-blog';

  const config: StarlightBlogConfig;
  export default config;
}
