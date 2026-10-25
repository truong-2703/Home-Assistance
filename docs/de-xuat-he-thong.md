# Đề xuất: Đèn LED thông minh cho phòng trọ → nền móng cho Home Intelligent

## 1. Blog gốc làm gì

Bài của J-Rat Techworks ("I Built Hidden Smart LED Lighting for My Office Desk") làm đèn LED hắt sáng giấu sau bàn làm việc:

| Thành phần | Lựa chọn trong blog |
|---|---|
| Vi điều khiển | ESP32-C6 |
| Dải LED | WS2813 (LED địa chỉ 5V, có **đường data dự phòng**) |
| Firmware | ESPHome |
| Bộ não | Home Assistant |
| Vỏ / lắp đặt | In 3D, giấu dưới mặt bàn |

> Lưu ý: môi trường của mình bị chặn truy cập trang jrattechworks.com, nên bảng trên được tổng hợp từ mô tả video và trang Projects của tác giả chứ không phải từ toàn văn bài viết. Chi tiết đấu dây / code cụ thể nên đối chiếu thêm với bài gốc.

## 2. Đánh giá ý tưởng

### Điểm mạnh — nên giữ
- **ESPHome + Home Assistant là nền đúng** để sau này mở rộng: mọi node đều chạy local, không phụ thuộc cloud Trung Quốc, tự động xuất hiện trong HA, cập nhật OTA qua WiFi.
- **WS2813 có đường data dự phòng** — một LED chết không làm tắt cả đoạn phía sau. Chọn rất có ý thức.
- **Ánh sáng gián tiếp (hắt)** dễ chịu hơn hẳn rọi thẳng, hợp phòng nhỏ.
- Chi phí thấp, kiến thức học được (ESPHome, HA) dùng lại cho mọi thiết bị sau.

### Điểm yếu / thiếu khi áp vào phòng trọ
1. **Chỉ là đèn bật/tắt từ xa — chưa "thông minh".** Không có cảm biến hiện diện hay ánh sáng, nên vẫn phải tự bấm. Thêm mmWave + cảm biến lux mới thực sự tự động.
2. **Phụ thuộc HA/WiFi.** Nếu server chết thì đèn mất điều khiển. Cần nút bấm vật lý xử lý ngay trên ESP.
3. **LED 5V sụt áp trên đoạn dài.** Dài hơn ~2–3 m sẽ ngả màu vàng/đỏ ở cuối, phải cấp nguồn bổ sung (power injection). Dải 12V (WS2815) bớt vấn đề này.
4. **Tín hiệu 3.3V của ESP32 điều khiển LED 5V** chạy được "tạm" nhưng không ổn định khi dây dài → nên có IC chuyển mức 74AHCT125.
5. **Bối cảnh phòng trọ khác văn phòng nhà riêng:**
   - Không được khoan đục, đi lại dây điện 220V → mọi thứ phải cắm-là-chạy, dán băng keo/kẹp, mang đi được khi chuyển trọ.
   - WiFi thường là **router chung của chủ trọ** (không chỉnh được, có thể bật client isolation, hay đổi mật khẩu) → nên có router riêng cho thiết bị IoT.
   - An toàn cháy nổ: phòng nhỏ, nhiều đồ dễ cháy → không dùng nguồn tổ ong hở, phải có cầu chì.

## 3. Kiến trúc đề xuất (thiết kế để mở rộng)

```
┌────────────────────────── Lớp 3: "Trí thông minh" ───────────────────────────┐
│ Tự động hoá HA · Adaptive lighting · Trợ lý giọng nói local · LLM agent      │
└───────────────────────────────────┬──────────────────────────────────────────┘
┌──────────────────────── Lớp 2: Bộ não (1 máy duy nhất) ──────────────────────┐
│ Home Assistant OS  (+ Mosquitto MQTT, + Zigbee2MQTT/ZHA khi cần)             │
│ Chạy trên: laptop cũ / mini PC cũ / Raspberry Pi 4–5                          │
└───────┬──────────────────────┬───────────────────────┬───────────────────────┘
        │ ESPHome API          │ MQTT                  │ Zigbee
┌───────┴──────────┐   ┌───────┴────────────┐   ┌──────┴────────────────────┐
│ Node ESP32 tự làm │   │ Thiết bị khác      │   │ Cảm biến pin giá rẻ       │
│ đèn, cảm biến, IR │   │ (Tasmota, script)  │   │ cửa, nhiệt độ, nút bấm    │
└──────────────────┘   └────────────────────┘   └───────────────────────────┘
        └──── Mạng IoT riêng: router nhỏ của bạn, sau router chủ trọ ────┘
```

### 7 nguyên tắc để sau này mở rộng dễ nhất
1. **Một bộ não duy nhất (Home Assistant).** Mọi thiết bị, mọi giao thức đều quy về HA. Logic tự động hoá chỉ nằm một chỗ.
2. **Chỉ local, không cloud.** Ưu tiên ESPHome → Zigbee → MQTT. Tránh thiết bị chỉ chạy qua app cloud (Tuya cloud...).
3. **Node "tự lo được" khi mất kết nối.** Chức năng cốt lõi (bật/tắt đèn bằng nút) chạy ngay trên ESP; HA chỉ thêm phần thông minh.
4. **Cấu hình dạng module (ESPHome packages).** Phần chung (WiFi, API, OTA) viết một lần; mỗi tính năng (LED, mmWave, lux, nút) là một file. Thêm thiết bị mới = copy file node, đổi vài dòng `substitutions`.
5. **Quy ước đặt tên nhất quán:** `<khu-vuc>-<chuc-nang>` — ví dụ `phongtro-led-giuong`, `phongtro-ir-dieuhoa`, `bep-cambien-khoi`. Area trong HA đặt đúng từ đầu.
6. **Mọi thứ trong Git** (repo này): cấu hình ESPHome, package HA, tài liệu. `secrets.yaml` không bao giờ commit. Chuyển trọ / hỏng máy = clone lại và flash.
7. **Mạng IoT riêng.** Một router nhỏ (chế độ router, không phải repeater) cắm vào mạng chủ trọ. Thiết bị IoT + server HA ở trong mạng của bạn → IP cố định, mDNS hoạt động, đổi WiFi chủ trọ không ảnh hưởng.

## 4. Node đầu tiên: đèn LED hắt sáng giường/bàn

Đã có cấu hình sẵn trong repo, kiểm tra hợp lệ với ESPHome 2026.9 (`esphome/phongtro-led-giuong.yaml`).

### Phần cứng

| Linh kiện | Gợi ý | Ghi chú |
|---|---|---|
| Vi điều khiển | **ESP32-C3 SuperMini** | Rẻ, nhỏ, dễ mua ở VN. ESP32-C6 như blog cũng được (có thêm Thread/Zigbee). |
| Dải LED ≤ 3 m | WS2812B 5V, 60 LED/m | Rẻ, phổ biến nhất |
| Dải LED > 3 m | **WS2815 12V** | Ít sụt áp, có data dự phòng như WS2813 |
| Muốn ánh sáng mịn, không thấy chấm | LED COB địa chỉ (FCOB WS2811) | Không cần máng nhôm che |
| Cảm biến hiện diện | **HLK-LD2410C** (mmWave) | Phát hiện cả khi ngồi yên / nằm — PIR thì không |
| Cảm biến ánh sáng | BH1750 (I2C) | Chỉ bật đèn khi phòng thật sự tối |
| Chuyển mức tín hiệu | 74AHCT125 | 3.3V → 5V cho chân data |
| Nguồn | Adapter kín có chứng nhận, 5V 4–10A (hoặc 12V nếu dùng WS2815) | **Không** dùng nguồn tổ ong hở trong phòng trọ |
| Bảo vệ | Cầu chì 5A, tụ 1000 µF ở đầu dải, trở 330 Ω trên dây data | |
| Hạ áp (nếu nguồn 12V) | Mini-360 / MP1584 12V→5V cho ESP | |
| Lắp đặt | Máng nhôm + mica đục, kẹp dán 3M | Không khoan, gỡ ra mang đi được |

### Sơ đồ chân (ESP32-C3 SuperMini)

| Chân | Nối tới |
|---|---|
| GPIO10 | → 74AHCT125 → trở 330 Ω → DIN dải LED |
| GPIO20 (RX) | ← TX của LD2410C |
| GPIO21 (TX) | → RX của LD2410C |
| GPIO6 / GPIO7 | SDA / SCL của BH1750 |
| GPIO3 | Nút bấm (nối xuống GND) |
| 5V / GND | Từ nguồn — **GND chung** giữa nguồn, ESP và dải LED |

Dải dài: cấp nguồn thêm ở cuối dải (và giữa nếu > 5 m). Firmware đã giới hạn độ sáng tối đa 60% (`led_max_brightness`) để giảm dòng — 120 LED ở 60% trắng ≈ 4 A.

### Hành vi
- **Có người + phòng tối** → đèn tự bật. Sau 22h30 thì bật ánh sáng cam ấm 10% (dậy đêm không chói mắt).
- **Không còn người 3 phút** → tự tắt (mmWave nên ngồi im làm việc không bị tắt).
- **Nút bấm:** nhấn nhanh = bật/tắt; giữ 1 giây = chế độ ngủ. Chạy cả khi HA/WiFi chết.
- Công tắc `Đèn tự động` trong HA để tắt tự động khi cần.
- Web UI tại `http://phongtro-led-giuong.local` làm phương án dự phòng.

## 5. Lộ trình mở rộng

| Giai đoạn | Việc làm | Giá trị |
|---|---|---|
| **0. Nền** | Cài Home Assistant OS lên laptop cũ / mini PC / Pi; router IoT riêng; cài add-on ESPHome | Có bộ não + mạng ổn định |
| **1. Ánh sáng** | Node `phongtro-led-giuong` (repo này) | Đèn tự động đầu tiên |
| **2. Khí hậu** | Node IR blaster (ESPHome `remote_transmitter` + `climate_ir`) điều khiển điều hoà/quạt; cảm biến nhiệt-ẩm SHT31/AHT20 | Bật điều hoà trước khi về, tự tắt khi ngủ say, tiết kiệm tiền điện |
| **3. Năng lượng & an toàn** | Ổ cắm đo điện (flash ESPHome/Tasmota hoặc Zigbee); cảm biến cửa Zigbee; cảm biến khói/gas | Biết thiết bị nào ăn điện (tính tiền điện trọ), báo cửa mở khi vắng nhà |
| **4. Hiện diện & thông báo** | Nhận biết bạn ở nhà qua điện thoại (HA Companion app); thông báo Telegram | Ra khỏi nhà → tắt hết; về nhà → bật đèn, điều hoà |
| **5. Trí thông minh** | Adaptive Lighting (màu theo nhịp sinh học); trợ lý giọng nói local (HA Assist + ESP32-S3 voice satellite); LLM làm conversation agent trong HA | "Tôi đi ngủ đây" → tắt đèn, chỉnh điều hoà 27°C, hẹn tắt |

Mỗi giai đoạn chỉ là **thêm node mới + thêm package HA mới**, không phải sửa cái cũ — đó là lợi ích của kiến trúc module ở trên.

## 6. Cấu trúc repo

```
esphome/
  common/                    # khối dùng chung — viết một lần
    base.yaml                # WiFi, API mã hoá, OTA, web server, chẩn đoán
    boards/esp32-c3-supermini.yaml
    led-strip.yaml
    presence-ld2410.yaml
    lux-bh1750.yaml
    local-button.yaml
  phongtro-led-giuong.yaml   # một node = substitutions + danh sách package
  secrets.yaml.example
homeassistant/
  packages/
    phong_tro_den_tu_dong.yaml
docs/
  de-xuat-he-thong.md
```

### Bắt đầu
```bash
cd esphome
cp secrets.yaml.example secrets.yaml      # điền WiFi, tạo key bằng: openssl rand -base64 32
esphome run phongtro-led-giuong.yaml      # lần đầu cắm USB, sau đó OTA qua WiFi
```
Sau đó copy `homeassistant/packages/` vào thư mục config của HA và bật `packages` trong `configuration.yaml` (hướng dẫn trong đầu file package).
