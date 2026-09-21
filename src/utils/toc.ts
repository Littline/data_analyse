export interface TocHeading {
  depth: number;
  slug: string;
  text: string;
  children: TocHeading[];
}

/**
 * 把 Astro 渲染出的 headings 列表（扁平）转成嵌套的目录树。
 * 只保留 h2 / h3，避免侧边目录过长。
 */
export function buildToc(
  headings: Array<{ depth: number; slug: string; text: string }>,
  minDepth = 2,
  maxDepth = 3,
): TocHeading[] {
  const root: TocHeading[] = [];
  const stack: TocHeading[] = [];

  for (const heading of headings) {
    if (heading.depth < minDepth || heading.depth > maxDepth) continue;

    const node: TocHeading = { ...heading, children: [] };

    while (stack.length > 0 && stack[stack.length - 1]!.depth >= node.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1]!.children.push(node);
    }

    stack.push(node);
  }

  return root;
}
