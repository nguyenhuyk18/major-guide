export interface CreatePostTcpRequest {
    title: string;
    content: string;
    imageUrl: string;
    expertId: string;
}

export interface UpdatePostTcpRequest {
    id: string;
    title?: string;
    content?: string;
    imageUrl?: string;
    isNewImage?: boolean;
}

export interface DeletePostTcpRequest {
    id: string;
}

export interface GetPostByIdTcpRequest {
    id: string;
}

export interface GetPostsByExpertTcpRequest {
    expertId: string;
}
