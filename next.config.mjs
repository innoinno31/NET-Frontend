/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
      eslint: {
        ignoreDuringBuilds: true,
      },    
    webpack: (config) => {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
      return config;
    },
  };
  
export default nextConfig;
