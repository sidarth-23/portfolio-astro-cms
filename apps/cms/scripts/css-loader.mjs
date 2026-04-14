const isCssPath = (value) => /\.css($|\?|#)/.test(value);

export async function resolve(specifier, context, nextResolve) {
  if (isCssPath(specifier)) {
    const resolved = await nextResolve(specifier, context);
    return { ...resolved, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (isCssPath(url)) {
    return {
      format: "module",
      source: "export default {};",
      shortCircuit: true,
    };
  }

  return nextLoad(url, context);
}
