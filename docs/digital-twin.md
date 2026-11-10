# TruongHA · Căn hộ 3D (Digital Twin)

Mô hình 3D của căn hộ demo, dựng bằng Three.js và nhúng thẳng vào Home Assistant dưới dạng **custom panel**.
Trạng thái thiết bị trong mô hình luôn khớp với Home Assistant, và bấm trên mô hình sẽ điều khiển thiết bị thật (hoặc thiết bị giả lập).

## Chạy

1. `docker compose up -d`, mở `http://localhost:8123` và đăng nhập (`truongha` / `truongha123`).
2. Chọn **Căn hộ 3D** ở thanh bên, hoặc bấm **Xem căn hộ 3D** trên dashboard TruongHA, hoặc mở thẳng
   `http://localhost:8123/digital-twin`.
3. Kéo để xoay, cuộn để zoom, chạm bóng đèn để bật/tắt. Cột bên phải có các nút điều khiển và cảm biến.

Không cần tạo hay dán token: panel dùng luôn phiên đăng nhập của Home Assistant.

## Cấu trúc

| File | Vai trò |
|---|---|
| `homeassistant/configuration.yaml` (mục `panel_custom`) | Đăng ký panel `/digital-twin` ở thanh bên |
| `homeassistant/www/digital-twin/truongha-digital-twin.js` | Web component `truongha-digital-twin`: cảnh 3D, danh sách thiết bị, gọi dịch vụ |
| `homeassistant/www/digital-twin/vendor/` | Three.js 0.170 đóng gói sẵn (giấy phép MIT), để chạy khi không có internet |

Khi sửa file JS, tăng số `?v=` trong `module_url` để trình duyệt không dùng bản cũ trong bộ nhớ đệm.

## Phạm vi

- Bố cục 3D **minh họa** gồm 4 khu: phòng khách, phòng master, phòng bé, bếp. Đèn nhà tắm và hành lang tạm đặt trong khu bếp.
  Đây không phải bản vẽ kiến trúc và chưa khớp với sơ đồ 2D trên dashboard.
- Đồng bộ trạng thái qua đối tượng `hass` mà Home Assistant truyền cho panel (cập nhật tức thì khi có thay đổi).
- Điều khiển: đèn bật/tắt, rèm mở/đóng, khóa cửa khóa/mở, điều hòa bật/tắt. Cảm biến chỉ hiển thị.
- Tình trạng căn hộ: giờ kịch bản, chế độ nhà, an ninh, công suất.
- Giao diện chỉ dùng **trạng thái đã được Home Assistant xác nhận**, không tự đổi trước khi lệnh chạy xong.
- Lệnh không thực hiện được thì hiện thông báo lỗi ngay trên panel.

## An toàn

- **Mở khóa cửa phải bấm hai lần** (lần hai trong vòng 4 giây). Khóa cửa thì bấm một lần.
- Panel chỉ chạy bên trong Home Assistant đã đăng nhập; không có token nào nằm trong mã nguồn hay bộ nhớ trình duyệt.
- Chỉ dùng trong mạng nội bộ tin cậy. Không mở cổng 8123 ra internet.

## Bước tiếp theo

1. Dựng lại 6 phòng đúng theo sơ đồ 2D của căn hộ, có nội thất.
2. Thêm góc camera đặt sẵn, hiệu ứng rèm/cửa, lớp màu nhiệt độ, trạng thái báo động trên mô hình.
3. Thêm rèm, khóa, cảm biến khói/gas vào mô hình 3D (hiện mới có bóng đèn).
4. Test tự động với Home Assistant giả lập.
