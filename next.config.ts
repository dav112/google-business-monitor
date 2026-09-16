import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.10.169", "192.168.10.171", "192.168.10.*", "*.192.168.10.169"],
};

export default nextConfig;
