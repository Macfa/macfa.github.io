export function Container({
  children,
  width = "list",
}: {
  children: React.ReactNode;
  width?: "list" | "doc";
}) {
  const maxWidth = width === "doc" ? "max-w-[65ch]" : "max-w-3xl";

  return (
    <div className={`mx-auto w-full ${maxWidth} px-4 sm:px-6`}>{children}</div>
  );
}
