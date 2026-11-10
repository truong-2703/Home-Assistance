# Thư viện đóng gói sẵn

Đóng gói để trang 3D chạy được khi không có internet (demo tại chỗ khách).

| File | Nguồn | Giấy phép |
|---|---|---|
| `three.module.min.js` | npm `three@0.170.0`, `build/three.module.min.js` (giữ nguyên) | MIT (`LICENSE-three.txt`) |
| `OrbitControls.js` | npm `three@0.170.0`, `examples/jsm/controls/OrbitControls.js`; chỉ đổi `from 'three'` thành `from './three.module.min.js'` | MIT |

Cập nhật: `npm pack three@<phiên bản>`, giải nén, chép lại 2 file trên và sửa lại dòng import của `OrbitControls.js`.
