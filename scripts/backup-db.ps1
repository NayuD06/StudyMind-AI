# Sao lưu database MySQL (đang chạy bằng docker compose) và các file PDF đã tải lên vào thư mục backups/.
#   powershell -File scripts\backup-db.ps1
# Mỗi lần chạy tạo một cặp file cùng mốc thời gian: .sql.gz (database) và -uploads.zip (PDF).
# Giữ lại $Keep cặp mới nhất. Khôi phục: xem README.
param([int]$Keep = 7)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$name = "studymind-$stamp.sql.gz"
$uploadsName = "studymind-$stamp-uploads.zip"
$backupDir = Join-Path $root 'backups'
New-Item -ItemType Directory -Force $backupDir | Out-Null

# Nén ngay trong container rồi mới chép ra: đưa dữ liệu nhị phân qua pipeline của PowerShell sẽ làm hỏng file.
# MYSQL_PWD lấy từ biến môi trường của container nên mật khẩu không xuất hiện trên dòng lệnh.
docker compose exec -T mysql sh -c "MYSQL_PWD=`$MYSQL_PASSWORD mysqldump -ustudymind --single-transaction --no-tablespaces studymind | gzip > /tmp/$name"
if ($LASTEXITCODE -ne 0) { throw 'mysqldump thất bại (container mysql đã chạy chưa?)' }

docker compose cp "mysql:/tmp/$name" (Join-Path $backupDir $name)
if ($LASTEXITCODE -ne 0) { throw 'Không chép được file sao lưu ra khỏi container' }
docker compose exec -T mysql rm "/tmp/$name"

# Database chỉ lưu tên file; mất thư mục uploads là mất hết nội dung tài liệu, nên phải sao lưu cùng lúc
$files = @(Get-ChildItem (Join-Path $root 'backend\uploads') -Filter '*.pdf' -File)
if ($files.Count -gt 0) {
    Compress-Archive -Path $files.FullName -DestinationPath (Join-Path $backupDir $uploadsName)
}

foreach ($pattern in 'studymind-*.sql.gz', 'studymind-*-uploads.zip') {
    Get-ChildItem $backupDir -Filter $pattern |
        Sort-Object Name -Descending |
        Select-Object -Skip $Keep |
        Remove-Item -Confirm:$false
}

$size = [math]::Round((Get-Item (Join-Path $backupDir $name)).Length / 1KB, 1)
Write-Output "Đã sao lưu database: backups\$name ($size KB)"
if ($files.Count -gt 0) {
    Write-Output "Đã sao lưu $($files.Count) file PDF: backups\$uploadsName"
} else {
    Write-Output 'Chưa có file PDF nào để sao lưu'
}
