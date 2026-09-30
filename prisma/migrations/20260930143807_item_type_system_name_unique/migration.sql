-- System item types have userId = NULL, which the [userId, name] unique key treats as distinct
-- CreateIndex
CREATE UNIQUE INDEX "ItemType_system_name_key" ON "ItemType"("name") WHERE ("userId" IS NULL);
