/**
 * The 17 career families predicted by the ML model (agentic-ai/ml/career/taxonomy.py).
 * `riasec` is the typical Holland interest profile of the family (0..1), used to
 * explain a result in terms of the user's own interest scores.
 * `profiles` lists the app's career profiles in the family (same mapping as the
 * Python taxonomy) and is used to rank families when the ML service is down.
 */
export type CareerFamily = {
  code: string;
  name: string;
  description: string;
  riasec: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number>;
  majors: string[];
  jobs: string[];
  tryFirst: string;
  profiles: string[];
};

const r = (R: number, I: number, A: number, S: number, E: number, C: number) => ({ R, I, A, S, E, C });

export const CAREER_FAMILIES: CareerFamily[] = [
  {
    code: 'it_software', name: 'Công nghệ thông tin',
    description: 'Thiết kế, xây dựng và vận hành phần mềm, dữ liệu và hệ thống máy tính.',
    riasec: r(0.55, 0.92, 0.45, 0.25, 0.35, 0.75),
    majors: ['Khoa học máy tính', 'Kỹ thuật phần mềm', 'Hệ thống thông tin', 'Khoa học dữ liệu', 'An toàn thông tin'],
    jobs: ['Lập trình viên', 'Kỹ sư dữ liệu', 'Kỹ sư bảo mật', 'Kỹ sư DevOps'],
    tryFirst: 'tự làm một ứng dụng nhỏ hoặc học thử một khóa lập trình cơ bản',
    profiles: ['software_it', 'ai_data', 'cybersecurity_network', 'cloud_devops', 'game_interactive', 'education_technology'],
  },
  {
    code: 'engineering', name: 'Kỹ thuật',
    description: 'Ứng dụng toán và vật lý để thiết kế, chế tạo, vận hành máy móc và hệ thống.',
    riasec: r(0.92, 0.8, 0.3, 0.25, 0.4, 0.65),
    majors: ['Kỹ thuật cơ khí', 'Kỹ thuật điện - điện tử', 'Tự động hóa', 'Cơ điện tử', 'Kỹ thuật ô tô'],
    jobs: ['Kỹ sư cơ khí', 'Kỹ sư điện', 'Kỹ sư tự động hóa', 'Kỹ sư vận hành'],
    tryFirst: 'lắp thử một mạch Arduino hoặc tham quan một xưởng sản xuất',
    profiles: ['engineering_mechanical', 'engineering_electrical', 'automotive_transport', 'energy_renewable', 'aviation_maritime'],
  },
  {
    code: 'architecture_construction', name: 'Kiến trúc & Xây dựng',
    description: 'Thiết kế không gian, công trình và quản lý quá trình xây dựng.',
    riasec: r(0.82, 0.65, 0.78, 0.3, 0.5, 0.7),
    majors: ['Kiến trúc', 'Kỹ thuật xây dựng', 'Quy hoạch đô thị', 'Thiết kế nội thất', 'Hệ thống thông tin địa lý'],
    jobs: ['Kiến trúc sư', 'Kỹ sư xây dựng', 'Kỹ sư dự toán', 'Chuyên viên quy hoạch'],
    tryFirst: 'phác thảo mặt bằng một căn phòng hoặc học thử SketchUp',
    profiles: ['construction_architecture', 'geospatial_gis'],
  },
  {
    code: 'business_management', name: 'Kinh doanh & Quản trị',
    description: 'Điều hành tổ chức, quản lý con người, vận hành và phát triển kinh doanh.',
    riasec: r(0.3, 0.45, 0.4, 0.55, 0.95, 0.75),
    majors: ['Quản trị kinh doanh', 'Quản trị nhân lực', 'Logistics & chuỗi cung ứng', 'Thương mại điện tử', 'Kinh doanh quốc tế'],
    jobs: ['Chuyên viên kinh doanh', 'Quản lý dự án', 'Chuyên viên nhân sự', 'Chuyên viên logistics'],
    tryFirst: 'tổ chức một dự án nhỏ ở trường hoặc thử bán một sản phẩm online',
    profiles: ['business_management', 'logistics_supplychain', 'entrepreneurship_innovation', 'ecommerce_digital', 'hr_people_ops'],
  },
  {
    code: 'marketing_communication', name: 'Marketing & Truyền thông',
    description: 'Xây dựng thương hiệu, sáng tạo nội dung và truyền tải thông điệp đến công chúng.',
    riasec: r(0.2, 0.4, 0.85, 0.65, 0.92, 0.4),
    majors: ['Marketing', 'Quan hệ công chúng', 'Truyền thông đa phương tiện', 'Báo chí', 'Tổ chức sự kiện'],
    jobs: ['Chuyên viên marketing', 'Content creator', 'Chuyên viên PR', 'Phóng viên'],
    tryFirst: 'lên ý tưởng và chạy thử một chiến dịch nhỏ cho câu lạc bộ',
    profiles: ['marketing_media', 'content_media', 'journalism_investigation', 'event_creative'],
  },
  {
    code: 'finance_economics', name: 'Tài chính, Kế toán & Kinh tế',
    description: 'Phân tích số liệu tài chính, quản lý tiền và nghiên cứu hoạt động kinh tế.',
    riasec: r(0.2, 0.75, 0.2, 0.3, 0.65, 0.95),
    majors: ['Tài chính - Ngân hàng', 'Kế toán', 'Kiểm toán', 'Kinh tế học', 'Kinh tế đầu tư'],
    jobs: ['Kế toán viên', 'Kiểm toán viên', 'Chuyên viên phân tích tài chính', 'Chuyên viên ngân hàng'],
    tryFirst: 'lập bảng ngân sách cá nhân trong một tháng hoặc học thử Excel tài chính',
    profiles: ['finance_accounting', 'economics_research'],
  },
  {
    code: 'arts_design', name: 'Nghệ thuật & Thiết kế',
    description: 'Sáng tạo hình ảnh, sản phẩm và trải nghiệm mang tính thẩm mỹ.',
    riasec: r(0.35, 0.4, 0.95, 0.4, 0.45, 0.3),
    majors: ['Thiết kế đồ họa', 'Thiết kế đa phương tiện', 'Thiết kế UX/UI', 'Mỹ thuật', 'Âm nhạc'],
    jobs: ['Nhà thiết kế đồ họa', 'Nhà thiết kế UX/UI', 'Họa sĩ minh họa', 'Nhà làm phim'],
    tryFirst: 'thiết kế một poster hoặc xây portfolio 3-5 sản phẩm nhỏ',
    profiles: ['design_multimedia', 'product_ux_research'],
  },
  {
    code: 'humanities_language', name: 'Ngôn ngữ & Nhân văn',
    description: 'Nghiên cứu ngôn ngữ, văn học, lịch sử, văn hóa và giao tiếp quốc tế.',
    riasec: r(0.15, 0.6, 0.8, 0.6, 0.45, 0.4),
    majors: ['Ngôn ngữ Anh', 'Ngôn ngữ Nhật/Hàn/Trung', 'Văn học', 'Lịch sử', 'Biên - phiên dịch'],
    jobs: ['Biên - phiên dịch viên', 'Giáo viên ngoại ngữ', 'Biên tập viên', 'Chuyên viên đối ngoại'],
    tryFirst: 'dịch thử một bài báo hoặc tham gia câu lạc bộ ngoại ngữ',
    profiles: ['language_international'],
  },
  {
    code: 'psychology_counseling', name: 'Tâm lý học',
    description: 'Tìm hiểu hành vi, cảm xúc của con người và hỗ trợ sức khỏe tinh thần.',
    riasec: r(0.15, 0.7, 0.5, 0.95, 0.4, 0.3),
    majors: ['Tâm lý học', 'Tâm lý học giáo dục', 'Tham vấn học đường'],
    jobs: ['Chuyên viên tâm lý', 'Chuyên viên tham vấn học đường', 'Chuyên viên nhân sự - đào tạo'],
    tryFirst: 'tham gia nhóm hỗ trợ bạn học hoặc đọc một cuốn sách nhập môn tâm lý',
    profiles: ['psychology_education'],
  },
  {
    code: 'education', name: 'Giáo dục',
    description: 'Giảng dạy, thiết kế bài học và đồng hành cùng sự phát triển của người học.',
    riasec: r(0.25, 0.45, 0.55, 0.95, 0.5, 0.5),
    majors: ['Sư phạm', 'Giáo dục mầm non', 'Giáo dục tiểu học', 'Quản lý giáo dục', 'Công nghệ giáo dục'],
    jobs: ['Giáo viên', 'Gia sư', 'Chuyên viên đào tạo', 'Chuyên viên phát triển chương trình'],
    tryFirst: 'kèm học cho một em nhỏ hoặc làm trợ giảng ở trung tâm',
    profiles: ['psychology_education', 'education_technology'],
  },
  {
    code: 'social_work', name: 'Xã hội học & Công tác xã hội',
    description: 'Nghiên cứu xã hội và trực tiếp hỗ trợ các cộng đồng, nhóm yếu thế.',
    riasec: r(0.2, 0.5, 0.45, 0.95, 0.5, 0.4),
    majors: ['Công tác xã hội', 'Xã hội học', 'Phát triển cộng đồng', 'Nhân học'],
    jobs: ['Nhân viên công tác xã hội', 'Điều phối dự án phi lợi nhuận', 'Nghiên cứu viên xã hội'],
    tryFirst: 'tham gia một dự án tình nguyện trong 1-2 tháng',
    profiles: ['social_impact'],
  },
  {
    code: 'law_public', name: 'Luật & Khu vực công',
    description: 'Áp dụng pháp luật, xây dựng chính sách và làm việc trong cơ quan nhà nước.',
    riasec: r(0.2, 0.65, 0.4, 0.6, 0.88, 0.65),
    majors: ['Luật', 'Luật kinh tế', 'Quan hệ quốc tế', 'Quản lý nhà nước', 'Chính trị học'],
    jobs: ['Luật sư', 'Chuyên viên pháp chế', 'Chuyên viên chính sách', 'Cán bộ ngoại giao'],
    tryFirst: 'tham gia một phiên tòa giả định hoặc câu lạc bộ tranh biện',
    profiles: ['law_publicservice', 'public_diplomacy'],
  },
  {
    code: 'health_medicine', name: 'Y tế & Điều dưỡng',
    description: 'Chăm sóc, chẩn đoán và điều trị để bảo vệ sức khỏe con người.',
    riasec: r(0.5, 0.85, 0.25, 0.88, 0.35, 0.55),
    majors: ['Y khoa', 'Điều dưỡng', 'Dược học', 'Y tế công cộng', 'Dinh dưỡng'],
    jobs: ['Bác sĩ', 'Điều dưỡng viên', 'Dược sĩ', 'Chuyên viên dinh dưỡng'],
    tryFirst: 'học một khóa sơ cứu hoặc tình nguyện tại cơ sở y tế',
    profiles: ['healthcare_biology', 'food_nutrition'],
  },
  {
    code: 'life_sciences', name: 'Khoa học sự sống',
    description: 'Nghiên cứu sinh vật, môi trường và ứng dụng sinh học vào đời sống.',
    riasec: r(0.55, 0.95, 0.3, 0.4, 0.3, 0.5),
    majors: ['Công nghệ sinh học', 'Sinh học', 'Khoa học môi trường', 'Nông nghiệp công nghệ cao', 'Thú y'],
    jobs: ['Kỹ thuật viên xét nghiệm', 'Nghiên cứu viên sinh học', 'Kỹ sư môi trường', 'Bác sĩ thú y'],
    tryFirst: 'làm một thí nghiệm nhỏ hoặc tham gia dự án môi trường ở trường',
    profiles: ['biotech_pharma', 'environment_agriculture', 'veterinary_animal'],
  },
  {
    code: 'physical_sciences_math', name: 'Khoa học tự nhiên & Toán',
    description: 'Nghiên cứu toán, vật lý, hóa học và các quy luật của tự nhiên.',
    riasec: r(0.5, 0.98, 0.3, 0.25, 0.3, 0.65),
    majors: ['Toán học', 'Toán tin', 'Vật lý', 'Hóa học', 'Khoa học vật liệu'],
    jobs: ['Nhà nghiên cứu', 'Chuyên viên phân tích định lượng', 'Kỹ sư hóa', 'Giảng viên'],
    tryFirst: 'giải một bài toán mở hoặc tham gia một dự án nghiên cứu khoa học',
    profiles: ['science_research', 'chemistry_materials'],
  },
  {
    code: 'hospitality_tourism', name: 'Du lịch & Dịch vụ',
    description: 'Tổ chức trải nghiệm du lịch, lưu trú, ẩm thực và chăm sóc khách hàng.',
    riasec: r(0.4, 0.25, 0.45, 0.75, 0.88, 0.5),
    majors: ['Quản trị du lịch & lữ hành', 'Quản trị khách sạn', 'Quản trị nhà hàng'],
    jobs: ['Hướng dẫn viên', 'Quản lý khách sạn', 'Điều hành tour', 'Chuyên viên chăm sóc khách hàng'],
    tryFirst: 'làm part-time ở khách sạn/quán cà phê hoặc lên kế hoạch một chuyến đi cho nhóm',
    profiles: ['hospitality_tourism'],
  },
  {
    code: 'sports_fitness', name: 'Thể thao & Vận động',
    description: 'Huấn luyện, giảng dạy thể chất và chăm sóc sức khỏe vận động.',
    riasec: r(0.8, 0.45, 0.3, 0.8, 0.55, 0.3),
    majors: ['Giáo dục thể chất', 'Huấn luyện thể thao', 'Quản lý thể dục thể thao', 'Vật lý trị liệu'],
    jobs: ['Huấn luyện viên', 'Giáo viên thể dục', 'Huấn luyện viên cá nhân', 'Chuyên viên phục hồi chức năng'],
    tryFirst: 'làm trợ lý huấn luyện cho đội thể thao của trường',
    profiles: ['sports_wellness'],
  },
];

export const RIASEC_LABELS: Record<string, string> = {
  R: 'Thực hành - Kỹ thuật',
  I: 'Nghiên cứu - Phân tích',
  A: 'Nghệ thuật - Sáng tạo',
  S: 'Xã hội - Hỗ trợ',
  E: 'Quản lý - Thuyết phục',
  C: 'Nghiệp vụ - Tổ chức',
};
