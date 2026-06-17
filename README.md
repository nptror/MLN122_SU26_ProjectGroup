# HẠNH PHÚC HAY TIỀN BẠC?

## Mô phỏng Giá trị Thặng dư, Tha hóa lao động và Bái vật giáo hàng hóa thông qua Web Game tương tác

---

## Giới thiệu

Đây là một dự án Web giáo dục được xây dựng nhằm trực quan hóa các khái niệm trong học thuyết của Karl Marx, bao gồm:

* Giá trị thặng dư
* Tha hóa lao động
* Bái vật giáo hàng hóa
* Mối quan hệ giữa lao động, tiền lương và chất lượng cuộc sống

Thay vì chỉ trình bày lý thuyết bằng văn bản, dự án sử dụng một trò chơi tương tác giúp người học tự trải nghiệm các lựa chọn kinh tế và xã hội trong cuộc sống của một người lao động trẻ.

---

# Mục tiêu dự án

* Giúp sinh viên hiểu các khái niệm kinh tế chính trị thông qua trải nghiệm thực tế.
* Tăng tính tương tác và hứng thú trong học tập.
* Chuyển hóa nội dung lý thuyết thành mô hình mô phỏng trực quan.
* Tạo môi trường cạnh tranh và thảo luận trong lớp học.

---

# Cấu trúc hệ thống

Dự án gồm 2 trang chính:

## 1. Trang lý thuyết

### Mục đích

Cung cấp kiến thức nền tảng trước khi người học tham gia trò chơi.

### Nội dung

#### Giá trị thặng dư

* Khái niệm giá trị thặng dư.
* Nguồn gốc của lợi nhuận trong nền sản xuất tư bản chủ nghĩa.
* Giá trị thặng dư tuyệt đối.
* Giá trị thặng dư tương đối.

#### Tha hóa lao động

* Người lao động bị tách khỏi sản phẩm lao động.
* Người lao động bị chi phối bởi quá trình sản xuất.
* Tác động đến đời sống tinh thần và xã hội.

#### Bái vật giáo hàng hóa

* Hàng hóa được nhìn nhận như có giá trị tự thân.
* Con người đánh giá bản thân thông qua việc sở hữu hàng hóa.
* Ảnh hưởng của tiêu dùng và mạng xã hội trong đời sống hiện đại.

### Chức năng

* Hiển thị nội dung trực quan.
* Infographic.
* Animation minh họa.
* Nút chuyển sang trang Game.

---

## 2. Trang Game

### Tên trò chơi

"Hạnh Phúc Hay Tiền Bạc?"

### Thể loại

Choice-Based Game (Reigns Style)

### Bối cảnh

Người chơi vào vai một lao động trẻ mới bắt đầu cuộc sống tại thành phố lớn.

Mục tiêu là sống sót qua 30 ngày và đạt điểm Hạnh phúc cao nhất.

---

# Gameplay

Mỗi ngày người chơi nhận được một tình huống thực tế.

Ví dụ:

* Tăng ca đến nửa đêm.
* Mua điện thoại mới.
* Đi du lịch cùng bạn bè.
* Chấp nhận KPI cao.
* Mua xe trả góp.
* Đầu tư tài chính.

Mỗi tình huống có hai lựa chọn.

Người chơi phải cân bằng giữa:

* Thu nhập
* Sức khỏe
* Áp lực xã hội
* Tiêu dùng
* Chất lượng cuộc sống

---

# Hệ thống chỉ số

## Tiền (Money)

Đại diện cho khả năng tài chính hiện tại.

## Sức khỏe (Health)

Đại diện cho thể chất và tinh thần.

## Tha hóa (Alienation)

Đại diện cho mức độ mất cân bằng giữa con người và lao động.

## Bái vật giáo (Commodity Fetishism)

Đại diện cho xu hướng đánh giá bản thân thông qua việc sở hữu hàng hóa.

## Sĩ diện (Social Status)

Đại diện cho áp lực xã hội và nhu cầu được công nhận.

---

# Điều kiện kết thúc

## Kiệt sức lao động

Sức khỏe ≤ 0

---

## Tha hóa hoàn toàn

Tha hóa ≥ 100

---

## Nô lệ tiêu dùng

Bái vật giáo ≥ 100

---

## Cân bằng cuộc sống

Hoàn thành 30 ngày với các chỉ số ở mức hợp lý.

---

# Công thức tính điểm

Điểm Hạnh phúc:

Happiness Score = Money + Health - Alienation - Fetishism

Điểm càng cao thể hiện khả năng cân bằng tốt giữa vật chất và chất lượng cuộc sống.

---

# Hệ thống xếp hạng

Người chơi được xếp loại:

* S Rank
* A Rank
* B Rank
* C Rank
* D Rank

Dựa trên Happiness Score cuối cùng.

---

# Công nghệ sử dụng

Frontend:

* HTML5
* CSS3
* JavaScript ES6

Giao diện:

* Dark Mode
* Glassmorphism
* Responsive Design
* CSS Animation

Realtime:

* Supabase Realtime

Database:

* Supabase PostgreSQL

Triển khai:

* Render
* Vercel
* Netlify

---

# Ý nghĩa giáo dục

Dự án giúp người học nhận ra rằng:

* Thu nhập cao chưa chắc đồng nghĩa với hạnh phúc.
* Việc theo đuổi vật chất quá mức có thể dẫn đến mất cân bằng cuộc sống.
* Áp lực lao động và tiêu dùng có ảnh hưởng trực tiếp đến sức khỏe và đời sống tinh thần.
* Các khái niệm Giá trị thặng dư, Tha hóa lao động và Bái vật giáo hàng hóa vẫn có thể quan sát được trong xã hội hiện đại.

---

# Tác giả

Dự án được xây dựng với mục tiêu học tập và minh họa các nội dung của môn Kinh tế Chính trị Mác – Lênin thông qua hình thức Web Game tương tác.
