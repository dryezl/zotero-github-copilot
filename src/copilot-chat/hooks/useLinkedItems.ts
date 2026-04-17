export function useLinkedItems(input: string): string[] {
  const matches = input.match(/\[\[(.*?)\]\]/g) || [];
  return matches.map((value) => value.slice(2, -2));
}
