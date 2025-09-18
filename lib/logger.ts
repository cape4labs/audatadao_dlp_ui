const isDebug = process.env.NEXT_PUBLIC_DEBUG === "true";

export function debugLog(...args: any) {
  if (isDebug) {
    console.log(args);
  }
}
