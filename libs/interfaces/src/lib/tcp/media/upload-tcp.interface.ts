export interface UploadImageTcpRequest {
    fileBuffer: string; // base64 encoded
    fileName: string;
}

export interface UploadImageTcpResponse {
    url: string;
}
