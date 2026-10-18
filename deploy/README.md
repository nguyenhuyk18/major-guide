# Deploy MajorGuide lên AWS EC2 (1 máy, Docker Compose)

Toàn bộ hệ thống (React, 8 service NestJS, AI FastAPI, MongoDB, Redis, RabbitMQ, Keycloak, Qdrant, TURN)
chạy trên **1 máy EC2**. Caddy tự cấp HTTPS cho địa chỉ miễn phí `https://<ip>.sslip.io`, không cần mua tên miền.

```
Internet ─► Caddy :443 ─┬─ /            → React (build tĩnh)
                        ├─ /api/*       → bff:3300  ─TCP─► authorizer, user-access, booking, slot, media, mail, chat
                        ├─ /socket.io/* → bff:3300  → chat (chat, thông báo, tín hiệu video call)
                        └─ /ai/*        → agentic-ai:8000 (ML + RAG)
coturn :3478 (TURN cho video call)     MongoDB / Redis / RabbitMQ / Keycloak / Qdrant: chỉ mạng nội bộ
```

Chi phí ước tính (Singapore): máy ~2,8 USD/ngày khi chạy; khi tắt chỉ còn ổ đĩa + IP ~6,5 USD/tháng.

---

## Bước 1. Tạo máy trên AWS Console (~10 phút)

1. Góc phải trên chọn region **Asia Pacific (Singapore) ap-southeast-1**.
2. **Billing → Budgets → Create budget**: Monthly cost budget 20 USD, nhập email để nhận cảnh báo.
3. **EC2 → Launch instance**:
   - Name: `majorguide`
   - AMI: **Ubuntu Server 24.04 LTS** (x86_64)
   - Instance type: **m7i-flex.large** (2 vCPU, 8 GiB). Không có thì chọn **t3.large**.
   - Key pair: **Create new key pair** → tên `majorguide`, loại RSA, định dạng `.pem` → tải file về, ví dụ `D:\keys\majorguide.pem`.
   - Network settings → **Edit** → Create security group, thêm các rule:

     | Type | Port | Source |
     |---|---|---|
     | SSH | 22 | **My IP** |
     | HTTP | 80 | Anywhere (0.0.0.0/0) |
     | HTTPS | 443 | Anywhere |
     | Custom TCP | 3478 | Anywhere |
     | Custom UDP | 3478 | Anywhere |
     | Custom UDP | 49152-49200 | Anywhere |

   - Configure storage: **40 GiB gp3**.
   - **Launch instance**.
4. **EC2 → Elastic IPs → Allocate Elastic IP address → Allocate**, rồi **Actions → Associate** với máy `majorguide`.
   Ghi lại IP, ví dụ `13.250.1.2` → web của bạn sẽ là `https://13-250-1-2.sslip.io`.

## Bước 2. Chuẩn bị trên máy bạn (Git Bash, thư mục `major-guide`)

Các container local (MongoDB, Keycloak, Qdrant) phải đang chạy để xuất dữ liệu.

```bash
python deploy/make_env.py --ip 13.250.1.2     # thay bằng Elastic IP thật
bash deploy/pack.sh                            # tạo deploy/out/code.tar.gz (~30 MB) + data.tar.gz (~0,5–1 GB)
```

`make_env.py` lấy các khóa bí mật từ `.env` hiện có, đổi địa chỉ service sang tên container và sinh mật khẩu
mới cho MongoDB / RabbitMQ / TURN. `pack.sh` tạm dừng Keycloak và Qdrant local vài giây để sao chép dữ liệu,
sau đó tự bật lại.

Sửa quyền file key (PowerShell, chỉ làm 1 lần, nếu không ssh sẽ báo "UNPROTECTED PRIVATE KEY"):

```powershell
icacls D:\keys\majorguide.pem /inheritance:r
icacls D:\keys\majorguide.pem /grant:r "$($env:USERNAME):(R)"
```

Upload lên server:

```bash
scp -i /d/keys/majorguide.pem deploy/out/code.tar.gz deploy/out/data.tar.gz ubuntu@13.250.1.2:~/
```

## Bước 3. Cài đặt trên server

```bash
ssh -i /d/keys/majorguide.pem ubuntu@13.250.1.2

mkdir -p majorguide && tar -xzf code.tar.gz -C majorguide
bash majorguide/major-guide/deploy/server-setup.sh     # cài Docker + swap 4 GB
exit                                                   # thoát ra để nhận quyền docker

ssh -i /d/keys/majorguide.pem ubuntu@13.250.1.2
bash majorguide/major-guide/deploy/deploy.sh           # build + khôi phục dữ liệu + chạy (~20–30 phút lần đầu)
```

Xong khi màn hình in `MajorGuide: https://13-250-1-2.sslip.io`. Mở địa chỉ đó trên trình duyệt
(lần đầu Caddy mất ~30 giây để xin chứng chỉ HTTPS).

## Bước 4. Kiểm tra nhanh

- Đăng nhập tài khoản member, làm trắc nghiệm → ra 3 nhóm ngành + chuyên gia gợi ý.
- Đăng nhập trang admin `/admin/login`.
- Chatbot AI (cần bật model trong Groq console).
- Video call giữa 2 máy khác mạng (có TURN nên 4G vẫn gọi được).
- Chạy Selenium vào server: `python e2e/career_quiz_selenium.py --base-url https://13-250-1-2.sslip.io`

**Stripe (không bắt buộc):** trang thanh toán vẫn xác nhận qua `checkout-session/:id/status`. Muốn dùng webhook:
Stripe Dashboard → Developers → Webhooks → Add endpoint
`https://13-250-1-2.sslip.io/api/v2/payment/stripe/webhook`, sự kiện `checkout.session.completed`,
copy Signing secret vào `STRIPE_WEBHOOK_SECRET` trong `deploy/.env.production` trên server rồi chạy lại `deploy.sh`.

## Lệnh thường dùng (trên server)

```bash
cd ~/majorguide/major-guide/deploy
DC="docker compose --env-file .env.production -f docker-compose.prod.yml"
$DC ps                     # trạng thái
$DC logs -f bff            # xem log 1 service (bff, user-access, agentic-ai, caddy...)
$DC restart user-access    # khởi động lại 1 service
free -h; docker stats --no-stream   # RAM
```

**Cập nhật code:** trên máy bạn `bash deploy/pack.sh --code`, `scp` file `code.tar.gz` lên, rồi chạy lại
`bash majorguide/major-guide/deploy/deploy.sh` (dữ liệu được giữ nguyên).

## `deploy.sh` làm những gì (mỗi lần chạy)

1. Giải nén `~/code.tar.gz` (nếu có), lần đầu khôi phục `~/data.tar.gz` (Keycloak, Qdrant, MongoDB).
2. Build 3 image: `majorguide/nest` (8 service NestJS), `majorguide/agentic-ai`, `majorguide/web` (React + Caddy).
3. Bật toàn bộ 16 container (`docker-compose.prod.yml`, múi giờ `Asia/Ho_Chi_Minh`).
4. `fix-timestamps.js`: sửa createdAt/updatedAt bị lưu bằng giờ khởi động service (lỗi cũ), lấy giờ thật từ `_id`. Chạy nhiều lần không sao.
5. `seed-demo-booking.js`: tạo lịch demo video call `nguyenhuy` ↔ `kimwexler` (luôn mở, không tính doanh thu).
6. Tải sẵn model RAG bge-m3.

RabbitMQ không cần cấu hình tay: service booking và slot tự tạo exchange/queue/binding khi khởi động
(`libs/configuration/src/lib/rabbit-topology.ts`).

## Deploy sang server / tài khoản khác

Làm lại Bước 1–3 với máy mới, chỉ khác lệnh tạo cấu hình:

```bash
python deploy/make_env.py --ip <IP_MỚI>                          # dùng https://<ip>.sslip.io
python deploy/make_env.py --ip <IP_MỚI> --domain majorguide.vn   # nếu có tên miền riêng (trỏ bản ghi A về IP)
bash deploy/pack.sh          # code + dữ liệu hiện tại trên máy bạn
```

Muốn mang **dữ liệu đang chạy trên server cũ** (chứ không phải dữ liệu máy bạn) sang server mới: trên server cũ chạy
`docker compose ... exec -T mongodb sh -c 'mongodump -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --gzip --archive' > mongo.archive.gz`
và nén thư mục `deploy/data/keycloak`, `deploy/data/qdrant` theo đúng cấu trúc của `data.tar.gz`.

Server nào cũng cần mở cổng 80, 443, 3478 (TCP+UDP), 49152-49200 (UDP) và tối thiểu 8 GB RAM.

## Tắt / bật máy để tiết kiệm

- **Tắt:** EC2 → Instances → chọn máy → **Instance state → Stop**. Dữ liệu và Elastic IP được giữ.
- **Bật lại trước buổi bảo vệ:** **Instance state → Start**, đợi ~2 phút, mọi container tự chạy lại, địa chỉ web không đổi.
- **Sau khi bảo vệ xong (dừng hẳn chi phí):** Terminate instance, **Elastic IPs → Release**, kiểm tra
  **Volumes** không còn ổ đĩa nào.
