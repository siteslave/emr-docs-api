export interface IFile {
  id?: string;
  file_type?: string;
  filename?: string;
  mimtype?: string;
  data?: string;
  created_at?: string;
}
export interface IDocument {
  id?: string;
  vn?: string;
  hn?: string;
  files?: Array<IFile>;
}