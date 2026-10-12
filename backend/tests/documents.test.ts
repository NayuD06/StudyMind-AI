import { beforeAll, describe, expect, it } from 'vitest'
import { findPii } from '../src/modules/documents/pdf.js'
import { api, bearer, makePdf, makeSubject, makeUser, moderate, publishedDoc, uploadDoc, type TestUser } from './helpers.js'

let admin: TestUser
let owner: TestUser
let other: TestUser

beforeAll(async () => {
  admin = await makeUser('ADMIN')
  owner = await makeUser('STUDENT', 'Người đăng')
  other = await makeUser('STUDENT', 'Người đọc')
})

const list = (query: Record<string, string | number>) => api().get('/api/documents').query(query).expect(200)
const titles = (res: { body: { items: { title: string }[] } }) => res.body.items.map((item) => item.title)

describe('đăng tài liệu', () => {
  it('cần đăng nhập', async () => {
    await api().post('/api/documents').field('title', 'Không đăng nhập').attach('file', await makePdf(), 'a.pdf').expect(401)
  })

  it('tài liệu mới nằm ở hàng chờ duyệt, có số trang', async () => {
    const res = await api()
      .post('/api/documents')
      .set(bearer(owner))
      .field('title', 'Bài giảng mới đăng')
      .attach('file', await makePdf(), { filename: 'bai-giang.pdf', contentType: 'application/pdf' })
      .expect(201)
    expect(res.body.document).toMatchObject({ title: 'Bài giảng mới đăng', moderationStatus: 'PENDING', pageCount: 1 })
    expect(res.body.piiFindings).toEqual([])
  })

  it('từ chối file không phải PDF dù đặt đuôi và MIME là PDF', async () => {
    const fake = Buffer.from('<html>đây không phải pdf</html>')
    const res = await api()
      .post('/api/documents')
      .set(bearer(owner))
      .field('title', 'File giả dạng')
      .attach('file', fake, { filename: 'gia.pdf', contentType: 'application/pdf' })
      .expect(400)
    expect(res.body.message).toBe('File không phải PDF hợp lệ')
  })

  it('từ chối khi thiếu file, tiêu đề quá ngắn hoặc môn học không tồn tại', async () => {
    const pdf = await makePdf()
    await api().post('/api/documents').set(bearer(owner)).field('title', 'Thiếu file').expect(400)
    await api().post('/api/documents').set(bearer(owner)).field('title', 'ab').attach('file', pdf, 'a.pdf').expect(400)
    await api().post('/api/documents').set(bearer(owner)).field('title', 'Môn lạ').field('subjectId', '99999999').attach('file', pdf, 'a.pdf').expect(400)
  })

  it('cảnh báo khi PDF chứa email hoặc số điện thoại, và che bớt khi báo lại', async () => {
    const pdf = await makePdf('Lien he: nguyenvana@example.com hoac 0912345678')
    const res = await api().post('/api/documents').set(bearer(owner)).field('title', 'Có thông tin cá nhân').attach('file', pdf, 'a.pdf').expect(201)
    const samples = res.body.piiFindings.map((finding: { sample: string }) => finding.sample)
    expect(samples).toEqual(['ng***@example.com', '091*****78'])
  })
})

describe('findPii', () => {
  it('nhận ra email và số di động viết nhiều kiểu', () => {
    const found = findPii('a.b@truong.edu.vn, 0912 345 678, +84912345678, 0912.345.678', 3)
    expect(found.map((item) => item.type)).toEqual(['email', 'phone', 'phone', 'phone'])
    expect(found.every((item) => item.page === 3)).toBe(true)
  })

  it('không bắt nhầm số thường', () => {
    expect(findPii('Năm 2026 có 1234567890123 bản ghi, mã 12345', 1)).toEqual([])
  })
})

describe('ai xem được tài liệu chưa duyệt', () => {
  it('chỉ người đăng và quản trị viên; người khác nhận 404', async () => {
    const doc = await uploadDoc(owner)
    await api().get(`/api/documents/${doc.id}`).expect(404)
    await api().get(`/api/documents/${doc.id}`).set(bearer(other)).expect(404)
    await api().get(`/api/documents/${doc.id}/file`).set(bearer(other)).expect(404)
    await api().get(`/api/documents/${doc.id}`).set(bearer(owner)).expect(200)
    await api().get(`/api/documents/${doc.id}`).set(bearer(admin)).expect(200)

    const all = await list({ limit: 50 })
    expect(all.body.items.some((item: { id: number }) => item.id === doc.id)).toBe(false)
  })

  it('duyệt xong thì ai cũng xem được; lượt xem không tính người đăng', async () => {
    const doc = await publishedDoc(owner, admin)
    await api().get(`/api/documents/${doc.id}`).set(bearer(owner)).expect(200)
    const res = await api().get(`/api/documents/${doc.id}`).expect(200)
    expect(res.body.document.viewCount).toBe(1)
    expect(res.body.document.uploader).toEqual({ id: owner.id, name: 'Người đăng' })
  })

  it('tải về cần đăng nhập và được đếm; xem trực tiếp thì không cần', async () => {
    const doc = await publishedDoc(owner, admin)
    const view = await api().get(`/api/documents/${doc.id}/file`).expect(200)
    expect(view.headers['content-type']).toContain('application/pdf')
    expect(view.headers['cache-control']).toContain('no-store')

    await api().get(`/api/documents/${doc.id}/file?download=1`).expect(401)
    await api().get(`/api/documents/${doc.id}/file?download=1`).set(bearer(other)).expect(200)
    const res = await api().get(`/api/documents/${doc.id}`).expect(200)
    expect(res.body.document.downloadCount).toBe(1)
  })
})

describe('tìm kiếm và lọc', () => {
  const tag = `zq${Date.now().toString(36)}`
  let subjectId: number

  beforeAll(async () => {
    const subject = await makeSubject(`Giải tích ${tag}`)
    subjectId = subject.id
    await publishedDoc(owner, admin, { title: `Cơ bản về SQL ${tag}`, school: `ĐH A ${tag}`, major: 'Công nghệ thông tin' })
    await publishedDoc(owner, admin, { title: `Đề thi cuối kỳ ${tag}`, description: 'Có lời giải chi tiết', school: `ĐH B ${tag}`, major: 'Toán ứng dụng', subjectId })
    await publishedDoc(other, admin, { title: `Ghi chú mạng máy tính ${tag}`, school: `ĐH A ${tag}` })
  })

  it('tìm đủ mọi từ, không cần đúng thứ tự', async () => {
    expect(titles(await list({ q: `sql cơ bản ${tag}` }))).toEqual([`Cơ bản về SQL ${tag}`])
    expect(titles(await list({ q: `${tag} không-có-từ-này` }))).toEqual([])
  })

  it('tìm cả trong mô tả và tên môn học', async () => {
    expect(titles(await list({ q: `lời giải ${tag}` }))).toEqual([`Đề thi cuối kỳ ${tag}`])
    expect(titles(await list({ q: `giải tích ${tag}` }))).toEqual([`Đề thi cuối kỳ ${tag}`])
  })

  it('ký tự đặc biệt của LIKE không thành ký tự đại diện', async () => {
    expect(titles(await list({ q: `% ${tag}` }))).toEqual([])
    expect(titles(await list({ q: `_ ${tag}` }))).toEqual([])
  })

  it('lọc theo trường, ngành, môn học, người đăng', async () => {
    expect(titles(await list({ q: tag, school: `ĐH A ${tag}` }))).toHaveLength(2)
    expect(titles(await list({ q: tag, major: 'Toán ứng dụng' }))).toEqual([`Đề thi cuối kỳ ${tag}`])
    expect(titles(await list({ q: tag, subjectId }))).toEqual([`Đề thi cuối kỳ ${tag}`])
    expect(titles(await list({ q: tag, uploaderId: other.id }))).toEqual([`Ghi chú mạng máy tính ${tag}`])
  })

  it('lọc theo điểm đánh giá trung bình', async () => {
    const rater = await makeUser()
    const found = await list({ q: tag, limit: 50 })
    const byTitle = (title: string) => found.body.items.find((item: { title: string }) => item.title.startsWith(title)).id as number
    await api().put(`/api/documents/${byTitle('Cơ bản')}/rating`).set(bearer(rater)).send({ score: 5 }).expect(200)
    await api().put(`/api/documents/${byTitle('Đề thi')}/rating`).set(bearer(rater)).send({ score: 2 }).expect(200)

    expect(titles(await list({ q: tag, minRating: 4 }))).toEqual([`Cơ bản về SQL ${tag}`])
    expect(titles(await list({ q: tag, minRating: 2 }))).toHaveLength(2)
    await api().get('/api/documents').query({ minRating: 9 }).expect(400)
  })

  it('danh sách trường và ngành để lọc chỉ lấy từ tài liệu công khai', async () => {
    await uploadDoc(owner, { title: `Chưa duyệt ${tag}`, school: `ĐH Ẩn ${tag}` })
    const res = await api().get('/api/documents/facets').expect(200)
    expect(res.body.schools).toEqual(expect.arrayContaining([`ĐH A ${tag}`, `ĐH B ${tag}`]))
    expect(res.body.schools).not.toContain(`ĐH Ẩn ${tag}`)
    expect(res.body.majors).toEqual(expect.arrayContaining(['Công nghệ thông tin', 'Toán ứng dụng']))
  })

  it('trang công khai của người đăng đếm đúng tài liệu đã duyệt', async () => {
    const uploader = await makeUser()
    await publishedDoc(uploader, admin)
    await uploadDoc(uploader)
    const res = await api().get(`/api/users/${uploader.id}`).expect(200)
    expect(res.body.user.documentCount).toBe(1)
  })
})

describe('sửa tài liệu', () => {
  const edit = (id: number, user: TestUser, body: object) => api().put(`/api/documents/${id}`).set(bearer(user)).send(body)

  it('chỉ người đăng sửa được, kể cả quản trị viên cũng không', async () => {
    const doc = await publishedDoc(owner, admin)
    await edit(doc.id, other, { title: 'Sửa trộm tiêu đề' }).expect(403)
    await edit(doc.id, admin, { title: 'Quản trị sửa hộ' }).expect(403)
    await api().put(`/api/documents/${doc.id}`).send({ title: 'Không đăng nhập' }).expect(401)
  })

  it('thay thông tin; trường bỏ trống thì bị xóa; tài liệu đã duyệt vẫn công khai', async () => {
    const subject = await makeSubject()
    const doc = await publishedDoc(owner, admin, { description: 'Mô tả cũ', school: 'Trường cũ' })
    const res = await edit(doc.id, owner, { title: 'Tiêu đề đã sửa', major: 'Ngành mới', subjectId: subject.id, school: '' }).expect(200)

    expect(res.body.document).toMatchObject({ title: 'Tiêu đề đã sửa', description: null, school: null, major: 'Ngành mới', moderationStatus: 'APPROVED' })
    expect(res.body.document.subjects).toEqual([{ subject: { id: subject.id, name: subject.name, slug: subject.slug } }])
    await api().get(`/api/documents/${doc.id}`).expect(200)
  })

  it('tài liệu bị từ chối mà sửa thì quay lại hàng chờ duyệt', async () => {
    const doc = await uploadDoc(owner)
    await moderate(admin, doc.id, 'REJECTED', 'Tiêu đề chưa rõ ràng')
    const res = await edit(doc.id, owner, { title: 'Tiêu đề rõ ràng hơn' }).expect(200)
    expect(res.body.document).toMatchObject({ moderationStatus: 'PENDING', rejectReason: null })
  })

  it('kiểm tra dữ liệu như lúc đăng', async () => {
    const doc = await uploadDoc(owner)
    await edit(doc.id, owner, { title: 'ab' }).expect(400)
    await edit(doc.id, owner, { title: 'Môn không có', subjectId: 99999999 }).expect(400)
    await edit(99999999, owner, { title: 'Không tồn tại' }).expect(404)
  })
})

describe('đánh giá, lưu, bình luận, báo cáo', () => {
  let docId: number

  beforeAll(async () => {
    docId = (await publishedDoc(owner, admin)).id
  })

  it('không tự đánh giá tài liệu của mình; đánh giá lại thì ghi đè', async () => {
    const rate = (user: TestUser, score: number) => api().put(`/api/documents/${docId}/rating`).set(bearer(user)).send({ score })
    await rate(owner, 5).expect(400)
    await rate(other, 6).expect(400)
    await rate(other, 2).expect(200)
    const res = await rate(other, 4).expect(200)
    expect(res.body).toEqual({ rating: { avg: 4, count: 1 }, myRating: 4 })
  })

  it('lưu và bỏ lưu tài liệu', async () => {
    await api().put(`/api/documents/${docId}/favorite`).set(bearer(other)).expect(200)
    const saved = await api().get('/api/documents/favorites').set(bearer(other)).expect(200)
    expect(saved.body.items.map((item: { id: number }) => item.id)).toContain(docId)
    await api().delete(`/api/documents/${docId}/favorite`).set(bearer(other)).expect(200)
    const after = await api().get('/api/documents/favorites').set(bearer(other)).expect(200)
    expect(after.body.items).toEqual([])
  })

  it('bình luận báo cho người đăng; chỉ người viết hoặc quản trị viên xóa được', async () => {
    const add = await api().post(`/api/documents/${docId}/comments`).set(bearer(other)).send({ content: 'Tài liệu rất hữu ích' }).expect(201)
    const commentId = add.body.comment.id as number
    await api().post(`/api/documents/${docId}/comments`).set(bearer(other)).send({ content: '   ' }).expect(400)

    const inbox = await api().get('/api/notifications').set(bearer(owner)).expect(200)
    expect(inbox.body.items.some((item: { message: string }) => item.message.includes('Người đọc đã bình luận'))).toBe(true)

    await api().delete(`/api/documents/${docId}/comments/${commentId}`).set(bearer(owner)).expect(403)
    await api().delete(`/api/documents/${docId}/comments/${commentId}`).set(bearer(other)).expect(204)
    const listed = await api().get(`/api/documents/${docId}/comments`).expect(200)
    expect(listed.body.total).toBe(0)
  })

  it('báo cáo: không báo cáo tài liệu của mình, không gửi trùng', async () => {
    const report = (user: TestUser, reason: string) => api().post(`/api/documents/${docId}/reports`).set(bearer(user)).send({ reason })
    await report(owner, 'Tự báo cáo tài liệu của mình').expect(400)
    await report(other, 'ngắn').expect(400)
    await report(other, 'Tài liệu sao chép từ nguồn khác').expect(201)
    await report(other, 'Tài liệu sao chép từ nguồn khác').expect(409)
  })
})

describe('xóa tài liệu', () => {
  it('người khác không xóa được; người đăng xóa được', async () => {
    const doc = await publishedDoc(owner, admin)
    await api().delete(`/api/documents/${doc.id}`).set(bearer(other)).expect(403)
    await api().delete(`/api/documents/${doc.id}`).set(bearer(owner)).expect(204)
    await api().get(`/api/documents/${doc.id}`).set(bearer(owner)).expect(404)
  })
})
