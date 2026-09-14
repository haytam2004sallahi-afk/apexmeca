import React from 'react';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import matter from 'gray-matter';

const postModules = import.meta.glob('./content/posts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function loadPosts() {
  return Object.entries(postModules).map(([path, source]) => {
    const { data, content } = matter(source);
    const slug = path.split('/').pop().replace(/\.md$/, '');
    return { ...data, content, slug };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function BlogHeader() {
  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-5 md:px-10">
      <a href="/" className="font-display text-lg tracking-tightish">Apex Meca <span className="font-mono text-xs text-accent-bright">/AXM</span></a>
      <a href="/" className="font-mono text-xs uppercase tracking-widest text-muted hover:text-accent-bright">Back to studio</a>
    </header>
  );
}

function TagList({ tags = [] }) {
  return <div className="blog-tags">{tags.map((tag) => <span className="blog-tag" key={tag}>{tag}</span>)}</div>;
}

function BlogIndex({ posts }) {
  return (
    <>
      <p className="blog-kicker">Field notes / 01</p>
      <h1 className="blog-title">Engineering ideas, made tangible.</h1>
      <p className="blog-intro">Practical notes on CAD, sheet-metal design, and the decisions that turn clean geometry into manufacture-ready work.</p>
      <div className="blog-grid">
        {posts.map((post) => (
          <a className="blog-card" href={`/blog/${post.slug}`} key={post.slug}>
            <span className="blog-card__meta">{post.date} / {post.tags?.[0] || 'Design notes'}</span>
            <h2>{post.title}</h2>
            <p>{post.description}</p>
            <TagList tags={post.tags} />
          </a>
        ))}
      </div>
    </>
  );
}

function BlogPost({ post }) {
  if (!post) {
    return <><p className="blog-kicker">404 / Not found</p><h1 className="blog-title">This note does not exist.</h1><a className="blog-back" href="/blog">← All notes</a></>;
  }
  return (
    <article className="blog-post">
      <a className="blog-back !mt-0" href="/blog">← All notes</a>
      <p className="blog-post__meta">{post.date} / {post.tags?.join(' · ')}</p>
      <h1>{post.title}</h1>
      <p className="blog-post__description">{post.description}</p>
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
    </div>
  );
}
