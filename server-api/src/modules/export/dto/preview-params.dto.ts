export interface PreviewQueryDto {
  // Required parameters
  type: string;
  code: string;

  // Optional parameters
  id?: string;
  file_type?: string; // Valid values are 'pdf', 'xlsx' and 'docx'. Default value is 'pdf'
  status?: string; // Required for 'report-project' and 'report-project-all-invoices' types
  start?: string;
  end?: string;
  lang?: string;
  preview?: string; // If true, the file will be displayed in the browser. Otherwise, the file will be downloaded
}
