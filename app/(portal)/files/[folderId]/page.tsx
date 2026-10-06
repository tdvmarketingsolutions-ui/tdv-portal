import { FolderBrowser } from "../FolderBrowser";

export default function FilesFolderPage({ params }: { params: { folderId: string } }) {
  return <FolderBrowser folderId={params.folderId} />;
}
