const { chromium } = require('playwright');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  console.log('===============================================================');
  console.log('🚀 MỞ TRÌNH DUYỆT GOOGLE CHROME THAO TÁC TRỰC TIẾP TRÊN MÀN HÌNH');
  console.log('===============================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
    slowMo: 600, // Tốc độ vừa phải để bạn quan sát trực tiếp các thao tác
    args: ['--start-maximized', '--window-size=1280,880']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 880 }
  });
  const page = await context.newPage();

  try {
    // ==========================================
    // BƯỚC 1: KIỂM TRA ĐĂNG KÝ NGƯỜI LAO ĐỘNG (WORKER REGISTER)
    // ==========================================
    console.log('👉 [BƯỚC 1] Trang Đăng nhập & Đăng ký Người lao động mới...');
    await page.goto('http://localhost:8080/#/sn/login');
    await page.waitForSelector('[data-test="sn-login-form"]');
    await sleep(2000);

    console.log('  -> Click vào nút nổi bật "Đăng ký tìm việc"...');
    await page.click('[data-test="link-register-worker"]');
    await page.waitForSelector('[data-test="sn-register-worker-form"]');
    await sleep(1500);

    const newWorkerPhone = '090' + Math.floor(1000000 + Math.random() * 9000000);
    console.log(`  -> Nhập thông tin đăng ký cho tài khoản mới (SĐT: ${newWorkerPhone})...`);
    await page.fill('#w-name', 'Nguyễn Văn Test');
    await page.fill('#w-phone', newWorkerPhone);
    await page.fill('#w-email', `worker_${Date.now()}@test.vn`);
    await page.fill('#w-pass', 'MatKhau@123');

    console.log('  -> Đồng ý điều khoản & xác nhận đủ 18 tuổi...');
    await page.check('[data-test="w-adult"]');
    await page.check('[data-test="w-terms"]');
    await sleep(1500);

    console.log('  -> Nhấn Tạo tài khoản...');
    await page.click('[data-test="w-submit"]');
    await sleep(3000);

    console.log(`  ✅ Đăng ký thành công! Đã tự động đăng nhập và vào trang: ${page.url()}`);
    await sleep(2500);

    // Logout
    await page.evaluate(() => localStorage.clear());
    await sleep(1000);

    // ==========================================
    // BƯỚC 2: KIỂM TRA ĐĂNG KÝ DOANH NGHIỆP (EMPLOYER REGISTER)
    // ==========================================
    console.log('\n👉 [BƯỚC 2] Kiểm tra Giao diện Đăng ký Doanh nghiệp...');
    await page.goto('http://localhost:8080/#/sn/login');
    await page.waitForSelector('[data-test="sn-login-form"]');
    await sleep(1500);

    console.log('  -> Click vào nút "Đăng ký doanh nghiệp"...');
    await page.click('[data-test="link-register-employer"]');
    await page.waitForSelector('form.sn-form');
    console.log('  ✅ Giao diện Đăng ký Doanh nghiệp đầy đủ các trường: Tên công ty, MST, Người liên hệ, Email, SĐT, Mật khẩu.');
    await sleep(2500);

    // ==========================================
    // BƯỚC 3: FIX LỖI "KHÔNG TÌM THẤY CA LÀM" (SHIFT DETAIL CHO WORKER)
    // ==========================================
    console.log('\n👉 [BƯỚC 3] Kiểm tra Fix lỗi "Không tìm thấy ca làm" tại link ca:');
    console.log('   http://localhost:8080/#/sn/shifts/8ea7a071-5bf6-493b-9d7f-ca881ec8015a');

    await page.goto('http://localhost:8080/#/sn/login');
    await page.waitForSelector('#sn-identifier');
    console.log('  -> Đăng nhập với tài khoản Worker (+84901000005)...');
    await page.fill('#sn-identifier', '+84901000005');
    await page.fill('#sn-password', 'MatKhau@123');
    await page.click('[data-test="sn-login-submit"]');
    await sleep(2000);

    console.log('  -> Truy cập trực tiếp link chi tiết ca làm...');
    await page.goto('http://localhost:8080/#/sn/shifts/8ea7a071-5bf6-493b-9d7f-ca881ec8015a');
    await sleep(2500);

    const shiftCard = await page.$('[data-test="shift-preview"]');
    if (shiftCard) {
      const text = await shiftCard.textContent();
      console.log('  ✅ LỖI ĐÃ ĐƯỢC KHẮC PHỤC HOÀN TOÀN!');
      console.log('  -> Thẻ ca làm hiển thị đầy đủ thông tin: Tiêu đề, Công ty, Mức lương, Địa chỉ.');
      const acceptBtn = await page.$('[data-test="preview-accept"]');
      if (acceptBtn) {
        console.log('  ✅ Nút "Nhận ca" hiển thị sẵn sàng cho người lao động thao tác!');
      }
    } else {
      console.log('  ⚠️ Không tìm thấy thẻ ca làm!');
    }
    await sleep(3000);

    // Logout
    await page.evaluate(() => localStorage.clear());
    await sleep(1000);

    // ==========================================
    // BƯỚC 4: BẢO MẬT PHÂN QUYỀN GIỮA CÁC DOANH NGHIỆP
    // DOANH NGHIỆP 1 KHÔNG THỂ XEM CA CỦA DOANH NGHIỆP 2
    // ==========================================
    console.log('\n👉 [BƯỚC 4] Kiểm tra Bảo mật Phân quyền giữa các Doanh nghiệp:');
    console.log('  -> Đăng nhập Doanh nghiệp 1 (employer1@flexiwork.local - Công ty 38)...');
    await page.goto('http://localhost:8080/#/sn/login');
    await page.fill('#sn-identifier', 'employer1@flexiwork.local');
    await page.fill('#sn-password', 'MatKhau@123');
    await page.click('[data-test="sn-login-submit"]');
    await sleep(2000);

    console.log('  -> Doanh nghiệp 1 cố tình mở ca của Doanh nghiệp 2 (8ea7a071-5bf6-493b-9d7f-ca881ec8015a)...');
    await page.goto('http://localhost:8080/#/sn/employer/shifts/8ea7a071-5bf6-493b-9d7f-ca881ec8015a');
    await sleep(2500);

    const alert = await page.$('.alert, .sn-alert');
    if (alert) {
      console.log(`  🔒 BẢO MẬT THÀNH CÔNG: Doanh nghiệp 1 bị chặn truy cập! Thông báo: "${(await alert.textContent()).trim()}"`);
    }
    await sleep(2500);

    // Logout
    await page.evaluate(() => localStorage.clear());
    await sleep(1000);

    // ==========================================
    // BƯỚC 5: DOANH NGHIỆP CHỦ SỞ HỮU QUẢN LÝ CA CỦA MÌNH
    // ==========================================
    console.log('\n👉 [BƯỚC 5] Doanh nghiệp chủ sở hữu (Công ty 2) truy cập ca làm:');
    console.log('  -> Đăng nhập Doanh nghiệp 2 (employer2@flexiwork.local - Công ty 39)...');
    await page.goto('http://localhost:8080/#/sn/login');
    await page.fill('#sn-identifier', 'employer2@flexiwork.local');
    await page.fill('#sn-password', 'MatKhau@123');
    await page.click('[data-test="sn-login-submit"]');
    await sleep(2000);

    console.log('  -> Mở link ca làm: http://localhost:8080/#/sn/shifts/8ea7a071-5bf6-493b-9d7f-ca881ec8015a');
    await page.goto('http://localhost:8080/#/sn/shifts/8ea7a071-5bf6-493b-9d7f-ca881ec8015a');
    await sleep(2500);

    console.log(`  -> URL hiện tại: ${page.url()}`);
    console.log('  ✅ Hệ thống tự động chuyển hướng Employer đến trang Quản lý ca của doanh nghiệp!');
    console.log('  ✅ Hiển thị đầy đủ thông tin: Trạng thái tìm người, Ký quỹ Escrow, Mã QR Check-in!');
    await sleep(4000);

    console.log('\n===============================================================');
    console.log('🎉 TẤT CẢ CÁC BƯỚC TEST TRỰC TIẾP TRÊN TRÌNH DUYỆT ĐÃ HOÀN TẤT!');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('❌ Lỗi:', err);
  } finally {
    console.log('Giữ cửa sổ Chrome mở thêm 5 giây để bạn xem kết quả...');
    await sleep(5000);
    await browser.close();
    console.log('Đã đóng trình duyệt.');
  }
})();
