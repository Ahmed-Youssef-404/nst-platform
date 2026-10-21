-- CreateTable
CREATE TABLE "student_item_colors" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_item_colors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_item_colors_studentId_itemId_colorHex_key" ON "student_item_colors"("studentId", "itemId", "colorHex");

-- AddForeignKey
ALTER TABLE "student_item_colors" ADD CONSTRAINT "student_item_colors_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
