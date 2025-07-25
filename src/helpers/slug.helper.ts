export function slugify(str: string) {
  return str
    .normalize("NFKD") // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, "") // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 _-]/g, "") // remove non-alphanumeric characters
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-") // remove consecutive hyphens
    .replace(/_+/g, "_"); // remove consecutive underscore
}

export function getSlugifiedFilenameWithExtension(str: string) {
  const parts = str.split(".");
  const extension = parts.pop();
  return `${slugify(parts.join(""))}.${extension}`;
}
