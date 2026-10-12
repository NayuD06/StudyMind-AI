-- CreateTable
CREATE TABLE `admin_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(500) NOT NULL,
    `ip` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_logs` ADD CONSTRAINT `admin_logs_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

