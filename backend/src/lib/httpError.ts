// Lỗi có mã HTTP, được errorHandler chuyển thành phản hồi JSON
export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
