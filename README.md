# Home Assistance — Home Intelligent cho phòng trọ

Hệ thống nhà thông minh tự làm, chạy local: **ESP32 + ESPHome** cho thiết bị, **Home Assistant** làm bộ não.
Bắt đầu bằng đèn LED hắt sáng tự động, thiết kế dạng module để mở rộng dần (điều hoà, năng lượng, an ninh, trợ lý giọng nói).

- Đánh giá ý tưởng gốc, kiến trúc và lộ trình: [`docs/system-proposal.md`](docs/system-proposal.md)
- Node đầu tiên: [`esphome/rentalroom-bed-led.yaml`](esphome/rentalroom-bed-led.yaml)
- Tự động hoá HA: [`homeassistant/packages/`](homeassistant/packages/)

---

## Demo TruongHA: căn hộ thông minh giả lập (không cần phần cứng)

Bản demo căn hộ thông minh 2 phòng ngủ, chạy hoàn toàn bằng **thiết bị giả lập** nên không cần phần cứng.
Kịch bản demo chi tiết nằm ở [docs/demo-script.md](docs/demo-script.md).

### Chạy demo (khoảng 5 phút)

**Cần có:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) hoặc Docker Engine (Linux).

```bash
git clone <repo này>
cd Home-Assistance
docker compose up -d
```

Lần đầu Docker tải image Home Assistant (khoảng 1–2 GB), mất vài phút. Sau đó:

1. Mở **http://localhost:8123**
2. Đăng nhập: **`truongha` / `truongha123`** (tài khoản được tạo tự động)
3. Ở thanh bên trái:
   - **TruongHA**: màn hình cho khách xem (sơ đồ nhà, các phòng, an ninh, năng lượng)
   - **Điều khiển demo**: bảng nút bấm và lời dẫn cho người thuyết trình
4. Bấm **Khôi phục từ đầu** rồi đi lần lượt từng cảnh.

Lệnh hay dùng:

```bash
docker compose logs -f homeassistant   # xem log
docker compose restart homeassistant   # khởi động lại sau khi sửa cấu hình
docker compose down                    # tắt demo
```

Đổi tài khoản mặc định: đặt biến môi trường trước lần chạy đầu tiên, ví dụ
`HA_USERNAME=demo HA_PASSWORD=matkhau docker compose up -d`.

### Cách bố trí khi đi demo

- **Màn hình lớn (máy chiếu/TV):** mở `http://localhost:8123/truongha-home`.
- **Điện thoại hoặc tab khác của bạn:** mở `http://<IP-laptop>:8123/truongha-demo` để bấm chuyển cảnh mà khách không thấy.
  Tìm IP laptop bằng `ipconfig` (Windows) hoặc `ifconfig` (macOS/Linux); điện thoại phải cùng mạng Wi-Fi hoặc 4G phát từ laptop.
- Muốn mở thẳng TruongHA khi vào trang: vào **Cài đặt → Bảng điều khiển**, chọn TruongHA và đặt làm mặc định.

### Nhận thông báo trên điện thoại (tùy chọn)

1. Cài app **Home Assistant** (iOS/Android) và đăng nhập vào `http://<IP-laptop>:8123`.
2. Vào **Cài đặt → Thiết bị & dịch vụ → Mobile App** và xem tên thiết bị, ví dụ `truong_iphone`.
3. Trên dashboard **Điều khiển demo**, ô **Gửi thông báo tới điện thoại** điền `mobile_app_truong_iphone`.

Từ đó mọi cảnh báo (cửa mở, khói, gas, ổ cắm bếp...) sẽ đẩy về điện thoại, có kèm nút "Tắt ngay" và "Khóa cửa".
Thông báo đẩy cần laptop có internet.

### Cấu trúc thư mục

```
docker-compose.yml          Home Assistant (mount thư mục homeassistant/) + bước tạo tài khoản tự động
setup/onboard.py            Tạo tài khoản, bỏ qua màn hình cài đặt ban đầu
esphome/                    Firmware node ESP32 thật (phòng trọ: LED, mmWave, lux, nút bấm)
homeassistant/              Thư mục cấu hình Home Assistant DUY NHẤT của repo
  configuration.yaml        Cấu hình chính (múi giờ VN, tiếng Việt, VND, nạp mọi package)
  packages/
    rental_room_auto_light.yaml  Automation đèn LED phòng trọ (dùng cho node ESP32 thật)
    rental_room_simulation.yaml      Giả lập node ESP32 phòng trọ - XÓA khi có phần cứng thật
    devices.yaml           Thiết bị giả lập của căn hộ: đèn, ổ cắm, khóa, rèm, cảm biến, điều hòa, TV
    security.yaml            Báo động, camera, mã tạm người giúp việc, khói và gas
    scenarios.yaml           Chế độ nhà, thông báo, automation sáng/đi vắng/về nhà/ban đêm
    energy.yaml         Công suất tiêu thụ, số liệu tiền điện minh họa
    demo.yaml               Nút bấm chuyển cảnh cho người thuyết trình
  dashboards/
    truongha.yaml           Dashboard khách hàng (có tab Phòng trọ)
    demo_control.yaml    Dashboard người thuyết trình
  themes/truongha.yaml      Màu thương hiệu TruongHA
  www/                      Sơ đồ căn hộ, ảnh camera giả lập
docs/demo-script.md       Kịch bản demo đã chốt
```

### Quy ước đặt tên

Theo nguyên tắc trong `docs/system-proposal.md`: khu vực trước, chức năng sau. **Mọi tên kỹ thuật dùng tiếng Anh**
(entity id, helper, script, automation, tên file, node ESPHome); **tên hiển thị cho người dùng giữ tiếng Việt**.

- **Node ESPHome:** `<area>-<function>`, ví dụ `rentalroom-bed-led` (friendly_name `Rental Room Bed`).
- **Entity Home Assistant** (không dùng được dấu gạch ngang): `<area>_<function>`, tên hiển thị `Khu vực · Chức năng`.
  Ví dụ `light.kitchen_light` (Bếp · Đèn), `climate.living_room_ac`, `lock.front_door_lock`, `switch.apartment_siren`.
- **Khu vực:** `living_room`, `master_bedroom`, `kids_room`, `kitchen`, `bathroom`, `hallway`, `front_door`,
  `apartment` (toàn căn hộ), `outdoor`, `rental_room`.
- **Helper giả lập:** `sim_<entity>`, ví dụ `input_boolean.sim_kitchen_light` giữ trạng thái của `light.kitchen_light`.
- Entity do node ESPHome tạo ra lấy theo `friendly_name` của node, ví dụ `light.rental_room_bed_led_strip`.
  Entity nào lấy id từ tên (node ESPHome, điều hòa, TV, báo động) thì đặt tên tiếng Anh và đổi tên hiển thị
  sang tiếng Việt bằng `homeassistant: customize:` trong package.

### Cách giả lập hoạt động

- Mỗi thiết bị (ví dụ `light.kitchen_light`) là một thiết bị template, lưu trạng thái trong helper ẩn `input_boolean.sim_*`.
  Automation và dashboard chỉ dùng entity thiết bị, không dùng helper, nên khi có phần cứng thật
  chỉ cần thay thiết bị ảo bằng thiết bị thật **cùng entity_id**.
- **Phòng trọ:** `rental_room_simulation.yaml` giả lập node `esphome/rentalroom-bed-led.yaml` với đúng entity id node thật
  sẽ tạo, nên automation thật `rental_room_auto_light.yaml` chạy được ngay trong demo. Khi flash ESP32 thật:
  xóa file giả lập, khởi động lại Home Assistant, xóa 3 thực thể giả lập cũ trong **Cài đặt → Thực thể**,
  rồi thêm node ESPHome. Automation giữ nguyên.
- **Giờ trong kịch bản** (`input_datetime.scenario_time`) thay cho giờ thật, để tua tới 6:30, 14:00, 22:30... mà không phải chờ.
  Khi lắp nhà thật, đổi trigger sang giờ thật (`trigger: time`).
- Điều hòa dùng `generic_thermostat`: nhiệt độ phòng giảm khi máy nén chạy và tăng dần về nhiệt độ ngoài trời khi tắt.
- Công suất điện được ước tính theo thiết bị đang bật. Số liệu tiền điện tháng là **minh họa**.

### Thương hiệu

TruongHA là giải pháp **dựa trên Home Assistant** (mã nguồn mở, giấy phép Apache 2.0).
Không dùng tên hay logo "Home Assistant" làm thương hiệu sản phẩm.
