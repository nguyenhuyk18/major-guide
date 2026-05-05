import { ApiProperty } from "@nestjs/swagger";

export class CreatePostGatewayRequest {
    @ApiProperty({ example: 'Tiêu đề bài viết', description: 'Tiêu đề bài viết' })
    title: string;

    @ApiProperty({ example: 'Nội dung bài viết', description: 'Nội dung bài viết' })
    content: string;

    @ApiProperty({ example: 'https://example.com/image.jpg', description: 'URL hình ảnh' })
    imageUrl: string;

    @ApiProperty({ example: 'expert-123', description: 'ID chuyên gia', required: false })
    expertId?: string;

    @ApiProperty({ example: 'Mô tả ngắn về bài viết', description: 'Mô tả', required: false })
    description?: string;

    @ApiProperty({ example: 'draft', description: 'Trạng thái: draft | published | archived', required: false })
    status?: string;

    @ApiProperty({ example: 'category-123', description: 'ID danh mục', required: false })
    categoryId?: string;

    @ApiProperty({ example: ['tag1', 'tag2'], description: 'Danh sách tags', required: false })
    tags?: string[];

    @ApiProperty({ example: 'Tóm tắt ngắn gọn bài viết', description: 'Tóm tắt bài viết', required: false })
    excerpt?: string;

    @ApiProperty({ example: false, description: 'Bài viết nổi bật', required: false })
    isFeatured?: boolean;

    @ApiProperty({ example: '2026-05-10T10:00:00Z', description: 'Thời gian hẹn đăng (ISO 8601)', required: false })
    scheduledAt?: string;

    @ApiProperty({ example: 'url-friendly-title', description: 'Slug URL', required: false })
    slug?: string;

    @ApiProperty({ example: 'SEO Meta Title', description: 'SEO Meta Title', required: false })
    metaTitle?: string;

    @ApiProperty({ example: 'SEO Meta Description', description: 'SEO Meta Description', required: false })
    metaDescription?: string;

    @ApiProperty({ example: ['https://example.com/img1.jpg'], description: 'Danh sách ảnh gallery', required: false })
    imageGallery?: string[];
}

export class UpdatePostGatewayRequest {
    @ApiProperty({ example: 'post-123', description: 'ID bài viết cần cập nhật' })
    id: string;

    @ApiProperty({ example: 'Tiêu đề mới', description: 'Tiêu đề bài viết', required: false })
    title?: string;

    @ApiProperty({ example: 'Nội dung mới', description: 'Nội dung bài viết', required: false })
    content?: string;

    @ApiProperty({ example: 'https://example.com/new-image.jpg', description: 'URL hình ảnh mới', required: false })
    imageUrl?: string;

    @ApiProperty({ example: 'Mô tả mới', description: 'Mô tả', required: false })
    description?: string;

    @ApiProperty({ example: 'published', description: 'Trạng thái: draft | published | archived', required: false })
    status?: string;

    @ApiProperty({ example: 'category-456', description: 'ID danh mục', required: false })
    categoryId?: string;

    @ApiProperty({ example: ['tag3', 'tag4'], description: 'Danh sách tags', required: false })
    tags?: string[];

    @ApiProperty({ example: 'Tóm tắt mới', description: 'Tóm tắt bài viết', required: false })
    excerpt?: string;

    @ApiProperty({ example: true, description: 'Bài viết nổi bật', required: false })
    isFeatured?: boolean;

    @ApiProperty({ example: '2026-05-15T10:00:00Z', description: 'Thời gian hẹn đăng (ISO 8601)', required: false })
    scheduledAt?: string;

    @ApiProperty({ example: 'new-url-friendly-title', description: 'Slug URL', required: false })
    slug?: string;

    @ApiProperty({ example: 'New SEO Meta Title', description: 'SEO Meta Title', required: false })
    metaTitle?: string;

    @ApiProperty({ example: 'New SEO Meta Description', description: 'SEO Meta Description', required: false })
    metaDescription?: string;

    @ApiProperty({ example: ['https://example.com/img2.jpg'], description: 'Danh sách ảnh gallery', required: false })
    imageGallery?: string[];
}
