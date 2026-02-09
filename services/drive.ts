
export interface DriveFolder {
  id: string;
  name: string;
}

// ID da pasta mestre fornecida pelo usuário
export const AFETO_MASTER_FOLDER_ID = '1sLufc1dd_zZVLWkCCxDiMa3leT08Fie_';

export const findFolderByName = async (name: string, parentId: string, accessToken: string): Promise<string | null> => {
  // Busca por nome exato dentro de um pai específico
  const query = `name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name)`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
};

export const createDriveFolder = async (folderName: string, accessToken: string, parentId: string): Promise<string> => {
  const body = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  };

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Erro ao criar pasta no Google Drive');
  return data.id;
};

/**
 * Cria ou obtém a pasta do projeto do cliente dentro da pasta mestre
 */
export const getOrCreateProjectFolder = async (projectName: string, accessToken: string): Promise<string> => {
  let folderId = await findFolderByName(projectName, AFETO_MASTER_FOLDER_ID, accessToken);
  
  if (!folderId) {
    folderId = await createDriveFolder(projectName, accessToken, AFETO_MASTER_FOLDER_ID);
  }
  
  return folderId;
};

export const uploadToDrive = async (
  blob: Blob,
  fileName: string,
  parentId: string,
  accessToken: string
): Promise<void> => {
  const metadata = {
    name: fileName,
    parents: [parentId],
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', blob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro no upload para o Google Drive');
  }
};
