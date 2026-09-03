/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  // The monorepo documents itself; no generated agent files in the tree.
  agentRules: false,
}

export default nextConfig
