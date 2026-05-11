import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Virtuoso } from "react-virtuoso";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Dùng đúng version của pdfjs-dist mà react-pdf đang bundle để tránh
// "API version does not match the Worker version".
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type Props = {
  fileUrl: string;
  Footer: React.ComponentType;
  onFail?: () => void;
};

export function PdfReader({ fileUrl, Footer, onFail }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(800);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.min(el.clientWidth || 800, 1200));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="mx-auto max-w-3xl px-2">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(err) => {
          console.error("PDF load error", err);
          onFail?.();
        }}
        loading={
          <div className="p-10 text-center text-muted-foreground">Đang tải PDF…</div>
        }
        error={
          <div className="p-10 text-center text-destructive">Không tải được PDF.</div>
        }
      >
        {numPages && (
          <Virtuoso
            useWindowScroll
            totalCount={numPages}
            increaseViewportBy={{ top: 1500, bottom: 2000 }}
            defaultItemHeight={width * 1.4}
            components={{
              Header: () => <div className="h-14" />,
              Footer: () => <Footer />,
            }}
            itemContent={(i) => (
              <div className="flex justify-center py-2">
                <Page
                  pageNumber={i + 1}
                  width={width}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  loading={
                    <div
                      style={{ width, height: width * 1.4 }}
                      className="bg-secondary/40"
                    />
                  }
                />
              </div>
            )}
          />
        )}
      </Document>
    </div>
  );
}