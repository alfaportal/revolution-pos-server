import "./styles.css";
import { initRouter, onRoute } from "./lib/router.js";
import { renderBlogList } from "./pages/blogList.js";
import { renderBlogArticle } from "./pages/blogArticle.js";
import { integrated } from "./lib/base.js";

if (integrated) {
  onRoute("/blog", () => renderBlogList());
  onRoute("/blog/:slug", ({ slug }) => renderBlogArticle(slug));
} else {
  onRoute("/", () => renderBlogList());
  onRoute("/blog/:slug", ({ slug }) => renderBlogArticle(slug));
}

initRouter();
