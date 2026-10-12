// Nội dung mẫu cho `npm run db:seed:demo`. Mỗi phần (section) của tài liệu thành một trang PDF.

export const DEMO_DOMAIN = 'demo.studymind.local'

export const STUDENTS = [
  { name: 'Nguyễn Minh Anh', email: `minhanh@${DEMO_DOMAIN}`, major: 'Khoa học máy tính' },
  { name: 'Trần Quốc Bảo', email: `quocbao@${DEMO_DOMAIN}`, major: 'Kỹ thuật phần mềm' },
  { name: 'Lê Thu Hà', email: `thuha@${DEMO_DOMAIN}`, major: 'Hệ thống thông tin' },
  { name: 'Phạm Đức Huy', email: `duchuy@${DEMO_DOMAIN}`, major: 'Mạng máy tính' },
  { name: 'Võ Ngọc Lan', email: `ngoclan@${DEMO_DOMAIN}`, major: 'Trí tuệ nhân tạo' },
  { name: 'Đặng Gia Khánh', email: `giakhanh@${DEMO_DOMAIN}`, major: 'Kỹ thuật phần mềm' },
]

export const COMMENTS = [
  'Tài liệu tóm tắt gọn, đọc một lượt là nắm được ý chính. Cảm ơn bạn!',
  'Phần ví dụ rất dễ hiểu, giá mà có thêm vài bài tập tự luyện nữa.',
  'Mình ôn thi giữa kỳ bằng file này, khá sát đề của thầy.',
  'Trang 2 trình bày hơi nhanh, bạn nào giải thích kỹ hơn giúp mình với.',
  'Đúng thứ mình đang tìm, đã lưu lại để đọc trước buổi học.',
  'Nội dung ổn, nhưng nên bổ sung tài liệu tham khảo ở cuối.',
  'Cảm ơn bạn đã chia sẻ, lớp mình đang chuyền nhau file này.',
  'Có một chỗ ký hiệu khác với giáo trình của trường mình, mọi người lưu ý nhé.',
  'Ngắn mà đủ ý, hợp để ôn nhanh đêm trước khi thi.',
  'Bạn có bản cập nhật cho học kỳ này không?',
]

export const REPORT_REASONS = [
  'Nội dung sai hoặc không liên quan: phần định nghĩa ở trang 2 khác với giáo trình.',
  'Vi phạm bản quyền: nội dung chép lại gần như nguyên văn từ sách có bản quyền.',
]

export type DemoDocument = {
  title: string
  subject: string // slug của môn học trong seed.ts
  description: string
  status?: 'PENDING' | 'REJECTED' // mặc định là đã duyệt
  rejectReason?: string
  sections: [heading: string, body: string][]
}

export const DOCUMENTS: DemoDocument[] = [
  {
    title: 'Tóm tắt chuẩn hóa cơ sở dữ liệu: từ 1NF đến BCNF',
    subject: 'co-so-du-lieu',
    description: 'Định nghĩa từng dạng chuẩn, cách nhận biết vi phạm và ví dụ tách bảng.',
    sections: [
      ['Vì sao phải chuẩn hóa', 'Một bảng thiết kế kém sẽ lặp dữ liệu và sinh ra ba loại bất thường: khi thêm, khi sửa và khi xóa. Ví dụ bảng DangKy(MaSV, TenSV, MaMon, TenMon, Diem) lặp tên sinh viên ở mọi dòng; đổi tên một sinh viên phải sửa nhiều dòng, sót một dòng là dữ liệu mâu thuẫn.\n\nChuẩn hóa là quá trình tách bảng dựa trên phụ thuộc hàm để loại bỏ sự lặp lại đó mà không làm mất thông tin.'],
      ['Phụ thuộc hàm và các dạng chuẩn 1NF, 2NF, 3NF', 'Phụ thuộc hàm X → Y nghĩa là hai dòng giống nhau ở X thì phải giống nhau ở Y.\n\n1NF: mọi thuộc tính đều nguyên tố, không có nhóm lặp.\n\n2NF: đạt 1NF và không có thuộc tính không khóa nào phụ thuộc vào một phần của khóa chính. Trong ví dụ trên, TenSV chỉ phụ thuộc MaSV nên bảng vi phạm 2NF.\n\n3NF: đạt 2NF và không có phụ thuộc bắc cầu: thuộc tính không khóa không được phụ thuộc vào thuộc tính không khóa khác.'],
      ['BCNF và cách tách bảng', 'BCNF chặt hơn 3NF: với mọi phụ thuộc hàm không tầm thường X → Y, X phải là siêu khóa.\n\nCách tách: tìm một phụ thuộc X → Y vi phạm, tách thành R1(X, Y) và R2(R trừ Y). Lặp lại cho tới khi mọi bảng đạt chuẩn. Phép tách này luôn bảo toàn thông tin (nối lại không mất dòng) nhưng có thể không bảo toàn phụ thuộc hàm, vì vậy thực tế nhiều hệ thống dừng ở 3NF.'],
    ],
  },
  {
    title: 'Đề cương ôn tập SQL: JOIN, GROUP BY và truy vấn lồng',
    subject: 'co-so-du-lieu',
    description: 'Các mẫu câu truy vấn hay ra thi kèm lời giải thích từng bước.',
    sections: [
      ['Các loại JOIN', 'INNER JOIN chỉ giữ các dòng khớp ở cả hai bảng. LEFT JOIN giữ mọi dòng của bảng bên trái, cột của bảng phải nhận NULL khi không khớp. Mẹo tìm "sinh viên chưa đăng ký môn nào": LEFT JOIN rồi lọc WHERE dangky.masv IS NULL.\n\nLưu ý điều kiện đặt ở ON và ở WHERE cho kết quả khác nhau khi dùng LEFT JOIN: điều kiện ở WHERE trên bảng phải sẽ biến phép nối thành INNER JOIN.'],
      ['GROUP BY và HAVING', 'Thứ tự xử lý logic: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY. WHERE lọc dòng trước khi gom nhóm, HAVING lọc nhóm sau khi gom.\n\nVí dụ: liệt kê các môn có điểm trung bình trên 7:\nSELECT mamon, AVG(diem) FROM dangky GROUP BY mamon HAVING AVG(diem) > 7.\n\nMọi cột trong SELECT không nằm trong hàm gộp đều phải xuất hiện trong GROUP BY.'],
      ['Truy vấn lồng', 'Truy vấn con không tương quan chạy một lần, ví dụ tìm sinh viên có điểm cao hơn điểm trung bình toàn trường. Truy vấn con tương quan tham chiếu tới dòng của truy vấn ngoài và được tính lại cho từng dòng.\n\nEXISTS thường nhanh hơn IN khi truy vấn con trả về nhiều dòng. NOT IN cho kết quả rỗng nếu truy vấn con có giá trị NULL, nên ưu tiên NOT EXISTS.'],
    ],
  },
  {
    title: 'Giao tác và điều khiển đồng thời',
    subject: 'co-so-du-lieu',
    description: 'Tính chất ACID, các mức cô lập và kỹ thuật khóa hai pha.',
    status: 'PENDING',
    sections: [
      ['Tính chất ACID', 'Giao tác là một dãy thao tác được xem như một đơn vị công việc. Bốn tính chất: nguyên tố (làm hết hoặc không làm gì), nhất quán (đưa dữ liệu từ trạng thái hợp lệ này sang trạng thái hợp lệ khác), cô lập (các giao tác đồng thời không thấy trạng thái dở dang của nhau) và bền vững (đã commit thì không mất dù hệ thống hỏng).'],
      ['Các hiện tượng khi chạy đồng thời', 'Đọc bẩn: đọc dữ liệu của giao tác chưa commit. Đọc không lặp lại: đọc hai lần cùng một dòng ra hai giá trị. Bóng ma: chạy lại cùng điều kiện ra thêm dòng mới.\n\nBốn mức cô lập READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE lần lượt chặn thêm từng hiện tượng, đổi lại là giảm khả năng chạy song song.'],
      ['Khóa hai pha', 'Giao tác chia làm hai pha: pha lấy khóa và pha nhả khóa; đã nhả một khóa thì không được lấy thêm khóa mới. Mọi lịch tuân theo khóa hai pha đều khả tuần tự xung đột, nhưng có thể dẫn tới deadlock nên hệ quản trị cần cơ chế phát hiện và hủy một giao tác.'],
    ],
  },
  {
    title: 'Độ phức tạp thuật toán và ký hiệu Big-O',
    subject: 'cau-truc-du-lieu-va-giai-thuat',
    description: 'Cách đếm số phép toán, các lớp độ phức tạp thường gặp và định lý Master.',
    sections: [
      ['Ý nghĩa của Big-O', 'f(n) = O(g(n)) nếu tồn tại hằng số c và n0 sao cho f(n) ≤ c·g(n) với mọi n ≥ n0. Big-O mô tả tốc độ tăng của thời gian chạy theo kích thước đầu vào, bỏ qua hằng số và các số hạng bậc thấp.\n\nThứ tự tăng dần: O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ), O(n!).'],
      ['Phân tích vòng lặp', 'Một vòng lặp chạy n lần với thân O(1) là O(n). Hai vòng lồng nhau độc lập là O(n²). Vòng lặp mà biến đếm nhân đôi mỗi bước chạy log n lần.\n\nVí dụ tìm kiếm nhị phân: mỗi bước bỏ đi một nửa mảng nên cần tối đa log₂ n + 1 phép so sánh.'],
      ['Định lý Master', 'Với công thức truy hồi T(n) = a·T(n/b) + O(nᵈ): nếu d > log_b a thì T(n) = O(nᵈ); nếu d = log_b a thì T(n) = O(nᵈ log n); nếu d < log_b a thì T(n) = O(n^(log_b a)).\n\nÁp dụng: merge sort có a = 2, b = 2, d = 1 nên T(n) = O(n log n).'],
    ],
  },
  {
    title: 'Cây nhị phân tìm kiếm và cây AVL',
    subject: 'cau-truc-du-lieu-va-giai-thuat',
    description: 'Thao tác tìm, chèn, xóa trên BST và bốn trường hợp xoay của cây AVL.',
    sections: [
      ['Cây nhị phân tìm kiếm', 'Với mỗi nút, mọi khóa ở cây con trái nhỏ hơn khóa của nút và mọi khóa ở cây con phải lớn hơn. Duyệt trung thứ tự cho dãy khóa tăng dần.\n\nTìm, chèn, xóa đều mất O(h) với h là chiều cao cây. Chèn dãy đã sắp xếp làm cây suy biến thành danh sách, h = n.'],
      ['Xóa một nút', 'Ba trường hợp: nút lá thì xóa thẳng; nút có một con thì nối con lên thay; nút có hai con thì thay bằng nút nhỏ nhất của cây con phải (hoặc lớn nhất của cây con trái) rồi xóa nút đó.'],
      ['Cây AVL', 'Cây AVL giữ hệ số cân bằng (chiều cao trái trừ chiều cao phải) của mọi nút trong khoảng -1 đến 1, nhờ đó h = O(log n).\n\nSau khi chèn, đi ngược từ nút mới lên gốc; gặp nút mất cân bằng thì xoay. Bốn trường hợp: trái-trái (xoay phải), phải-phải (xoay trái), trái-phải (xoay trái ở con rồi xoay phải), phải-trái (xoay phải ở con rồi xoay trái).'],
    ],
  },
  {
    title: 'Các thuật toán sắp xếp: so sánh và cài đặt',
    subject: 'cau-truc-du-lieu-va-giai-thuat',
    description: 'Bảng so sánh bubble, insertion, merge, quick, heap sort.',
    sections: [
      ['Các thuật toán O(n²)', 'Bubble sort đổi chỗ các cặp kề nhau sai thứ tự. Selection sort chọn phần tử nhỏ nhất đưa về đầu. Insertion sort chèn từng phần tử vào đoạn đã sắp xếp; đây là lựa chọn tốt cho mảng nhỏ hoặc gần như đã sắp xếp vì chỉ mất O(n) trong trường hợp tốt nhất.'],
      ['Merge sort và quick sort', 'Merge sort chia đôi mảng, sắp xếp từng nửa rồi trộn; luôn O(n log n), ổn định, nhưng cần thêm O(n) bộ nhớ.\n\nQuick sort chọn chốt, phân hoạch mảng thành phần nhỏ hơn và lớn hơn chốt; trung bình O(n log n), xấu nhất O(n²) khi chốt luôn là phần tử nhỏ nhất hoặc lớn nhất. Chọn chốt ngẫu nhiên để tránh trường hợp xấu.'],
      ['Heap sort và giới hạn dưới', 'Heap sort dựng max-heap trong O(n) rồi lặp lại việc lấy phần tử lớn nhất ra cuối mảng; O(n log n), không cần bộ nhớ phụ nhưng không ổn định.\n\nMọi thuật toán sắp xếp dựa trên so sánh cần ít nhất Ω(n log n) phép so sánh trong trường hợp xấu nhất. Counting sort và radix sort vượt giới hạn này vì không so sánh trực tiếp các khóa.'],
    ],
  },
  {
    title: 'Mô hình OSI và TCP/IP: so sánh từng tầng',
    subject: 'mang-may-tinh',
    description: 'Chức năng 7 tầng OSI, ánh xạ sang TCP/IP và giao thức tiêu biểu.',
    sections: [
      ['Bảy tầng OSI', 'Từ dưới lên: vật lý (truyền bit), liên kết dữ liệu (khung, địa chỉ MAC), mạng (định tuyến, địa chỉ IP), giao vận (TCP, UDP, cổng), phiên, trình diễn và ứng dụng.\n\nMỗi tầng chỉ nói chuyện với tầng ngay trên và ngay dưới nó; dữ liệu đi xuống được bọc thêm tiêu đề của từng tầng, gọi là đóng gói.'],
      ['Mô hình TCP/IP', 'TCP/IP gộp thành bốn tầng: truy cập mạng, Internet, giao vận, ứng dụng. Ba tầng trên cùng của OSI nằm trong tầng ứng dụng của TCP/IP.\n\nGiao thức tiêu biểu: Ethernet và Wi-Fi ở tầng truy cập mạng; IP, ICMP ở tầng Internet; TCP, UDP ở tầng giao vận; HTTP, DNS, SMTP ở tầng ứng dụng.'],
      ['TCP và UDP', 'TCP hướng kết nối: bắt tay ba bước (SYN, SYN-ACK, ACK), đánh số thứ tự, xác nhận, truyền lại và điều khiển tắc nghẽn. UDP không kết nối, không bảo đảm, tiêu đề chỉ 8 byte nên hợp với DNS, thoại và video trực tiếp.'],
    ],
  },
  {
    title: 'Chia mạng con (subnetting): bài tập có lời giải',
    subject: 'mang-may-tinh',
    description: 'Cách tính địa chỉ mạng, broadcast và số host cho từng mạng con.',
    status: 'REJECTED',
    rejectReason: 'File trùng nội dung với một tài liệu khác bạn đã đăng, vui lòng gộp lại thành một file.',
    sections: [
      ['Công thức cần nhớ', 'Với tiền tố /n: số địa chỉ là 2^(32-n), số host dùng được là 2^(32-n) - 2 vì trừ địa chỉ mạng và địa chỉ broadcast.\n\nMượn k bit từ phần host thì được 2^k mạng con.'],
      ['Bài tập mẫu', 'Chia 192.168.10.0/24 thành 4 mạng con bằng nhau. Mượn 2 bit, tiền tố mới là /26, mỗi mạng 64 địa chỉ, 62 host.\n\nBốn mạng con: 192.168.10.0, .64, .128, .192. Mạng thứ hai có dải host từ .65 đến .126 và broadcast là .127.'],
    ],
  },
  {
    title: 'Lập lịch CPU: FCFS, SJF và Round Robin',
    subject: 'he-dieu-hanh',
    description: 'Cách vẽ biểu đồ Gantt và tính thời gian chờ trung bình cho từng thuật toán.',
    sections: [
      ['Các tiêu chí đánh giá', 'Thời gian hoàn thành = thời điểm kết thúc trừ thời điểm đến. Thời gian chờ = thời gian hoàn thành trừ thời gian chạy CPU. Thời gian đáp ứng = lần đầu được cấp CPU trừ thời điểm đến.'],
      ['FCFS và SJF', 'FCFS phục vụ theo thứ tự đến, đơn giản nhưng gặp hiệu ứng đoàn xe: tiến trình dài đứng trước làm mọi tiến trình ngắn phải chờ.\n\nSJF chọn tiến trình có thời gian chạy ngắn nhất, cho thời gian chờ trung bình nhỏ nhất, nhưng có thể làm tiến trình dài bị đói và cần dự đoán trước thời gian chạy.'],
      ['Round Robin', 'Mỗi tiến trình được chạy tối đa một lượng tử thời gian q rồi quay về cuối hàng đợi. q quá lớn thì thành FCFS, q quá nhỏ thì tốn thời gian chuyển ngữ cảnh.\n\nVí dụ P1 = 5, P2 = 3, P3 = 1 cùng đến lúc 0, q = 2: thứ tự chạy P1, P2, P3, P1, P2, P1; thời gian chờ lần lượt là 4, 5, 4.'],
    ],
  },
  {
    title: 'Deadlock: điều kiện, phát hiện và phòng tránh',
    subject: 'he-dieu-hanh',
    description: 'Bốn điều kiện Coffman, đồ thị cấp phát tài nguyên và thuật toán Banker.',
    sections: [
      ['Bốn điều kiện cần', 'Deadlock chỉ xảy ra khi đồng thời có: loại trừ tương hỗ, giữ và chờ, không thu hồi, và chờ vòng tròn. Phá được một trong bốn điều kiện là ngăn được deadlock.\n\nCách phổ biến nhất là phá chờ vòng tròn: đánh số tài nguyên và buộc mọi tiến trình xin theo thứ tự tăng dần.'],
      ['Đồ thị cấp phát tài nguyên', 'Cạnh từ tiến trình tới tài nguyên là yêu cầu, cạnh từ tài nguyên tới tiến trình là đã cấp. Nếu mỗi loại tài nguyên chỉ có một thể hiện thì có chu trình tương đương có deadlock; nếu có nhiều thể hiện thì chu trình chỉ là điều kiện cần.'],
      ['Thuật toán Banker', 'Hệ thống chỉ cấp tài nguyên nếu sau khi cấp vẫn ở trạng thái an toàn, tức là tồn tại một thứ tự cho mọi tiến trình chạy xong.\n\nKiểm tra an toàn: tìm tiến trình có Need ≤ Available, giả sử nó chạy xong và trả lại tài nguyên (Available cộng thêm Allocation), lặp lại cho tới khi hết tiến trình hoặc không tìm được.'],
    ],
  },
  {
    title: 'Tìm kiếm A* và cách chọn heuristic',
    subject: 'tri-tue-nhan-tao',
    description: 'So sánh BFS, UCS, tham lam và A*; điều kiện để A* tìm được lời giải tối ưu.',
    sections: [
      ['Từ tìm kiếm mù tới tìm kiếm có thông tin', 'BFS mở rộng nút nông nhất, UCS mở rộng nút có chi phí g(n) nhỏ nhất. Tìm kiếm tham lam chỉ nhìn ước lượng h(n) tới đích nên nhanh nhưng không tối ưu.\n\nA* kết hợp cả hai: f(n) = g(n) + h(n).'],
      ['Heuristic chấp nhận được và nhất quán', 'h chấp nhận được nếu không bao giờ ước lượng cao hơn chi phí thật tới đích; khi đó A* tìm kiếm trên cây cho lời giải tối ưu.\n\nh nhất quán nếu h(n) ≤ c(n, n\') + h(n\') với mọi cạnh; khi đó A* tìm kiếm trên đồ thị cũng tối ưu và không cần mở lại nút đã đóng.'],
      ['Ví dụ với bài toán 8 ô', 'h1 là số ô sai vị trí, h2 là tổng khoảng cách Manhattan. Cả hai đều chấp nhận được, và h2 luôn lớn hơn hoặc bằng h1 nên h2 trội hơn: A* dùng h2 mở rộng ít nút hơn.\n\nCách tạo heuristic: nới lỏng ràng buộc của bài toán và lấy chi phí lời giải của bài toán đã nới lỏng.'],
    ],
  },
  {
    title: 'Nhập môn học máy: hồi quy tuyến tính và gradient descent',
    subject: 'tri-tue-nhan-tao',
    description: 'Hàm mất mát, công thức cập nhật trọng số và vai trò của tốc độ học.',
    sections: [
      ['Mô hình và hàm mất mát', 'Hồi quy tuyến tính dự đoán ŷ = w·x + b. Hàm mất mát thường dùng là sai số bình phương trung bình: J(w, b) = (1/2m) Σ (ŷᵢ - yᵢ)².\n\nMục tiêu của huấn luyện là tìm w và b làm J nhỏ nhất.'],
      ['Gradient descent', 'Lặp lại: w := w - α·∂J/∂w và b := b - α·∂J/∂b, trong đó α là tốc độ học. Với hồi quy tuyến tính, ∂J/∂w = (1/m) Σ (ŷᵢ - yᵢ)·xᵢ.\n\nα quá nhỏ thì hội tụ chậm, α quá lớn thì J dao động hoặc phân kỳ. Nên chuẩn hóa đặc trưng về cùng thang đo để hội tụ nhanh hơn.'],
      ['Quá khớp và cách hạn chế', 'Mô hình quá khớp khi sai số trên tập huấn luyện thấp nhưng trên tập kiểm tra cao. Cách hạn chế: thêm dữ liệu, giảm số đặc trưng, hoặc thêm số hạng phạt λ Σ w² vào hàm mất mát (điều chuẩn L2).\n\nLuôn tách riêng tập kiểm tra và chỉ dùng nó một lần ở cuối để đánh giá.'],
    ],
  },
  {
    title: 'Quy trình Scrum tóm tắt trong 3 trang',
    subject: 'cong-nghe-phan-mem',
    description: 'Vai trò, sự kiện và sản phẩm của Scrum; khác gì so với mô hình thác nước.',
    sections: [
      ['Ba vai trò', 'Product Owner quyết định làm gì và thứ tự ưu tiên trong Product Backlog. Scrum Master giúp nhóm làm đúng Scrum và gỡ vướng mắc. Nhóm phát triển tự tổ chức, cùng chịu trách nhiệm về sản phẩm của mỗi sprint.'],
      ['Các sự kiện', 'Sprint kéo dài từ một đến bốn tuần. Mở đầu là Sprint Planning để chọn việc; mỗi ngày có Daily Scrum 15 phút; cuối sprint có Sprint Review để trình diễn sản phẩm và Sprint Retrospective để cải tiến cách làm việc.'],
      ['So với mô hình thác nước', 'Thác nước làm tuần tự: phân tích, thiết kế, lập trình, kiểm thử; yêu cầu phải chốt từ đầu và lỗi thường phát hiện muộn. Scrum giao phần mềm chạy được sau mỗi sprint nên nhận phản hồi sớm và đổi hướng dễ hơn, đổi lại khó ước lượng tổng chi phí từ đầu.'],
    ],
  },
  {
    title: 'UML: sơ đồ use case và sơ đồ lớp',
    subject: 'cong-nghe-phan-mem',
    description: 'Ký hiệu và ví dụ cho hệ thống quản lý thư viện.',
    status: 'REJECTED',
    rejectReason: 'File chỉ có phần mở đầu, chưa có sơ đồ nào. Bạn bổ sung nội dung rồi đăng lại nhé.',
    sections: [
      ['Mở đầu', 'Tài liệu này sẽ trình bày ký hiệu của sơ đồ use case và sơ đồ lớp trong UML, lấy ví dụ từ hệ thống quản lý thư viện. Phần sơ đồ sẽ được bổ sung sau.'],
    ],
  },
  {
    title: 'Logic mệnh đề và các quy tắc suy diễn',
    subject: 'toan-roi-rac',
    description: 'Bảng chân trị, các tương đương logic quan trọng và cách chứng minh.',
    sections: [
      ['Các phép toán và bảng chân trị', 'Năm phép toán: phủ định, hội, tuyển, kéo theo và tương đương. Mệnh đề p → q chỉ sai khi p đúng và q sai.\n\nHằng đúng là công thức đúng với mọi bộ giá trị; mâu thuẫn là công thức luôn sai.'],
      ['Các tương đương logic', 'Luật De Morgan: ¬(p ∧ q) ≡ ¬p ∨ ¬q và ¬(p ∨ q) ≡ ¬p ∧ ¬q. Kéo theo: p → q ≡ ¬p ∨ q. Phản đảo: p → q ≡ ¬q → ¬p.\n\nChú ý mệnh đề đảo q → p không tương đương với p → q.'],
      ['Quy tắc suy diễn', 'Modus ponens: từ p và p → q suy ra q. Modus tollens: từ ¬q và p → q suy ra ¬p. Tam đoạn luận giả định: từ p → q và q → r suy ra p → r.\n\nChứng minh phản chứng: giả sử kết luận sai rồi dẫn tới mâu thuẫn.'],
    ],
  },
  {
    title: 'Lý thuyết đồ thị: đường đi Euler và Hamilton',
    subject: 'toan-roi-rac',
    description: 'Điều kiện tồn tại, thuật toán Fleury và các định lý Dirac, Ore.',
    sections: [
      ['Chu trình và đường đi Euler', 'Chu trình Euler đi qua mỗi cạnh đúng một lần và quay về đỉnh xuất phát. Đồ thị vô hướng liên thông có chu trình Euler khi và chỉ khi mọi đỉnh có bậc chẵn; có đường đi Euler khi có đúng hai đỉnh bậc lẻ.\n\nThuật toán Fleury: đi theo cạnh bất kỳ, chỉ đi qua cầu khi không còn lựa chọn khác.'],
      ['Chu trình Hamilton', 'Chu trình Hamilton đi qua mỗi đỉnh đúng một lần. Không có điều kiện cần và đủ đơn giản; bài toán kiểm tra thuộc lớp NP-đầy đủ.\n\nĐịnh lý Dirac: đồ thị n ≥ 3 đỉnh mà mọi đỉnh có bậc ít nhất n/2 thì có chu trình Hamilton. Định lý Ore: nếu tổng bậc của hai đỉnh không kề bất kỳ ít nhất bằng n thì có chu trình Hamilton.'],
    ],
  },
  {
    title: 'HTTP và REST API cơ bản',
    subject: 'lap-trinh-web',
    description: 'Phương thức, mã trạng thái và nguyên tắc thiết kế đường dẫn tài nguyên.',
    sections: [
      ['Yêu cầu và phản hồi HTTP', 'Một yêu cầu gồm phương thức, đường dẫn, các tiêu đề và phần thân. GET để đọc, POST để tạo, PUT thay toàn bộ, PATCH sửa một phần, DELETE để xóa. GET, PUT và DELETE là lũy đẳng: gọi nhiều lần cho cùng kết quả.'],
      ['Mã trạng thái', '2xx là thành công (200 OK, 201 Created, 204 No Content). 3xx là chuyển hướng. 4xx là lỗi phía người gọi: 400 dữ liệu sai, 401 chưa đăng nhập, 403 không có quyền, 404 không tìm thấy, 409 xung đột, 429 gọi quá nhiều. 5xx là lỗi phía máy chủ.'],
      ['Thiết kế REST', 'Đường dẫn là danh từ số nhiều chỉ tài nguyên: /documents, /documents/12/comments. Không đặt động từ vào đường dẫn; hành động thể hiện bằng phương thức HTTP.\n\nMáy chủ không giữ trạng thái giữa các yêu cầu: mỗi yêu cầu phải tự mang đủ thông tin xác thực, thường là token trong tiêu đề Authorization.'],
    ],
  },
  {
    title: 'React Hooks: useState, useEffect và các lỗi hay gặp',
    subject: 'lap-trinh-web',
    description: 'Ghi chú cá nhân khi học React, kèm ví dụ sửa lỗi vòng lặp vô hạn.',
    status: 'PENDING',
    sections: [
      ['useState', 'useState trả về giá trị hiện tại và hàm cập nhật. Cập nhật là bất đồng bộ: đọc lại biến ngay sau khi gọi hàm cập nhật vẫn ra giá trị cũ. Khi giá trị mới phụ thuộc giá trị cũ, truyền hàm: setCount(c => c + 1).\n\nGóp ý xin gửi về nhom.hoctap.web@gmail.com hoặc nhắn 0912 345 678.'],
      ['useEffect', 'Hàm trong useEffect chạy sau khi giao diện đã vẽ. Mảng phụ thuộc quyết định khi nào chạy lại: bỏ trống mảng thì chạy mỗi lần vẽ, mảng rỗng thì chỉ chạy một lần.\n\nLỗi vòng lặp vô hạn: gọi hàm cập nhật state trong effect mà chính state đó nằm trong mảng phụ thuộc. Luôn trả về hàm dọn dẹp khi đăng ký sự kiện hoặc đặt bộ đếm thời gian.'],
    ],
  },
]
