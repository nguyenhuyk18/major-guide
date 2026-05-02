import { EinvoiceMailRequest } from '@common/interfaces/tcp/mail/einvoice-mail.interface';

function formatDate(d: Date | string): string {
  try {
    return new Date(d).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return String(d);
  }
}

function formatTime(d: Date | string): string {
  try {
    return new Date(d).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(d);
  }
}

function formatPrice(price: number): string {
  try {
    return Number(price).toLocaleString('vi-VN') + ' đ';
  } catch {
    return price + ' đ';
  }
}

export function buildInvoiceEmailHtml(data: EinvoiceMailRequest): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Hóa đơn đặt lịch - Major Guide</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f0f4f8;
      color: #1a202c;
      padding: 24px 16px;
    }
    .wrapper { max-width: 620px; margin: 0 auto; }

    /* Warning banner */
    .warning-banner {
      background: linear-gradient(135deg, #ff6b35, #f7931e);
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .warning-banner p { color: #fff; font-size: 13px; font-weight: 600; }
    .warning-banner span { color: rgba(255,255,255,0.88); font-size: 12px; font-weight: 400; display: block; margin-top: 2px; }

    /* Card */
    .card {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      padding: 28px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand { color: #fff; }
    .brand strong { font-size: 20px; font-weight: 800; display: block; }
    .brand small { font-size: 12px; opacity: 0.75; }
    .invoice-label { color: #fff; text-align: right; }
    .invoice-label strong { font-size: 22px; font-weight: 800; display: block; }
    .invoice-label small {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.4);
      border-radius: 50px;
      padding: 2px 10px;
      font-size: 11px;
      margin-top: 4px;
    }

    /* Body */
    .body { padding: 28px 30px; }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8896a8;
      margin-bottom: 10px;
    }

    /* Info grid */
    .info-grid { display: table; width: 100%; border-collapse: separate; border-spacing: 0 8px; margin-bottom: 20px; }
    .info-row { display: table-row; }
    .info-label {
      display: table-cell;
      width: 140px;
      font-size: 12px;
      color: #8896a8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 0;
      vertical-align: middle;
    }
    .info-value {
      display: table-cell;
      font-size: 14px;
      color: #1a202c;
      font-weight: 600;
      padding: 8px 0;
      vertical-align: middle;
    }
    .info-value.email { color: #667eea; font-weight: 400; }

    .divider { border: none; border-top: 1px solid #e8ecf2; margin: 20px 0; }

    /* Expert card */
    .expert-card {
      background: linear-gradient(135deg, #f0f4ff, #f7f0ff);
      border: 1px solid #d6def8;
      border-radius: 12px;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
    }
    .expert-avatar {
      width: 56px; height: 56px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #667eea;
      flex-shrink: 0;
    }
    .expert-fallback {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 22px; font-weight: 700;
      flex-shrink: 0;
    }
    .expert-role { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #667eea; margin-bottom: 3px; }
    .expert-name { font-size: 16px; font-weight: 700; color: #1a202c; }

    /* Schedule table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 10px; overflow: hidden; }
    thead tr { background: linear-gradient(135deg, #667eea, #764ba2); }
    th { color: #fff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 11px 16px; text-align: left; }
    td { padding: 11px 16px; font-size: 13px; color: #334155; border-bottom: 1px solid #e8ecf2; font-weight: 500; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #f7f9fc; }

    /* Total */
    .total-box {
      background: #f7f9fc;
      border: 1px solid #e8ecf2;
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 24px;
    }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
    .total-row:last-child { border-bottom: none; padding-top: 12px; margin-top: 4px; font-size: 16px; font-weight: 800; color: #1a202c; }
    .total-amount { color: #667eea; }

    /* Payment warning */
    .pay-warning {
      background: #fff7ed;
      border: 2px solid #fdba74;
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 24px;
    }
    .pay-warning strong { color: #c2410c; font-size: 13px; display: block; margin-bottom: 4px; }
    .pay-warning p { color: #92400e; font-size: 12px; line-height: 1.6; }

    /* CTA Button (placeholder - sẽ gắn link thanh toán sau) */
    .cta-wrap { text-align: center; margin-bottom: 24px; }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 50px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    /* Footer */
    .footer {
      background: #f7f9fc;
      border-top: 1px solid #e8ecf2;
      padding: 16px 30px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.7;
    }
    .footer a { color: #667eea; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- Warning banner -->
    <div class="warning-banner">
      <span style="font-size:24px;">⏰</span>
      <div>
        <p>Vui lòng thanh toán trong vòng 30 phút!</p>
        <span>Đặt lịch sẽ tự động bị huỷ nếu không thanh toán kịp thời.</span>
      </div>
    </div>

    <div class="card">

      <!-- Header -->
      <div class="header">
        <div class="brand">
          <strong>🎓 Major Guide</strong>
          <small>Nền tảng kết nối chuyên gia</small>
        </div>
        <div class="invoice-label">
          <strong>HÓA ĐƠN</strong>
          <small>⏳ CHỜ THANH TOÁN</small>
        </div>
      </div>

      <!-- Body -->
      <div class="body">

        <!-- Customer info -->
        <div class="section-title">Thông tin khách hàng</div>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">Họ và tên</div>
            <div class="info-value">${data.nameCustomer}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Email</div>
            <div class="info-value email">${data.email}</div>
          </div>
        </div>

        <hr class="divider"/>

        <!-- Expert info -->
        <div class="section-title">Chuyên gia được chọn</div>
        <div class="expert-card">
          ${data.avartarExpert
      ? `<img class="expert-avatar" src="${data.avartarExpert}" alt="Avatar"/>`
      : `<div class="expert-fallback">${(data.nameExpert || 'E').charAt(0).toUpperCase()}</div>`
    }
          <div>
            <div class="expert-role">Chuyên gia tư vấn</div>
            <div class="expert-name">${data.nameExpert}</div>
          </div>
        </div>

        <hr class="divider"/>

        <!-- Schedule -->
        <div class="section-title">Chi tiết lịch hẹn</div>
        <table>
          <thead>
            <tr><th>Thông tin</th><th>Giá trị</th></tr>
          </thead>
          <tbody>
            <tr><td>📅 Ngày hỗ trợ</td><td>${formatDate(data.daySupport)}</td></tr>
            <tr><td>🕐 Giờ bắt đầu</td><td>${formatTime(data.startTime)}</td></tr>
            <tr><td>🕕 Giờ kết thúc</td><td>${formatTime(data.endTime)}</td></tr>
          </tbody>
        </table>

        <!-- Totals -->
        <div class="total-box">
          <div class="total-row">
            <span>Phí tư vấn (1 buổi)</span>
            <span>${formatPrice(data.priceTotal)}</span>
          </div>
          <div class="total-row">
            <span>Phí dịch vụ nền tảng</span>
            <span>Miễn phí</span>
          </div>
          <div class="total-row">
            <span>Tổng thanh toán</span>
            <span class="total-amount">${formatPrice(data.priceTotal)}</span>
          </div>
        </div>

        <!-- Payment warning -->
        <div class="pay-warning">
          <strong>⚠️ Lưu ý quan trọng về thanh toán</strong>
          <p>
            Bạn cần hoàn tất thanh toán <strong>trong vòng 30 phút</strong> kể từ khi nhận được email này.
            Sau thời gian trên, lịch hẹn sẽ <strong>tự động bị huỷ</strong> và slot sẽ được mở lại cho người dùng khác.
          </p>
        </div>


      </div>

      <!-- Footer -->
      <div class="footer">
        Cảm ơn bạn đã tin tưởng sử dụng <a href="#">Major Guide</a>.<br/>
        File hóa đơn PDF được đính kèm trong email này.<br/>
        © ${new Date().getFullYear()} Major Guide. All rights reserved.
      </div>

    </div>
  </div>
</body>
</html>`;
}
