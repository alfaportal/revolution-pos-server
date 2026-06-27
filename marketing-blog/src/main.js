import "./styles.css";
import { initRouter, onRoute } from "./lib/router.js";
import { renderHome } from "./pages/home.js";
import { renderBlogArticle } from "./pages/blogArticle.js";
import { integrated } from "./lib/base.js";

onRoute("/", () => renderHome());

if (integrated) {
  onRoute("/blog/:slug", ({ slug }) => renderBlogArticle(slug));
} else {
  onRoute("/blog/:slug", ({ slug }) => renderBlogArticle(slug));
}

initRouter();
