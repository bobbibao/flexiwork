/**
 * Vietnamese notification copy (docs/ARCHITECTURE.md §11). Placeholders: {name}.
 * Kept as TypeScript (not JSON) so it ships with the build without an asset rule.
 */
export const NOTIFICATION_TEMPLATES_VI: Record<string, { title: string; body: string; url: string }> = {
  shift_offered: { title: 'Có ca làm mới cho bạn', body: '{title} tại {location}, {start}. Thu nhập dự kiến {pay}. Trả lời trước {expires}.', url: '/sn/offers' },
  shift_accepted: { title: 'Đã có người nhận ca', body: '{worker} đã nhận ca "{title}" ({start}).', url: '/sn/employer/shifts/{shift_id}' },
  escrow_topup_needed: { title: 'Cần nạp thêm tiền ký quỹ', body: 'Số dư không đủ để giữ {amount} cho ca "{title}". Vui lòng nạp tiền trong 30 phút để giữ người lao động.', url: '/sn/wallet' },
  shift_confirmed: { title: 'Ca làm đã được xác nhận', body: 'Ca "{title}" lúc {start} đã được đảm bảo thanh toán. Hãy đến đúng giờ!', url: '/sn/my-shifts/{shift_id}' },
  check_in_reminder: { title: 'Sắp đến giờ làm', body: 'Ca "{title}" bắt đầu lúc {start} tại {location}. Nhớ check-in khi đến nơi.', url: '/sn/my-shifts/{shift_id}' },
  no_show: { title: 'Người lao động không đến', body: 'Ca "{title}" ({start}): không có check-in. Hệ thống đang xử lý (tìm người thay hoặc hoàn tiền).', url: '/sn/employer/shifts/{shift_id}' },
  no_show_worker: { title: 'Bạn đã bỏ lỡ ca làm', body: 'Bạn không check-in ca "{title}" ({start}). Điểm tin cậy của bạn bị trừ.', url: '/sn/my-shifts/{shift_id}' },
  confirm_completion: { title: 'Xác nhận hoàn thành ca', body: '{worker} đã check-out ca "{title}". Vui lòng xác nhận số giờ làm.', url: '/sn/employer/shifts/{shift_id}' },
  payment_received: { title: 'Bạn đã nhận được tiền', body: 'Ca "{title}": {net} đã được cộng vào ví của bạn.', url: '/sn/wallet' },
  shift_cancelled: { title: 'Ca làm đã bị hủy', body: 'Ca "{title}" ({start}) đã bị hủy.', url: '/sn/my-shifts/{shift_id}' },
  shift_expired: { title: 'Ca làm đã hết hạn', body: 'Không có người nhận ca "{title}" ({start}). Bạn có thể đăng lại với mức lương cao hơn.', url: '/sn/employer/shifts/{shift_id}' },
  topup_succeeded: { title: 'Nạp tiền thành công', body: 'Đã nạp {amount} vào ví doanh nghiệp.', url: '/sn/wallet' },
  topup_failed: { title: 'Nạp tiền thất bại', body: 'Giao dịch nạp {amount} không thành công.', url: '/sn/wallet' },
  payout_settled: { title: 'Rút tiền thành công', body: '{amount} đã được chuyển về tài khoản ngân hàng của bạn.', url: '/sn/wallet' },
  payout_failed: { title: 'Rút tiền thất bại', body: 'Giao dịch rút {amount} không thành công. Tiền đã được hoàn vào ví.', url: '/sn/wallet' },
  exception_opened: { title: 'Ngoại lệ mới cần xử lý', body: '[{severity}] {summary}', url: '/sn/ops/exceptions/{case_id}' },
};

export function renderTemplate(key: string, vars: Record<string, string | number | null | undefined>) {
  const t = NOTIFICATION_TEMPLATES_VI[key];
  if (!t) throw new Error(`Unknown notification template ${key}`);
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === null || vars[k] === undefined ? '' : String(vars[k])));
  return { title: fill(t.title), body: fill(t.body), url: fill(t.url) };
}

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dt = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
export const formatVnd = (n: number | null | undefined) => (n === null || n === undefined ? '' : vnd.format(n));
export const formatVnDateTime = (iso: string | Date | null | undefined) => (iso ? dt.format(new Date(iso)) : '');
