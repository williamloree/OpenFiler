export interface IReqFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export interface IFile {
  name: string;
  defaultName: string;
  type: string;
  size: number;
  path: string;
  fieldname: string;
  url: string;
}

export interface ObjectAuthorizedMimeTypes {
  [key: string]: string[];
}

export interface FieldConfig {
  name: string;
  maxCount: number;
}

export type ArrayFields = FieldConfig[];