-- AlterTable
ALTER TABLE `documents` DROP COLUMN `fileUrl`,
    ADD COLUMN `moderationStatus` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `piiFindings` JSON NULL,
    ADD COLUMN `rejectReason` VARCHAR(191) NULL,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    ADD COLUMN `reviewedById` INTEGER NULL,
    ADD COLUMN `storageKey` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `documents_storageKey_key` ON `documents`(`storageKey`);

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

