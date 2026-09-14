import React from 'react';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import { parse as parseYaml } from 'yaml';

const postModules = import.meta.glob('./content/posts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function parsePost(source) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: source };
  return { data: parseYaml(match[1]) || {}, content: match[2].trim() };
}

function loadPosts() {
  return Object.entries(postModules).map(([path, source]) => {
    const rawSource = typeof source === 'string' ? source : source?.default;
    if (!rawSource) return null;
    const { data, content } = parsePost(rawSource);
    const slug = path.split('/').pop().replace(/\.md$/, '');
    return { ...data, content, slug };
  }).filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function BlogHeader() {
  return (
    <header className="blog-header">
      <a href="/" className="font-display text-lg tracking-tightish text-ink">Apex Meca <span className="font-mono text-xs text-accent-bright">/AXM</span></a>
      <nav className="blog-nav" aria-label="Primary navigation">
        <a href="/#services">Services</a>
        <a href="/#portfolio">Portfolio</a>
        <a href="/#toolset">Software</a>
        <a href="/#contact">Contact</a>
        <a href="/blog" aria-current="page">Blog</a>
      </nav>
    </header>
  );
}

function BlogFooter() {
  return (
    <footer className="border-t border-line px-6 py-8 text-center md:px-10">
      <p className="font-mono text-xs text-muted">© {new Date().getFullYear()} Apex Meca — Haytam Sallahi</p>
    </footer>
  );
}

function TagList({ tags = [] }) {
  return <div className="blog-tags">{tags.map((tag) => <span className="blog-tag" key={tag}>{tag}</span>)}</div>;
}

function BlogIndex({ posts }) {
  return (
    <>
      <p className="blog-kicker">Field notes / 01</p>
      <h1 className="blog-title text-white">Engineering ideas, made tangible.</h1>
      <p className="blog-intro text-slate-200">Practical notes on CAD, sheet-metal design, and the decisions that turn clean geometry into manufacture-ready work.</p>
      {posts.length ? (
        <div className="blog-grid">
          {posts.map((post) => (
            <a className="blog-card text-white" href={`/blog/${post.slug}`} key={post.slug}>
              <span className="blog-card__meta">{post.date} / {post.tags?.[0] || 'Design notes'}</span>
              <h2>{post.title}</h2>
              <p className="text-slate-200">{post.description}</p>
              <TagList tags={post.tags} />
            </a>
          ))}
        </div>
      ) : <p className="blog-empty text-slate-200">No posts found. Check the Markdown glob and frontmatter.</p>}
    </>
  );
}

function BlogPost({ post }) {
  if (!post) {
    return <><p className="blog-kicker">404 / Not found</p><h1 className="blog-title text-white">This note does not exist.</h1><a className="blog-back" href="/blog">← Back to all posts</a></>;
  }
  return (
    <article className="blog-post">
      <a className="blog-back !mt-0" href="/blog">← Back to all posts</a>
      <p className="blog-post__meta">{post.date} / {post.tags?.join(' · ')}</p>
      <h1 className="text-white">{post.title}</h1>
      <p className="blog-post__description text-slate-200">{post.description}</p>
      <div className="markdown-body"><ReactMarkdown>{post.content}</ReactMarkdown></div>
    </article>
  );
}

export function renderBlog() {
  const posts = loadPosts();
  const slug = window.location.pathname.replace(/^\/blog\/?/, '').replace(/\/$/, '');
  const post = slug ? posts.find((item) => item.slug === slug) : null;
  document.title = post ? `${post.title} — Apex Meca` : 'Blog — Apex Meca';
  document.body.innerHTML = '<div id="blog-root"></div>';
  createRoot(document.getElementById('blog-root')).render(
    <div className="blog-page">
      <BlogHeader />
      <main className="blog-shell">{slug ? <BlogPost post={post} /> : <BlogIndex posts={posts} />}</main>
      <BlogFooter />
    </div>
  );
}
