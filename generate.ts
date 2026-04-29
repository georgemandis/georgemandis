const BLOG_FEED_URL = "https://george.mand.is/feed.json";
const GITHUB_API_URL =
  "https://api.github.com/users/georgemandis/repos?sort=pushed&per_page=10&type=owner";

const EXCLUDED_REPO_PATTERNS = [
  /^homebrew-/,
  /^scoop-/,
  /-tap$/,
  /-bucket$/,
  /^georgemandis$/, // this repo itself
];

interface BlogItem {
  title: string;
  url: string;
  date_published: string;
}

interface GitHubRepo {
  name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function fetchBlogPosts(): Promise<BlogItem[]> {
  const res = await fetch(BLOG_FEED_URL);
  const feed = await res.json();
  return feed.items.slice(0, 5);
}

async function fetchRepos(): Promise<GitHubRepo[]> {
  const res = await fetch(GITHUB_API_URL);
  const repos: GitHubRepo[] = await res.json();
  return repos
    .filter(
      (r) =>
        !r.fork &&
        !EXCLUDED_REPO_PATTERNS.some((pattern) => pattern.test(r.name))
    )
    .slice(0, 5);
}

function generateReadme(posts: BlogItem[], repos: GitHubRepo[]): string {
  const image = `<a href="https://george.mand.is/hire"><img src="https://d33wubrfki0l68.cloudfront.net/abf7a83094ae7040ac0d25de2848a9bfe08328c6/1a9ce/media/mes/me-teaching.jpg" alt="Two smiley-face puppets on a breadboard" /></a>`;

  const blogRows = posts
    .map(
      (p) => `| [${p.title}](${p.url}) | ${formatDate(p.date_published)} |`
    )
    .join("\n");

  const repoRows = repos
    .map(
      (r) =>
        `| [${r.name}](${r.html_url}) | ${r.description || ""} |`
    )
    .join("\n");

  return `

${image}

#### Latest Blog Posts
| Title | Date |
| --- | --- |
${blogRows}

#### Recent Projects
| Repo | Description |
| --- | --- |
${repoRows}

---

*This README is auto-generated daily via [GitHub Actions](https://github.com/georgemandis/georgemandis/blob/main/.github/workflows/update-readme.yml).*
`;
}

const [posts, repos] = await Promise.all([fetchBlogPosts(), fetchRepos()]);
const readme = generateReadme(posts, repos);
await Bun.write("README.md", readme);
console.log("README.md updated successfully");
