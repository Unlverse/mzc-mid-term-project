import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('admin1234', 10);

  await prisma.managerAccount.upsert({
    where: { loginId: 'admin' },
    update: {
      name: '관리자',
      passwordHash,
    },
    create: {
      loginId: 'admin',
      passwordHash,
      name: '관리자',
    },
  });

  const settings = await prisma.reservationSetting.findFirst();

  if (settings) {
    await prisma.reservationSetting.update({
      where: { id: settings.id },
      data: {
        reservationStartTime: '17:00',
        reservationEndTime: '21:00',
        slotIntervalMinutes: 30,
        slotCapacity: 3,
      },
    });
  } else {
    await prisma.reservationSetting.create({
      data: {
        reservationStartTime: '17:00',
        reservationEndTime: '21:00',
        slotIntervalMinutes: 30,
        slotCapacity: 3,
      },
    });
  }

  console.log('Seed completed.');
  console.log('admin loginId: admin');
  console.log('admin password: admin1234');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
