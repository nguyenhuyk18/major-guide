export type Dimension = 'interest' | 'workValue' | 'workStyle';
export type BankQuestion = {
  code: string;
  dimension: Dimension;
  facet: string;
  text: string;
  contextVariants: string[];
  polarity: 1 | -1;
  weight: number;
  isCore: boolean;
};
export type CareerProfile = {
  code: string;
  name: string;
  interests: Record<string, number>;
  values: Record<string, number>;
  styles: Record<string, number>;
  relatedMajors: string[];
  activities: string[];
};

const interestItems: Record<string, string[]> = {
  R: [
    'lắp ráp hoặc sửa chữa một vật dụng',
    'tạo ra sản phẩm hữu hình',
    'học bằng cách trực tiếp thực hành',
    'sử dụng công cụ hoặc thiết bị',
    'quan sát kết quả cụ thể từ công việc',
    'giải quyết vấn đề bằng thao tác thực tế',
    'tìm hiểu máy móc vận hành',
    'làm việc trong môi trường cần vận động',
  ],
  I: [
    'tìm bằng chứng trước khi kết luận',
    'tìm nguyên nhân phía sau một hiện tượng',
    'phân tích dữ liệu để tìm quy luật',
    'thử nhiều giả thuyết khi giải quyết vấn đề',
    'đọc sâu về một chủ đề khó',
    'đặt câu hỏi vì sao và kiểm chứng',
    'thực hiện thí nghiệm hoặc nghiên cứu',
    'giải bài toán chưa có lời giải rõ ràng',
  ],
  A: [
    'tạo ý tưởng khác cách làm quen thuộc',
    'làm việc với hình ảnh, âm thanh hoặc câu chữ',
    'thể hiện góc nhìn qua sản phẩm',
    'sáng tạo trong không gian tự do',
    'chú ý bố cục và cảm xúc của sản phẩm',
    'kể một câu chuyện theo cách riêng',
    'thử nghiệm nhiều phong cách biểu đạt',
    'làm nhiệm vụ có nhiều cách hoàn thành',
  ],
  S: [
    'giúp người khác tiến bộ',
    'lắng nghe khi ai đó gặp khó khăn',
    'hướng dẫn một người hiểu vấn đề',
    'quan tâm cảm xúc của mọi người trong nhóm',
    'tạo tác động tích cực cho cộng đồng',
    'hợp tác thay vì cạnh tranh cá nhân',
    'kiên nhẫn giải thích cho người khác',
    'làm việc trực tiếp với con người',
  ],
  E: [
    'thuyết phục người khác ủng hộ ý tưởng',
    'đứng ra dẫn dắt khi nhóm thiếu định hướng',
    'biến ý tưởng thành cơ hội',
    'đưa ra quyết định và chịu trách nhiệm',
    'theo đuổi mục tiêu có tính thử thách',
    'trình bày ý tưởng trước nhiều người',
    'thương lượng và xây dựng quan hệ',
    'chủ động bắt đầu hoạt động mới',
  ],
  C: [
    'sắp xếp thông tin theo hệ thống',
    'làm việc theo quy trình cụ thể',
    'kiểm tra chi tiết trước khi hoàn thành',
    'lập kế hoạch và theo dõi tiến độ',
    'quản lý hồ sơ hoặc số liệu',
    'hoàn thành nhiệm vụ đúng thứ tự',
    'duy trì sự chính xác và nhất quán',
    'biến công việc lộn xộn thành có tổ chức',
  ],
};
const valueItems: Record<string, string[]> = {
  achievement: [
    'nhìn thấy thành quả rõ ràng',
    'sử dụng tốt năng lực cá nhân',
    'có cảm giác hoàn thành',
    'chinh phục mục tiêu có ý nghĩa',
  ],
  independence: [
    'tự quyết trong cách làm việc',
    'có không gian cho ý tưởng riêng',
    'chịu trách nhiệm cho lựa chọn',
    'chủ động sắp xếp công việc',
  ],
  relationships: [
    'làm việc cùng người tôn trọng nhau',
    'làm việc phù hợp giá trị đạo đức',
    'hợp tác chân thành',
    'làm công việc có ích',
  ],
  support: [
    'được quản lý hỗ trợ',
    'làm trong tổ chức công bằng',
    'được hướng dẫn khi cần',
    'được phát triển lâu dài',
  ],
  recognition: [
    'được ghi nhận đóng góp',
    'có đường thăng tiến',
    'có ảnh hưởng trong công việc',
    'có vị trí được đánh giá cao',
  ],
  workingConditions: [
    'có thu nhập và sự ổn định',
    'có môi trường an toàn',
    'cân bằng công việc và cuộc sống',
    'có hoạt động đa dạng',
  ],
};
const styleItems: Record<string, string[]> = {
  analytical: [
    'tách vấn đề lớn thành phần nhỏ',
    'so sánh nhiều nguồn trước quyết định',
    'nhận ra liên hệ giữa thông tin',
    'dùng lập luận khi xử lý vấn đề',
  ],
  creative: [
    'nghĩ ra nhiều cách tiếp cận',
    'cải tiến một sản phẩm',
    'kết nối ý tưởng khác nhau',
    'dùng trí tưởng tượng',
  ],
  communication: [
    'diễn đạt để người khác dễ hiểu',
    'điều chỉnh cách nói theo người nghe',
    'trao đổi khi có bất đồng',
    'trình bày kết quả',
  ],
  organization: [
    'xác định ưu tiên',
    'theo dõi thời hạn',
    'duy trì tài liệu có trật tự',
    'chuẩn bị trước cho rủi ro',
  ],
  persistence: [
    'thử tiếp khi cách đầu thất bại',
    'tập trung với nhiệm vụ dài',
    'hoàn thành cam kết khó',
    'dùng phản hồi để cải thiện',
  ],
  detail: [
    'nhận ra sai sót nhỏ',
    'kiểm tra trước khi bàn giao',
    'giữ dữ liệu nhất quán',
    'cẩn thận khi sai số có hậu quả',
  ],
  adaptability: [
    'điều chỉnh kế hoạch khi thay đổi',
    'học công cụ mới',
    'bình tĩnh trước nhiệm vụ bất ngờ',
    'làm việc với nhiều kiểu người',
  ],
};
const build = (
  data: Record<string, string[]>,
  dimension: Dimension,
  core = false
): BankQuestion[] =>
  Object.entries(data).flatMap(([facet, items]) =>
    items.map((item, index) => {
      const text =
        dimension === 'interest'
          ? `Tôi thích ${item}.`
          : dimension === 'workValue'
          ? `Tôi coi trọng việc ${item}.`
          : `Tôi thường ${item}.`;
      return {
        code: `${
          dimension === 'interest'
            ? 'RIASEC'
            : dimension === 'workValue'
            ? 'VALUE'
            : 'STYLE'
        }_${facet.toUpperCase()}_${String(index + 1).padStart(3, '0')}`,
        dimension,
        facet,
        text,
        contextVariants: [
          `Trong một dự án học tập, ${text.charAt(0).toLowerCase()}${text.slice(
            1
          )}`,
        ],
        polarity: 1,
        weight: 1,
        isCore: core && index < 2,
      };
    })
  );
export const QUESTION_BANK = [
  ...build(interestItems, 'interest', true),
  ...build(valueItems, 'workValue'),
  ...build(styleItems, 'workStyle'),
];

const p = (
  code: string,
  name: string,
  i: number[],
  relatedMajors: string[],
  activities: string[],
  values: Record<string, number> = {},
  styles: Record<string, number> = {}
): CareerProfile => ({
  code,
  name,
  interests: Object.fromEntries(
    ['R', 'I', 'A', 'S', 'E', 'C'].map((k, x) => [k, i[x]])
  ),
  values: {
    achievement: 0.65,
    independence: 0.55,
    relationships: 0.5,
    support: 0.5,
    recognition: 0.5,
    workingConditions: 0.6,
    ...values,
  },
  styles: {
    analytical: 0.55,
    creative: 0.5,
    communication: 0.5,
    organization: 0.55,
    persistence: 0.6,
    detail: 0.55,
    adaptability: 0.55,
    ...styles,
  },
  relatedMajors,
  activities,
});
export const CAREER_PROFILES: CareerProfile[] = [
  p(
    'software_it',
    'Công nghệ thông tin & Phần mềm',
    [0.55, 0.9, 0.55, 0.3, 0.4, 0.75],
    ['Kỹ thuật phần mềm', 'Hệ thống thông tin', 'Khoa học máy tính'],
    ['Xây một ứng dụng nhỏ'],
    { independence: 0.75 },
    { analytical: 0.9, persistence: 0.8 }
  ),
  p(
    'ai_data',
    'AI & Khoa học dữ liệu',
    [0.35, 0.98, 0.4, 0.25, 0.35, 0.8],
    ['Khoa học dữ liệu', 'Trí tuệ nhân tạo', 'Thống kê'],
    ['Phân tích bộ dữ liệu công khai'],
    { achievement: 0.85 },
    { analytical: 0.98, detail: 0.85 }
  ),
  p(
    'cybersecurity_network',
    'An toàn thông tin & Mạng',
    [0.6, 0.92, 0.25, 0.25, 0.35, 0.85],
    ['An toàn thông tin', 'Mạng máy tính'],
    ['Thử phòng lab bảo mật hợp pháp'],
    {},
    { analytical: 0.92, detail: 0.95 }
  ),
  p(
    'engineering_mechanical',
    'Cơ khí & Chế tạo',
    [0.98, 0.72, 0.35, 0.25, 0.4, 0.65],
    ['Kỹ thuật cơ khí', 'Cơ điện tử'],
    ['Thử thiết kế CAD'],
    { achievement: 0.8 },
    { detail: 0.8 }
  ),
  p(
    'engineering_electrical',
    'Điện, Điện tử & Tự động hóa',
    [0.92, 0.82, 0.3, 0.25, 0.35, 0.75],
    ['Kỹ thuật điện', 'Tự động hóa'],
    ['Mô phỏng Arduino'],
    {},
    { analytical: 0.85, detail: 0.9 }
  ),
  p(
    'construction_architecture',
    'Xây dựng & Kiến trúc',
    [0.82, 0.65, 0.78, 0.3, 0.5, 0.7],
    ['Kiến trúc', 'Kỹ thuật xây dựng'],
    ['Phác thảo một không gian'],
    {},
    { creative: 0.82, organization: 0.78 }
  ),
  p(
    'business_management',
    'Kinh doanh & Quản lý',
    [0.3, 0.5, 0.45, 0.58, 0.95, 0.72],
    ['Quản trị kinh doanh', 'Quản trị nhân lực'],
    ['Điều phối dự án nhỏ'],
    { recognition: 0.8 },
    { communication: 0.85, organization: 0.9 }
  ),
  p(
    'marketing_media',
    'Marketing & Truyền thông',
    [0.25, 0.45, 0.85, 0.65, 0.95, 0.4],
    ['Marketing', 'Quan hệ công chúng'],
    ['Thiết kế chiến dịch nhỏ'],
    { recognition: 0.75 },
    { creative: 0.9, communication: 0.95 }
  ),
  p(
    'finance_accounting',
    'Tài chính & Kế toán',
    [0.25, 0.78, 0.25, 0.3, 0.62, 0.98],
    ['Tài chính', 'Kế toán', 'Kiểm toán'],
    ['Lập ngân sách cá nhân'],
    { workingConditions: 0.8 },
    { analytical: 0.9, detail: 0.98 }
  ),
  p(
    'logistics_supplychain',
    'Logistics & Chuỗi cung ứng',
    [0.55, 0.62, 0.3, 0.4, 0.75, 0.92],
    ['Logistics', 'Chuỗi cung ứng'],
    ['Mô phỏng hành trình đơn hàng'],
    {},
    { organization: 0.95, adaptability: 0.85 }
  ),
  p(
    'design_multimedia',
    'Thiết kế & Đa phương tiện',
    [0.35, 0.35, 0.98, 0.4, 0.6, 0.35],
    ['Thiết kế đồ họa', 'Thiết kế UX/UI'],
    ['Thiết kế lại màn hình ứng dụng'],
    { independence: 0.85 },
    { creative: 0.98 }
  ),
  p(
    'content_media',
    'Nội dung & Media',
    [0.25, 0.35, 0.98, 0.58, 0.78, 0.3],
    ['Báo chí', 'Sản xuất nội dung'],
    ['Tạo một câu chuyện ngắn'],
    { recognition: 0.7 },
    { creative: 0.95, communication: 0.88 }
  ),
  p(
    'language_international',
    'Ngôn ngữ & Quốc tế',
    [0.2, 0.5, 0.72, 0.82, 0.68, 0.4],
    ['Ngôn ngữ học', 'Quan hệ quốc tế'],
    ['Thử dịch nội dung chuyên ngành'],
    { relationships: 0.85 },
    { communication: 0.95, adaptability: 0.88 }
  ),
  p(
    'psychology_education',
    'Tâm lý & Giáo dục',
    [0.2, 0.72, 0.55, 0.98, 0.45, 0.45],
    ['Tâm lý học', 'Sư phạm'],
    ['Hướng dẫn một bạn học'],
    { relationships: 0.98, support: 0.8 },
    { communication: 0.9 }
  ),
  p(
    'law_publicservice',
    'Luật & Dịch vụ công',
    [0.2, 0.8, 0.45, 0.75, 0.78, 0.82],
    ['Luật', 'Hành chính công'],
    ['Phân tích tình huống pháp lý'],
    { relationships: 0.75 },
    { analytical: 0.9, communication: 0.88 }
  ),
  p(
    'healthcare_biology',
    'Sức khỏe & Sinh học',
    [0.65, 0.92, 0.35, 0.95, 0.3, 0.72],
    ['Y khoa', 'Điều dưỡng', 'Sinh học'],
    ['Tìm hiểu chủ đề sức khỏe từ nguồn khoa học'],
    { relationships: 0.9 },
    { detail: 0.92, persistence: 0.9 }
  ),
  p(
    'cloud_devops',
    'Hạ tầng Cloud & DevOps',
    [0.7, 0.88, 0.25, 0.25, 0.4, 0.95],
    ['Điện toán đám mây', 'Quản trị hệ thống', 'DevOps'],
    ['Triển khai một website lên cloud'],
    { workingConditions: 0.75 },
    { analytical: 0.88, organization: 0.92, detail: 0.9 }
  ),
  p(
    'product_ux_research',
    'Sản phẩm số & UX Research',
    [0.3, 0.78, 0.82, 0.82, 0.72, 0.55],
    ['Quản lý sản phẩm', 'UX Research', 'Thiết kế tương tác'],
    ['Phỏng vấn người dùng về một ứng dụng'],
    { achievement: 0.8, independence: 0.72 },
    { analytical: 0.82, creative: 0.85, communication: 0.9 }
  ),
  p(
    'biotech_pharma',
    'Công nghệ sinh học & Dược',
    [0.62, 0.98, 0.3, 0.68, 0.25, 0.82],
    ['Công nghệ sinh học', 'Dược học', 'Hóa sinh'],
    ['Đọc và tóm tắt một nghiên cứu sinh học'],
    { achievement: 0.82 },
    { analytical: 0.92, detail: 0.95, persistence: 0.9 }
  ),
  p(
    'environment_agriculture',
    'Môi trường & Nông nghiệp công nghệ',
    [0.9, 0.78, 0.45, 0.7, 0.35, 0.55],
    ['Khoa học môi trường', 'Nông nghiệp công nghệ cao', 'Quản lý tài nguyên'],
    ['Khảo sát một vấn đề môi trường tại địa phương'],
    { relationships: 0.8 },
    { analytical: 0.72, adaptability: 0.82 }
  ),
  p(
    'economics_research',
    'Kinh tế học & Nghiên cứu chính sách',
    [0.2, 0.95, 0.35, 0.62, 0.62, 0.88],
    ['Kinh tế học', 'Kinh tế phát triển', 'Phân tích chính sách'],
    ['Phân tích một chỉ số kinh tế'],
    { achievement: 0.75 },
    { analytical: 0.98, detail: 0.85, communication: 0.72 }
  ),
  p(
    'hr_people_ops',
    'Nhân sự & Phát triển con người',
    [0.2, 0.52, 0.5, 0.95, 0.82, 0.7],
    ['Quản trị nhân lực', 'Đào tạo và phát triển', 'Tâm lý tổ chức'],
    ['Thiết kế hoạt động onboarding nhỏ'],
    { relationships: 0.95, support: 0.9 },
    { communication: 0.95, organization: 0.82 }
  ),
  p(
    'hospitality_tourism',
    'Du lịch, Nhà hàng & Trải nghiệm dịch vụ',
    [0.55, 0.35, 0.65, 0.95, 0.85, 0.62],
    ['Quản trị du lịch', 'Quản trị khách sạn', 'Dịch vụ hàng không'],
    ['Thiết kế hành trình trải nghiệm một ngày'],
    { relationships: 0.9, workingConditions: 0.65 },
    { communication: 0.95, adaptability: 0.95 }
  ),
  p(
    'social_impact',
    'Công tác xã hội & Phát triển cộng đồng',
    [0.35, 0.62, 0.5, 0.99, 0.58, 0.48],
    ['Công tác xã hội', 'Phát triển cộng đồng', 'Quản lý phi lợi nhuận'],
    ['Tham gia một hoạt động cộng đồng'],
    { relationships: 0.99, support: 0.85 },
    { communication: 0.88, persistence: 0.82 }
  ),
  p(
    'science_research',
    'Khoa học cơ bản & Nghiên cứu',
    [0.35, 0.99, 0.4, 0.35, 0.2, 0.78],
    ['Toán học', 'Vật lý', 'Hóa học', 'Khoa học vật liệu'],
    ['Thử tái hiện một thí nghiệm đơn giản'],
    { achievement: 0.85, independence: 0.82 },
    { analytical: 0.99, persistence: 0.95, detail: 0.9 }
  ),
  p(
    'sports_wellness',
    'Thể thao & Sức khỏe vận động',
    [0.95, 0.55, 0.4, 0.9, 0.65, 0.35],
    ['Khoa học thể thao', 'Huấn luyện thể thao', 'Vật lý trị liệu'],
    ['Theo dõi và phân tích một kế hoạch vận động'],
    { relationships: 0.88, achievement: 0.78 },
    { communication: 0.82, persistence: 0.9 }
  ),
  p(
    'automotive_transport',
    'Ô tô & Công nghệ vận tải',
    [0.98, 0.72, 0.3, 0.25, 0.45, 0.7],
    ['Kỹ thuật ô tô', 'Công nghệ giao thông', 'Cơ khí động lực'],
    ['Tìm hiểu cấu tạo một hệ thống trên ô tô'],
    { achievement: 0.75 },
    { analytical: 0.78, detail: 0.82 }
  ),
  p(
    'entrepreneurship_innovation',
    'Khởi nghiệp & Đổi mới sáng tạo',
    [0.35, 0.62, 0.82, 0.62, 0.99, 0.38],
    ['Khởi nghiệp', 'Đổi mới sáng tạo', 'Kinh doanh số'],
    ['Kiểm chứng một ý tưởng với năm người dùng'],
    { independence: 0.95, recognition: 0.82 },
    { creative: 0.92, communication: 0.9, adaptability: 0.98 }
  ),
  p(
    'game_interactive',
    'Game & Trải nghiệm tương tác',
    [0.45, 0.72, 0.98, 0.42, 0.62, 0.38],
    ['Phát triển game', 'Thiết kế game', 'Interactive Media'],
    ['Tạo prototype một cơ chế game'],
    { independence: 0.82 },
    { creative: 0.98, analytical: 0.75, persistence: 0.85 }
  ),
  p(
    'ecommerce_digital',
    'Thương mại điện tử & Kinh doanh số',
    [0.28, 0.58, 0.65, 0.65, 0.95, 0.78],
    ['Thương mại điện tử', 'Kinh doanh số', 'Digital Commerce'],
    ['Thiết kế một gian hàng thử nghiệm'],
    { achievement: 0.82, recognition: 0.72 },
    { analytical: 0.75, communication: 0.82, organization: 0.85 }
  ),
  p(
    'energy_renewable',
    'Năng lượng & Công nghệ xanh',
    [0.88, 0.9, 0.35, 0.42, 0.35, 0.75],
    ['Kỹ thuật năng lượng', 'Năng lượng tái tạo', 'Kỹ thuật nhiệt'],
    ['Ước tính năng lượng cho một mô hình nhỏ'],
    { achievement: 0.82, relationships: 0.68 },
    { analytical: 0.9, detail: 0.88 }
  ),
  p(
    'chemistry_materials',
    'Hóa học & Khoa học vật liệu',
    [0.62, 0.99, 0.4, 0.3, 0.2, 0.88],
    ['Hóa học', 'Khoa học vật liệu', 'Kỹ thuật hóa học'],
    ['Tìm hiểu tính chất một vật liệu quen thuộc'],
    { achievement: 0.86, independence: 0.7 },
    { analytical: 0.98, detail: 0.96, persistence: 0.9 }
  ),
  p(
    'food_nutrition',
    'Công nghệ thực phẩm & Dinh dưỡng',
    [0.72, 0.82, 0.45, 0.85, 0.35, 0.72],
    ['Công nghệ thực phẩm', 'Dinh dưỡng', 'Đảm bảo chất lượng thực phẩm'],
    ['Phân tích nhãn dinh dưỡng của một sản phẩm'],
    { relationships: 0.82, workingConditions: 0.72 },
    { analytical: 0.82, detail: 0.9 }
  ),
  p(
    'veterinary_animal',
    'Thú y & Khoa học động vật',
    [0.9, 0.82, 0.35, 0.95, 0.25, 0.55],
    ['Thú y', 'Chăn nuôi', 'Khoa học động vật'],
    ['Tìm hiểu quy trình chăm sóc một loài vật'],
    { relationships: 0.95, achievement: 0.75 },
    { detail: 0.85, persistence: 0.9 }
  ),
  p(
    'geospatial_gis',
    'Địa lý, GIS & Không gian',
    [0.72, 0.9, 0.58, 0.45, 0.32, 0.82],
    ['GIS', 'Trắc địa bản đồ', 'Địa lý học'],
    ['Tạo một bản đồ dữ liệu đơn giản'],
    { independence: 0.72 },
    { analytical: 0.92, detail: 0.88, creative: 0.62 }
  ),
  p(
    'aviation_maritime',
    'Hàng không & Hàng hải',
    [0.92, 0.68, 0.25, 0.52, 0.62, 0.95],
    ['Kỹ thuật hàng không', 'Khai thác vận tải', 'Hàng hải'],
    ['Mô phỏng kế hoạch một hành trình vận tải'],
    { workingConditions: 0.78, recognition: 0.72 },
    { organization: 0.98, detail: 0.95, adaptability: 0.82 }
  ),
  p(
    'journalism_investigation',
    'Báo chí & Điều tra dữ liệu',
    [0.25, 0.88, 0.82, 0.78, 0.72, 0.55],
    ['Báo chí', 'Báo chí dữ liệu', 'Truyền thông điều tra'],
    ['Kiểm chứng một thông tin đang lan truyền'],
    { independence: 0.82, relationships: 0.75 },
    { analytical: 0.9, communication: 0.95, persistence: 0.82 }
  ),
  p(
    'public_diplomacy',
    'Ngoại giao & Quản trị công',
    [0.2, 0.7, 0.55, 0.88, 0.88, 0.78],
    ['Quan hệ quốc tế', 'Ngoại giao', 'Quản lý nhà nước'],
    ['Mô phỏng đàm phán một vấn đề cộng đồng'],
    { relationships: 0.9, recognition: 0.7 },
    { communication: 0.98, organization: 0.82, adaptability: 0.88 }
  ),
  p(
    'event_creative',
    'Sự kiện & Công nghiệp sáng tạo',
    [0.52, 0.35, 0.88, 0.9, 0.92, 0.62],
    ['Quản trị sự kiện', 'Công nghiệp văn hóa', 'Tổ chức biểu diễn'],
    ['Lập concept cho một sự kiện nhỏ'],
    { relationships: 0.82, recognition: 0.75 },
    { creative: 0.92, communication: 0.95, organization: 0.9 }
  ),
  p(
    'education_technology',
    'Công nghệ giáo dục & Thiết kế học tập',
    [0.25, 0.78, 0.8, 0.95, 0.55, 0.62],
    ['Công nghệ giáo dục', 'Thiết kế học liệu', 'Learning Experience Design'],
    ['Thiết kế một bài học tương tác ngắn'],
    { relationships: 0.92, achievement: 0.78 },
    { creative: 0.85, communication: 0.92, organization: 0.78 }
  ),
];
