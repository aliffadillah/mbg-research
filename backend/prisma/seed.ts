import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Data dari components.json — data gizi per komponen makanan
const componentData = [
  { name: 'Acar Timun Wortel', calories: 38, fat: 0.3, protein: 0.6, carbs: 9.0, fiber: 0.6, category: 'sayuran' },
  { name: 'Anggur', calories: 30, fat: 0.2, protein: 0.5, carbs: 6.8, fiber: 1.2, category: 'buah' },
  { name: 'Apel', calories: 58, fat: 0.3, protein: 0.4, carbs: 14.9, fiber: 2.6, category: 'buah' },
  { name: 'Ayam Goreng', calories: 245, fat: 33.1, protein: 11.4, carbs: 0.3, fiber: 0.0, category: 'protein' },
  { name: 'Ayam Serundeng', calories: 245, fat: 33.1, protein: 11.4, carbs: 0.3, fiber: 0.0, category: 'protein' },
  { name: 'Bakso Saus BBQ', calories: 114, fat: 3.0, protein: 5.3, carbs: 16.4, fiber: 0.1, category: 'protein' },
  { name: 'Capcay', calories: 97, fat: 6.3, protein: 5.8, carbs: 4.2, fiber: 0.6, category: 'sayuran' },
  { name: 'Chiken Katsu', calories: 358, fat: 16.0, protein: 36.0, carbs: 14.0, fiber: 0.6, category: 'protein' },
  { name: 'Fla Susu', calories: 61, fat: 3.3, protein: 3.2, carbs: 4.3, fiber: 0.0, category: 'pelengkap' },
  { name: 'Gudeg', calories: 160, fat: 9.2, protein: 3.3, carbs: 16.0, fiber: 2.3, category: 'sayuran' },
  { name: 'Jagung', calories: 142, fat: 0.7, protein: 5.0, carbs: 30.3, fiber: 0.0, category: 'karbohidrat' },
  { name: 'Jeruk', calories: 45, fat: 0.2, protein: 0.9, carbs: 11.2, fiber: 0.0, category: 'buah' },
  { name: 'Kacang Merah', calories: 158, fat: 0.9, protein: 10.3, carbs: 28.2, fiber: 2.6, category: 'protein' },
  { name: 'Keju', calories: 326, fat: 20.3, protein: 22.8, carbs: 13.1, fiber: 0.0, category: 'pelengkap' },
  { name: 'Kelengkeng', calories: 60, fat: 0.1, protein: 1.0, carbs: 15.0, fiber: 1.1, category: 'buah' },
  { name: 'Ketimun dan Selada', calories: 26, fat: 0.4, protein: 1.4, carbs: 4.3, fiber: 2.1, category: 'sayuran' },
  { name: 'Kwetiaw', calories: 163, fat: 0.3, protein: 2.5, carbs: 37.5, fiber: 0.2, category: 'karbohidrat' },
  { name: 'Lele Crispy', calories: 372, fat: 6.3, protein: 7.8, carbs: 3.5, fiber: 0.0, category: 'protein' },
  { name: 'Lontong', calories: 216, fat: 0.5, protein: 4.5, carbs: 48.0, fiber: 0.6, category: 'karbohidrat' },
  { name: 'Mie', calories: 102, fat: 3.9, protein: 6.2, carbs: 10.5, fiber: 0.0, category: 'karbohidrat' },
  { name: 'Nasi', calories: 180, fat: 0.3, protein: 3.0, carbs: 39.8, fiber: 0.2, category: 'karbohidrat' },
  { name: 'Nasi Daun Jeruk', calories: 180, fat: 0.3, protein: 3.0, carbs: 39.8, fiber: 0.2, category: 'karbohidrat' },
  { name: 'Pepes Tahu', calories: 76, fat: 1.8, protein: 5.2, carbs: 10.6, fiber: 2.2, category: 'protein' },
  { name: 'Pisang', calories: 127, fat: 0.2, protein: 1.4, carbs: 21.0, fiber: 0.0, category: 'buah' },
  { name: 'Pisang Lampung', calories: 99, fat: 0.2, protein: 1.3, carbs: 25.6, fiber: 4.3, category: 'buah' },
  { name: 'Rolade Asam Manis', calories: 406, fat: 23.0, protein: 30.0, carbs: 16.0, fiber: 0.3, category: 'protein' },
  { name: 'Roti', calories: 248, fat: 1.2, protein: 0.8, carbs: 50.0, fiber: 9.1, category: 'karbohidrat' },
  { name: 'Salad Buah', calories: 244, fat: 15.5, protein: 1.3, carbs: 29.0, fiber: 3.5, category: 'buah' },
  { name: 'Sawi', calories: 28, fat: 0.3, protein: 2.3, carbs: 4.0, fiber: 2.5, category: 'sayuran' },
  { name: 'Sayur Isi Pepaya', calories: 49, fat: 0.3, protein: 1.7, carbs: 9.8, fiber: 2.7, category: 'sayuran' },
  { name: 'Semur Ayam Kecap', calories: 336, fat: 20.0, protein: 26.5, carbs: 10.0, fiber: 0.0, category: 'protein' },
  { name: 'Tahu', calories: 115, fat: 8.5, protein: 9.7, carbs: 2.5, fiber: 0.1, category: 'protein' },
  { name: 'Tahu Crispy', calories: 115, fat: 8.5, protein: 9.7, carbs: 2.5, fiber: 0.1, category: 'protein' },
  { name: 'Telur', calories: 251, fat: 19.4, protein: 16.3, carbs: 1.4, fiber: 0.0, category: 'protein' },
  { name: 'Telur Semur', calories: 251, fat: 19.4, protein: 16.3, carbs: 1.4, fiber: 0.0, category: 'protein' },
  { name: 'Tempe Goreng', calories: 350, fat: 26.6, protein: 24.5, carbs: 10.4, fiber: 4.2, category: 'protein' },
  { name: 'Tempe Sagu', calories: 350, fat: 26.6, protein: 24.5, carbs: 10.4, fiber: 4.2, category: 'protein' },
  { name: 'Tumis Keciwis', calories: 66, fat: 5.2, protein: 1.7, carbs: 3.6, fiber: 1.2, category: 'sayuran' },
  { name: 'Tumis Koll Wortel', calories: 92, fat: 5.5, protein: 1.9, carbs: 9.3, fiber: 1.7, category: 'sayuran' },
];

// Data dari daily_menu.json — menu harian
const dailyMenuData = [
  { name: 'Menu 1', foods: ['Apel', 'Tempe Goreng', 'Ayam Goreng', 'Gudeg', 'Nasi'],
    largePortion: { energi: 625, lemak: 26, protein: 18, karbohidrat: 81, serat: 5 },
    smallPortion: { energi: 520, lemak: 25, protein: 17, karbohidrat: 65, serat: 5.2 } },
  { name: 'Menu 2', foods: ['Telur Semur', 'Sayur Isi Pepaya', 'Pisang', 'Tahu', 'Lontong'],
    largePortion: { energi: 570, lemak: 19, protein: 20, karbohidrat: 85, serat: 3 },
    smallPortion: { energi: 480, lemak: 18, protein: 19, karbohidrat: 65, serat: 2.9 } },
  { name: 'Menu 3', foods: ['Mie', 'Sawi', 'Semur Ayam Kecap', 'Tempe Sagu', 'Pisang'],
    largePortion: { energi: 645, lemak: 25, protein: 15, karbohidrat: 95, serat: 0 },
    smallPortion: { energi: 525, lemak: 22, protein: 13, karbohidrat: 75, serat: 0 } },
  { name: 'Menu 4', foods: ['Apel', 'Kacang Merah', 'Telur', 'Fla Susu', 'Jagung'],
    largePortion: { energi: 560, lemak: 19, protein: 21, karbohidrat: 90, serat: 0 },
    smallPortion: { energi: 425, lemak: 19, protein: 19, karbohidrat: 70, serat: 0 } },
  { name: 'Menu 5', foods: ['Tahu', 'Tumis Koll Wortel', 'Telur Semur', 'Kelengkeng', 'Nasi'],
    largePortion: { energi: 630, lemak: 19, protein: 20, karbohidrat: 95, serat: 2.3 },
    smallPortion: { energi: 522, lemak: 18, protein: 19, karbohidrat: 75, serat: 2.2 } },
  { name: 'Menu 6', foods: ['Salad Buah', 'Tempe Goreng', 'Rolade Asam Manis', 'Capcay', 'Nasi'],
    largePortion: { energi: 673, lemak: 22, protein: 20, karbohidrat: 101, serat: 32 },
    smallPortion: { energi: 583, lemak: 21, protein: 19, karbohidrat: 81, serat: 3.1 } },
  { name: 'Menu 7', foods: ['Nasi', 'Anggur', 'Tumis Keciwis', 'Tahu', 'Lele Crispy'],
    largePortion: { energi: 556, lemak: 15, protein: 18, karbohidrat: 85, serat: 0 },
    smallPortion: { energi: 445, lemak: 15, protein: 17, karbohidrat: 64, serat: 0 } },
  { name: 'Menu 8', foods: ['Ketimun dan Selada', 'Anggur', 'Chiken Katsu', 'Keju', 'Roti'],
    largePortion: { energi: 554, lemak: 26, protein: 19, karbohidrat: 60, serat: 0 },
    smallPortion: { energi: 254, lemak: 26, protein: 16, karbohidrat: 40, serat: 0 } },
  { name: 'Menu 9', foods: ['Nasi Daun Jeruk', 'Ketimun dan Selada', 'Ayam Serundeng', 'Pepes Tahu', 'Pisang Lampung'],
    largePortion: { energi: 587, lemak: 24, protein: 18, karbohidrat: 78, serat: 0 },
    smallPortion: { energi: 474, lemak: 22, protein: 15, karbohidrat: 60, serat: 0 } },
  { name: 'Menu 10', foods: ['Jeruk', 'Tahu Crispy', 'Bakso Saus BBQ', 'Acar Timun Wortel', 'Kwetiaw'],
    largePortion: { energi: 595, lemak: 30, protein: 20, karbohidrat: 65, serat: 0 },
    smallPortion: { energi: 495, lemak: 25, protein: 17, karbohidrat: 55, serat: 0 } },
];

async function main() {
  console.log('🌱 Seeding database with real nutrition data...');

  // Clear existing data
  await prisma.dailyMenu.deleteMany();
  await prisma.nutrition.deleteMany();
  console.log('  Cleared existing data');

  // Seed nutrition components
  const nutritionResult = await prisma.nutrition.createMany({
    data: componentData,
    skipDuplicates: true,
  });
  console.log(`  ✅ Seeded ${nutritionResult.count} nutrition components`);

  // Seed daily menus
  const menuResult = await prisma.dailyMenu.createMany({
    data: dailyMenuData,
    skipDuplicates: true,
  });
  console.log(`  ✅ Seeded ${menuResult.count} daily menus`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
