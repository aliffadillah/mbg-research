import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, category?: string) {
    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }

    return this.prisma.nutrition.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.nutrition.findUnique({ where: { id } });
  }

  async getCategories() {
    const result = await this.prisma.nutrition.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return result.map((r: { category: string }) => r.category);
  }

  async getMenus() {
    return this.prisma.dailyMenu.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getStats() {
    const allFoods = await this.prisma.nutrition.findMany();
    const allMenus = await this.prisma.dailyMenu.findMany({ orderBy: { name: 'asc' } });

    // 1. Category distribution (count per category)
    const categoryMap: Record<string, number> = {};
    for (const food of allFoods) {
      categoryMap[food.category] = (categoryMap[food.category] || 0) + 1;
    }
    const categoryDistribution = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));

    // 2. Average nutrients per category
    const categoryNutrients: Record<string, { calories: number[]; protein: number[]; fat: number[]; carbs: number[]; fiber: number[] }> = {};
    for (const food of allFoods) {
      if (!categoryNutrients[food.category]) {
        categoryNutrients[food.category] = { calories: [], protein: [], fat: [], carbs: [], fiber: [] };
      }
      categoryNutrients[food.category].calories.push(food.calories);
      categoryNutrients[food.category].protein.push(food.protein);
      categoryNutrients[food.category].fat.push(food.fat);
      categoryNutrients[food.category].carbs.push(food.carbs);
      categoryNutrients[food.category].fiber.push(food.fiber);
    }
    const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
    const averageNutrients = Object.entries(categoryNutrients).map(([category, data]) => ({
      category,
      calories: avg(data.calories),
      protein: avg(data.protein),
      fat: avg(data.fat),
      carbs: avg(data.carbs),
      fiber: avg(data.fiber),
    }));

    // 3. Menu energy comparison (large vs small portion)
    const menuEnergy = allMenus.map((menu) => {
      const large = menu.largePortion as any;
      const small = menu.smallPortion as any;
      return {
        name: menu.name,
        largeEnergy: large?.energi || 0,
        smallEnergy: small?.energi || 0,
        largeFat: large?.lemak || 0,
        smallFat: small?.lemak || 0,
        largeProtein: large?.protein || 0,
        smallProtein: small?.protein || 0,
        largeCarbs: large?.karbohidrat || 0,
        smallCarbs: small?.karbohidrat || 0,
      };
    });

    // 4. All foods for scatter plot
    const scatterData = allFoods.map((food) => ({
      name: food.name,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      calories: food.calories,
      category: food.category,
    }));

    return {
      totalFoods: allFoods.length,
      totalMenus: allMenus.length,
      categoryDistribution,
      averageNutrients,
      menuEnergy,
      scatterData,
    };
  }
}
