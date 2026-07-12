// __COMMIT_SHA__ is injected by vite.config.js: the commit that triggered
// the deploy in CI, or the local working tree's commit outside CI.
const SHA = typeof __COMMIT_SHA__ === 'string' ? __COMMIT_SHA__ : null

export default function VersionBadge() {
  if (!SHA) return null

  return (
    <a
      className="version-badge"
      href={`https://github.com/takecare/tugalingo/commit/${SHA}`}
      target="_blank"
      rel="noreferrer"
    >
      {SHA.slice(0, 7)}
    </a>
  )
}
