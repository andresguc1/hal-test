import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { BASE } from "../utils/base";

export async function GET(context) {
  const posts = (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: "HAL-TEST Blog",
    description: "HAL-TEST: the missing link in browser automation.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: new URL(`${BASE}blog/${post.id}/`, context.site).href,
    })),
  });
}
