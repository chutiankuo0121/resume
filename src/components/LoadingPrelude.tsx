import type { Ref } from "react";

export default function LoadingPrelude({ ref, error, onRetry }: {
  ref: Ref<HTMLElement>;
  error: string;
  onRetry: () => void;
}) {
  return (
    <section ref={ref} className="loading-prelude" role={error ? "group" : "progressbar"}
      aria-label="正在凝聚星尘" aria-valuemin={error ? undefined : 0}
      aria-valuemax={error ? undefined : 100} aria-valuenow={error ? undefined : 0}
      data-failed={Boolean(error)}>
      <div className="prelude-copy" aria-hidden="true">
        <div className="prelude-counter">
          {[100, 10, 1].map((place) => (
            <span className="prelude-digit" key={place}>
              <span className="prelude-digit-strip" data-place={place}>
                {Array.from({ length: 11 }, (_, index) => (
                  <span key={index}>{index % 10}</span>
                ))}
              </span>
            </span>
          ))}
        </div>
      </div>
      {error && (
        <div className="prelude-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetry}>重新加载</button>
        </div>
      )}
    </section>
  );
}
