/**
 *
 * @param {Object} props
 * @param {import("solid-js").JSXElement} props.children
 * @param {("primary"|"primary-outline")} props.variant Button variant
 * @param {("xs"|"sm"|"md"|"lg")} props.size Size of the button
 * @param {function} props.onClick
 * @returns {import("solid-js").JSXElement}
 */
export function Button(props) {
  const { children, variant, size, onClick = () => {} } = props;

  const classList = {
    "text-xs px-1": size === "xs",
    "text-sm py-1 px-2": size === "sm",
    "text-md py-1 px-2": size === "md",
    "text-lg py-2 px-3": size === "lg",
    "bg-primary text-z-1": variant === "primary",
    "border-primary text-primary hover:bg-primary hover:text-z-1":
      variant === "primary-outline",
  };

  return (
    <button
      className="flex items-center duration-[150ms] border-[1px] capitalize rounded border-transparent"
      classList={classList}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
