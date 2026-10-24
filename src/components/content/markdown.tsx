import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders editor Markdown on the server. Raw HTML is NOT rendered (react-markdown default),
 * and only http(s)/mailto links are kept, so a compromised editor account cannot inject scripts.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-am">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => (/^(https?:|mailto:|\/|#)/i.test(url) ? url : "")}
        components={{
          a: ({ href, children: c }) => {
            const external = href?.startsWith("http");
            return (
              <a href={href} {...(external ? { rel: "noopener noreferrer nofollow", target: "_blank" } : {})}>
                {c}
              </a>
            );
          },
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => (
            <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} loading="lazy" decoding="async" />
          ),
          h1: ({ children: c }) => <h2>{c}</h2>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
