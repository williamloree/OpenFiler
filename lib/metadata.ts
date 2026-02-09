import { join } from "path";
import { readFile, writeFile } from "fs/promises";

interface FileMetadata {
  isPrivate: boolean;
}

type MetadataStore = Record<string, FileMetadata>;

const METADATA_PATH = join(process.cwd(), "upload", ".metadata.json");

async function loadMetadata(): Promise<MetadataStore> {
  try {
    const data = await readFile(METADATA_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveMetadata(store: MetadataStore): Promise<void> {
  await writeFile(METADATA_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function getFilePrivacy(folder: string, filename: string): Promise<boolean> {
  const store = await loadMetadata();
  const key = `${folder}/${filename}`;
  return store[key]?.isPrivate ?? false;
}

export async function setFilePrivacy(folder: string, filename: string, isPrivate: boolean): Promise<void> {
  const store = await loadMetadata();
  const key = `${folder}/${filename}`;
  if (isPrivate) {
    store[key] = { isPrivate: true };
  } else {
    delete store[key];
  }
  await saveMetadata(store);
}

export async function getAllPrivateFiles(): Promise<Set<string>> {
  const store = await loadMetadata();
  const privateSet = new Set<string>();
  for (const [key, meta] of Object.entries(store)) {
    if (meta.isPrivate) privateSet.add(key);
  }
  return privateSet;
}

export async function removeFileMetadata(folder: string, filename: string): Promise<void> {
  const store = await loadMetadata();
  const key = `${folder}/${filename}`;
  if (key in store) {
    delete store[key];
    await saveMetadata(store);
  }
}
