/// <reference types="astro/client" />
/// <reference path="../node_modules/@astrojs/starlight/virtual.d.ts" />
/// <reference path="../node_modules/@astrojs/starlight/virtual-internal.d.ts" />

declare module 'virtual:starlight-blog/config' {
  import type { StarlightBlogConfig } from 'starlight-blog';

  const config: StarlightBlogConfig;
  export default config;
}
